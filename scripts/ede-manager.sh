#!/bin/sh
set -eu

action=${1:-install}
target=${EDE_TARGET:-/system/dashboard-ui/ede.user.js}
backup_root=${EDE_BACKUP_ROOT:-/config/emby-lyric-enhance/ede-1.47}
original="$backup_root/original/ede.user.js"
amd_vulnerable='"function"==typeof define&&define.amd?define(e):'
amd_fixed='"function"==typeof define&&define.amd&&!1?define(e):'

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

count_in_scope() {
    scope_name=$1
    needle=$2
    awk -v wanted="$scope_name" -v needle="$needle" '
function brace_delta(line, i, c, value) {
    value = 0
    for (i = 1; i <= length(line); i++) {
        c = substr(line, i, 1)
        if (c == "{") value++
        else if (c == "}") value--
    }
    return value
}
function scope_for(line) {
    if (line ~ /(^|[[:space:]])beforeDestroy[[:space:]]*\([^)]*\)[[:space:]]*\{/)
        return "beforeDestroy"
    if (line ~ /(^|[[:space:]])onViewShow[[:space:]]*\([^)]*\)[[:space:]]*\{/)
        return "onViewShow"
    if (line ~ /(^|[[:space:]])destroy(AllInterval)?[[:space:]]*\([^)]*\)[[:space:]]*\{/ || line ~ /function[[:space:]]+destroy(AllInterval)?[[:space:]]*\([^)]*\)[[:space:]]*\{/)
        return "destroy"
    return ""
}
{
    if (!active && scope_for($0) == wanted) {
        active = 1
        depth = 0
        started = 0
    }
    if (active) {
        if (index($0, needle)) found++
        depth += brace_delta($0)
        if (index($0, "{")) started = 1
        if (started && depth <= 0) active = 0
    }
}
END { print found + 0 }
' "$target"
}

is_lifecycle_fixed() {
    [ "$(count_in_scope destroy "ede.destroyIntervalIds.forEach(id => clearInterval(id));")" -eq 1 ] &&
        [ "$(count_in_scope beforeDestroy "const detail = e && e.detail;")" -eq 1 ] &&
        [ "$(count_in_scope beforeDestroy "if (window.ede && window.ede.danmaku) {")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "const detail = e && e.detail ? e.detail : {};")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "if (detail.type === 'video-osd' && window.ede) {")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "window.ede.itemId = params.id || '';")" -eq 1 ] &&
        [ "$(count_fixed "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")" -eq 0 ]
}

is_lifecycle_legacy_fixed() {
    [ "$(count_in_scope destroy "ede.destroyIntervalIds.forEach(id => clearInterval(id));")" -eq 1 ] &&
        [ "$(count_in_scope beforeDestroy "const detail = e && e.detail;")" -eq 1 ] &&
        [ "$(count_in_scope beforeDestroy "if (window.ede && window.ede.danmaku) {")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "const detail = e && e.detail ? e.detail : {};")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "if (detail.type === 'video-osd' && window.ede) {")" -eq 0 ] &&
        [ "$(count_in_scope onViewShow "const params = detail.params || {};")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "window.ede.itemId = params.id || '';")" -eq 1 ] &&
        [ "$(count_fixed "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")" -eq 0 ]
}

is_lifecycle_vulnerable() {
    [ "$(count_in_scope destroy "window.ede.destroyIntervalIds.map(id => clearInterval(id));")" -eq 1 ] &&
        [ "$(count_in_scope destroy "window.ede.destroyIntervalIds = [];")" -eq 1 ] &&
        [ "$(count_in_scope beforeDestroy "if (e.detail.type !== 'video-osd') {")" -eq 1 ] &&
        [ "$(count_in_scope beforeDestroy "if (window.ede.danmaku) {")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "if (e.detail.type === 'video-osd') {")" -eq 1 ] &&
        [ "$(count_in_scope onViewShow "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")" -eq 1 ]
}

is_amd_fixed() {
    [ "$(count_fixed "$amd_vulnerable")" -eq 0 ] &&
        [ "$(count_fixed "$amd_fixed")" -eq 1 ]
}

is_amd_vulnerable() {
    [ "$(count_fixed "$amd_vulnerable")" -eq 1 ] &&
        [ "$(count_fixed "$amd_fixed")" -eq 0 ]
}

is_recognized() {
    { is_lifecycle_fixed || is_lifecycle_legacy_fixed || is_lifecycle_vulnerable; } &&
        { is_amd_fixed || is_amd_vulnerable; }
}

is_fixed() {
    is_lifecycle_fixed && is_amd_fixed
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
        return
    fi
    if ! is_recognized; then
        say "EDE：文件存在，但不是已识别的 1.47 原版或本项目修复版。"
        return 1
    fi

    if is_lifecycle_fixed; then
        say "EDE 页面生命周期：已修复"
    else
        say "EDE 页面生命周期：待修复"
    fi
    if is_amd_fixed; then
        say "EDE Danmaku AMD 隔离：已修复"
    else
        say "EDE Danmaku AMD 隔离：待修复（可能污染 Alameda 模块队列并导致随机 404）"
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
        say "EDE 1.47 页面生命周期与 Danmaku AMD 隔离修复均已存在，无需重复修改。"
        warn_provider
        return
    fi

    amd_vulnerable_count=$(count_fixed "$amd_vulnerable")
    amd_fixed_count=$(count_fixed "$amd_fixed")
    destroy_map_global=$(count_fixed "window.ede.destroyIntervalIds.map(id => clearInterval(id));")
    destroy_map_scope=$(count_in_scope destroy "window.ede.destroyIntervalIds.map(id => clearInterval(id));")
    destroy_reset_global=$(count_fixed "window.ede.destroyIntervalIds = [];")
    destroy_reset_scope=$(count_in_scope destroy "window.ede.destroyIntervalIds = [];")
    detail_hide_global=$(count_fixed "if (e.detail.type !== 'video-osd') {")
    detail_hide_scope=$(count_in_scope beforeDestroy "if (e.detail.type !== 'video-osd') {")
    danmaku_global=$(count_fixed "if (window.ede.danmaku) {")
    danmaku_scope=$(count_in_scope beforeDestroy "if (window.ede.danmaku) {")
    detail_show_global=$(count_fixed "if (e.detail.type === 'video-osd') {")
    detail_show_scope=$(count_in_scope onViewShow "if (e.detail.type === 'video-osd') {")
    item_id_global=$(count_fixed "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")
    item_id_scope=$(count_in_scope onViewShow "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';")
    if ! is_recognized; then
        say "EDE 1.47 特征计数（全局/目标函数）：" >&2
        say "  amd-vulnerable=$amd_vulnerable_count amd-fixed=$amd_fixed_count" >&2
        say "  timer-map=$destroy_map_global/$destroy_map_scope timer-reset=$destroy_reset_global/$destroy_reset_scope" >&2
        say "  beforeDestroy-view=$detail_hide_global/$detail_hide_scope beforeDestroy-danmaku=$danmaku_global/$danmaku_scope" >&2
        say "  onViewShow-view=$detail_show_global/$detail_show_scope onViewShow-itemId=$item_id_global/$item_id_scope" >&2
        fail "目标函数与已验证的 EDE 1.47 代码特征不一致，未做任何修改。"
    fi

    mkdir -p "$backup_root/original"
    if [ ! -f "$original" ]; then
        backup_candidate="$original.new.$$"
        cp -p "$target" "$backup_candidate"
        mv -f "$backup_candidate" "$original"
        say "EDE 原始文件已备份到 $original"
    else
        old_target=$target
        target=$original
        if ! is_recognized; then
            target=$old_target
            fail "现有 EDE 原始备份不是已识别的 1.47 文件，未覆盖备份或目标文件。"
        fi
        target=$old_target
    fi

    mkdir -p "$backup_root/upgrade-safety"
    safety="$backup_root/upgrade-safety/ede.user.js.$(date +%Y%m%d-%H%M%S)-$$"
    cp -p "$target" "$safety"
    say "本次修复前文件已保存到 $safety"

    candidate="$target.elyric-new.$$"
    trap 'rm -f -- "$candidate"' 0 HUP INT TERM
    legacy_fixed=0
    if is_lifecycle_legacy_fixed; then
        legacy_fixed=1
    fi
    awk -v amd_vulnerable="$amd_vulnerable" -v amd_fixed="$amd_fixed" -v legacy_fixed="$legacy_fixed" '
function replace_literal(line, needle, replacement, position) {
    position = index(line, needle)
    if (!position) return line
    amd_replacements++
    return substr(line, 1, position - 1) replacement substr(line, position + length(needle))
}
function indent(line, value) {
    value = line
    sub(/[^ \t].*$/, "", value)
    return value
}
function brace_delta(line, i, c, value) {
    value = 0
    for (i = 1; i <= length(line); i++) {
        c = substr(line, i, 1)
        if (c == "{") value++
        else if (c == "}") value--
    }
    return value
}
function scope_for(line) {
    if (line ~ /(^|[[:space:]])beforeDestroy[[:space:]]*\([^)]*\)[[:space:]]*\{/)
        return "beforeDestroy"
    if (line ~ /(^|[[:space:]])onViewShow[[:space:]]*\([^)]*\)[[:space:]]*\{/)
        return "onViewShow"
    if (line ~ /(^|[[:space:]])destroy(AllInterval)?[[:space:]]*\([^)]*\)[[:space:]]*\{/ || line ~ /function[[:space:]]+destroy(AllInterval)?[[:space:]]*\([^)]*\)[[:space:]]*\{/)
        return "destroy"
    return ""
}
{
    $0 = replace_literal($0, amd_vulnerable, amd_fixed)
    if (!scope) {
        scope = scope_for($0)
        if (scope) {
            depth = 0
            started = 0
        }
    }
    current_scope = scope
    handled = 0
    pad = indent($0)
    if (current_scope == "destroy" && index($0, "window.ede.destroyIntervalIds.map(id => clearInterval(id));")) {
        print pad "const ede = window.ede;"
        print pad "if (!ede || !Array.isArray(ede.destroyIntervalIds)) {"
        print pad "    return;"
        print pad "}"
        print pad "ede.destroyIntervalIds.forEach(id => clearInterval(id));"
        replace_destroy_reset = 1
        handled = 1
    } else if (current_scope == "destroy" && replace_destroy_reset && index($0, "window.ede.destroyIntervalIds = [];")) {
        print pad "ede.destroyIntervalIds = [];"
        replace_destroy_reset = 0
        handled = 1
    } else if (current_scope == "beforeDestroy" && index($0, "if (e.detail.type !== '\''video-osd'\'') {")) {
        print pad "const detail = e && e.detail;"
        print pad "if (!detail || detail.type !== '\''video-osd'\'') {"
        handled = 1
    } else if (current_scope == "beforeDestroy" && index($0, "if (window.ede.danmaku) {")) {
        print pad "if (window.ede && window.ede.danmaku) {"
        handled = 1
    } else if (current_scope == "onViewShow" && index($0, "if (e.detail.type === '\''video-osd'\'') {")) {
        print pad "const detail = e && e.detail ? e.detail : {};"
        print pad "if (detail.type === '\''video-osd'\'') {"
        handled = 1
    } else if (current_scope == "onViewShow" && index($0, "window.ede.itemId = e.detail.params.id ? e.detail.params.id : '\'''\'';")) {
        print pad "if (detail.type === '\''video-osd'\'' && window.ede) {"
        print pad "    const params = detail.params || {};"
        print pad "    window.ede.itemId = params.id || '\'''\'';"
        print pad "}"
        handled = 1
    } else if (current_scope == "onViewShow" && legacy_fixed && index($0, "const params = detail.params || {};")) {
        replace_legacy_item = 1
        handled = 1
    } else if (current_scope == "onViewShow" && replace_legacy_item && index($0, "window.ede.itemId = params.id || '\'''\'';")) {
        print pad "if (detail.type === '\''video-osd'\'' && window.ede) {"
        print pad "    const params = detail.params || {};"
        print pad "    window.ede.itemId = params.id || '\'''\'';"
        print pad "}"
        replace_legacy_item = 0
        handled = 1
    }
    if (!handled) print
    if (current_scope) {
        depth += brace_delta($0)
        if (index($0, "{")) started = 1
        if (started && depth <= 0) scope = ""
    }
}
END {
    if (amd_replacements > 1) exit 42
    if (replace_legacy_item) exit 43
}
' "$target" > "$candidate"
    chmod 0644 "$candidate"

    old_target=$target
    target=$candidate
    if ! is_fixed; then
        target=$old_target
        fail "EDE 修复结果校验失败，原文件保持不变。"
    fi
    target=$old_target

    mv -f "$candidate" "$target"
    trap - 0 HUP INT TERM
    say "EDE 1.47 页面生命周期与 Danmaku AMD 隔离修复已原子应用。"
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

uninstall_fix() {
    if [ ! -f "$target" ]; then
        say "未找到 $target，当前容器未安装 EDE，无需恢复。"
        return
    fi
    if [ -f "$original" ]; then
        if cmp -s "$original" "$target"; then
            say "EDE 1.47 当前已经是修改前原文件，无需重复恢复。"
            return
        fi
        restore_original
        return
    fi
    if is_lifecycle_vulnerable && is_amd_vulnerable; then
        say "EDE 1.47 当前已经是修复前原文件，且没有本项目备份，无需恢复。"
        return
    fi
    fail "EDE 已被修改但找不到本项目原始备份：$original。为避免覆盖未知版本，未做修改。"
}

case "$action" in
    install|fix) install_fix ;;
    status) status ;;
    restore|original) restore_original ;;
    uninstall) uninstall_fix ;;
    *) fail "未知操作：$action（支持 install、status、restore、uninstall）" ;;
esac
