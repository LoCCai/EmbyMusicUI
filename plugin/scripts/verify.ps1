param(
    [switch]$IncludeEmbyBuild,
    [string]$EmbyApiVersion = "4.9.1.90",
    [string]$NodePath = ""
)

$ErrorActionPreference = "Stop"
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$node = if ($NodePath) {
    if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) {
        throw "Node.js executable was not found: $NodePath"
    }
    [IO.Path]::GetFullPath($NodePath)
} else {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        throw "Node.js was not found on PATH. Install Node.js or pass -NodePath <path-to-node.exe>."
    }
    $nodeCommand.Source
}

& (Join-Path $PSScriptRoot "test-core.ps1") -EmbyApiVersion $EmbyApiVersion
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\adapter.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\plugin-integration.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\theme-v2-contract.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\plugin-config-page.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\docker-install.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\ede-manager.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\docker-plugin-install.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node (Join-Path $repositoryRoot "tests\container-manager.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& $node --check (Join-Path $repositoryRoot "adapters\4.9.5.0\lyrics.inject.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& git -C $repositoryRoot diff --check
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if ($IncludeEmbyBuild) {
    & (Join-Path $PSScriptRoot "build.ps1") -EmbyApiVersion $EmbyApiVersion
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$releasePlugin = Join-Path $repositoryRoot "plugin\artifacts\package\EmbyLyricEnhance.dll"
if (-not (Test-Path -LiteralPath $releasePlugin)) {
    throw "Prebuilt plugin DLL was not found: $releasePlugin"
}

$releaseAssemblyName = [Reflection.AssemblyName]::GetAssemblyName($releasePlugin)
[xml]$pluginProject = Get-Content -LiteralPath (Join-Path $repositoryRoot "plugin\src\EmbyLyricEnhance.Plugin\EmbyLyricEnhance.Plugin.csproj")
$declaredVersion = [string]$pluginProject.Project.PropertyGroup.Version
if ($releaseAssemblyName.Version.ToString(3) -ne $declaredVersion) {
    throw "Prebuilt plugin version $($releaseAssemblyName.Version) does not match project version $declaredVersion."
}

$releaseReferences = [Reflection.Assembly]::LoadFile($releasePlugin).GetReferencedAssemblies().Name
if ($releaseReferences -contains "EmbyLyricEnhance.Core") {
    throw "Prebuilt plugin still depends on the standalone EmbyLyricEnhance.Core assembly."
}

Write-Output "prebuilt single-DLL package structure and version: ok"
if (-not $IncludeEmbyBuild) {
    Write-Output "Local verification completed without the network-dependent Emby package build."
}
