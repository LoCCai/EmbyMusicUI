param(
    [switch]$IncludeEmbyBuild,
    [string]$EmbyApiVersion = "4.9.1.90"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))

& (Join-Path $PSScriptRoot "test-core.ps1") -EmbyApiVersion $EmbyApiVersion
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& node (Join-Path $repositoryRoot "tests\adapter.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& node (Join-Path $repositoryRoot "tests\plugin-integration.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& node (Join-Path $repositoryRoot "tests\docker-plugin-install.test.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& node --check (Join-Path $repositoryRoot "adapters\4.9.5.0\lyrics.inject.js")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& git -C $repositoryRoot diff --check
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if ($IncludeEmbyBuild) {
    & (Join-Path $PSScriptRoot "build.ps1") -EmbyApiVersion $EmbyApiVersion
    exit $LASTEXITCODE
}

Write-Output "Local verification completed without the network-dependent Emby package build."
