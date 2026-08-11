#!/bin/sh
set -eu

action=${1:-install}
target=${EDE_TARGET:-/system/dashboard-ui/ede.user.js}
backup_root=${EDE_BACKUP_ROOT:-/config/emby-lyric-enhance/ede-1.47}
original="$backup_root/original/ede.user.js"

say() {
    printf '%s\n' "$*"
}

fail() {
    printf '错误：%s\n' "$*" >&2
    exit 1
}

count_fixed() {
    grep -F -c -- "$1" "$target" 2>/dev/null || true
}

is_fixed() {
    [ "$(count_fixed "const detail = e && e.detail ? e.detail : {};")" -ge 1 ] &&
        [ "$(count_fixed "window.ede.itemId = params.id || '';")" -eq 1 ] &&
        [ "$(count_fixed "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")" -eq 0 ]
}

warn_provider() {
    if [ -d /config/plugins ] &&
       ls /config/plugins 2>/dev/null | grep -qi 'customcssjs'; then
        say "警告：检测到 CustomCssJS Provider；它重新生成 ede.user.js 后可能覆盖本修复。"
    fi
}

status() {
    if [ ! -f "$target" ]; then
        say "EDE：未找到 $target"
    elif is_fixed; then
        say "EDE：页面生命周期修复已应用。"
    elif [ "$(count_fixed "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")" -eq 1 ]; then
        say "EDE：检测到待修复的 1.47 代码。"
    else
        say "EDE：文件存在，但不是已识别的 1.47 原版或本项目修复版。"
        return 1
    fi

    if [ -f "$original" ]; then
        say "EDE 原始备份：$original"
    else
        say "EDE 原始备份：尚未创建"
    fi
}

install_fix() {
    if [ ! -f "$target" ]; then
        say "未找到 $target，当前容器未安装 EDE，已安全跳过。"
        return
    fi
    if is_fixed; then
        say "EDE 1.47 页面生命周期修复已存在，无需重复修改。"
        warn_provider
        return
    fi

    destroy_map_count=$(count_fixed "window.ede.destroyIntervalIds.map(id => clearInterval(id));")
    destroy_reset_count=$(count_fixed "window.ede.destroyIntervalIds = [];")
    detail_hide_count=$(count_fixed "if (e.detail.type !== 'video-osd') {")
    danmaku_count=$(count_fixed "if (window.ede.danmaku) {")
    detail_show_count=$(count_fixed "if (e.detail.type === 'video-osd') {")
    item_id_count=$(count_fixed "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")
    if [ "$destroy_map_count" -ne 1 ] ||
       [ "$destroy_reset_count" -ne 1 ] ||
       [ "$detail_hide_count" -ne 1 ] ||
       [ "$danmaku_count" -ne 1 ] ||
       [ "$detail_show_count" -ne 1 ] ||
       [ "$item_id_count" -ne 1 ]; then
        fail "目标文件与已验证的 EDE 1.47 代码特征不一致，未做任何修改。"
    fi

    mkdir -p "$backup_root/original"
    if [ ! -f "$original" ]; then
        backup_candidate="$original.new.$$"
        cp -p "$target" "$backup_candidate"
        mv -f "$backup_candidate" "$original"
        say "EDE 原始文件已备份到 $original"
    elif ! cmp -s "$original" "$target"; then
        fail "现有 EDE 原始备份与当前待修复文件不同，未覆盖备份或目标文件。"
    fi

    candidate="$target.elyric-new.$$"
    trap 'rm -f -- "$candidate"' 0 HUP INT TERM
    awk '
function indent(line, value) {
    value = line
    sub(/[^ \t].*$/, "", value)
    return value
}
index($0, "window.ede.destroyIntervalIds.map(id => clearInterval(id));") {
    pad = indent($0)
    print pad "const ede = window.ede;"
    print pad "if (!ede || !Array.isArray(ede.destroyIntervalIds)) {"
    print pad "    return;"
    print pad "}"
    print pad "ede.destroyIntervalIds.forEach(id => clearInterval(id));"
    replace_destroy_reset = 1
    next
}
replace_destroy_reset && index($0, "window.ede.destroyIntervalIds = [];") {
    pad = indent($0)
    print pad "ede.destroyIntervalIds = [];"
    replace_destroy_reset = 0
    next
}
index($0, "if (e.detail.type !== '\''video-osd'\'') {") {
    pad = indent($0)
    print pad "const detail = e && e.detail;"
    print pad "if (!detail || detail.type !== '\''video-osd'\'') {"
    next
}
index($0, "if (window.ede.danmaku) {") {
    pad = indent($0)
    print pad "if (window.ede && window.ede.danmaku) {"
    next
}
index($0, "if (e.detail.type === '\''video-osd'\'') {") {
    pad = indent($0)
    print pad "const detail = e && e.detail ? e.detail : {};"
    print pad "if (detail.type === '\''video-osd'\'') {"
    insert_item_id = 1
    next
}
insert_item_id {
    print
    pad = indent($0)
    print pad "const params = detail.params || {};"
    print pad "window.ede.itemId = params.id || '\'''\'';"
    insert_item_id = 0
    next
}
index($0, "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '\'''\'';") {
    next
}
{ print }
' "$target" > "$candidate"
    chmod 0644 "$candidate"

    if [ "$(grep -F -c "const ede = window.ede;" "$candidate" 2>/dev/null || true)" -ne 1 ] ||
       [ "$(grep -F -c "ede.destroyIntervalIds.forEach(id => clearInterval(id));" "$candidate" 2>/dev/null || true)" -ne 1 ] ||
       [ "$(grep -F -c "const detail = e && e.detail;" "$candidate" 2>/dev/null || true)" -ne 1 ] ||
       [ "$(grep -F -c "if (window.ede && window.ede.danmaku) {" "$candidate" 2>/dev/null || true)" -ne 1 ] ||
       [ "$(grep -F -c "const detail = e && e.detail ? e.detail : {};" "$candidate" 2>/dev/null || true)" -ne 1 ] ||
       [ "$(grep -F -c "window.ede.itemId = params.id || '';" "$candidate" 2>/dev/null || true)" -ne 1 ] ||
       grep -Fq "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';" "$candidate"; then
        fail "EDE 修复结果校验失败，原文件保持不变。"
    fi

    mv -f "$candidate" "$target"
    trap - 0 HUP INT TERM
    say "EDE 1.47 页面生命周期修复已原子应用。"
    warn_provider
}

restore_original() {
    [ -f "$original" ] || fail "找不到 EDE 原始备份：$original"
    mkdir -p "$backup_root/restore-safety"
    if [ -f "$target" ]; then
        safety="$backup_root/restore-safety/ede.user.js.$(date +%Y%m%d-%H%M%S)-$$"
        cp -p "$target" "$safety"
        say "恢复前文件已保存到 $safety"
    fi

    candidate="$target.elyric-restore.$$"
    trap 'rm -f -- "$candidate"' 0 HUP INT TERM
    cp -p "$original" "$candidate"
    mv -f "$candidate" "$target"
    trap - 0 HUP INT TERM
    say "已恢复 EDE 1.47 原始文件：$target"
    warn_provider
}

case "$action" in
    install|fix) install_fix ;;
    status) status ;;
    restore|original) restore_original ;;
    *) fail "未知操作：$action（支持 install、status、restore）" ;;
esac
