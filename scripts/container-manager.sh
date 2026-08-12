#!/bin/sh
set -eu

VERSION="4.9.5.0"
BUILD_ID="2026.08.12-player-theme-v3-ui-fixes"
TARGET_ROOT="${ELYRIC_TARGET_ROOT:-/system/dashboard-ui/videoosd}"
TARGET_JS="$TARGET_ROOT/lyrics.js"
TARGET_CSS="$TARGET_ROOT/lyrics.css"
CONFIG_ROOT="${ELYRIC_CONFIG_ROOT:-/config}"
BACKUP_ROOT="$CONFIG_ROOT/emby-lyric-enhance/$VERSION"
ORIGINAL_ROOT="$BACKUP_ROOT/original"
ENHANCED_ROOT="$BACKUP_ROOT/enhanced"
PAYLOAD_ROOT="${ELYRIC_PAYLOAD_ROOT:-/tmp/emby-lyric-enhance/adapter}"
PAYLOAD_JS="$PAYLOAD_ROOT/lyrics.inject.js"
PAYLOAD_CSS="$PAYLOAD_ROOT/lyrics.inject.css"
RECOVERY_ROOT="${ELYRIC_RECOVERY_ROOT:-$PAYLOAD_ROOT/recovered-original}"
EXPECTED_JS="${ELYRIC_EXPECTED_JS:-32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb}"
EXPECTED_CSS="${ELYRIC_EXPECTED_CSS:-82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7}"
MARKER="ELYRIC_ENHANCE_BEGIN:$VERSION"
ANCHOR="_exports.default=LyricsRenderer"

say() {
    printf '%s\n' "$*"
}

fail() {
    printf '错误：%s\n' "$*" >&2
    exit 1
}

sha256_file() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v busybox >/dev/null 2>&1; then
        busybox sha256sum "$1" | awk '{print $1}'
    else
        fail "容器内缺少 sha256sum，无法安全校验文件。"
    fi
}

require_targets() {
    [ -f "$TARGET_JS" ] || fail "找不到 $TARGET_JS"
    [ -f "$TARGET_CSS" ] || fail "找不到 $TARGET_CSS"
    [ -d "$CONFIG_ROOT" ] || fail "找不到 $CONFIG_ROOT，无法保存持久备份。"
}

has_marker() {
    grep -Fq "$MARKER" "$TARGET_JS" 2>/dev/null
}

verify_original_file() {
    file=$1
    expected=$2
    label=$3
    actual=$(sha256_file "$file")
    [ "$actual" = "$expected" ] || fail "$label 指纹不匹配。期望 $expected，实际 $actual。请确认使用的是未修改的 Emby $VERSION 文件。"
}

verify_original_backups() {
    [ -f "$ORIGINAL_ROOT/lyrics.js" ] || fail "缺少原始 lyrics.js 备份。"
    [ -f "$ORIGINAL_ROOT/lyrics.css" ] || fail "缺少原始 lyrics.css 备份。"
    verify_original_file "$ORIGINAL_ROOT/lyrics.js" "$EXPECTED_JS" "备份 lyrics.js"
    verify_original_file "$ORIGINAL_ROOT/lyrics.css" "$EXPECTED_CSS" "备份 lyrics.css"
}

recover_original_backups() {
    recovery_js="$RECOVERY_ROOT/lyrics.js"
    recovery_css="$RECOVERY_ROOT/lyrics.css"
    [ -f "$recovery_js" ] || fail "恢复源缺少 lyrics.js：$recovery_js"
    [ -f "$recovery_css" ] || fail "恢复源缺少 lyrics.css：$recovery_css"
    verify_original_file "$recovery_js" "$EXPECTED_JS" "镜像原版 lyrics.js"
    verify_original_file "$recovery_css" "$EXPECTED_CSS" "镜像原版 lyrics.css"

    mkdir -p "$ORIGINAL_ROOT"
    tmp_js="$ORIGINAL_ROOT/lyrics.js.recover.$$"
    tmp_css="$ORIGINAL_ROOT/lyrics.css.recover.$$"
    recovery_cleanup() {
        rm -f "$tmp_js" "$tmp_css"
    }
    trap recovery_cleanup 0
    trap 'recovery_cleanup; exit 1' HUP INT TERM

    cp "$recovery_js" "$tmp_js"
    cp "$recovery_css" "$tmp_css"
    chmod 0644 "$tmp_js" "$tmp_css"
    mv -f "$tmp_js" "$ORIGINAL_ROOT/lyrics.js"
    mv -f "$tmp_css" "$ORIGINAL_ROOT/lyrics.css"
    verify_original_backups

    trap - 0 HUP INT TERM
    say "已从当前容器的不可变镜像补回 Emby $VERSION 原版备份。"
}

require_managed_target() {
    if has_marker; then
        return 0
    fi
    if [ "$(sha256_file "$TARGET_JS")" = "$EXPECTED_JS" ] && [ "$(sha256_file "$TARGET_CSS")" = "$EXPECTED_CSS" ]; then
        return 0
    fi
    fail "当前 /system 文件既不是已知的 Emby $VERSION 原版，也不是本适配生成的增强版。为防止用旧备份覆盖其他版本，已停止。"
}

atomic_pair_replace() {
    source_js=$1
    source_css=$2
    tmp_js="$TARGET_JS.elyric.tmp.$$"
    tmp_css="$TARGET_CSS.elyric.tmp.$$"

    cleanup_pair() {
        rm -f "$tmp_js" "$tmp_css"
    }
    trap cleanup_pair 0
    trap 'cleanup_pair; exit 1' HUP INT TERM

    cp "$source_js" "$tmp_js"
    cp "$source_css" "$tmp_css"
    chmod 0644 "$tmp_js" "$tmp_css"

    if ! mv -f "$tmp_js" "$TARGET_JS"; then
        fail "替换 lyrics.js 失败。"
    fi
    if ! mv -f "$tmp_css" "$TARGET_CSS"; then
        cp "$ORIGINAL_ROOT/lyrics.js" "$TARGET_JS" || true
        cp "$ORIGINAL_ROOT/lyrics.css" "$TARGET_CSS" || true
        fail "替换 lyrics.css 失败，已尝试恢复两个原始文件。"
    fi

    trap - 0 HUP INT TERM
}

create_enhanced_files() {
    [ -f "$PAYLOAD_JS" ] || fail "缺少注入载荷 $PAYLOAD_JS"
    [ -f "$PAYLOAD_CSS" ] || fail "缺少注入载荷 $PAYLOAD_CSS"
    verify_original_backups

    mkdir -p "$ENHANCED_ROOT"
    tmp_js="$ENHANCED_ROOT/lyrics.js.tmp.$$"
    tmp_css="$ENHANCED_ROOT/lyrics.css.tmp.$$"

    anchor_count=$(awk -v anchor="$ANCHOR" '
        {
            value = $0
            while ((position = index(value, anchor)) > 0) {
                count++
                value = substr(value, position + length(anchor))
            }
        }
        END { print count + 0 }
    ' "$ORIGINAL_ROOT/lyrics.js")
    [ "$anchor_count" = "1" ] || fail "lyrics.js 注入锚点数量为 $anchor_count，预期为 1。"

    awk -v anchor="$ANCHOR" -v payload_file="$PAYLOAD_JS" '
        BEGIN {
            while ((getline line < payload_file) > 0) {
                payload = payload line ORS
            }
            close(payload_file)
        }
        {
            position = index($0, anchor)
            if (position > 0) {
                print substr($0, 1, position - 1) payload substr($0, position)
            } else {
                print
            }
        }
    ' "$ORIGINAL_ROOT/lyrics.js" > "$tmp_js"

    awk 'FNR == 1 && NR != 1 { print "" } { print }' \
        "$ORIGINAL_ROOT/lyrics.css" "$PAYLOAD_CSS" > "$tmp_css"

    grep -Fq "$MARKER" "$tmp_js" || fail "生成的 lyrics.js 缺少注入标记。"
    grep -Fq "$MARKER" "$tmp_css" || fail "生成的 lyrics.css 缺少注入标记。"

    mv -f "$tmp_js" "$ENHANCED_ROOT/lyrics.js"
    mv -f "$tmp_css" "$ENHANCED_ROOT/lyrics.css"
    chmod 0644 "$ENHANCED_ROOT/lyrics.js" "$ENHANCED_ROOT/lyrics.css"
    manifest_tmp="$ENHANCED_ROOT/manifest.tmp.$$"
    {
        printf 'build_id=%s\n' "$BUILD_ID"
        printf 'lyrics_js_sha256=%s\n' "$(sha256_file "$ENHANCED_ROOT/lyrics.js")"
        printf 'lyrics_css_sha256=%s\n' "$(sha256_file "$ENHANCED_ROOT/lyrics.css")"
    } > "$manifest_tmp"
    mv -f "$manifest_tmp" "$ENHANCED_ROOT/manifest"
}

install_enhanced() {
    require_targets
    mkdir -p "$ORIGINAL_ROOT" "$ENHANCED_ROOT"

    require_managed_target

    if [ ! -f "$ORIGINAL_ROOT/lyrics.js" ] || [ ! -f "$ORIGINAL_ROOT/lyrics.css" ]; then
        has_marker && fail "当前文件已有增强标记，但没有完整原始备份；为避免覆盖，已停止。"
        verify_original_file "$TARGET_JS" "$EXPECTED_JS" "lyrics.js"
        verify_original_file "$TARGET_CSS" "$EXPECTED_CSS" "lyrics.css"
        cp -p "$TARGET_JS" "$ORIGINAL_ROOT/lyrics.js"
        cp -p "$TARGET_CSS" "$ORIGINAL_ROOT/lyrics.css"
    fi

    verify_original_backups
    create_enhanced_files
    atomic_pair_replace "$ENHANCED_ROOT/lyrics.js" "$ENHANCED_ROOT/lyrics.css"
    say "已启用 Emby $VERSION 歌词增强。"
    say "原始备份：$ORIGINAL_ROOT"
}

switch_original() {
    require_targets
    require_managed_target
    if [ "$(sha256_file "$TARGET_JS")" = "$EXPECTED_JS" ] &&
       [ "$(sha256_file "$TARGET_CSS")" = "$EXPECTED_CSS" ]; then
        say "当前已是 Emby $VERSION 原版歌词文件，无需重复恢复。"
        return
    fi
    verify_original_backups
    atomic_pair_replace "$ORIGINAL_ROOT/lyrics.js" "$ORIGINAL_ROOT/lyrics.css"
    say "已切换到 Emby $VERSION 原版歌词文件，增强备份仍保留。"
}

switch_enhanced() {
    require_targets
    require_managed_target
    verify_original_backups
    # Regenerate from the payload copied by the current checkout. Reusing a
    # marker-only cached pair can silently reinstall an older adapter release.
    create_enhanced_files
    atomic_pair_replace "$ENHANCED_ROOT/lyrics.js" "$ENHANCED_ROOT/lyrics.css"
    say "已重新启用 Emby $VERSION 歌词增强。"
}

show_status() {
    require_targets
    if has_marker; then
        say "状态：增强版已启用"
    elif [ "$(sha256_file "$TARGET_JS")" = "$EXPECTED_JS" ] && [ "$(sha256_file "$TARGET_CSS")" = "$EXPECTED_CSS" ]; then
        say "状态：当前为 Emby $VERSION 原版文件"
    else
        say "状态：未知文件状态（既不是已知原版，也没有本适配标记）"
    fi

    say "前端构建：$BUILD_ID"
    current_js_sha=$(sha256_file "$TARGET_JS")
    current_css_sha=$(sha256_file "$TARGET_CSS")
    say "lyrics.js SHA-256：$current_js_sha"
    say "lyrics.css SHA-256：$current_css_sha"
    if [ -f "$ENHANCED_ROOT/manifest" ]; then
        expected_build=$(sed -n 's/^build_id=//p' "$ENHANCED_ROOT/manifest" | head -n 1)
        expected_js=$(sed -n 's/^lyrics_js_sha256=//p' "$ENHANCED_ROOT/manifest" | head -n 1)
        expected_css=$(sed -n 's/^lyrics_css_sha256=//p' "$ENHANCED_ROOT/manifest" | head -n 1)
        if [ "$expected_build" = "$BUILD_ID" ] && [ "$current_js_sha" = "$expected_js" ] && [ "$current_css_sha" = "$expected_css" ]; then
            say "构建校验：仓库构建 ID 与两个前端文件完全一致"
        else
            say "构建校验：不一致，请重新执行 install"
        fi
    else
        say "构建校验：缺少清单，请重新执行 install"
    fi

    if [ -f "$ORIGINAL_ROOT/lyrics.js" ] && [ -f "$ORIGINAL_ROOT/lyrics.css" ]; then
        say "原始备份：存在"
    else
        say "原始备份：不存在或不完整"
    fi
}

case "${1:-status}" in
    recover-original)
        recover_original_backups
        ;;
    install|enhanced)
        if [ "${1:-}" = "install" ]; then
            install_enhanced
        else
            switch_enhanced
        fi
        ;;
    original|undo|uninstall)
        switch_original
        ;;
    status)
        show_status
        ;;
    *)
        fail "未知命令：$1（支持 install、original、uninstall、enhanced、status、recover-original）"
        ;;
esac
