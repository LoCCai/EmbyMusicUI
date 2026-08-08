#!/bin/sh
set -eu

VERSION="4.9.5.0"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ADAPTER_DIR="$SCRIPT_DIR/adapters/$VERSION"
MANAGER="$SCRIPT_DIR/scripts/container-manager.sh"
REMOTE_ROOT="/tmp/emby-lyric-enhance"

say() {
    printf '%s\n' "$*"
}

fail() {
    printf '错误：%s\n' "$*" >&2
    exit 1
}

command -v docker >/dev/null 2>&1 || fail "没有找到 docker 命令。请在 Emby Docker 宿主机运行本脚本。"
docker info >/dev/null 2>&1 || fail "无法连接 Docker。请使用有 Docker 权限的账号运行。"
[ -f "$ADAPTER_DIR/lyrics.inject.js" ] || fail "缺少 $ADAPTER_DIR/lyrics.inject.js"
[ -f "$ADAPTER_DIR/lyrics.inject.css" ] || fail "缺少 $ADAPTER_DIR/lyrics.inject.css"
[ -f "$MANAGER" ] || fail "缺少 $MANAGER"

container=${1:-}
action=${2:-}

if [ -z "$container" ]; then
    say "当前正在运行的 Docker 容器："
    docker ps --format '  {{.Names}}\t{{.Image}}\t{{.Status}}'
    printf '\n请输入 Emby 容器名或容器 ID（不是镜像名）：'
    IFS= read -r container
fi

[ -n "$container" ] || fail "容器名不能为空。"
docker inspect "$container" >/dev/null 2>&1 || fail "找不到容器：$container"
running=$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)
[ "$running" = "true" ] || fail "容器 $container 当前没有运行。"

config_mount=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/config"}}{{.Source}}{{end}}{{end}}' "$container" 2>/dev/null || true)
if [ -z "$config_mount" ]; then
    say "警告：没有检测到挂载到 /config 的持久卷。"
    say "备份将留在容器可写层，删除或重建容器后也会丢失。"
    printf '仍要继续吗？[y/N] '
    IFS= read -r answer
    case "$answer" in
        y|Y|yes|YES) ;;
        *) exit 1 ;;
    esac
fi

say ""
say "重要提示："
say "  - 请勿通过删除、重建容器或重建镜像来切换原版/增强版。"
say "  - /system 内的注入会在容器更新或重建后消失；届时请重新运行本脚本。"
say "  - 本脚本把原始备份保存到 /config/emby-lyric-enhance/$VERSION/。"
say ""

if [ -z "$action" ]; then
    say "请选择操作："
    say "  1) 安装或重新生成并启用增强版"
    say "  2) 切换到原版（保留增强版和备份）"
    say "  3) 重新启用增强版"
    say "  4) 查看状态"
    say "  5) 退出"
    printf '输入序号：'
    IFS= read -r choice
    case "$choice" in
        1) action=install ;;
        2) action=original ;;
        3) action=enhanced ;;
        4) action=status ;;
        5) exit 0 ;;
        *) fail "无效序号：$choice" ;;
    esac
fi

case "$action" in
    install|original|undo|enhanced|status) ;;
    *) fail "未知操作：$action（支持 install、original、enhanced、status）" ;;
esac

docker exec -u 0 "$container" /bin/sh -c "rm -rf '$REMOTE_ROOT' && mkdir -p '$REMOTE_ROOT/adapter'"
docker cp "$ADAPTER_DIR/lyrics.inject.js" "$container:$REMOTE_ROOT/adapter/lyrics.inject.js" >/dev/null
docker cp "$ADAPTER_DIR/lyrics.inject.css" "$container:$REMOTE_ROOT/adapter/lyrics.inject.css" >/dev/null
docker cp "$MANAGER" "$container:$REMOTE_ROOT/container-manager.sh" >/dev/null
docker exec -u 0 -e ELYRIC_PAYLOAD_ROOT="$REMOTE_ROOT/adapter" "$container" /bin/sh "$REMOTE_ROOT/container-manager.sh" "$action"

case "$action" in
    install|enhanced|original|undo)
        say ""
        say "文件已切换，无需重启或重建容器。请强制刷新 Emby Web 页面；若仍显示旧样式，请清除站点缓存。"
        ;;
esac
