#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
package_root=${ELYRIC_PACKAGE_ROOT:-"$script_dir/plugin/artifacts/package"}
plugin_dll="$package_root/EmbyLyricEnhance.dll"
remote_stage=${ELYRIC_REMOTE_STAGE:-/tmp/emby-lyric-enhance-plugin}
remote_plugins=${ELYRIC_REMOTE_PLUGINS:-/config/plugins}
remote_backup=${ELYRIC_REMOTE_BACKUP:-/config/emby-lyric-enhance/plugin-backup}
config_destination=${ELYRIC_CONFIG_DESTINATION:-/config}

say() {
    printf '%s\n' "$*"
}

fail() {
    printf '错误：%s\n' "$*" >&2
    exit 1
}

restart_if_requested() {
    case "$action" in
        *-restart)
            say "正在重启容器以加载插件……"
            docker restart "$container" >/dev/null
            say "容器已重启。"
            ;;
        *)
            say "必须重启 Emby 容器后，C# 插件变更才会加载。"
            ;;
    esac
}

report_frontend_configuration_support() {
    if docker exec "$container" /bin/sh -c '
videoosd=/system/dashboard-ui/videoosd/videoosd.js
[ -f "$videoosd" ] && grep -q "EmbyLyricEnhance/PublicConfiguration" "$videoosd"
' >/dev/null 2>&1; then
        say "Emby Web 前端适配器：已包含 DLL 公共配置读取。"
    else
        say "警告：当前 Emby Web VideoOsd 文件未包含 DLL 配置读取。"
        say "请再执行：sh docker-install.sh '$container' install"
        say "只更新 EmbyLyricEnhance.dll 不会自动修改 /system/dashboard-ui/videoosd/videoosd.js。"
    fi
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
        printf '\n请输入 Emby 容器名或容器 ID：'
        IFS= read -r container || fail "没有读取到容器名。"
    fi
}

command -v docker >/dev/null 2>&1 || fail "没有找到 docker 命令。请在 Emby Docker 宿主机运行。"
docker info >/dev/null 2>&1 || fail "无法连接 Docker。"

container=${1:-}
action=${2:-install}
backup_name=${3:-}

if [ -z "$container" ]; then
    choose_container
fi

[ -n "$container" ] || fail "容器名不能为空。"
docker inspect "$container" >/dev/null 2>&1 || fail "找不到容器：$container"

case "$action" in
    install|install-restart|rollback|rollback-restart|uninstall|uninstall-restart|status|backups) ;;
    *) fail "未知操作：$action（支持 install、rollback、uninstall、status、backups 及带 -restart 的变体）" ;;
esac

if [ -n "$backup_name" ]; then
    case "$backup_name" in
        *[!A-Za-z0-9._-]*) fail "备份名包含非法字符。" ;;
        install-*|rollback-safety-*|uninstall-safety-*) ;;
        *) fail "备份名必须来自 backups 输出中的 install-*、rollback-safety-* 或 uninstall-safety-*。" ;;
    esac
fi

if [ "$action" = "status" ]; then
    docker exec "$container" /bin/sh -c '
plugins=$1
for name in EmbyLyricEnhance.dll; do
    if [ -f "$plugins/$name" ]; then
        if command -v sha256sum >/dev/null 2>&1; then
            sha256sum "$plugins/$name"
        else
            ls -l "$plugins/$name"
        fi
    else
        echo "缺少：$plugins/$name"
    fi
done
if [ -f "$plugins/EmbyLyricEnhance.Core.dll" ]; then
    echo "警告：检测到旧版独立 Core DLL；请重新执行 install 清理。"
else
    echo "旧版独立 Core DLL：未安装（正常）"
fi
' sh "$remote_plugins"
    report_frontend_configuration_support
    exit 0
fi

if [ "$action" = "backups" ]; then
    docker exec "$container" /bin/sh -c '
backup_root=$1
found=0
for directory in "$backup_root"/install-* "$backup_root"/rollback-safety-* "$backup_root"/uninstall-safety-*; do
    [ -d "$directory" ] || continue
    found=1
    state=available
    [ -f "$directory/.restored" ] && state=restored
    printf "%s\t%s\n" "${directory##*/}" "$state"
done
[ "$found" -eq 1 ] || echo "没有插件备份。"
' sh "$remote_backup"
    exit 0
fi

mounts=$(docker inspect --format '{{range .Mounts}}{{println .Destination}}{{end}}' "$container")
case "
$mounts
" in
    *"
$config_destination
"*) ;;
    *)
        [ "${ELYRIC_ALLOW_UNPERSISTED_CONFIG:-0}" = "1" ] ||
            fail "容器没有持久挂载 $config_destination。为避免重建容器后丢失插件，安装已停止。"
        say "警告：正在写入未确认持久化的 $config_destination。"
        ;;
esac

if [ "$action" = "install" ] || [ "$action" = "install-restart" ]; then
    [ -s "$plugin_dll" ] || fail "缺少或为空：$plugin_dll，请确认已拉取带预编译 DLL 的插件分支，或运行 build.ps1/build.sh。"

    docker exec -u 0 "$container" /bin/sh -c '
set -eu
stage=$1
plugins=$2
backup_root=$3
rm -rf "$stage"
mkdir -p "$stage" "$plugins" "$backup_root"
' sh "$remote_stage" "$remote_plugins" "$remote_backup"
    docker cp "$plugin_dll" "$container:$remote_stage/EmbyLyricEnhance.dll" >/dev/null

    docker exec -u 0 "$container" /bin/sh -c '
set -eu
stage=$1
plugins=$2
backup_root=$3
backup_set="$backup_root/install-$(date +%Y%m%d-%H%M%S)-$$"
names="EmbyLyricEnhance.dll EmbyLyricEnhance.Core.dll"

mkdir -p "$backup_set"
[ -s "$stage/EmbyLyricEnhance.dll" ] || {
    echo "错误：暂存文件缺失或为空：$stage/EmbyLyricEnhance.dll" >&2
    exit 1
}
for name in $names; do
    if [ -f "$plugins/$name" ]; then
        cp -p "$plugins/$name" "$backup_set/$name"
    else
        : > "$backup_set/$name.missing"
    fi
done
cp "$stage/EmbyLyricEnhance.dll" "$plugins/EmbyLyricEnhance.dll.new"
chmod 0644 "$plugins/EmbyLyricEnhance.dll.new"

install_ok=1
mv -f "$plugins/EmbyLyricEnhance.dll.new" "$plugins/EmbyLyricEnhance.dll" || install_ok=0
if [ "$install_ok" -eq 1 ]; then
    rm -f "$plugins/EmbyLyricEnhance.Core.dll" || install_ok=0
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
printf "%s\n" "${backup_set##*/}" > "$backup_root/latest-install"
printf "备份集：%s\n" "$backup_set"
' sh "$remote_stage" "$remote_plugins" "$remote_backup"

    say "单文件插件 DLL 已复制到 $remote_plugins；旧版独立 Core DLL 已清理。"
    say "旧插件文件（若存在）已成组保存在 $remote_backup。"
    report_frontend_configuration_support
    restart_if_requested
    exit 0
fi

if [ "$action" = "uninstall" ] || [ "$action" = "uninstall-restart" ]; then
    docker exec -u 0 "$container" /bin/sh -c '
set -eu
plugins=$1
backup_root=$2
names="EmbyLyricEnhance.dll EmbyLyricEnhance.Core.dll"
safety="$backup_root/uninstall-safety-$(date +%Y%m%d-%H%M%S)-$$"

mkdir -p "$plugins" "$safety"
found=0
for name in $names; do
    if [ -f "$plugins/$name" ]; then
        cp -p "$plugins/$name" "$safety/$name"
        found=1
    else
        : > "$safety/$name.missing"
    fi
done

if [ "$found" -eq 0 ]; then
    rm -rf "$safety"
    echo "EmbyLyricEnhance 插件 DLL 当前未安装，无需重复卸载。"
    exit 0
fi

remove_ok=1
for name in $names; do
    rm -f "$plugins/$name" || remove_ok=0
done
if [ "$remove_ok" -ne 1 ]; then
    echo "错误：插件卸载不完整，正在恢复卸载前文件。" >&2
    set +e
    for name in $names; do
        if [ -f "$safety/$name" ]; then
            cp -p "$safety/$name" "$plugins/$name"
        else
            rm -f "$plugins/$name"
        fi
    done
    exit 1
fi

printf "卸载前插件已保存到：%s\n" "$safety"
' sh "$remote_plugins" "$remote_backup"

    say "EmbyLyricEnhance 插件 DLL 已卸载，配置和主题数据未删除。"
    restart_if_requested
    exit 0
fi

docker exec -u 0 "$container" /bin/sh -c '
set -eu
plugins=$1
backup_root=$2
requested=$3
names="EmbyLyricEnhance.Core.dll EmbyLyricEnhance.dll"
selected=

if [ -n "$requested" ]; then
    selected="$backup_root/$requested"
else
    if [ -f "$backup_root/latest-install" ]; then
        IFS= read -r latest_name < "$backup_root/latest-install" || true
        case "$latest_name" in
            install-*)
                if [ -d "$backup_root/$latest_name" ] && [ ! -f "$backup_root/$latest_name/.restored" ]; then
                    selected="$backup_root/$latest_name"
                fi
                ;;
        esac
    fi
    if [ -z "$selected" ]; then
        for candidate in "$backup_root"/install-*; do
            [ -d "$candidate" ] || continue
            [ -f "$candidate/.restored" ] && continue
            selected=$candidate
        done
    fi
fi

[ -n "$selected" ] && [ -d "$selected" ] || {
    echo "错误：没有可用的安装备份。" >&2
    exit 1
}
[ ! -f "$selected/.restored" ] || {
    echo "错误：该备份已经执行过回滚：${selected##*/}" >&2
    exit 1
}

for name in $names; do
    [ -f "$selected/$name" ] || [ -f "$selected/$name.missing" ] || {
        echo "错误：备份集不完整：$selected/$name" >&2
        exit 1
    }
done

safety="$backup_root/rollback-safety-$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$safety"
for name in $names; do
    if [ -f "$plugins/$name" ]; then
        cp -p "$plugins/$name" "$safety/$name"
    else
        : > "$safety/$name.missing"
    fi
    if [ -f "$selected/$name" ]; then
        cp "$selected/$name" "$plugins/$name.rollback"
        chmod 0644 "$plugins/$name.rollback"
    fi
done

rollback_ok=1
for name in $names; do
    if [ -f "$selected/$name" ]; then
        mv -f "$plugins/$name.rollback" "$plugins/$name" || rollback_ok=0
    else
        rm -f "$plugins/$name" || rollback_ok=0
    fi
done

if [ "$rollback_ok" -ne 1 ]; then
    echo "错误：回滚未完整应用，正在恢复回滚前文件。" >&2
    set +e
    for name in $names; do
        if [ -f "$safety/$name" ]; then
            cp -p "$safety/$name" "$plugins/$name"
        else
            rm -f "$plugins/$name"
        fi
        rm -f "$plugins/$name.rollback"
    done
    exit 1
fi

: > "$selected/.restored"
rm -f "$backup_root/latest-install"
printf "已恢复备份：%s\n" "$selected"
printf "回滚前文件另存为：%s\n" "$safety"
' sh "$remote_plugins" "$remote_backup" "$backup_name"

say "插件 DLL 已回滚。"
restart_if_requested
