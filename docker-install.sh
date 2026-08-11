#!/bin/sh
set -eu

VERSION="4.9.5.0"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ADAPTER_DIR="$SCRIPT_DIR/adapters/$VERSION"
MANAGER="$SCRIPT_DIR/scripts/container-manager.sh"
PLUGIN_INSTALLER="$SCRIPT_DIR/docker-plugin-install.sh"
EDE_MANAGER="$SCRIPT_DIR/scripts/ede-manager.sh"
REMOTE_ROOT="/tmp/emby-lyric-enhance"

say() {
    printf '%s\n' "$*"
}

fail() {
    printf '错误：%s\n' "$*" >&2
    exit 1
}

choose_container() {
    running_containers=$(docker ps --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}')
    detected_containers=

    while IFS='|' read -r detected_id detected_name detected_image detected_status; do
        [ -n "$detected_id" ] || continue
        case "$detected_id $detected_name $detected_image $detected_status" in
            *[Ee][Mm][Bb][Yy]*)
                detected_line="$detected_id|$detected_name|$detected_image|$detected_status"
                if [ -n "$detected_containers" ]; then
                    detected_containers="$detected_containers
$detected_line"
                else
                    detected_containers=$detected_line
                fi
                ;;
        esac
    done <<EOF
$running_containers
EOF

    manual_requested=0
    if [ -n "$detected_containers" ]; then
        say "自动发现可能的 Emby 容器："
        detected_count=0
        while IFS='|' read -r detected_id detected_name detected_image detected_status; do
            [ -n "$detected_id" ] || continue
            detected_count=$((detected_count + 1))
            printf '  %d) %s\t%s\t%s\t[%.12s]\n' \
                "$detected_count" "$detected_name" "$detected_image" "$detected_status" "$detected_id"
        done <<EOF
$detected_containers
EOF

        manual_choice=$((detected_count + 1))
        printf '  %d) 没有我要的容器，手动输入\n' "$manual_choice"

        while :; do
            printf '\n请输入序号：'
            IFS= read -r selected_choice || fail "没有读取到容器选择。"
            selected_choice=$(printf '%s' "$selected_choice" | tr -d '[:space:]')
            case "$selected_choice" in
                ''|*[!0-9]*)
                    say "请输入列表中的数字序号。"
                    continue
                    ;;
            esac

            if [ "$selected_choice" -eq "$manual_choice" ]; then
                manual_requested=1
                break
            fi
            if [ "$selected_choice" -lt 1 ] || [ "$selected_choice" -gt "$detected_count" ]; then
                say "序号超出范围，请重新输入。"
                continue
            fi

            selected_index=0
            while IFS='|' read -r detected_id detected_name detected_image detected_status; do
                [ -n "$detected_id" ] || continue
                selected_index=$((selected_index + 1))
                if [ "$selected_index" -eq "$selected_choice" ]; then
                    container=$detected_name
                    break
                fi
            done <<EOF
$detected_containers
EOF
            [ -n "$container" ] && break
        done
    else
        say "没有自动发现名称、镜像或状态中包含 emby 的运行容器。"
        manual_requested=1
    fi

    if [ "$manual_requested" -eq 1 ]; then
        say "当前正在运行的全部 Docker 容器："
        docker ps --format '  {{.Names}}\t{{.Image}}\t{{.Status}}'
        printf '\n请输入 Emby 容器名或容器 ID（不是镜像名）：'
        IFS= read -r container || fail "没有读取到容器名。"
    fi
}

prompt_features() {
    while :; do
        say ""
        say "请选择要执行的功能："
        say "  1) 安装或更新歌词播放器前端"
        say "  2) 安装或更新服务端插件 DLL"
        say "  3) 修复 EDE 1.47 页面生命周期"
        say "  4) 退出"
        say "可以输入单个数字，也可以用空格分隔多个数字，例如：1 2 3"
        printf '输入功能序号：'
        IFS= read -r feature_input || fail "没有读取到功能选择。"
        feature_input=$(printf '%s' "$feature_input" | tr '\r\t' '  ')
        selected_features=
        feature_input_valid=1
        exit_requested=0

        set -f
        for feature_number in $feature_input; do
            case "$feature_number" in
                1|2|3)
                    case " $selected_features " in
                        *" $feature_number "*) ;;
                        *) selected_features="$selected_features $feature_number" ;;
                    esac
                    ;;
                4)
                    exit_requested=1
                    ;;
                *) feature_input_valid=0 ;;
            esac
        done
        set +f

        selected_features=${selected_features# }
        if [ "$exit_requested" -eq 1 ]; then
            if [ "$feature_input_valid" -eq 1 ] && [ -z "$selected_features" ]; then
                exit 0
            fi
            feature_input_valid=0
        fi
        if [ "$feature_input_valid" -eq 1 ] && [ -n "$selected_features" ]; then
            requested_features=$selected_features
            selected_features=
            for ordered_feature in 1 2 3; do
                case " $requested_features " in
                    *" $ordered_feature "*) selected_features="$selected_features $ordered_feature" ;;
                esac
            done
            selected_features=${selected_features# }
            return
        fi
        say "输入无效。请只输入 1、2、3，多个功能用空格分隔；4 必须单独输入。"
    done
}

has_feature() {
    case " $selected_features " in
        *" $1 "*) return 0 ;;
        *) return 1 ;;
    esac
}

confirm_bundle_persistence() {
    bundle_config_mount=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/config"}}{{.Source}}{{end}}{{end}}' "$container" 2>/dev/null || true)
    if [ -n "$bundle_config_mount" ]; then
        return
    fi

    say "警告：没有检测到挂载到 /config 的持久卷。"
    say "前端、插件和 EDE 备份将留在容器可写层，删除或重建容器后会丢失。"
    printf '仍要继续吗？[y/N] '
    IFS= read -r answer
    case "$answer" in
        y|Y|yes|YES) ELYRIC_ALLOW_UNPERSISTED_CONFIG=1; export ELYRIC_ALLOW_UNPERSISTED_CONFIG ;;
        *) exit 1 ;;
    esac
}

validate_bundle_payloads() {
    if has_feature 1; then
        [ -f "$ADAPTER_DIR/lyrics.inject.js" ] || fail "缺少 $ADAPTER_DIR/lyrics.inject.js"
        [ -f "$ADAPTER_DIR/lyrics.inject.css" ] || fail "缺少 $ADAPTER_DIR/lyrics.inject.css"
        [ -f "$MANAGER" ] || fail "缺少 $MANAGER"
    fi
    if has_feature 2; then
        [ -f "$PLUGIN_INSTALLER" ] || fail "缺少 $PLUGIN_INSTALLER"
        bundle_package_root=${ELYRIC_PACKAGE_ROOT:-"$SCRIPT_DIR/plugin/artifacts/package"}
        [ -s "$bundle_package_root/EmbyLyricEnhance.dll" ] ||
            fail "缺少或为空：$bundle_package_root/EmbyLyricEnhance.dll"
    fi
    if has_feature 3; then
        [ -f "$EDE_MANAGER" ] || fail "缺少 $EDE_MANAGER"
    fi
}

run_ede_action() {
    ede_action=$1
    docker exec -u 0 "$container" /bin/sh -c "mkdir -p '$REMOTE_ROOT'"
    docker cp "$EDE_MANAGER" "$container:$REMOTE_ROOT/ede-manager.sh" >/dev/null
    docker exec -u 0 "$container" /bin/sh "$REMOTE_ROOT/ede-manager.sh" "$ede_action"
}

run_feature_bundle() {
    validate_bundle_payloads
    confirm_bundle_persistence

    say ""
    say "目标容器：$container"
    say "执行功能：$selected_features"

    if has_feature 1; then
        say ""
        say "[功能 1] 正在安装或更新歌词播放器前端……"
        sh "$SCRIPT_DIR/docker-install.sh" "$container" install
    fi
    if has_feature 2; then
        say ""
        say "[功能 2] 正在安装或更新服务端插件 DLL……"
        sh "$PLUGIN_INSTALLER" "$container" install
    fi
    if has_feature 3; then
        say ""
        say "[功能 3] 正在检查并修复 EDE 1.47……"
        run_ede_action install
    fi

    if has_feature 2; then
        say ""
        say "所有选中功能均已完成，正在重启容器以加载插件 DLL……"
        docker restart "$container" >/dev/null
        say "容器已重启。"
    fi

    say ""
    say "执行完成：$selected_features"
    say "请清除 Emby 站点缓存或强制刷新页面后验收。"
}

recover_original_from_container_image() {
    image_id=$(docker inspect -f '{{.Image}}' "$container" 2>/dev/null || true)
    [ -n "$image_id" ] || fail "无法读取容器 $container 的不可变镜像 ID。"

    recovery_parent=${TMPDIR:-/tmp}
    recovery_dir=$(mktemp -d "$recovery_parent/elyric-recover.XXXXXX") ||
        fail "无法创建临时恢复目录。"
    recovery_container=

    cleanup_recovery() {
        if [ -n "$recovery_container" ]; then
            docker rm -f "$recovery_container" >/dev/null 2>&1 || true
        fi
        case "$recovery_dir" in
            "$recovery_parent"/elyric-recover.*)
                rm -rf -- "$recovery_dir"
                ;;
        esac
    }
    trap cleanup_recovery 0
    trap 'cleanup_recovery; exit 1' HUP INT TERM

    say "当前文件已是增强版但原版备份缺失，正在从容器的不可变镜像安全恢复……"
    recovery_container=$(docker create "$image_id") || fail "无法从当前镜像创建不启动的临时容器。"
    [ -n "$recovery_container" ] || fail "临时容器 ID 为空。"

    docker cp "$recovery_container:/system/dashboard-ui/videoosd/lyrics.js" "$recovery_dir/lyrics.js" >/dev/null ||
        fail "无法从镜像提取原版 lyrics.js。"
    docker cp "$recovery_container:/system/dashboard-ui/videoosd/lyrics.css" "$recovery_dir/lyrics.css" >/dev/null ||
        fail "无法从镜像提取原版 lyrics.css。"

    docker exec -u 0 "$container" /bin/sh -c "mkdir -p '$REMOTE_ROOT/recovered-original'"
    docker cp "$recovery_dir/lyrics.js" "$container:$REMOTE_ROOT/recovered-original/lyrics.js" >/dev/null
    docker cp "$recovery_dir/lyrics.css" "$container:$REMOTE_ROOT/recovered-original/lyrics.css" >/dev/null
    docker exec -u 0 \
        -e ELYRIC_PAYLOAD_ROOT="$REMOTE_ROOT/adapter" \
        -e ELYRIC_RECOVERY_ROOT="$REMOTE_ROOT/recovered-original" \
        "$container" /bin/sh "$REMOTE_ROOT/container-manager.sh" recover-original

    cleanup_recovery
    recovery_container=
    recovery_dir=
    trap - 0 HUP INT TERM
}

command -v docker >/dev/null 2>&1 || fail "没有找到 docker 命令。请在 Emby Docker 宿主机运行本脚本。"
docker info >/dev/null 2>&1 || fail "无法连接 Docker。请使用有 Docker 权限的账号运行。"

container=${1:-}
action=${2:-}

if [ -z "$container" ]; then
    choose_container
fi

[ -n "$container" ] || fail "容器名不能为空。"
docker inspect "$container" >/dev/null 2>&1 || fail "找不到容器：$container"
running=$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)
[ "$running" = "true" ] || fail "容器 $container 当前没有运行。"

case "$action" in
    '')
        prompt_features
        run_feature_bundle
        exit 0
        ;;
    all)
        selected_features="1 2 3"
        run_feature_bundle
        exit 0
        ;;
    plugin)
        selected_features="2"
        run_feature_bundle
        exit 0
        ;;
    ede|ede-fix)
        selected_features="3"
        run_feature_bundle
        exit 0
        ;;
    ede-status)
        [ -f "$EDE_MANAGER" ] || fail "缺少 $EDE_MANAGER"
        run_ede_action status
        exit 0
        ;;
    ede-restore)
        [ -f "$EDE_MANAGER" ] || fail "缺少 $EDE_MANAGER"
        confirm_bundle_persistence
        run_ede_action restore
        exit 0
        ;;
esac

[ -f "$ADAPTER_DIR/lyrics.inject.js" ] || fail "缺少 $ADAPTER_DIR/lyrics.inject.js"
[ -f "$ADAPTER_DIR/lyrics.inject.css" ] || fail "缺少 $ADAPTER_DIR/lyrics.inject.css"
[ -f "$MANAGER" ] || fail "缺少 $MANAGER"

config_mount=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/config"}}{{.Source}}{{end}}{{end}}' "$container" 2>/dev/null || true)
if [ -z "$config_mount" ]; then
    say "警告：没有检测到挂载到 /config 的持久卷。"
    say "备份将留在容器可写层，删除或重建容器后也会丢失。"
    if [ "${ELYRIC_ALLOW_UNPERSISTED_CONFIG:-0}" != "1" ]; then
        printf '仍要继续吗？[y/N] '
        IFS= read -r answer
        case "$answer" in
            y|Y|yes|YES) ;;
            *) exit 1 ;;
        esac
    fi
fi

say ""
say "重要提示："
say "  - 请勿通过删除、重建容器或重建镜像来切换原版/增强版。"
say "  - /system 内的注入会在容器更新或重建后消失；届时请重新运行本脚本。"
say "  - 本脚本把原始备份保存到 /config/emby-lyric-enhance/$VERSION/。"
say ""

case "$action" in
    install|original|undo|enhanced|status) ;;
    *) fail "未知操作：$action（支持 install、original、enhanced、status）" ;;
esac

docker exec -u 0 "$container" /bin/sh -c "rm -rf '$REMOTE_ROOT' && mkdir -p '$REMOTE_ROOT/adapter'"
docker cp "$ADAPTER_DIR/lyrics.inject.js" "$container:$REMOTE_ROOT/adapter/lyrics.inject.js" >/dev/null
docker cp "$ADAPTER_DIR/lyrics.inject.css" "$container:$REMOTE_ROOT/adapter/lyrics.inject.css" >/dev/null
docker cp "$MANAGER" "$container:$REMOTE_ROOT/container-manager.sh" >/dev/null

case "$action" in
    install|enhanced|original|undo)
        if docker exec "$container" /bin/sh -c '
target=/system/dashboard-ui/videoosd/lyrics.js
original=/config/emby-lyric-enhance/4.9.5.0/original
grep -Fq "ELYRIC_ENHANCE_BEGIN:4.9.5.0" "$target" 2>/dev/null &&
    { [ ! -f "$original/lyrics.js" ] || [ ! -f "$original/lyrics.css" ]; }
'; then
            recover_original_from_container_image
        fi
        ;;
esac

docker exec -u 0 -e ELYRIC_PAYLOAD_ROOT="$REMOTE_ROOT/adapter" "$container" /bin/sh "$REMOTE_ROOT/container-manager.sh" "$action"

case "$action" in
    install|enhanced|original|undo)
        say ""
        say "文件已切换，无需重启或重建容器。请强制刷新 Emby Web 页面；若仍显示旧样式，请清除站点缓存。"
        ;;
esac
