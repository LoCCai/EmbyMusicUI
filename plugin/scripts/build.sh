#!/bin/sh
set -eu

configuration=${CONFIGURATION:-Release}
emby_api_version=${EMBY_API_VERSION:-4.9.1.90}
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
plugin_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
repository_root=$(CDPATH= cd -- "$plugin_root/.." && pwd)
project="$plugin_root/src/EmbyLyricEnhance.Plugin/EmbyLyricEnhance.Plugin.csproj"
artifact_root="$plugin_root/artifacts"
package_root="$plugin_root/artifacts/package"
package_staging="$artifact_root/package.new"
package_previous="$artifact_root/package.previous"

command -v dotnet >/dev/null 2>&1 || {
    printf '%s\n' '错误：没有找到 .NET 8 SDK。' >&2
    exit 1
}

export DOTNET_CLI_HOME="$repository_root/.dotnet-home"
export NUGET_PACKAGES="$repository_root/.packages"
export DOTNET_CLI_TELEMETRY_OPTOUT=1

if [ ! -e "$package_root" ] && [ -e "$package_previous" ]; then
    mv "$package_previous" "$package_root"
fi
rm -rf -- "$package_staging"
mkdir -p "$package_staging"
dotnet restore "$project" \
    --configfile "$plugin_root/NuGet.Config" \
    -p:EmbyApiVersion="$emby_api_version"
dotnet build "$project" \
    --configuration "$configuration" \
    --no-restore \
    --output "$package_staging" \
    -p:EmbyApiVersion="$emby_api_version"

[ -f "$package_staging/EmbyLyricEnhance.dll" ] || {
    printf '%s\n' '错误：缺少 EmbyLyricEnhance.dll。' >&2
    exit 1
}
[ ! -e "$package_staging/EmbyLyricEnhance.Core.dll" ] || {
    printf '%s\n' '错误：构建生成了不受支持的独立 EmbyLyricEnhance.Core.dll。' >&2
    exit 1
}

rm -rf -- "$package_previous"
if [ -e "$package_root" ]; then
    mv "$package_root" "$package_previous"
fi
if mv "$package_staging" "$package_root"; then
    rm -rf -- "$package_previous"
else
    if [ -e "$package_previous" ]; then
        mv "$package_previous" "$package_root"
    fi
    exit 1
fi

printf '插件构建产物：%s\n' "$package_root"
