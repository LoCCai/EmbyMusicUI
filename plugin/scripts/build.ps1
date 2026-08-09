param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release",
    [string]$EmbyApiVersion = "4.9.1.90"
)

$ErrorActionPreference = "Stop"

$pluginRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $pluginRoot ".."))
$installedDotnet = Join-Path ([Environment]::GetFolderPath("LocalApplicationData")) "Microsoft\dotnet\dotnet.exe"
$dotnetCommand = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnet = if (Test-Path -LiteralPath $installedDotnet) {
    $installedDotnet
} elseif ($dotnetCommand) {
    $dotnetCommand.Source
} else {
    throw ".NET 8 SDK was not found."
}

$env:DOTNET_CLI_HOME = Join-Path $repositoryRoot ".dotnet-home"
$env:NUGET_PACKAGES = Join-Path $repositoryRoot ".packages"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
$project = Join-Path $pluginRoot "src\EmbyLyricEnhance.Plugin\EmbyLyricEnhance.Plugin.csproj"
$nugetConfig = Join-Path $pluginRoot "NuGet.Config"
$artifactRoot = Join-Path $pluginRoot "artifacts"
$packageRoot = Join-Path $pluginRoot "artifacts\package"
$packageStaging = Join-Path $artifactRoot "package.new"
$packagePrevious = Join-Path $artifactRoot "package.previous"

if (-not (Test-Path -LiteralPath $packageRoot) -and (Test-Path -LiteralPath $packagePrevious)) {
    Move-Item -LiteralPath $packagePrevious -Destination $packageRoot
}
if (Test-Path -LiteralPath $packageStaging) {
    Remove-Item -LiteralPath $packageStaging -Recurse -Force
}
New-Item -ItemType Directory -Path $packageStaging -Force | Out-Null

& $dotnet restore $project `
    --configfile $nugetConfig `
    "/p:EmbyApiVersion=$EmbyApiVersion"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $dotnet build $project `
    --configuration $Configuration `
    --no-restore `
    --output $packageStaging `
    "/p:EmbyApiVersion=$EmbyApiVersion"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$requiredFiles = @(
    (Join-Path $packageStaging "EmbyLyricEnhance.dll"),
    (Join-Path $packageStaging "EmbyLyricEnhance.Core.dll")
)
foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "Build completed without required artifact: $file"
    }
}

if (Test-Path -LiteralPath $packagePrevious) {
    Remove-Item -LiteralPath $packagePrevious -Recurse -Force
}
if (Test-Path -LiteralPath $packageRoot) {
    Move-Item -LiteralPath $packageRoot -Destination $packagePrevious
}
try {
    Move-Item -LiteralPath $packageStaging -Destination $packageRoot
} catch {
    if (Test-Path -LiteralPath $packagePrevious) {
        Move-Item -LiteralPath $packagePrevious -Destination $packageRoot
    }
    throw
}
if (Test-Path -LiteralPath $packagePrevious) {
    Remove-Item -LiteralPath $packagePrevious -Recurse -Force
}

Write-Output "Plugin package ready: $packageRoot"
