#!/bin/sh
set -eu

VERSION="4.9.5.0"
BUILD_ID="2026.08.14-theme-v6-dual-canvas-r1"
TARGET_ROOT="${ELYRIC_TARGET_ROOT:-/system/dashboard-ui/videoosd}"
CONFIG_ROOT="${ELYRIC_CONFIG_ROOT:-/config}"
BACKUP_ROOT="$CONFIG_ROOT/emby-lyric-enhance/$VERSION"
ORIGINAL_ROOT="$BACKUP_ROOT/original"
ENHANCED_ROOT="$BACKUP_ROOT/enhanced"
PAYLOAD_ROOT="${ELYRIC_PAYLOAD_ROOT:-/tmp/emby-lyric-enhance/adapter}"
RECOVERY_ROOT="${ELYRIC_RECOVERY_ROOT:-$PAYLOAD_ROOT/recovered-original}"
PAYLOAD_JS="$PAYLOAD_ROOT/lyrics.inject.js"
PAYLOAD_CSS="$PAYLOAD_ROOT/lyrics.inject.css"
MARKER="ELYRIC_ENHANCE_BEGIN:$VERSION"
ANCHOR="_exports.default=VideoOsd"
FILES="videoosd.js videoosd.css lyrics.js lyrics.css"

EXPECTED_VIDEOOSD_JS="${ELYRIC_EXPECTED_VIDEOOSD_JS:-8c254d3a3844ee80f9d03205c94b04e60bc5440f44cf776e697c3ce96fd69687}"
EXPECTED_VIDEOOSD_CSS="${ELYRIC_EXPECTED_VIDEOOSD_CSS:-491e78881253de76cad25f76af3132cb13daf207bd865de92ccc8a68ac2bf3a7}"
EXPECTED_LYRICS_JS="${ELYRIC_EXPECTED_LYRICS_JS:-32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb}"
EXPECTED_LYRICS_CSS="${ELYRIC_EXPECTED_LYRICS_CSS:-82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7}"

say(){ printf '%s\n' "$*"; }
fail(){ printf '错误：%s\n' "$*" >&2; exit 1; }
sha256_file(){
    if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
    elif command -v busybox >/dev/null 2>&1; then busybox sha256sum "$1" | awk '{print $1}'
    else fail "容器内缺少 sha256sum，无法安全校验文件。"; fi
}
expected_for(){
    case "$1" in
        videoosd.js) printf '%s' "$EXPECTED_VIDEOOSD_JS";;
        videoosd.css) printf '%s' "$EXPECTED_VIDEOOSD_CSS";;
        lyrics.js) printf '%s' "$EXPECTED_LYRICS_JS";;
        lyrics.css) printf '%s' "$EXPECTED_LYRICS_CSS";;
    esac
}
require_targets(){
    [ -d "$CONFIG_ROOT" ] || fail "找不到 $CONFIG_ROOT，无法保存持久备份。"
    for name in $FILES; do [ -f "$TARGET_ROOT/$name" ] || fail "找不到 $TARGET_ROOT/$name"; done
}
verify_file(){
    file=$1 expected=$2 label=$3 actual=$(sha256_file "$file")
    [ "$actual" = "$expected" ] || fail "$label 指纹不匹配。期望 $expected，实际 $actual。请确认使用的是未修改的 Emby $VERSION 文件。"
}
verify_original_backups(){
    for name in $FILES; do
        [ -f "$ORIGINAL_ROOT/$name" ] || fail "缺少原始 $name 备份。"
        verify_file "$ORIGINAL_ROOT/$name" "$(expected_for "$name")" "备份 $name"
    done
}
has_marker(){ grep -Fq "$MARKER" "$TARGET_ROOT/videoosd.js" 2>/dev/null; }
has_legacy_marker(){ grep -Fq "$MARKER" "$TARGET_ROOT/lyrics.js" 2>/dev/null; }
all_original(){
    for name in $FILES; do [ "$(sha256_file "$TARGET_ROOT/$name")" = "$(expected_for "$name")" ] || return 1; done
    return 0
}
require_managed_target(){ has_marker && return 0; has_legacy_marker && return 0; all_original && return 0; fail "当前 /system 四文件既不是已知的 Emby $VERSION 原版，也不是本适配生成的增强版。"; }

recover_original_backups(){
    mkdir -p "$ORIGINAL_ROOT"
    for name in $FILES; do
        [ -f "$RECOVERY_ROOT/$name" ] || fail "恢复源缺少 $name：$RECOVERY_ROOT/$name"
        verify_file "$RECOVERY_ROOT/$name" "$(expected_for "$name")" "镜像原版 $name"
        cp "$RECOVERY_ROOT/$name" "$ORIGINAL_ROOT/$name.recover.$$"
        chmod 0644 "$ORIGINAL_ROOT/$name.recover.$$"
        mv -f "$ORIGINAL_ROOT/$name.recover.$$" "$ORIGINAL_ROOT/$name"
    done
    verify_original_backups
    say "已从当前容器的不可变镜像补回 Emby $VERSION 四份原版备份。"
}

atomic_quad_replace(){
    source_root=$1
    rollback_root="$TARGET_ROOT/.elyric-rollback.$$"
    mkdir "$rollback_root" || fail "无法创建四文件回滚目录。"
    replaced=""
    cleanup_atomic(){
        for cleanup in $FILES; do rm -f "$TARGET_ROOT/$cleanup.elyric.tmp.$$"; done
        rm -rf "$rollback_root"
    }
    rollback_atomic(){
        for restored in $replaced; do cp "$rollback_root/$restored" "$TARGET_ROOT/$restored" || true; done
        cleanup_atomic
    }
    trap 'rollback_atomic; exit 1' HUP INT TERM
    for name in $FILES; do
        cp "$TARGET_ROOT/$name" "$rollback_root/$name" || { cleanup_atomic; fail "无法保存 $name 的即时回滚副本。"; }
        cp "$source_root/$name" "$TARGET_ROOT/$name.elyric.tmp.$$" || { cleanup_atomic; fail "无法准备 $name 的临时替换文件。"; }
        chmod 0644 "$TARGET_ROOT/$name.elyric.tmp.$$" || { cleanup_atomic; fail "无法设置 $name 临时文件权限。"; }
    done
    for name in $FILES; do
        if mv -f "$TARGET_ROOT/$name.elyric.tmp.$$" "$TARGET_ROOT/$name"; then replaced="$replaced $name"
        else
            rollback_atomic
            fail "替换 $name 失败，已回滚已替换文件。"
        fi
    done
    cleanup_atomic
    trap - HUP INT TERM
}

create_enhanced_files(){
    [ -f "$PAYLOAD_JS" ] || fail "缺少注入载荷 $PAYLOAD_JS"
    [ -f "$PAYLOAD_CSS" ] || fail "缺少注入载荷 $PAYLOAD_CSS"
    verify_original_backups
    mkdir -p "$ENHANCED_ROOT"
    anchor_count=$(awk -v anchor="$ANCHOR" '{v=$0;while((p=index(v,anchor))>0){c++;v=substr(v,p+length(anchor))}}END{print c+0}' "$ORIGINAL_ROOT/videoosd.js")
    [ "$anchor_count" = "1" ] || fail "videoosd.js 注入锚点数量为 $anchor_count，预期为 1。"
    awk -v anchor="$ANCHOR" -v payload_file="$PAYLOAD_JS" 'BEGIN{while((getline line<payload_file)>0)payload=payload line ORS;close(payload_file)}{p=index($0,anchor);if(p>0)print substr($0,1,p-1) payload substr($0,p);else print}' "$ORIGINAL_ROOT/videoosd.js" > "$ENHANCED_ROOT/videoosd.js.tmp.$$"
    awk 'FNR==1&&NR!=1{print ""}{print}' "$ORIGINAL_ROOT/videoosd.css" "$PAYLOAD_CSS" > "$ENHANCED_ROOT/videoosd.css.tmp.$$"
    cp "$ORIGINAL_ROOT/lyrics.js" "$ENHANCED_ROOT/lyrics.js.tmp.$$"
    cp "$ORIGINAL_ROOT/lyrics.css" "$ENHANCED_ROOT/lyrics.css.tmp.$$"
    grep -Fq "$MARKER" "$ENHANCED_ROOT/videoosd.js.tmp.$$" || fail "生成的 videoosd.js 缺少注入标记。"
    grep -Fq "$MARKER" "$ENHANCED_ROOT/videoosd.css.tmp.$$" || fail "生成的 videoosd.css 缺少注入标记。"
    for name in $FILES; do mv -f "$ENHANCED_ROOT/$name.tmp.$$" "$ENHANCED_ROOT/$name"; chmod 0644 "$ENHANCED_ROOT/$name"; done
    { printf 'build_id=%s\n' "$BUILD_ID"; for name in $FILES; do key=$(printf '%s' "$name"|tr '.-' '__'); printf '%s_sha256=%s\n' "$key" "$(sha256_file "$ENHANCED_ROOT/$name")"; done; } > "$ENHANCED_ROOT/manifest.tmp.$$"
    mv -f "$ENHANCED_ROOT/manifest.tmp.$$" "$ENHANCED_ROOT/manifest"
}

install_enhanced(){
    require_targets; mkdir -p "$ORIGINAL_ROOT" "$ENHANCED_ROOT"; require_managed_target
    missing=0; for name in $FILES; do [ -f "$ORIGINAL_ROOT/$name" ] || missing=1; done
    if [ "$missing" = 1 ]; then
        { has_marker || has_legacy_marker; } && fail "当前文件已有增强标记，但没有完整四文件原始备份。"
        for name in $FILES; do verify_file "$TARGET_ROOT/$name" "$(expected_for "$name")" "$name"; cp -p "$TARGET_ROOT/$name" "$ORIGINAL_ROOT/$name"; done
    fi
    create_enhanced_files; atomic_quad_replace "$ENHANCED_ROOT"
    say "已启用 Emby $VERSION 单根自定义播放器。"; say "原始备份：$ORIGINAL_ROOT"
}
switch_original(){ require_targets; require_managed_target; all_original && { say "当前已是 Emby $VERSION 原版四文件。"; return; }; verify_original_backups; atomic_quad_replace "$ORIGINAL_ROOT"; say "已恢复 Emby $VERSION 原版四文件。"; }
switch_enhanced(){ require_targets; require_managed_target; create_enhanced_files; atomic_quad_replace "$ENHANCED_ROOT"; say "已重新启用 Emby $VERSION 单根自定义播放器。"; }
show_status(){
    require_targets
    if has_marker; then say "状态：单根自定义播放器已启用"; elif has_legacy_marker; then say "状态：旧版歌词 Hook，运行 install 将迁移"; elif all_original; then say "状态：当前为 Emby $VERSION 原版文件"; else say "状态：未知文件状态"; fi
    say "前端构建：$BUILD_ID"
    for name in $FILES; do say "$name SHA-256：$(sha256_file "$TARGET_ROOT/$name")"; done
}

case "${1:-status}" in
    recover-original) recover_original_backups;;
    install) install_enhanced;;
    enhanced) switch_enhanced;;
    original|undo|uninstall) switch_original;;
    status) show_status;;
    *) fail "未知命令：$1（支持 install、original、uninstall、enhanced、status、recover-original）";;
esac
