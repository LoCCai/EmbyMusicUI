param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release",
    [string]$EmbyApiVersion = "4.9.1.90"
)

$ErrorActionPreference = "Stop"

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$workspaceDotnet = Join-Path $repositoryRoot ".packages\dotnet\dotnet.exe"
$installedDotnet = Join-Path ([Environment]::GetFolderPath("LocalApplicationData")) "Microsoft\dotnet\dotnet.exe"
$dotnetCommand = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnet = if (Test-Path -LiteralPath $workspaceDotnet) {
    $workspaceDotnet
} elseif (Test-Path -LiteralPath $installedDotnet) {
    $installedDotnet
} elseif ($dotnetCommand) {
    $dotnetCommand.Source
} else {
    throw ".NET SDK executable was not found."
}

$dotnetRoot = Split-Path -Parent $dotnet
$sdkVersion = (& $dotnet --version).Trim()
$compiler = Join-Path $dotnetRoot "sdk\$sdkVersion\Roslyn\bincore\csc.dll"
if (-not (Test-Path -LiteralPath $compiler)) {
    throw "Roslyn compiler was not found at $compiler"
}

$referencePackRoot = Join-Path $dotnetRoot "packs\Microsoft.NETCore.App.Ref"
$referencePack = Get-ChildItem -LiteralPath $referencePackRoot -Directory |
    Sort-Object { [Version]$_.Name } -Descending |
    Select-Object -First 1
if (-not $referencePack) {
    throw "Microsoft.NETCore.App.Ref was not found under $referencePackRoot"
}

$referenceDirectory = Join-Path $referencePack.FullName "ref\net8.0"
$references = @(Get-ChildItem -LiteralPath $referenceDirectory -Filter "*.dll" -File |
    ForEach-Object { "/reference:$($_.FullName)" })

$artifactRoot = Join-Path $repositoryRoot "plugin\artifacts\core-tests\$Configuration"
New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null

$coreOutput = Join-Path $artifactRoot "EmbyLyricEnhance.Core.dll"
$testOutput = Join-Path $artifactRoot "EmbyLyricEnhance.Core.Tests.dll"
$pluginContractOutput = Join-Path $artifactRoot "EmbyLyricEnhance.Plugin.Contract.dll"
$fixtureSource = Join-Path $repositoryRoot "plugin\tests\EmbyLyricEnhance.Core.Tests\Fixtures\theme-v6-frontend.json"
$fixtureOutputDirectory = Join-Path $artifactRoot "Fixtures"
New-Item -ItemType Directory -Path $fixtureOutputDirectory -Force | Out-Null
Copy-Item -LiteralPath $fixtureSource -Destination (Join-Path $fixtureOutputDirectory "theme-v6-frontend.json") -Force
$coreSources = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot "plugin\src\EmbyLyricEnhance.Core") -Filter "*.cs" -File |
    Select-Object -ExpandProperty FullName)
$testSources = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot "plugin\tests\EmbyLyricEnhance.Core.Tests") -Filter "*.cs" -File |
    Select-Object -ExpandProperty FullName)
$pluginSources = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot "plugin\src\EmbyLyricEnhance.Plugin") -Filter "*.cs" -File |
    Select-Object -ExpandProperty FullName)
$pluginContractSources = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot "plugin\tests\EmbyLyricEnhance.Plugin.ContractTests") -Filter "*.cs" -File |
    Select-Object -ExpandProperty FullName)

& $dotnet $compiler `
    /noconfig `
    /nostdlib+ `
    /langversion:latest `
    /nullable:enable `
    /deterministic+ `
    /warnaserror+ `
    /target:library `
    "/out:$coreOutput" `
    @references `
    @coreSources
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $dotnet $compiler `
    /noconfig `
    /nostdlib+ `
    /langversion:latest `
    /nullable:enable `
    /deterministic+ `
    /warnaserror+ `
    /target:exe `
    "/out:$testOutput" `
    "/reference:$coreOutput" `
    @references `
    @testSources
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $dotnet $compiler `
    /noconfig `
    /nostdlib+ `
    /langversion:latest `
    /nullable:enable `
    /deterministic+ `
    /warnaserror+ `
    /target:exe `
    "/out:$pluginContractOutput" `
    @references `
    @coreSources `
    @pluginContractSources `
    @pluginSources
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$contractReferences = [Reflection.Assembly]::LoadFile(
    $pluginContractOutput).GetReferencedAssemblies().Name
if ($contractReferences -contains "EmbyLyricEnhance.Core") {
    throw "Plugin contract output still depends on the standalone EmbyLyricEnhance.Core assembly."
}

$realApiDirectories = @(
    (Join-Path $repositoryRoot ".packages\mediabrowser.common\$EmbyApiVersion\lib\netstandard2.0"),
    (Join-Path $repositoryRoot ".packages\mediabrowser.server.core\$EmbyApiVersion\lib\netstandard2.0"),
    (Join-Path $repositoryRoot ".packages\nuget-cache\mediabrowser.common\$EmbyApiVersion\lib\netstandard2.0"),
    (Join-Path $repositoryRoot ".packages\nuget-cache\mediabrowser.server.core\$EmbyApiVersion\lib\netstandard2.0")
) | Where-Object { Test-Path -LiteralPath $_ }
if ($realApiDirectories.Count -ge 2) {
    $realApiReferences = @(Get-ChildItem -LiteralPath $realApiDirectories -Filter "*.dll" -File |
        Sort-Object Name -Unique |
        ForEach-Object { "/reference:$($_.FullName)" })
    $realApiOutput = Join-Path $artifactRoot "EmbyLyricEnhance.Plugin.RealApi.dll"

    & $dotnet $compiler `
        /noconfig `
        /nostdlib+ `
        /langversion:latest `
        /nullable:enable `
        /deterministic+ `
        /warnaserror+ `
        /target:library `
        "/out:$realApiOutput" `
        @references `
        @realApiReferences `
        @coreSources `
        @pluginSources
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Write-Output "plugin real MediaBrowser.Common and Server.Core $EmbyApiVersion API compile: ok"
} else {
    Write-Output "plugin real API compile skipped: both MediaBrowser.Common and Server.Core $EmbyApiVersion are required locally."
}

$runtimeConfig = @{
    runtimeOptions = @{
        tfm = "net8.0"
        framework = @{
            name = "Microsoft.NETCore.App"
            version = "8.0.0"
        }
    }
} | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText(
    (Join-Path $artifactRoot "EmbyLyricEnhance.Core.Tests.runtimeconfig.json"),
    $runtimeConfig,
    [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText(
    (Join-Path $artifactRoot "EmbyLyricEnhance.Plugin.Contract.runtimeconfig.json"),
    $runtimeConfig,
    [Text.UTF8Encoding]::new($false))

& $dotnet $pluginContractOutput
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $dotnet $testOutput
exit $LASTEXITCODE
