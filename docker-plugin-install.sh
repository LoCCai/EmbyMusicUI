#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
package_root="$script_dir/plugin/artifacts/package"
plugin_dll="$package_root/EmbyLyricEnhance.dll"
core_dll="$package_root/EmbyLyricEnhance.Core.dll"
remote_stage="/tmp/emby-lyric-enhance-plugin"
remote_plugins="/config/plugins"
remote_backup="/config/emby-lyric-enhance/plugin-backup"

say() {
    printf '%s\n' "$*"
}

fail() {
    printf '错误：%s\n' "$*" >&2
    exit 1
}

command -v docker >/dev/null 2>&1 || fail "没有找到 docker 命令。请在 Emby Docker 宿主机运行。"
docker info >/dev/null 2>&1 || fail "无法连接 Docker。"

container=${1:-}
action=${2:-install}

if [ -z "$container" ]; then
    say "当前正在运行的 Docker 容器："
    docker ps --format '  {{.Names}}\t{{.Image}}\t{{.Status}}'
    printf '\n请输入 Emby 容器名或容器 ID：'
    IFS= read -r container
fi

[ -n "$container" ] || fail "容器名不能为空。"
docker inspect "$container" >/dev/null 2>&1 || fail "找不到容器：$container"

case "$action" in
    install|install-restart|status) ;;
    *) fail "未知操作：$action（支持 install、install-restart、status）" ;;
esac

if [ "$action" = "status" ]; then
    docker exec "$container" /bin/sh -c \
        "for file in '$remote_plugins/EmbyLyricEnhance.dll' '$remote_plugins/EmbyLyricEnhance.Core.dll'; do if [ -f \"\$file\" ]; then ls -l \"\$file\"; else echo \"缺少：\$file\"; fi; done"
    exit 0
fi

[ -f "$plugin_dll" ] || fail "缺少 $plugin_dll，请先运行 plugin/scripts/build.ps1 或 build.sh。"
[ -f "$core_dll" ] || fail "缺少 $core_dll，请先构建插件。"

docker exec -u 0 "$container" /bin/sh -c \
    "rm -rf '$remote_stage' && mkdir -p '$remote_stage' '$remote_plugins' '$remote_backup'"
docker cp "$plugin_dll" "$container:$remote_stage/EmbyLyricEnhance.dll" >/dev/null
docker cp "$core_dll" "$container:$remote_stage/EmbyLyricEnhance.Core.dll" >/dev/null

docker exec -u 0 "$container" /bin/sh -c '
set -eu
stage=$1
plugins=$2
backup_root=$3
backup_set="$backup_root/$(date +%Y%m%d-%H%M%S)-$$"
names="EmbyLyricEnhance.dll EmbyLyricEnhance.Core.dll"

mkdir -p "$backup_set"
for name in $names; do
    [ -s "$stage/$name" ] || {
        echo "错误：暂存文件缺失或为空：$stage/$name" >&2
        exit 1
    }
    if [ -f "$plugins/$name" ]; then
        cp -p "$plugins/$name" "$backup_set/$name"
    else
        : > "$backup_set/$name.missing"
    fi
    cp "$stage/$name" "$plugins/$name.new"
    chmod 0644 "$plugins/$name.new"
done

install_ok=1
mv -f "$plugins/EmbyLyricEnhance.Core.dll.new" "$plugins/EmbyLyricEnhance.Core.dll" || install_ok=0
if [ "$install_ok" -eq 1 ]; then
    mv -f "$plugins/EmbyLyricEnhance.dll.new" "$plugins/EmbyLyricEnhance.dll" || install_ok=0
fi

if [ "$install_ok" -ne 1 ]; then
    echo "错误：插件文件更新不完整，正在恢复同一组旧文件。" >&2
    set +e
    for name in $names; do
        if [ -f "$backup_set/$name" ]; then
            cp -p "$backup_set/$name" "$plugins/$name"
        else
            rm -f "$plugins/$name"
        fi
        rm -f "$plugins/$name.new"
    done
    rm -rf "$stage"
    exit 1
fi

rm -rf "$stage"
printf "备份集：%s\n" "$backup_set"
' sh "$remote_stage" "$remote_plugins" "$remote_backup"

say "插件 DLL 已复制到 $remote_plugins。"
say "旧 DLL（若存在）已按安装时间成组保存在 $remote_backup。"

if [ "$action" = "install-restart" ]; then
    say "正在重启容器以加载插件……"
    docker restart "$container" >/dev/null
    say "容器已重启。"
else
    say "必须重启 Emby 容器后，C# 插件和设置页才会加载。"
    say "需要立即重启时运行：sh docker-plugin-install.sh '$container' install-restart"
fi
