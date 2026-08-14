/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */
/* ELYRIC_BUILD:2026.08.14-theme-v6-dual-canvas-r2 */
;(function () {
    "use strict";

    if ("undefined" !== typeof location
        && /(?:^|[?&])elyric=off(?:&|$)/i.test(String(location.search || ""))) {
        return;
    }

    var TICKS_PER_SECOND = 10000000;
    var MAX_INTERPOLATION_MS = 800;
    var LYRIC_FOLLOW_IDLE_MS = 10000;
    var THEME_STORAGE_KEY = "emby-lyric-enhance.theme";
    var LAYOUT_STORAGE_KEY = "emby-lyric-enhance.player-layout";
    var ARTWORK_ROTATION_STORAGE_KEY = "emby-lyric-enhance.artwork-rotation";
    var VISUALIZER_STYLE_STORAGE_KEY = "emby-lyric-enhance.visualizer-style";
    var VISUALIZER_RANGE_STORAGE_KEY = "emby-lyric-enhance.visualizer-range";
    var VISUALIZER_AMPLITUDE_STORAGE_KEY = "emby-lyric-enhance.visualizer-amplitude";
    var VISUALIZER_WIDTH_STORAGE_KEY = "emby-lyric-enhance.visualizer-width";
    var VISUALIZER_HEIGHT_STORAGE_KEY = "emby-lyric-enhance.visualizer-height";
    var VISUALIZER_SENSITIVITY_STORAGE_KEY = "emby-lyric-enhance.visualizer-sensitivity";
    var VISUALIZER_RESPONSE_STORAGE_KEY = "emby-lyric-enhance.visualizer-response";
    var VISUALIZER_SMOOTHING_STORAGE_KEY = "emby-lyric-enhance.visualizer-smoothing";
    var VISUALIZER_DENSITY_STORAGE_KEY = "emby-lyric-enhance.visualizer-density";
    var VISUALIZER_BASS_BOOST_STORAGE_KEY = "emby-lyric-enhance.visualizer-bass-boost";
    var BACKGROUND_MODE_STORAGE_KEY = "emby-lyric-enhance.background-mode";
    var VISUALIZER_COLOR_MODE_STORAGE_KEY = "emby-lyric-enhance.visualizer-color-mode";
    var VISUALIZER_COLOR_STORAGE_KEYS = [
        "emby-lyric-enhance.visualizer-color-1",
        "emby-lyric-enhance.visualizer-color-2",
        "emby-lyric-enhance.visualizer-color-3"
    ];
    var LYRIC_ALIGNMENT_STORAGE_KEY = "emby-lyric-enhance.lyric-alignment";
    var LYRIC_SCALE_STORAGE_KEY = "emby-lyric-enhance.lyric-scale";
    var PLAYER_PREFERENCES_KEY = "emby-lyric-enhance.player-preferences.v2";
    var PLAYER_THEME_LIBRARY_STORAGE_KEY = "emby-lyric-enhance.player-themes.v1";
    var PLAYER_THEME_DESIGN_STORAGE_KEY = "emby-lyric-enhance.player-theme-design.v1";
    var PLAYER_BUILD_ID = "2026.08.14-theme-v6-dual-canvas-r2";
    var PLAYER_PREFERENCES_VERSION = 6;
    var PLAYER_THEME_SCHEMA_VERSION = 6;
    var PLAYER_THEME_DOCUMENT_FORMAT = "emby-lyric-theme";
    var PLAYER_THEME_LAYOUT_MODEL = "fixed-canvas-v1";
    var PLAYER_THEME_LEGACY_V5_LAYOUT_MODEL = "anchored-canvas-v2";
    var PLAYER_THEME_PREVIOUS_LAYOUT_MODEL = "anchored-canvas-v1";
    var PLAYER_THEME_CANVAS_SIZES = {
        landscape: { width: 1920, height: 1080 },
        portrait: { width: 1080, height: 1920 }
    };
    var PLAYER_THEME_MAX_RENDER_SCALE = 8;
    var PLAYER_THEME_V3_MIGRATION_BACKUP_KEY = "emby-lyric-enhance.player-theme-v3-backup.v1";
    var PLAYER_THEME_V6_MIGRATION_BACKUP_KEY = "emby-lyric-enhance.player-theme-v6-backup.v1";
    var MAX_LEGACY_USER_PLAYER_THEMES = 24;
    var PLAYER_PREFERENCES_SAVE_DELAY = 500;
    var PLAYER_WORKSPACE_PATH = "EmbyLyricEnhance/UserWorkspace";
    var PLAYER_THEMES_PATH = "EmbyLyricEnhance/Themes";
    var PLAYER_ASSETS_PATH = "EmbyLyricEnhance/Assets";
    var PLAYER_THEME_V2_OFFLINE_QUEUE_KEY = "emby-lyric-enhance.theme-v5.offline-queue";
    var PLAYER_THEME_V2_WORKSPACE_CACHE_KEY = "emby-lyric-enhance.theme-v5.workspace-cache";
    var PLAYER_THEME_V2_LEGACY_ARCHIVE_KEY = "emby-lyric-enhance.theme-v5.legacy-archive";
    var PLAYER_THEME_V5_REPAIR_BACKUP_KEY = "emby-lyric-enhance.theme-v5.layout-repair-backups";
    var PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION = 2;
    var PLAYER_THEME_LAYER_Z = {
        artwork: 20, metadata: 20, lyrics: 20, visualizer: 30, controlDock: 40
    };
    var PUBLIC_CONFIGURATION_PATH = "EmbyLyricEnhance/PublicConfiguration";
    var PLAYER_LAYOUTS = [
        { id: "album", label: "编辑唱片" },
        { id: "center", label: "Spotify 海报" },
        { id: "mobile", label: "移动唱机" },
        { id: "mint", label: "薄荷拟物" },
        { id: "deck", label: "实体唱盘" },
        { id: "stack", label: "专辑列表" },
        { id: "coverflow", label: "封面流" },
        { id: "lyrics", label: "唱片歌词" },
        { id: "rose", label: "粉色拟态" },
        { id: "custom", label: "自定义" }
    ];
    var PLAYER_LAYOUT_PRESET_DEFAULTS = {
        album: {
            backgroundMode: "white", lyricAlignment: "left", visualizerStyle: "line",
            visualizerColorMode: "dual", visualizerColors: ["#d74642", "#111111", "#767676"]
        },
        center: {
            backgroundMode: "blur", lyricAlignment: "left", visualizerStyle: "curve",
            visualizerColorMode: "solid", visualizerColors: ["#1ed760", "#75f59e", "#d8ffe4"]
        },
        mobile: {
            backgroundMode: "blur", lyricAlignment: "center", visualizerStyle: "waveform",
            visualizerColorMode: "dual", visualizerColors: ["#ffffff", "#b9f782", "#6ed9ff"]
        },
        mint: {
            backgroundMode: "white", lyricAlignment: "center", visualizerStyle: "spectrum",
            visualizerColorMode: "solid", visualizerColors: ["#617d76", "#91aaa3", "#d9ebe6"]
        },
        deck: {
            backgroundMode: "white", lyricAlignment: "center", visualizerStyle: "balls",
            visualizerColorMode: "dual", visualizerColors: ["#7b80e8", "#b6b8ff", "#40444b"]
        },
        stack: {
            backgroundMode: "blur", lyricAlignment: "left", visualizerStyle: "line",
            visualizerColorMode: "dual", visualizerColors: ["#ff525d", "#ffffff", "#ff9ca2"]
        },
        coverflow: {
            backgroundMode: "blur", lyricAlignment: "center", visualizerStyle: "chroma",
            visualizerColorMode: "multi", visualizerColors: ["#ffb13b", "#ff5c52", "#f6e28f"]
        },
        lyrics: {
            backgroundMode: "blur", lyricAlignment: "left", visualizerStyle: "waveform",
            visualizerColorMode: "dual", visualizerColors: ["#ffffff", "#dbe4dd", "#92bd9f"]
        },
        rose: {
            backgroundMode: "white", lyricAlignment: "left", visualizerStyle: "balls",
            visualizerColorMode: "solid", visualizerColors: ["#ff2f72", "#ff87ad", "#ffd1df"]
        }
    };
    var PLAYER_SURFACE_STYLES = [
        { id: "none", label: "无背景" },
        { id: "glass", label: "毛玻璃" },
        { id: "inset", label: "内嵌" },
        { id: "embossed", label: "浮雕" },
        { id: "floating", label: "悬浮" }
    ];
    var PLAYER_ARTWORK_MODES = [
        { id: "single", label: "单封面" },
        { id: "coverflow", label: "封面流" }
    ];
    var PLAYER_ARTWORK_MATERIALS = [
        { id: "plain", label: "简洁" },
        { id: "vinyl", label: "黑胶" },
        { id: "poster", label: "海报" },
        { id: "turntable", label: "唱机" },
        { id: "neumorphic", label: "拟物" },
        { id: "deck", label: "唱盘" },
        { id: "stack", label: "叠放" },
        { id: "coverflow", label: "空间流" }
    ];
    var PLAYER_CONTROL_MATERIALS = [
        { id: "glass", label: "玻璃" },
        { id: "minimal", label: "简洁" },
        { id: "black", label: "纯黑" },
        { id: "white", label: "纯白" },
        { id: "gradient", label: "渐变" },
        { id: "rainbow", label: "彩虹" },
        { id: "neumorphic", label: "拟物" },
        { id: "deck", label: "唱盘" },
        { id: "poster", label: "海报" }
    ];
    var PLAYER_METADATA_ANCHORS = [
        { id: "start", label: "左锚点" },
        { id: "center", label: "中心锚点" },
        { id: "end", label: "右锚点" }
    ];
    var PLAYER_MEDIA_FIELDS = [
        { id: "overview", label: "歌曲" },
        { id: "file", label: "文件" },
        { id: "audio", label: "音频" },
        { id: "image", label: "图像" },
        { id: "lyrics", label: "歌词流" }
    ];
    var PLAYER_METADATA_SUMMARY_FIELDS = [
        { id: "title", label: "歌名" }, { id: "artist", label: "艺术家" }, { id: "album", label: "专辑" },
        { id: "container", label: "容器" }, { id: "codec", label: "编码" },
        { id: "sampleRate", label: "采样率" }, { id: "bitDepth", label: "位深" },
        { id: "channels", label: "声道" }, { id: "bitrate", label: "码率" }
    ];
    var PLAYER_THEME_COLOR_DEFINITIONS = [
        { id: "backgroundA", label: "背景颜色一", cssProperty: "--elyric-design-background-a", fallback: "#10141c" },
        { id: "backgroundB", label: "背景颜色二", cssProperty: "--elyric-design-background-b", fallback: "#273447" },
        { id: "artworkFrame", label: "封面外框", cssProperty: "--elyric-design-artwork-frame", fallback: "#ffffff" },
        { id: "metadataText", label: "歌曲信息文字", cssProperty: "--elyric-design-metadata-text", fallback: "#ffffff" },
        { id: "metadataSurface", label: "歌曲信息背景", cssProperty: "--elyric-design-metadata-surface", fallback: "#111827" },
        { id: "lyricsSurface", label: "歌词背景", cssProperty: "--elyric-design-lyrics-surface", fallback: "#111827" },
        { id: "lyricPast", label: "已播放歌词", cssProperty: "--elyric-design-lyric-past", fallback: "#b8c1d1" },
        { id: "lyricCurrent", label: "当前行歌词", cssProperty: "--elyric-design-lyric-current", fallback: "#ffffff" },
        { id: "lyricFuture", label: "未播放歌词", cssProperty: "--elyric-design-lyric-future", fallback: "#8993a5" },
        { id: "progressActive", label: "进度已播放", cssProperty: "--elyric-design-progress-active", fallback: "#ffffff" },
        { id: "progressTrack", label: "进度未播放", cssProperty: "--elyric-design-progress-track", fallback: "#667085" },
        { id: "volumeActive", label: "音量已填充", cssProperty: "--elyric-design-volume-active", fallback: "#ffffff" },
        { id: "volumeTrack", label: "音量轨道", cssProperty: "--elyric-design-volume-track", fallback: "#667085" },
        { id: "mediaSurface", label: "信息弹卡背景", cssProperty: "--elyric-design-media-surface", fallback: "#111827" }
    ];
    var THEMES = [
        { id: "classic", label: "经典累积" },
        { id: "focus", label: "单字聚焦" },
        { id: "gradient", label: "渐变扫光" },
        { id: "apple", label: "Apple 风格" },
        { id: "minimal", label: "简洁整行" }
    ];
    var VISUALIZER_STYLES = [
        { id: "spectrum", label: "能量柱" },
        { id: "mirror", label: "镜像频谱" },
        { id: "waveform", label: "实时波形" },
        { id: "fall", label: "峰值回落" },
        { id: "curve", label: "流线" },
        { id: "line", label: "折线" },
        { id: "chroma", label: "彩色镜像" },
        { id: "balls", label: "粒子矩阵" },
        { id: "pulse", label: "呼吸" }
    ];
    var VISUALIZER_FREQUENCY_LAYOUTS = [
        { id: "centerOut", label: "中心向两侧" },
        { id: "lowToHigh", label: "低频到高频" },
        { id: "radial", label: "环形能量" }
    ];
    var VISUALIZER_ANALYSIS_DEFINITIONS = [
        {
            id: "sensitivity", property: "__elyricVisualizerSensitivity",
            storageKey: VISUALIZER_SENSITIVITY_STORAGE_KEY,
            minimum: 50, maximum: 220, step: 5, fallback: 125, valueUnit: "%"
        },
        {
            id: "response", property: "__elyricVisualizerResponse",
            storageKey: VISUALIZER_RESPONSE_STORAGE_KEY,
            minimum: 10, maximum: 100, step: 5, fallback: 80, valueUnit: "%"
        },
        {
            id: "smoothing", property: "__elyricVisualizerSmoothing",
            storageKey: VISUALIZER_SMOOTHING_STORAGE_KEY,
            minimum: 0, maximum: 85, step: 5, fallback: 25, valueUnit: "%"
        },
        {
            id: "minFrequency", property: "__elyricVisualizerMinFrequency",
            storageKey: "emby-lyric-enhance.visualizer-min-frequency",
            minimum: 20, maximum: 400, step: 10, fallback: 30, valueUnit: " Hz"
        },
        {
            id: "maxFrequency", property: "__elyricVisualizerMaxFrequency",
            storageKey: "emby-lyric-enhance.visualizer-max-frequency",
            minimum: 6000, maximum: 22000, step: 500, fallback: 16000, valueUnit: " Hz"
        },
        {
            id: "density", property: "__elyricVisualizerDensity",
            storageKey: VISUALIZER_DENSITY_STORAGE_KEY,
            minimum: 24, maximum: 96, step: 4, fallback: 56, valueUnit: ""
        },
        {
            id: "bassBoost", property: "__elyricVisualizerBassBoost",
            storageKey: VISUALIZER_BASS_BOOST_STORAGE_KEY,
            minimum: 0, maximum: 200, step: 5, fallback: 100, valueUnit: "%"
        }
    ];
    var VISUALIZER_RANGES = [
        { id: "compact", label: "窄幅", width: 40 },
        { id: "wide", label: "宽幅", width: 62 },
        { id: "full", label: "全宽", width: 88 }
    ];
    var BACKGROUND_MODES = [
        { id: "black", label: "黑色" },
        { id: "white", label: "白色" },
        { id: "blur", label: "专辑模糊" },
        { id: "gradient", label: "自定义渐变" }
    ];
    var VISUALIZER_COLOR_MODES = [
        { id: "solid", label: "纯色" },
        { id: "dual", label: "双色" },
        { id: "multi", label: "多色" },
        { id: "rainbow", label: "彩虹" }
    ];
    var LYRIC_ALIGNMENTS = [
        { id: "left", label: "左对齐" },
        { id: "center", label: "居中" },
        { id: "right", label: "右对齐" }
    ];
    var PLAYER_TUNING_DEFINITIONS = [
        {
            id: "backgroundBlur", label: "高斯模糊", storageKey: "emby-lyric-enhance.background-blur",
            minimum: 0, maximum: 72, step: 1, fallback: 44, cssProperty: "--elyric-background-blur",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "backgroundDim", label: "背景压暗", storageKey: "emby-lyric-enhance.background-dim",
            minimum: 20, maximum: 88, step: 1, fallback: 64, cssProperty: "--elyric-background-dim",
            ratio: true, valueUnit: "%"
        },
        {
            id: "artworkScale", label: "唱片内部缩放", storageKey: "emby-lyric-enhance.artwork-scale",
            minimum: 35, maximum: 140, step: 1, fallback: 100, cssProperty: "--elyric-artwork-scale",
            ratio: true, valueUnit: "%"
        },
        {
            id: "artworkSize", label: "唱片占屏宽度", storageKey: "emby-lyric-enhance.artwork-size",
            minimum: 12, maximum: 82, step: 1, fallback: 30, cssProperty: "--elyric-artwork-size",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "artworkX", label: "唱片横向位置", storageKey: "emby-lyric-enhance.artwork-x",
            minimum: 0, maximum: 100, step: 1, fallback: 76, cssProperty: "--elyric-artwork-x",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "artworkY", label: "唱片纵向位置", storageKey: "emby-lyric-enhance.artwork-y",
            minimum: 4, maximum: 88, step: 1, fallback: 40, cssProperty: "--elyric-artwork-y",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "metadataWidth", label: "歌曲信息宽度", storageKey: "emby-lyric-enhance.metadata-width",
            minimum: 10, maximum: 94, step: 1, fallback: 30, cssProperty: "--elyric-metadata-width",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "metadataX", label: "歌曲信息横向位置", storageKey: "emby-lyric-enhance.metadata-x",
            minimum: 0, maximum: 100, step: 1, fallback: 64, cssProperty: "--elyric-metadata-x",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "metadataY", label: "歌曲信息纵向位置", storageKey: "emby-lyric-enhance.metadata-y",
            minimum: 3, maximum: 88, step: 1, fallback: 11, cssProperty: "--elyric-metadata-y",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "lyricsWidth", label: "歌词区域宽度", storageKey: "emby-lyric-enhance.lyrics-width",
            minimum: 10, maximum: 96, step: 1, fallback: 46, cssProperty: "--elyric-lyrics-width",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "lyricsHeight", label: "歌词区域高度", storageKey: "emby-lyric-enhance.lyrics-height",
            minimum: 12, maximum: 80, step: 1, fallback: 54, cssProperty: "--elyric-lyrics-height",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "lyricsX", label: "歌词横向位置", storageKey: "emby-lyric-enhance.lyrics-x",
            minimum: 0, maximum: 100, step: 1, fallback: 7, cssProperty: "--elyric-lyrics-x",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "lyricsY", label: "歌词纵向位置", storageKey: "emby-lyric-enhance.lyrics-y",
            minimum: 4, maximum: 84, step: 1, fallback: 18, cssProperty: "--elyric-lyrics-y",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "lyricLineGap", label: "歌词行距", storageKey: "emby-lyric-enhance.lyric-line-gap",
            minimum: 90, maximum: 180, step: 5, fallback: 125, cssProperty: "--elyric-line-height",
            ratio: true, valueUnit: "%"
        },
        {
            id: "lyricInactiveOpacity", label: "非当前行透明度", storageKey: "emby-lyric-enhance.lyric-inactive-opacity",
            minimum: 10, maximum: 65, step: 1, fallback: 30, cssProperty: "--elyric-other-lines-opacity",
            ratio: true, valueUnit: "%"
        },
        {
            id: "backgroundSaturation", label: "背景饱和度", storageKey: "emby-lyric-enhance.background-saturation",
            minimum: 0, maximum: 220, step: 5, fallback: 115, cssProperty: "--elyric-design-background-saturation",
            percentage: true, valueUnit: "%"
        },
        {
            id: "backgroundAngle", label: "渐变角度", storageKey: "emby-lyric-enhance.background-angle",
            minimum: 0, maximum: 360, step: 5, fallback: 135, cssProperty: "--elyric-design-background-angle",
            cssUnit: "deg", valueUnit: "°"
        },
        {
            id: "artworkInnerSize", label: "内层封面大小", storageKey: "emby-lyric-enhance.artwork-inner-size",
            minimum: 18, maximum: 100, step: 1, fallback: 88, cssProperty: "--elyric-design-artwork-inner-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "artworkOuterRadius", label: "外层圆角 / 外径", storageKey: "emby-lyric-enhance.artwork-outer-radius",
            minimum: 0, maximum: 50, step: 1, fallback: 50, cssProperty: "--elyric-design-artwork-outer-radius",
            percentage: true, valueUnit: "%"
        },
        {
            id: "artworkInnerRadius", label: "内层圆角 / 内径", storageKey: "emby-lyric-enhance.artwork-inner-radius",
            minimum: 0, maximum: 50, step: 1, fallback: 50, cssProperty: "--elyric-design-artwork-inner-radius",
            percentage: true, valueUnit: "%"
        },
        {
            id: "artworkPadding", label: "内外层间距", storageKey: "emby-lyric-enhance.artwork-padding",
            minimum: 0, maximum: 18, step: 1, fallback: 4, cssProperty: "--elyric-design-artwork-padding",
            percentage: true, valueUnit: "%"
        },
        {
            id: "artworkBorderWidth", label: "封面外框宽度", storageKey: "emby-lyric-enhance.artwork-border-width",
            minimum: 0, maximum: 12, step: 1, fallback: 1, cssProperty: "--elyric-design-artwork-border-width",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "artworkShadowDepth", label: "封面阴影深度", storageKey: "emby-lyric-enhance.artwork-shadow-depth",
            minimum: 0, maximum: 64, step: 2, fallback: 28, cssProperty: "--elyric-design-artwork-shadow-depth",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "coverflowWidth", label: "封面流宽度", storageKey: "emby-lyric-enhance.coverflow-width",
            minimum: 36, maximum: 96, step: 1, fallback: 82, cssProperty: "--elyric-design-coverflow-width",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "coverflowHeight", label: "封面流高度", storageKey: "emby-lyric-enhance.coverflow-height",
            minimum: 18, maximum: 68, step: 1, fallback: 48, cssProperty: "--elyric-design-coverflow-height",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "metadataTitleSize", label: "歌曲标题大小", storageKey: "emby-lyric-enhance.metadata-title-size",
            minimum: 70, maximum: 260, step: 5, fallback: 135, cssProperty: "--elyric-design-title-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "metadataArtistSize", label: "歌手文字大小", storageKey: "emby-lyric-enhance.metadata-artist-size",
            minimum: 70, maximum: 220, step: 5, fallback: 110, cssProperty: "--elyric-design-artist-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "metadataAlbumSize", label: "专辑文字大小", storageKey: "emby-lyric-enhance.metadata-album-size",
            minimum: 65, maximum: 200, step: 5, fallback: 100, cssProperty: "--elyric-design-album-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "metadataLetterSpacing", label: "歌曲信息字间距", storageKey: "emby-lyric-enhance.metadata-letter-spacing",
            minimum: -2, maximum: 12, step: .5, fallback: 0, cssProperty: "--elyric-design-metadata-letter-spacing",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "metadataPadding", label: "歌曲信息内边距", storageKey: "emby-lyric-enhance.metadata-padding",
            minimum: 0, maximum: 48, step: 2, fallback: 12, cssProperty: "--elyric-design-metadata-padding",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "metadataRadius", label: "歌曲信息圆角", storageKey: "emby-lyric-enhance.metadata-radius",
            minimum: 0, maximum: 48, step: 2, fallback: 18, cssProperty: "--elyric-design-metadata-radius",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "metadataBlur", label: "歌曲信息模糊", storageKey: "emby-lyric-enhance.metadata-blur",
            minimum: 0, maximum: 48, step: 2, fallback: 18, cssProperty: "--elyric-design-metadata-blur",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "metadataOpacity", label: "歌曲信息背景强度", storageKey: "emby-lyric-enhance.metadata-opacity",
            minimum: 0, maximum: 100, step: 1, fallback: 72, cssProperty: "--elyric-design-metadata-opacity",
            percentage: true, valueUnit: "%"
        },
        {
            id: "lyricsPadding", label: "歌词内边距", storageKey: "emby-lyric-enhance.lyrics-padding",
            minimum: 0, maximum: 64, step: 2, fallback: 22, cssProperty: "--elyric-design-lyrics-padding",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "lyricsRadius", label: "歌词背景圆角", storageKey: "emby-lyric-enhance.lyrics-radius",
            minimum: 0, maximum: 64, step: 2, fallback: 24, cssProperty: "--elyric-design-lyrics-radius",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "lyricsBlur", label: "歌词背景模糊", storageKey: "emby-lyric-enhance.lyrics-blur",
            minimum: 0, maximum: 64, step: 2, fallback: 22, cssProperty: "--elyric-design-lyrics-blur",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "lyricsOpacity", label: "歌词背景强度", storageKey: "emby-lyric-enhance.lyrics-opacity",
            minimum: 0, maximum: 100, step: 1, fallback: 58, cssProperty: "--elyric-design-lyrics-opacity",
            percentage: true, valueUnit: "%"
        },
        {
            id: "lyricLetterSpacing", label: "歌词字间距", storageKey: "emby-lyric-enhance.lyric-letter-spacing",
            minimum: -2, maximum: 16, step: .5, fallback: 0, cssProperty: "--elyric-design-lyric-letter-spacing",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "lyricPastSize", label: "已播放歌词大小", storageKey: "emby-lyric-enhance.lyric-past-size",
            minimum: 65, maximum: 180, step: 5, fallback: 95, cssProperty: "--elyric-design-lyric-past-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "lyricCurrentSize", label: "当前行歌词大小", storageKey: "emby-lyric-enhance.lyric-current-size",
            minimum: 70, maximum: 220, step: 5, fallback: 125, cssProperty: "--elyric-design-lyric-current-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "lyricFutureSize", label: "未播放歌词大小", storageKey: "emby-lyric-enhance.lyric-future-size",
            minimum: 65, maximum: 180, step: 5, fallback: 95, cssProperty: "--elyric-design-lyric-future-size",
            percentage: true, valueUnit: "%"
        },
        {
            id: "lyricCurrentWeight", label: "当前行字重", storageKey: "emby-lyric-enhance.lyric-current-weight",
            minimum: 300, maximum: 900, step: 50, fallback: 760, cssProperty: "--elyric-design-lyric-current-weight",
            valueUnit: ""
        },
        {
            id: "visualizerX", label: "频谱横向位置", storageKey: "emby-lyric-enhance.visualizer-x",
            minimum: 0, maximum: 100, step: 1, fallback: 50, cssProperty: "--elyric-design-visualizer-x",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "visualizerY", label: "频谱纵向位置", storageKey: "emby-lyric-enhance.visualizer-y",
            minimum: 5, maximum: 88, step: 1, fallback: 78, cssProperty: "--elyric-design-visualizer-y",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "visualizerRotation", label: "频谱旋转", storageKey: "emby-lyric-enhance.visualizer-rotation",
            minimum: -180, maximum: 180, step: 5, fallback: 0, cssProperty: "--elyric-design-visualizer-rotation",
            cssUnit: "deg", valueUnit: "°"
        },
        {
            id: "visualizerOpacity", label: "频谱透明度", storageKey: "emby-lyric-enhance.visualizer-opacity",
            minimum: 10, maximum: 100, step: 1, fallback: 78, cssProperty: "--elyric-design-visualizer-opacity",
            ratio: true, valueUnit: "%"
        },
        {
            id: "progressWidth", label: "进度条宽度", storageKey: "emby-lyric-enhance.progress-width",
            minimum: 28, maximum: 92, step: 1, fallback: 62, cssProperty: "--elyric-design-progress-width",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "progressTrackHeight", label: "进度轨道厚度", storageKey: "emby-lyric-enhance.progress-height",
            minimum: 2, maximum: 12, step: 1, fallback: 6, cssProperty: "--elyric-design-progress-height",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "progressThumbSize", label: "进度滑块大小", storageKey: "emby-lyric-enhance.progress-thumb-size",
            minimum: 8, maximum: 26, step: 1, fallback: 16, cssProperty: "--elyric-design-progress-thumb-size",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "volumeWidth", label: "音量条宽度", storageKey: "emby-lyric-enhance.volume-width",
            minimum: 8, maximum: 32, step: 1, fallback: 18, cssProperty: "--elyric-design-volume-width",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "volumeTrackHeight", label: "音量轨道厚度", storageKey: "emby-lyric-enhance.volume-height",
            minimum: 2, maximum: 12, step: 1, fallback: 5, cssProperty: "--elyric-design-volume-height",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "volumeThumbSize", label: "音量滑块大小", storageKey: "emby-lyric-enhance.volume-thumb-size",
            minimum: 8, maximum: 24, step: 1, fallback: 14, cssProperty: "--elyric-design-volume-thumb-size",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "consoleBlur", label: "控制台模糊", storageKey: "emby-lyric-enhance.console-blur",
            minimum: 8, maximum: 48, step: 2, fallback: 26, cssProperty: "--elyric-design-console-blur",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "consoleOpacity", label: "控制台背景强度", storageKey: "emby-lyric-enhance.console-opacity",
            minimum: 28, maximum: 96, step: 1, fallback: 72, cssProperty: "--elyric-design-console-opacity",
            percentage: true, valueUnit: "%"
        },
        {
            id: "mediaWidth", label: "信息弹卡宽度", storageKey: "emby-lyric-enhance.media-width",
            minimum: 18, maximum: 54, step: 1, fallback: 34, cssProperty: "--elyric-design-media-width",
            cssUnit: "vw", valueUnit: "%"
        },
        {
            id: "mediaMaxHeight", label: "信息弹卡高度", storageKey: "emby-lyric-enhance.media-height",
            minimum: 28, maximum: 88, step: 1, fallback: 72, cssProperty: "--elyric-design-media-height",
            cssUnit: "vh", valueUnit: "%"
        },
        {
            id: "mediaRadius", label: "信息弹卡圆角", storageKey: "emby-lyric-enhance.media-radius",
            minimum: 0, maximum: 48, step: 2, fallback: 22, cssProperty: "--elyric-design-media-radius",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "mediaBlur", label: "信息弹卡模糊", storageKey: "emby-lyric-enhance.media-blur",
            minimum: 0, maximum: 48, step: 2, fallback: 24, cssProperty: "--elyric-design-media-blur",
            cssUnit: "px", valueUnit: " px"
        },
        {
            id: "mediaOpacity", label: "信息弹卡背景强度", storageKey: "emby-lyric-enhance.media-opacity",
            minimum: 20, maximum: 100, step: 1, fallback: 88, cssProperty: "--elyric-design-media-opacity",
            percentage: true, valueUnit: "%"
        }
    ];
    var PLAYER_THEME_V2_PROFILE_IDS = ["landscape", "portrait"];
    var playerThemeV2ActiveProfile = "";
    var PLAYER_THEME_V2_LAYER_IDS = [
        "artwork", "metadata", "lyrics", "visualizer", "controlDock"
    ];
    var PLAYER_THEME_V4_LAYER_IDS = [
        "artwork", "metadata", "lyrics", "visualizer",
        "progress", "transport", "volume", "auxiliary"
    ];
    var PLAYER_THEME_V2_LAYER_LABELS = {
        artwork: "专辑图", metadata: "歌曲信息", lyrics: "歌词",
        visualizer: "频谱", controlDock: "播放控制坞"
    };
    var PLAYER_CONTROL_DOCK_GROUP_IDS = ["progress", "transport", "volume", "auxiliary"];
    var PLAYER_CONTROL_DOCK_BUTTON_IDS = {
        progress: [],
        transport: ["previous", "playPause", "next"],
        volume: ["mute", "slider", "value"],
        auxiliary: ["shuffle", "repeat", "stop", "queue", "media", "settings", "visualizerToggle",
            "secondaryLyrics", "tertiaryLyrics", "artworkRotation"]
    };
    var PLAYER_CONTROL_DOCK_JUSTIFY_IDS = ["start", "center", "end", "space-between"];
    var PLAYER_CONTROL_DOCK_ALIGN_IDS = ["start", "center", "end"];
    var PLAYER_THEME_V2_ANCHORS = ["start", "center", "end"];
    var PLAYER_LEGACY_GEOMETRY_TUNING_IDS = [
        "artworkSize", "artworkX", "artworkY", "metadataWidth", "metadataX", "metadataY",
        "lyricsWidth", "lyricsHeight", "lyricsX", "lyricsY", "visualizerX", "visualizerY",
        "visualizerRotation", "visualizerOpacity", "progressWidth", "volumeWidth"
    ];
    var PLAYER_THEME_TUNING_DEFINITIONS = PLAYER_TUNING_DEFINITIONS.filter(function (definition) {
        return PLAYER_LEGACY_GEOMETRY_TUNING_IDS.indexOf(definition.id) < 0;
    });
    var PLAYER_THEME_V2_REGISTRY = [];

    function normalizePlayerThemeV2Number(value, minimum, maximum, fallback) {
        value = Number(value);
        return isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
    }

    function normalizePlayerThemeV2Boolean(value) {
        return true === value || "true" === value || 1 === value;
    }

    function normalizePlayerThemeV2Enum(value, allowed, fallback) {
        value = String(null == value ? "" : value);
        return allowed.indexOf(value) >= 0 ? value : fallback;
    }

    function normalizePlayerThemeV2String(value, fallback, maximumLength) {
        value = String(null == value ? (fallback || "") : value)
            .replace(/[\u0000-\u001f\u007f]/g, " ").trim();
        return value.slice(0, maximumLength || 160) || fallback || "";
    }

    function normalizePlayerThemeV2Id(value) {
        value = String(value || "").trim();
        return /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : "";
    }

    function normalizePlayerThemeV2HttpsUrl(value) {
        value = String(value || "").trim();
        return !value || /^https:\/\/[^\s]+$/i.test(value) ? value.slice(0, 2048) : "";
    }

    function normalizePlayerThemeV2ClipPath(value) {
        value = String(value || "none").trim();
        return "none" === value || /^polygon\([\d\s.,%+-]+\)$/i.test(value) ? value : "none";
    }

    function playerThemeV2ChoiceValues(choiceId) {
        var definitions = {
            artworkMode: PLAYER_ARTWORK_MODES,
            artworkMaterial: PLAYER_ARTWORK_MATERIALS,
            controlMaterial: PLAYER_CONTROL_MATERIALS,
            metadataAnchor: PLAYER_METADATA_ANCHORS,
            metadataAlign: LYRIC_ALIGNMENTS,
            metadataSurface: PLAYER_SURFACE_STYLES,
            lyricsSurface: PLAYER_SURFACE_STYLES,
            mediaSurface: PLAYER_SURFACE_STYLES
        };
        return (definitions[choiceId] || []).map(function (item) { return item.id; });
    }

    function registerPlayerThemeV2Parameter(definition) {
        if (!definition || !definition.id
            || !Object.prototype.hasOwnProperty.call(definition, "defaultValue")
            || "function" !== typeof definition.validate
            || !definition.editor || !definition.binding || !definition.serverRule) {
            throw new Error("PlayerThemeV2 parameter registration is incomplete");
        }
        if (PLAYER_THEME_V2_REGISTRY.some(function (item) { return item.id === definition.id; })) {
            throw new Error("Duplicate PlayerThemeV2 parameter: " + definition.id);
        }
        definition.serialize = true;
        definition.serverValidate = true;
        definition.migrate = definition.migrate || function (value) { return value; };
        var rootFamily = definition.id.split(".")[0];
        definition.themePath = ["tuning", "colors", "choices", "player", "mediaFields"].indexOf(rootFamily) >= 0
            ? definition.id
            : "v2." + definition.id;
        PLAYER_THEME_V2_REGISTRY.push(definition);
    }

    PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
        registerPlayerThemeV2Parameter({
            id: "tuning." + definition.id,
            defaultValue: definition.fallback,
            validate: function (value) { return normalizePlayerTuningValue(definition, value); },
            editor: "range",
            binding: definition.cssProperty,
            serverRule: "tuning-range"
        });
    });
    PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
        registerPlayerThemeV2Parameter({
            id: "colors." + definition.id,
            defaultValue: definition.fallback,
            validate: function (value) { return normalizeHexColor(value, definition.fallback); },
            editor: "color",
            binding: definition.cssProperty,
            serverRule: "hex-color"
        });
    });
    ["artworkMode", "artworkMaterial", "controlMaterial", "metadataAnchor", "metadataAlign", "metadataSurface", "lyricsSurface", "mediaSurface"]
        .forEach(function (choiceId) {
            registerPlayerThemeV2Parameter({
                id: "choices." + choiceId,
                defaultValue: defaultPlayerThemeChoices()[choiceId],
                validate: function (value) {
                    return normalizePlayerThemeV2Enum(
                        value,
                        playerThemeV2ChoiceValues(choiceId),
                        defaultPlayerThemeChoices()[choiceId]
                    );
                },
                editor: "segmented", binding: "data-elyric-" + choiceId,
                serverRule: "choice-enum"
            });
        });
    PLAYER_MEDIA_FIELDS.forEach(function (field) {
        registerPlayerThemeV2Parameter({
            id: "mediaFields." + field.id,
            defaultValue: defaultPlayerMediaFields()[field.id],
            validate: normalizePlayerThemeV2Boolean,
            editor: "toggle", binding: "media-card-field",
            serverRule: "boolean"
        });
    });
    [
        ["theme", "classic", "segmented", "data-elyric-theme", function (value) { return normalizePlayerThemeV2Enum(value, THEMES.map(function (item) { return item.id; }), "classic"); }, "player-enum"],
        ["backgroundMode", "blur", "segmented", "data-elyric-background-mode", function (value) { return normalizePlayerThemeV2Enum(value, BACKGROUND_MODES.map(function (item) { return item.id; }), "blur"); }, "player-enum"],
        ["visualizerStyle", "spectrum", "segmented", "canvas-renderer", function (value) { return normalizePlayerThemeV2Enum(value, VISUALIZER_STYLES.map(function (item) { return item.id; }), "spectrum"); }, "player-enum"],
        ["visualizerWidth", 62, "range", "canvas-size", function (value) { return normalizePlayerThemeV2Number(value, 10, 100, 62); }, "player-range"],
        ["visualizerHeight", 8, "range", "canvas-size", function (value) { return normalizePlayerThemeV2Number(value, 2, 30, 8); }, "player-range"],
        ["visualizerAmplitude", 70, "range", "canvas-amplitude", function (value) { return normalizePlayerThemeV2Number(value, 25, 140, 70); }, "player-range"],
        ["visualizerColorMode", "dual", "segmented", "canvas-paint", function (value) { return normalizePlayerThemeV2Enum(value, VISUALIZER_COLOR_MODES.map(function (item) { return item.id; }), "dual"); }, "player-enum"],
        ["visualizerColors", ["#a8e063", "#56d6c9", "#8b9dff"], "color-list", "canvas-paint", function (value) {
            return Array.isArray(value) && value.length
                ? value.slice(0, 8).map(function (color, index) { return normalizeHexColor(color, ["#a8e063", "#56d6c9", "#8b9dff"][index] || "#ffffff"); })
                : ["#a8e063", "#56d6c9", "#8b9dff"];
        }, "color-list"],
        ["lyricAlignment", "left", "segmented", "text-align", function (value) { return normalizePlayerThemeV2Enum(value, LYRIC_ALIGNMENTS.map(function (item) { return item.id; }), "left"); }, "player-enum"],
        ["lyricScale", 100, "range", "font-size", function (value) { return normalizePlayerThemeV2Number(value, 70, 170, 100); }, "player-range"],
        ["artworkRotation", true, "toggle", "animation-play-state", normalizePlayerThemeV2Boolean, "boolean"]
    ].forEach(function (item) {
        registerPlayerThemeV2Parameter({
            id: "player." + item[0], defaultValue: item[1],
            validate: item[4], editor: item[2], binding: item[3], serverRule: item[5]
        });
    });
    [
        ["lyrics.showSecondLine", true, "toggle", "data-elyric-show-second", normalizePlayerThemeV2Boolean, "boolean"],
        ["lyrics.showThirdAndLaterLines", true, "toggle", "data-elyric-show-third-plus", normalizePlayerThemeV2Boolean, "boolean"],
        ["lyrics.followDelayMs", LYRIC_FOLLOW_IDLE_MS, "range", "lyric-follow-timer", function (value) { return normalizePlayerThemeV2Number(value, 1000, 60000, LYRIC_FOLLOW_IDLE_MS); }, "player-range"],
        ["artwork.source", "emby", "select", "artwork-src", function (value) { return normalizePlayerThemeV2Enum(value, ["emby", "url", "asset"], "emby"); }, "player-enum"],
        ["artwork.url", "", "url", "artwork-src", normalizePlayerThemeV2HttpsUrl, "https-url"],
        ["artwork.assetId", "", "asset", "artwork-src", normalizePlayerThemeV2Id, "safe-id"],
        ["artwork.fit", "cover", "select", "object-fit", function (value) { return normalizePlayerThemeV2Enum(value, ["cover", "contain", "fill", "none", "scale-down"], "cover"); }, "player-enum"],
        ["artwork.focusX", 50, "range", "object-position", function (value) { return normalizePlayerThemeV2Number(value, 0, 100, 50); }, "player-range"],
        ["artwork.focusY", 50, "range", "object-position", function (value) { return normalizePlayerThemeV2Number(value, 0, 100, 50); }, "player-range"],
        ["artwork.clipPath", "none", "text", "clip-path", normalizePlayerThemeV2ClipPath, "clip-path"],
        ["popupStyle.surfaceOpacity", 100, "range", "popup-surface", function (value) { return normalizePlayerThemeV2Number(value, 35, 100, 100); }, "player-range"],
        ["popupStyle.radius", 24, "range", "popup-radius", function (value) { return normalizePlayerThemeV2Number(value, 0, 64, 24); }, "player-range"],
        ["controls.safeArea", 64, "range", "safe-area", function (value) { return normalizePlayerThemeV2Number(value, 44, 180, 64); }, "player-range"],
        ["visualizer.frequencyLayout", "centerOut", "segmented", "frequency-layout", function (value) {
            return normalizePlayerThemeV2Enum(
                value,
                VISUALIZER_FREQUENCY_LAYOUTS.map(function (item) { return item.id; }),
                "centerOut"
            );
        }, "player-enum"]
    ].forEach(function (item) {
        registerPlayerThemeV2Parameter({
            id: item[0], defaultValue: item[1],
            validate: item[4], editor: item[2], binding: item[3], serverRule: item[5]
        });
    });
    VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
        registerPlayerThemeV2Parameter({
            id: "visualizer.analysis." + definition.id,
            defaultValue: definition.fallback,
            validate: function (value) {
                value = Number(value);
                return isFinite(value)
                    ? Math.min(definition.maximum, Math.max(definition.minimum, value))
                    : definition.fallback;
            },
            editor: "range",
            binding: "canvas-analyser",
            serverRule: "visualizer-analysis-range"
        });
    });
    ["primary", "secondary", "tertiary"].forEach(function (lineId) {
        [
            ["fontFamily", "inherit", "font", "font-family", function (value) { return normalizePlayerThemeV2String(value, "inherit", 160); }, "safe-string"],
            ["fontAssetId", "", "asset", "font-face", normalizePlayerThemeV2Id, "safe-id"],
            ["fontUrl", "", "url", "font-face", normalizePlayerThemeV2HttpsUrl, "https-url"],
            ["size", "primary" === lineId ? 100 : 72, "range", "font-size", function (value) { return normalizePlayerThemeV2Number(value, 40, 300, "primary" === lineId ? 100 : 72); }, "typography-range"],
            ["weight", "primary" === lineId ? 700 : 500, "range", "font-weight", function (value) { return normalizePlayerThemeV2Number(value, 100, 900, "primary" === lineId ? 700 : 500); }, "typography-range"],
            ["italic", false, "toggle", "font-style", normalizePlayerThemeV2Boolean, "boolean"],
            ["letterSpacing", 0, "range", "letter-spacing", function (value) { return normalizePlayerThemeV2Number(value, -5, 20, 0); }, "typography-range"],
            ["lineHeight", 1.25, "range", "line-height", function (value) { return normalizePlayerThemeV2Number(value, .8, 3, 1.25); }, "typography-range"],
            ["color", "#ffffff", "color", "color", function (value) { return normalizeHexColor(value, "#ffffff"); }, "hex-color"],
            ["opacity", "primary" === lineId ? 1 : .72, "range", "opacity", function (value) { return normalizePlayerThemeV2Number(value, 0, 1, "primary" === lineId ? 1 : .72); }, "typography-range"],
            ["strokeWidth", 0, "range", "text-stroke", function (value) { return normalizePlayerThemeV2Number(value, 0, 8, 0); }, "typography-range"],
            ["strokeColor", "#000000", "color", "text-stroke", function (value) { return normalizeHexColor(value, "#000000"); }, "hex-color"],
            ["shadowX", 0, "range", "text-shadow", function (value) { return normalizePlayerThemeV2Number(value, -30, 30, 0); }, "typography-range"],
            ["shadowY", 4, "range", "text-shadow", function (value) { return normalizePlayerThemeV2Number(value, -30, 30, 4); }, "typography-range"],
            ["shadowBlur", 18, "range", "text-shadow", function (value) { return normalizePlayerThemeV2Number(value, 0, 60, 18); }, "typography-range"],
            ["shadowColor", "#000000", "color", "text-shadow", function (value) { return normalizeHexColor(value, "#000000"); }, "hex-color"],
            ["glow", 0, "range", "text-shadow", function (value) { return normalizePlayerThemeV2Number(value, 0, 60, 0); }, "typography-range"]
        ].forEach(function (item) {
            registerPlayerThemeV2Parameter({
                id: "typography." + lineId + "." + item[0],
                defaultValue: item[1],
                validate: item[4], editor: item[2], binding: item[3], serverRule: item[5]
            });
        });
        ["past", "current", "future"].forEach(function (stateId) {
            registerPlayerThemeV2Parameter({
                id: "typography." + lineId + ".states." + stateId + ".color",
                defaultValue: "current" === stateId ? "#ffffff" : "#8993a5",
                validate: function (value) { return normalizeHexColor(value, "#ffffff"); },
                editor: "color", binding: "lyric-state-color", serverRule: "hex-color"
            });
            registerPlayerThemeV2Parameter({
                id: "typography." + lineId + ".states." + stateId + ".opacity",
                defaultValue: "current" === stateId ? 1 : .55,
                validate: function (value) { return normalizePlayerThemeV2Number(value, 0, 1, "current" === stateId ? 1 : .55); },
                editor: "range", binding: "lyric-state-opacity", serverRule: "typography-range"
            });
        });
    });
    PLAYER_THEME_V2_PROFILE_IDS.forEach(function (profileId) {
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            [
                ["x", 0, "position"], ["y", 0, "position"],
                ["width", 10, "size"], ["height", 10, "size"],
                ["rotation", 0, "transform"], ["z", 10, "z-index"],
                ["opacity", 1, "opacity"], ["hidden", false, "display"],
                ["locked", false, "editor-lock"]
            ].forEach(function (item) {
                registerPlayerThemeV2Parameter({
                    id: "layouts." + profileId + "." + layerId + "." + item[0],
                    defaultValue: defaultPlayerThemeV2Layouts()[profileId][layerId][item[0]],
                    validate: "hidden" === item[0] || "locked" === item[0]
                        ? normalizePlayerThemeV2Boolean
                        : function (value) {
                            var ranges = {
                                x: [-1920, 1920], y: [-1920, 1920], width: [44, 3840], height: [44, 3840],
                                rotation: [-360, 360], z: [0, 1000], opacity: [0, 1]
                            };
                            return normalizePlayerThemeV2Number(
                                value, ranges[item[0]][0], ranges[item[0]][1], item[1]
                            );
                        },
                    editor: "hidden" === item[0] || "locked" === item[0] ? "toggle" : "number",
                    binding: item[2],
                    serverRule: "hidden" === item[0] || "locked" === item[0] ? "boolean" : "layer-range"
                });
            });
        });
        registerPlayerThemeV2Parameter({
            id: "controls.profiles." + profileId,
            defaultValue: defaultPlayerControlDock().profiles[profileId],
            validate: function (value) {
                return normalizePlayerControlDockProfile(value, "portrait" === profileId);
            },
            editor: "control-dock", binding: "control-dock-layout", serverRule: "control-dock"
        });
    });

    function playerThemeV2PathValue(source, path) {
        return String(path).split(".").reduce(function (value, part) {
            return null == value ? undefined : value[part];
        }, source);
    }

    function setPlayerThemeV2PathValue(target, path, value) {
        var parts = String(path).split(".");
        var host = target;
        parts.slice(0, -1).forEach(function (part) {
            if (!host[part] || "object" !== typeof host[part]) { host[part] = {}; }
            host = host[part];
        });
        host[parts[parts.length - 1]] = clonePlayerThemeV2Value(value);
    }

    function normalizeRegisteredPlayerThemeV2Snapshot(theme) {
        PLAYER_THEME_V2_REGISTRY.forEach(function (definition) {
            if (0 === definition.themePath.indexOf("v2.") && !theme.v2) { return; }
            var current = playerThemeV2PathValue(theme, definition.themePath);
            var migrated = definition.migrate(
                undefined === current ? clonePlayerThemeV2Value(definition.defaultValue) : current
            );
            setPlayerThemeV2PathValue(theme, definition.themePath, definition.validate(migrated));
        });
        return theme;
    }

    if ("undefined" !== typeof window) {
        window.__elyricPlayerThemeV2Registry = PLAYER_THEME_V2_REGISTRY.map(function (definition) {
            return {
                id: definition.id,
                themePath: definition.themePath,
                editor: definition.editor,
                binding: definition.binding,
                serialize: definition.serialize,
                serverValidate: definition.serverValidate,
                serverRule: definition.serverRule,
                hasDefault: Object.prototype.hasOwnProperty.call(definition, "defaultValue"),
                hasValidator: "function" === typeof definition.validate,
                hasMigration: "function" === typeof definition.migrate
            };
        });
        window.__elyricMigratePlayerThemeV2State = function (source, baseLayout) {
            return normalizePlayerThemeV2State(source, baseLayout);
        };
    }

    function clonePlayerThemeV2Value(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function defaultPlayerThemeV2Layer(x, y, width, height, z, hidden, anchorX, anchorY) {
        var layer = {
            x: x, y: y, width: width, height: height,
            rotation: 0, z: z, opacity: 1, hidden: !!hidden, locked: false
        };
        if (anchorX || anchorY) {
            layer.anchorX = anchorX || "start";
            layer.anchorY = anchorY || "start";
        }
        return layer;
    }

    function defaultPlayerThemeV2Layouts() {
        return {
            landscape: {
                canvas: clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES.landscape),
                artwork: defaultPlayerThemeV2Layer(96, 144, 568, 568, PLAYER_THEME_LAYER_Z.artwork),
                metadata: defaultPlayerThemeV2Layer(96, 736, 568, 112, PLAYER_THEME_LAYER_Z.metadata),
                lyrics: defaultPlayerThemeV2Layer(720, 120, 1104, 548, PLAYER_THEME_LAYER_Z.lyrics),
                visualizer: defaultPlayerThemeV2Layer(720, 692, 1104, 156, PLAYER_THEME_LAYER_Z.visualizer),
                controlDock: defaultPlayerThemeV2Layer(64, 884, 1792, 160, PLAYER_THEME_LAYER_Z.controlDock)
            },
            portrait: {
                canvas: clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES.portrait),
                artwork: defaultPlayerThemeV2Layer(180, 112, 720, 720, PLAYER_THEME_LAYER_Z.artwork),
                metadata: defaultPlayerThemeV2Layer(96, 856, 888, 152, PLAYER_THEME_LAYER_Z.metadata),
                lyrics: defaultPlayerThemeV2Layer(80, 1032, 920, 372, PLAYER_THEME_LAYER_Z.lyrics),
                visualizer: defaultPlayerThemeV2Layer(80, 1428, 920, 124, PLAYER_THEME_LAYER_Z.visualizer),
                controlDock: defaultPlayerThemeV2Layer(40, 1608, 1000, 264, PLAYER_THEME_LAYER_Z.controlDock)
            }
        };
    }

    function scaleLegacyPlayerThemeV2Layer(layer, portrait) {
        if (!layer || "object" !== typeof layer) { return layer; }
        var scaled = clonePlayerThemeV2Value(layer);
        var scaleX = portrait ? 1.2 : 1.6;
        var scaleY = portrait ? 1.6 : 1.2;
        ["x", "width"].forEach(function (key) {
            if (isFinite(Number(scaled[key]))) { scaled[key] = Math.round(Number(scaled[key]) * scaleX * 10) / 10; }
        });
        ["y", "height"].forEach(function (key) {
            if (isFinite(Number(scaled[key]))) { scaled[key] = Math.round(Number(scaled[key]) * scaleY * 10) / 10; }
        });
        return scaled;
    }

    function absolutePlayerThemeV6Layer(layer, profileId) {
        layer = clonePlayerThemeV2Value(layer || {});
        var canvas = PLAYER_THEME_CANVAS_SIZES[profileId];
        var width = Number(layer.width) || 44;
        var height = Number(layer.height) || 44;
        var anchorX = layer.anchorX || "start";
        var anchorY = layer.anchorY || "start";
        layer.x = playerThemeV2AnchorCoordinate(anchorX, canvas.width)
            - ("end" === anchorX ? width : ("center" === anchorX ? width / 2 : 0))
            + (Number(layer.x) || 0);
        layer.y = playerThemeV2AnchorCoordinate(anchorY, canvas.height)
            - ("end" === anchorY ? height : ("center" === anchorY ? height / 2 : 0))
            + (Number(layer.y) || 0);
        delete layer.anchorX;
        delete layer.anchorY;
        return layer;
    }

    function absolutePlayerThemeV6Layout(layout, profileId) {
        var normalized = { canvas: clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES[profileId]) };
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            normalized[layerId] = absolutePlayerThemeV6Layer(layout && layout[layerId], profileId);
        });
        return normalized;
    }

    function scaleLegacyPlayerThemeV2Layout(layout, portrait) {
        var scaled = {};
        Object.keys(layout || {}).forEach(function (layerId) {
            scaled[layerId] = scaleLegacyPlayerThemeV2Layer(layout[layerId], portrait);
        });
        return scaled;
    }

    function normalizePlayerControlDockProfile(source, portrait) {
        var fallback = defaultPlayerControlDockProfile(portrait);
        source = source && "object" === typeof source ? source : {};
        var seenGroups = {};
        var rows = [];
        (Array.isArray(source.rows) ? source.rows : fallback.rows).slice(0, 4).forEach(function (row) {
            row = row && "object" === typeof row ? row : {};
            var groups = [];
            (Array.isArray(row.groups) ? row.groups : []).forEach(function (groupId) {
                groupId = normalizePlayerThemeV2Enum(groupId, PLAYER_CONTROL_DOCK_GROUP_IDS, "");
                if (groupId && !seenGroups[groupId]) { seenGroups[groupId] = true; groups.push(groupId); }
            });
            if (groups.length) {
                rows.push({
                    groups: groups,
                    justify: normalizePlayerThemeV2Enum(row.justify, PLAYER_CONTROL_DOCK_JUSTIFY_IDS, "center"),
                    align: normalizePlayerThemeV2Enum(row.align, PLAYER_CONTROL_DOCK_ALIGN_IDS, "center"),
                    gap: normalizePlayerThemeV2Number(row.gap, 0, 80, 12)
                });
            }
        });
        PLAYER_CONTROL_DOCK_GROUP_IDS.forEach(function (groupId) {
            if (!seenGroups[groupId]) {
                if (rows.length >= 4) { rows[rows.length - 1].groups.push(groupId); }
                else { rows.push({ groups: [groupId], justify: "center", align: "center", gap: 0 }); }
                seenGroups[groupId] = true;
            }
        });
        var groups = {};
        PLAYER_CONTROL_DOCK_GROUP_IDS.forEach(function (groupId) {
            var fallbackGroup = fallback.groups[groupId];
            var candidate = source.groups && source.groups[groupId] && "object" === typeof source.groups[groupId]
                ? source.groups[groupId] : fallbackGroup;
            var allowedButtons = PLAYER_CONTROL_DOCK_BUTTON_IDS[groupId];
            var seenButtons = {};
            var order = [];
            (Array.isArray(candidate.order) ? candidate.order : fallbackGroup.order).forEach(function (buttonId) {
                buttonId = normalizePlayerThemeV2Enum(buttonId, allowedButtons, "");
                if (buttonId && !seenButtons[buttonId]) { seenButtons[buttonId] = true; order.push(buttonId); }
            });
            allowedButtons.forEach(function (buttonId) {
                if (!seenButtons[buttonId]) { order.push(buttonId); }
            });
            var hiddenButtons = [];
            (Array.isArray(candidate.hiddenButtons) ? candidate.hiddenButtons : []).forEach(function (buttonId) {
                if (allowedButtons.indexOf(buttonId) >= 0 && "playPause" !== buttonId
                    && hiddenButtons.indexOf(buttonId) < 0) { hiddenButtons.push(buttonId); }
            });
            groups[groupId] = {
                visible: "progress" === groupId || "transport" === groupId
                    ? true : normalizePlayerThemeV2Boolean(candidate.visible),
                order: order,
                hiddenButtons: hiddenButtons,
                align: normalizePlayerThemeV2Enum(candidate.align, PLAYER_CONTROL_DOCK_ALIGN_IDS, fallbackGroup.align),
                gap: normalizePlayerThemeV2Number(candidate.gap, 0, 48, fallbackGroup.gap)
            };
        });
        groups.transport.hiddenButtons = groups.transport.hiddenButtons.filter(function (id) { return "playPause" !== id; });
        return { rows: rows.slice(0, 4), groups: groups };
    }

    function normalizePlayerControlDock(source) {
        source = source && "object" === typeof source ? source : {};
        return {
            safeArea: normalizePlayerThemeV2Number(source.safeArea, 44, 180, 64),
            profiles: {
                landscape: normalizePlayerControlDockProfile(source.profiles && source.profiles.landscape, false),
                portrait: normalizePlayerControlDockProfile(source.profiles && source.profiles.portrait, true)
            }
        };
    }

    function defaultPlayerControlDockProfile(portrait) {
        return {
            rows: portrait ? [
                { groups: ["progress"], justify: "center", align: "center", gap: 0 },
                { groups: ["transport"], justify: "center", align: "center", gap: 12 },
                { groups: ["auxiliary", "volume"], justify: "center", align: "center", gap: 12 }
            ] : [
                { groups: ["progress"], justify: "center", align: "center", gap: 0 },
                { groups: ["auxiliary", "transport", "volume"], justify: "space-between", align: "center", gap: 20 }
            ],
            groups: {
                progress: { visible: true, order: [], hiddenButtons: [], align: "center", gap: 0 },
                transport: {
                    visible: true, order: ["previous", "playPause", "next"],
                    hiddenButtons: [], align: "center", gap: 12
                },
                volume: {
                    visible: true, order: ["mute", "slider", "value"],
                    hiddenButtons: [], align: "end", gap: 8
                },
                auxiliary: {
                    visible: true,
                    order: ["shuffle", "repeat", "stop", "queue", "media", "settings", "visualizerToggle",
                        "secondaryLyrics", "tertiaryLyrics", "artworkRotation"],
                    hiddenButtons: [], align: portrait ? "center" : "start", gap: portrait ? 4 : 8
                }
            }
        };
    }

    function defaultPlayerControlDock() {
        return {
            safeArea: 64,
            profiles: {
                landscape: defaultPlayerControlDockProfile(false),
                portrait: defaultPlayerControlDockProfile(true)
            }
        };
    }

    function defaultPlayerThemeV2Typography() {
        function style(size, weight, opacity) {
            return {
                fontFamily: "inherit", fontAssetId: "", fontUrl: "", size: size,
                weight: weight, italic: false, letterSpacing: 0, lineHeight: 1.25,
                color: "#ffffff", opacity: opacity, strokeWidth: 0, strokeColor: "#000000",
                shadowX: 0, shadowY: 4, shadowBlur: 18, shadowColor: "#000000", glow: 0,
                states: {
                    past: { color: "#b8c1d1", opacity: .62 },
                    current: { color: "#ffffff", opacity: 1 },
                    future: { color: "#8993a5", opacity: .48 }
                }
            };
        }
        return { primary: style(100, 700, 1), secondary: style(72, 500, .72), tertiary: style(62, 450, .58) };
    }

    function defaultPlayerThemeV2State() {
        var analysis = {};
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            analysis[definition.id] = definition.fallback;
        });
        return {
            schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
            layoutModel: PLAYER_THEME_LAYOUT_MODEL,
            layoutRepairRevision: 0,
            viewport: { fit: "contain", alignX: "center", alignY: "end" },
            layouts: defaultPlayerThemeV2Layouts(),
            artwork: {
                source: "emby", url: "", assetId: "", fit: "cover",
                focusX: 50, focusY: 50, clipPath: "none"
            },
            typography: defaultPlayerThemeV2Typography(),
            lyrics: { showSecondLine: true, showThirdAndLaterLines: true, followDelayMs: LYRIC_FOLLOW_IDLE_MS },
            visualizer: { frequencyLayout: "centerOut", analysis: analysis },
            metadata: {
                summaryFields: ["title", "artist", "album", "container", "codec", "sampleRate", "bitDepth", "channels", "bitrate"]
            },
            systemChrome: {
                size: 52, surface: "glass", color: "#ffffff", surfaceColor: "#111827",
                radius: 50, blur: 18, shadow: 24, showLabels: false
            },
            overlays: {
                surface: "glass", surfaceColor: "#111827", textColor: "#ffffff", accentColor: "#ffffff",
                radius: 24, blur: 24, opacity: 92, backdrop: { dim: 0, blur: 0 },
                gap: 12, margin: 16, arrowSize: 10, durationMs: 200,
                sizes: {
                    media: { minWidth: 360, maxWidth: 480, maxHeight: 56 },
                    queue: { minWidth: 380, maxWidth: 460, maxHeight: 66 },
                    settings: { minWidth: 420, maxWidth: 560, maxHeight: 78 },
                    cast: { minWidth: 320, maxWidth: 420, maxHeight: 56 },
                    volume: { minWidth: 64, maxWidth: 96, maxHeight: 32 }
                }
            },
            console: {
                material: "glass", surfaceColor: "#111827", textColor: "#ffffff", accentColor: "#ffffff",
                gradientA: "#111827", gradientB: "#334155", gradientAngle: 135,
                radius: 28, blur: 26, opacity: 72, borderWidth: 1, shadow: 28
            },
            volume: {
                landscapeMode: "expanded", portraitMode: "iconPopover", iconFill: true,
                popoverWidth: 72, popoverHeight: 240
            },
            controls: defaultPlayerControlDock()
        };
    }

    function mergePlayerThemeV2Object(target, source) {
        if (!source || "object" !== typeof source) {
            return target;
        }
        Object.keys(source).forEach(function (key) {
            if (source[key] && "object" === typeof source[key] && !Array.isArray(source[key])) {
                if (!target[key] || "object" !== typeof target[key]) {
                    target[key] = {};
                }
                mergePlayerThemeV2Object(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
        return target;
    }

    function rememberPlayerThemeV3MigrationBackup(source) {
        if (!source || Number(source.schemaVersion) >= 4 || "undefined" === typeof localStorage) { return; }
        try {
            var backups = JSON.parse(localStorage.getItem(PLAYER_THEME_V3_MIGRATION_BACKUP_KEY) || "[]");
            if (!Array.isArray(backups)) { backups = []; }
            var serialized = JSON.stringify(source);
            if (!backups.some(function (entry) { return entry && entry.json === serialized; })) {
                backups.push({ migratedAt: Date.now(), json: serialized });
                localStorage.setItem(PLAYER_THEME_V3_MIGRATION_BACKUP_KEY, JSON.stringify(backups.slice(-24)));
            }
        } catch (error) {
            // Migration continues even when private browsing blocks local backup storage.
        }
    }

    function playerThemeV5LayoutFromV4(layout, portrait, fallbackLayout, scaleLegacyGeometry) {
        var converted = {};
        var fallback = fallbackLayout || defaultPlayerThemeV2Layouts()[portrait ? "portrait" : "landscape"];
        ["artwork", "metadata", "lyrics", "visualizer"].forEach(function (layerId) {
            converted[layerId] = layout && layout[layerId]
                ? (scaleLegacyGeometry
                    ? scaleLegacyPlayerThemeV2Layer(layout[layerId], portrait)
                    : clonePlayerThemeV2Value(layout[layerId]))
                : clonePlayerThemeV2Value(fallback[layerId]);
        });
        converted.controlDock = clonePlayerThemeV2Value(fallback.controlDock);
        return absolutePlayerThemeV6Layout(converted, portrait ? "portrait" : "landscape");
    }

    function playerThemeV5LayoutsForBase(baseLayout) {
        var sourceLayouts = PLAYER_THEME_V6_BUILTIN_LAYOUTS
            && PLAYER_THEME_V6_BUILTIN_LAYOUTS[baseLayout];
        if (!sourceLayouts) {
            return defaultPlayerThemeV2Layouts();
        }
        return {
            landscape: clonePlayerThemeV2Value(sourceLayouts.landscape),
            portrait: clonePlayerThemeV2Value(sourceLayouts.portrait)
        };
    }

    function rememberPlayerThemeV6MigrationBackup(source) {
        if (!source || Number(source.schemaVersion) >= PLAYER_THEME_SCHEMA_VERSION
            || "undefined" === typeof localStorage) { return; }
        try {
            var backups = JSON.parse(localStorage.getItem(PLAYER_THEME_V6_MIGRATION_BACKUP_KEY) || "[]");
            if (!Array.isArray(backups)) { backups = []; }
            var serialized = JSON.stringify(source);
            if (!backups.some(function (entry) { return entry && entry.json === serialized; })) {
                backups.push({ migratedAt: Date.now(), schemaVersion: Number(source.schemaVersion) || 0, json: serialized });
                localStorage.setItem(PLAYER_THEME_V6_MIGRATION_BACKUP_KEY, JSON.stringify(backups.slice(-24)));
            }
        } catch (error) {
            // A server-backed migration remains usable if local backup storage is unavailable.
        }
    }

    function playerThemeV5SafeBuiltInLayout(layout, portrait, fallbackLayout) {
        var safe = clonePlayerThemeV2Value(layout || fallbackLayout);
        var fallback = fallbackLayout || defaultPlayerThemeV2Layouts()[portrait ? "portrait" : "landscape"];
        safe.controlDock = clonePlayerThemeV2Value(fallback.controlDock);
        if (portrait) {
            safe.lyrics.height = Math.min(Number(safe.lyrics.height) || 400, 400);
            safe.visualizer = clonePlayerThemeV2Value(fallback.visualizer);
            var metadataRect = playerThemeV2LayerDesignRect(safe.metadata, {
                designWidth: PLAYER_THEME_CANVAS_SIZES.portrait.width,
                designHeight: PLAYER_THEME_CANVAS_SIZES.portrait.height
            });
            var lyricRect = playerThemeV2LayerDesignRect(safe.lyrics, {
                designWidth: PLAYER_THEME_CANVAS_SIZES.portrait.width,
                designHeight: PLAYER_THEME_CANVAS_SIZES.portrait.height
            });
            var requiredLyricTop = metadataRect.top + metadataRect.height + 20;
            if (lyricRect.top < requiredLyricTop) {
                safe.lyrics.y = Number(safe.lyrics.y || 0) + requiredLyricTop - lyricRect.top;
            }
            var visualizerRect = playerThemeV2LayerDesignRect(safe.visualizer, {
                designWidth: PLAYER_THEME_CANVAS_SIZES.portrait.width,
                designHeight: PLAYER_THEME_CANVAS_SIZES.portrait.height
            });
            var repairedLyricRect = playerThemeV2LayerDesignRect(safe.lyrics, {
                designWidth: PLAYER_THEME_CANVAS_SIZES.portrait.width,
                designHeight: PLAYER_THEME_CANVAS_SIZES.portrait.height
            });
            var maximumLyricHeight = visualizerRect.top - repairedLyricRect.top - 20;
            safe.lyrics.height = Math.max(44, Math.min(Number(safe.lyrics.height) || 400, maximumLyricHeight));
        }
        return safe;
    }

    function hasCompletePlayerThemeV2Layouts(layouts) {
        return PLAYER_THEME_V2_PROFILE_IDS.every(function (profileId) {
            var layout = layouts && layouts[profileId];
            return !!layout && PLAYER_THEME_V2_LAYER_IDS.every(function (layerId) {
                return !!layout[layerId] && "object" === typeof layout[layerId];
            });
        });
    }

    function migratePlayerThemeV2State(source, baseLayout) {
        var incoming = source && "object" === typeof source
            ? clonePlayerThemeV2Value(source)
            : {};
        var version = Number(incoming.schemaVersion) || 0;
        if (version > 0 && version < PLAYER_THEME_SCHEMA_VERSION) {
            rememberPlayerThemeV6MigrationBackup(incoming);
        }
        var fallbackLayouts = playerThemeV5LayoutsForBase(baseLayout);
        if (PLAYER_THEME_SCHEMA_VERSION === version && PLAYER_THEME_LAYOUT_MODEL === incoming.layoutModel) {
            incoming.layouts = hasCompletePlayerThemeV2Layouts(incoming.layouts)
                ? {
                    landscape: absolutePlayerThemeV6Layout(incoming.layouts.landscape, "landscape"),
                    portrait: absolutePlayerThemeV6Layout(incoming.layouts.portrait, "portrait")
                }
                : clonePlayerThemeV2Value(fallbackLayouts);
        } else if (5 === version && PLAYER_THEME_LAYOUT_MODEL === incoming.layoutModel) {
            incoming.layouts = hasCompletePlayerThemeV2Layouts(incoming.layouts)
                ? {
                    landscape: absolutePlayerThemeV6Layout(incoming.layouts.landscape, "landscape"),
                    portrait: absolutePlayerThemeV6Layout(incoming.layouts.portrait, "portrait")
                }
                : clonePlayerThemeV2Value(fallbackLayouts);
        } else if (PLAYER_THEME_SCHEMA_VERSION === version
            && PLAYER_THEME_LEGACY_V5_LAYOUT_MODEL === incoming.layoutModel) {
            incoming.layouts = hasCompletePlayerThemeV2Layouts(incoming.layouts)
                ? {
                    landscape: absolutePlayerThemeV6Layout(
                        scaleLegacyPlayerThemeV2Layout(incoming.layouts.landscape, false), "landscape"
                    ),
                    portrait: absolutePlayerThemeV6Layout(
                        scaleLegacyPlayerThemeV2Layout(incoming.layouts.portrait, true), "portrait"
                    )
                }
                : clonePlayerThemeV2Value(fallbackLayouts);
        } else if (4 === version && PLAYER_THEME_PREVIOUS_LAYOUT_MODEL === incoming.layoutModel) {
            incoming.layouts = {
                landscape: playerThemeV5LayoutFromV4(
                    incoming.layouts && incoming.layouts.landscape, false, fallbackLayouts.landscape, true
                ),
                portrait: playerThemeV5LayoutFromV4(
                    incoming.layouts && incoming.layouts.portrait, true, fallbackLayouts.portrait, true
                )
            };
            incoming.controls = defaultPlayerControlDock();
        } else {
            rememberPlayerThemeV3MigrationBackup(incoming);
            incoming.layouts = clonePlayerThemeV2Value(fallbackLayouts);
            incoming.viewportTransforms = clonePlayerThemeV2Value(defaultPlayerThemeV2State().viewportTransforms);
            incoming.controls = defaultPlayerControlDock();
        }
        delete incoming.layoutOverrides;
        delete incoming.viewportTransforms;
        incoming.layoutModel = PLAYER_THEME_LAYOUT_MODEL;
        incoming.schemaVersion = PLAYER_THEME_SCHEMA_VERSION;
        return incoming;
    }

    function normalizeThemeV6Section(source, fallback) {
        return mergePlayerThemeV2Object(
            clonePlayerThemeV2Value(fallback),
            source && "object" === typeof source ? source : {}
        );
    }

    function normalizePlayerThemeV6Metadata(source, fallback) {
        source = source && "object" === typeof source ? source : {};
        var allowed = PLAYER_METADATA_SUMMARY_FIELDS.map(function (field) { return field.id; });
        var seen = {};
        var fields = [];
        (Array.isArray(source.summaryFields) ? source.summaryFields : fallback.summaryFields).forEach(function (fieldId) {
            if (allowed.indexOf(fieldId) >= 0 && !seen[fieldId]) { seen[fieldId] = true; fields.push(fieldId); }
        });
        return { summaryFields: fields };
    }

    function normalizePlayerThemeV6SystemChrome(source, fallback) {
        source = source && "object" === typeof source ? source : {};
        return {
            size: normalizePlayerThemeV2Number(source.size, 44, 80, fallback.size),
            surface: normalizePlayerThemeV2Enum(source.surface, ["none", "glass", "black", "white", "gradient"], fallback.surface),
            color: normalizeHexColor(source.color, fallback.color),
            surfaceColor: normalizeHexColor(source.surfaceColor, fallback.surfaceColor),
            radius: normalizePlayerThemeV2Number(source.radius, 0, 50, fallback.radius),
            blur: normalizePlayerThemeV2Number(source.blur, 0, 48, fallback.blur),
            shadow: normalizePlayerThemeV2Number(source.shadow, 0, 64, fallback.shadow),
            showLabels: "boolean" === typeof source.showLabels ? source.showLabels : fallback.showLabels
        };
    }

    function normalizePlayerThemeV6Overlays(source, fallback) {
        source = source && "object" === typeof source ? source : {};
        var sizes = {};
        ["media", "queue", "settings", "cast", "volume"].forEach(function (kind) {
            var candidate = source.sizes && source.sizes[kind] || {};
            var defaults = fallback.sizes[kind];
            var minimumWidth = normalizePlayerThemeV2Number(candidate.minWidth, 48, 720, defaults.minWidth);
            var maximumWidth = normalizePlayerThemeV2Number(candidate.maxWidth, 48, 720, defaults.maxWidth);
            if (minimumWidth > maximumWidth) { minimumWidth = Math.min(defaults.minWidth, maximumWidth); }
            sizes[kind] = {
                minWidth: minimumWidth, maxWidth: maximumWidth,
                maxHeight: normalizePlayerThemeV2Number(candidate.maxHeight, 10, 100, defaults.maxHeight)
            };
        });
        var backdrop = source.backdrop && "object" === typeof source.backdrop ? source.backdrop : {};
        return {
            surface: normalizePlayerThemeV2Enum(source.surface, ["none", "glass", "black", "white", "gradient"], fallback.surface),
            surfaceColor: normalizeHexColor(source.surfaceColor, fallback.surfaceColor),
            textColor: normalizeHexColor(source.textColor, fallback.textColor),
            accentColor: normalizeHexColor(source.accentColor, fallback.accentColor),
            radius: normalizePlayerThemeV2Number(source.radius, 0, 64, fallback.radius),
            blur: normalizePlayerThemeV2Number(source.blur, 0, 64, fallback.blur),
            opacity: normalizePlayerThemeV2Number(source.opacity, 0, 100, fallback.opacity),
            backdrop: {
                dim: normalizePlayerThemeV2Number(backdrop.dim, 0, 100, fallback.backdrop.dim),
                blur: normalizePlayerThemeV2Number(backdrop.blur, 0, 48, fallback.backdrop.blur)
            },
            gap: normalizePlayerThemeV2Number(source.gap, 4, 32, fallback.gap),
            margin: normalizePlayerThemeV2Number(source.margin, 8, 48, fallback.margin),
            arrowSize: normalizePlayerThemeV2Number(source.arrowSize, 4, 24, fallback.arrowSize),
            durationMs: normalizePlayerThemeV2Number(source.durationMs, 0, 600, fallback.durationMs),
            sizes: sizes
        };
    }

    function normalizePlayerThemeV6Console(source, fallback) {
        source = source && "object" === typeof source ? source : {};
        return {
            material: normalizePlayerThemeV2Enum(source.material,
                ["glass", "minimal", "black", "white", "gradient", "rainbow", "neumorphic", "deck", "poster"],
                fallback.material),
            surfaceColor: normalizeHexColor(source.surfaceColor, fallback.surfaceColor),
            textColor: normalizeHexColor(source.textColor, fallback.textColor),
            accentColor: normalizeHexColor(source.accentColor, fallback.accentColor),
            gradientA: normalizeHexColor(source.gradientA, fallback.gradientA),
            gradientB: normalizeHexColor(source.gradientB, fallback.gradientB),
            gradientAngle: normalizePlayerThemeV2Number(source.gradientAngle, 0, 360, fallback.gradientAngle),
            radius: normalizePlayerThemeV2Number(source.radius, 0, 64, fallback.radius),
            blur: normalizePlayerThemeV2Number(source.blur, 0, 64, fallback.blur),
            opacity: normalizePlayerThemeV2Number(source.opacity, 0, 100, fallback.opacity),
            borderWidth: normalizePlayerThemeV2Number(source.borderWidth, 0, 12, fallback.borderWidth),
            shadow: normalizePlayerThemeV2Number(source.shadow, 0, 64, fallback.shadow)
        };
    }

    function normalizePlayerThemeV6Volume(source, fallback) {
        source = source && "object" === typeof source ? source : {};
        return {
            landscapeMode: normalizePlayerThemeV2Enum(source.landscapeMode, ["expanded", "iconPopover"], fallback.landscapeMode),
            portraitMode: "iconPopover",
            iconFill: "boolean" === typeof source.iconFill ? source.iconFill : fallback.iconFill,
            popoverWidth: normalizePlayerThemeV2Number(source.popoverWidth, 64, 120, fallback.popoverWidth),
            popoverHeight: normalizePlayerThemeV2Number(source.popoverHeight, 160, 360, fallback.popoverHeight)
        };
    }

    function normalizePlayerThemeV2State(source, baseLayout) {
        var incoming = migratePlayerThemeV2State(source, baseLayout);
        var state = mergePlayerThemeV2Object(defaultPlayerThemeV2State(), incoming);
        var sourceRoot = { v2: state };
        var sanitizedRoot = { v2: defaultPlayerThemeV2State() };
        PLAYER_THEME_V2_REGISTRY.forEach(function (definition) {
            if (0 !== definition.themePath.indexOf("v2.")) { return; }
            var value = playerThemeV2PathValue(sourceRoot, definition.themePath);
            setPlayerThemeV2PathValue(
                sanitizedRoot,
                definition.themePath,
                definition.validate(undefined === value ? definition.defaultValue : value)
            );
        });
        sanitizedRoot.v2.schemaVersion = PLAYER_THEME_SCHEMA_VERSION;
        sanitizedRoot.v2.layoutModel = PLAYER_THEME_LAYOUT_MODEL;
        sanitizedRoot.v2.layoutRepairRevision = Math.max(
            0,
            Math.min(
                PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION,
                Math.round(Number(state.layoutRepairRevision) || 0)
            )
        );
        sanitizedRoot.v2.controls = normalizePlayerControlDock(state.controls);
        var v6Defaults = defaultPlayerThemeV2State();
        sanitizedRoot.v2.viewport = { fit: "contain", alignX: "center", alignY: "end" };
        sanitizedRoot.v2.metadata = normalizePlayerThemeV6Metadata(state.metadata, v6Defaults.metadata);
        sanitizedRoot.v2.systemChrome = normalizePlayerThemeV6SystemChrome(state.systemChrome, v6Defaults.systemChrome);
        sanitizedRoot.v2.overlays = normalizePlayerThemeV6Overlays(state.overlays, v6Defaults.overlays);
        sanitizedRoot.v2.console = normalizePlayerThemeV6Console(state.console, v6Defaults.console);
        sanitizedRoot.v2.volume = normalizePlayerThemeV6Volume(state.volume, v6Defaults.volume);
        PLAYER_THEME_V2_PROFILE_IDS.forEach(function (profileId) {
            sanitizedRoot.v2.layouts[profileId].canvas = clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES[profileId]);
            PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
                sanitizedRoot.v2.layouts[profileId][layerId].z = PLAYER_THEME_LAYER_Z[layerId];
            });
        });
        return sanitizedRoot.v2;
    }

    function currentPlayerThemeV2Profile() {
        var viewport = "undefined" !== typeof window && window.visualViewport;
        var layoutWidth = Math.max(
            Number("undefined" !== typeof window && window.innerWidth) || 0,
            Number(document.documentElement && document.documentElement.clientWidth) || 0
        );
        var layoutHeight = Math.max(
            Number("undefined" !== typeof window && window.innerHeight) || 0,
            Number(document.documentElement && document.documentElement.clientHeight) || 0
        );
        var active = document && document.activeElement;
        var editingText = active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName || "");
        var keyboardReducedViewport = editingText && viewport && layoutHeight > 0
            && Number(viewport.height) < layoutHeight * .78;
        if (keyboardReducedViewport && playerThemeV2ActiveProfile) {
            return playerThemeV2ActiveProfile;
        }
        var width = layoutWidth || Number(viewport && viewport.width) || 1366;
        var height = layoutHeight || Number(viewport && viewport.height) || 768;
        playerThemeV2ActiveProfile = width >= height ? "landscape" : "portrait";
        return playerThemeV2ActiveProfile;
    }

    function resolvedPlayerThemeV2Layout(renderer, profileId) {
        ensurePlayerThemeV2State(renderer);
        return renderer.__elyricThemeV2.layouts[profileId];
    }

    function resolvedPlayerThemeV2Profile(state, profileId) {
        return profileId;
    }

    function ensurePlayerThemeV2ProfileOverride(renderer) {
        ensurePlayerThemeV2State(renderer);
    }

    function playerThemeV2ArtworkLayerElements(renderer) {
        return [renderer.__elyricPlayerIdentity, renderer.__elyricPlayerCoverflow]
            .filter(function (element) { return !!element; });
    }

    function playerThemeV2LayerElement(renderer, layerId) {
        if ("lyrics" === layerId) {
            return renderer.__elyricLyricViewport || renderer.itemsContainer;
        }
        if ("artwork" === layerId) {
            return renderer.__elyricPlayerThemeChoices
                && "coverflow" === renderer.__elyricPlayerThemeChoices.artworkMode
                ? renderer.__elyricPlayerCoverflow
                : renderer.__elyricPlayerIdentity;
        }
        var properties = {
            metadata: "__elyricPlayerMetadata",
            visualizer: "__elyricVisualizer",
            controlDock: "__elyricPlayerControlDock"
        };
        return renderer[properties[layerId]] || null;
    }

    function clearPlayerThemeV2LayerElement(element, layerId) {
        if (!element || !element.style) { return; }
        ["position", "left", "top", "width", "height", "transform", "transform-origin", "z-index", "opacity", "display",
            "--elyric-v4-layer-left", "--elyric-v4-layer-top", "--elyric-v4-layer-width", "--elyric-v4-layer-height",
            "--elyric-v4-layer-rotation"]
            .forEach(function (property) { element.style.removeProperty(property); });
        element.removeAttribute("data-elyric-v2-layer");
        element.removeAttribute("data-elyric-v2-user-hidden");
        element.classList.remove("elyric-player-v2-layer", "elyric-player-v2-layer-" + layerId);
    }

    function playerThemeV2ViewportRect() {
        var viewport = "undefined" !== typeof window ? window.visualViewport : null;
        return {
            left: viewport && isFinite(Number(viewport.offsetLeft)) ? Number(viewport.offsetLeft) : 0,
            top: viewport && isFinite(Number(viewport.offsetTop)) ? Number(viewport.offsetTop) : 0,
            width: Math.max(1, Number(viewport && viewport.width) || Number(window.innerWidth) || 1366),
            height: Math.max(1, Number(viewport && viewport.height) || Number(window.innerHeight) || 768)
        };
    }

    function playerThemeV2StageLayers(renderer, profileId) {
        var layers = {};
        var layout = resolvedPlayerThemeV2Layout(renderer, profileId);
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            layers[layerId] = clonePlayerThemeV2Value(layout[layerId]);
        });
        return layers;
    }

    function playerThemeV2SafeInsets(renderer) {
        if ("undefined" === typeof window || !window.getComputedStyle || !document.body) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        }
        var probe = renderer && renderer.__elyricThemeV2SafeInsetProbe;
        if (!probe) {
            probe = document.createElement("div");
            probe.setAttribute("aria-hidden", "true");
            probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;"
                + "padding-top:env(safe-area-inset-top,0px);padding-right:env(safe-area-inset-right,0px);"
                + "padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px)";
            var probeHost = renderer && renderer.__elyricRoot && renderer.__elyricRoot.appendChild
                ? renderer.__elyricRoot : document.body;
            probeHost.appendChild(probe);
            if (renderer) { renderer.__elyricThemeV2SafeInsetProbe = probe; }
        }
        var computed = window.getComputedStyle(probe);
        function value(name) {
            var parsed = parseFloat(computed && computed[name]);
            return isFinite(parsed) ? Math.max(0, parsed) : 0;
        }
        return {
            top: value("paddingTop"), right: value("paddingRight"),
            bottom: value("paddingBottom"), left: value("paddingLeft")
        };
    }

    function playerThemeV2StageMetrics(renderer, profileOverride, frozenViewport) {
        var profileId = PLAYER_THEME_V2_PROFILE_IDS.indexOf(profileOverride) >= 0
            ? profileOverride : currentPlayerThemeV2Profile();
        var viewport = frozenViewport || playerThemeV2ViewportRect();
        var safeInsets = playerThemeV2SafeInsets(renderer);
        var available = {
            left: viewport.left + safeInsets.left,
            top: viewport.top + safeInsets.top,
            width: Math.max(44, viewport.width - safeInsets.left - safeInsets.right),
            height: Math.max(44, viewport.height - safeInsets.top - safeInsets.bottom)
        };
        var canvasSize = PLAYER_THEME_CANVAS_SIZES[profileId];
        var baseWidth = canvasSize.width;
        var baseHeight = canvasSize.height;
        var baseScale = Math.max(.001, Math.min(
            PLAYER_THEME_MAX_RENDER_SCALE,
            available.width / baseWidth,
            available.height / baseHeight
        ));
        if (profileId !== currentPlayerThemeV2Profile()) {
            var previewScale = Math.min(
                Math.max(240, available.width * .72) / baseWidth,
                Math.max(320, available.height * .72) / baseHeight
            );
            available.width = baseWidth * previewScale;
            available.height = baseHeight * previewScale;
            available.left = viewport.left + safeInsets.left
                + (viewport.width - safeInsets.left - safeInsets.right - available.width) / 2;
            available.top = viewport.top + safeInsets.top
                + Math.max(0, (viewport.height - safeInsets.top - safeInsets.bottom - available.height) / 2);
            baseScale = previewScale;
        }
        var scale = baseScale;
        var designWidth = baseWidth;
        var designHeight = baseHeight;
        var originX = available.left + (available.width - designWidth * scale) / 2;
        var originY = available.top + available.height - designHeight * scale;
        return {
            profileId: profileId, viewport: viewport, available: available,
            baseWidth: baseWidth, baseHeight: baseHeight,
            designWidth: designWidth, designHeight: designHeight,
            baseScale: baseScale, scale: scale, originX: originX, originY: originY,
            forward: function (x, y) {
                return { x: originX + x * scale, y: originY + y * scale };
            },
            inverse: function (clientX, clientY) {
                return { x: (clientX - originX) / scale, y: (clientY - originY) / scale };
            }
        };
    }

    function playerThemeV2AnchorCoordinate(anchor, extent) {
        return "end" === anchor ? extent : ("center" === anchor ? extent / 2 : 0);
    }

    function playerThemeV2LayerDesignRect(layer, metrics) {
        var width = Number(layer.width) || 44;
        var height = Number(layer.height) || 44;
        var anchorX = layer.anchorX || "start";
        var anchorY = layer.anchorY || "start";
        var factorX = "end" === anchorX ? 1 : ("center" === anchorX ? .5 : 0);
        var factorY = "end" === anchorY ? 1 : ("center" === anchorY ? .5 : 0);
        return {
            left: playerThemeV2AnchorCoordinate(anchorX, metrics.designWidth) - width * factorX + Number(layer.x || 0),
            top: playerThemeV2AnchorCoordinate(anchorY, metrics.designHeight) - height * factorY + Number(layer.y || 0),
            width: width, height: height
        };
    }

    function playerThemeV5RectanglesOverlap(first, second, gap) {
        if (!first || !second) { return false; }
        gap = Math.max(0, Number(gap) || 0);
        return first.left < second.left + second.width + gap
            && first.left + first.width + gap > second.left
            && first.top < second.top + second.height + gap
            && first.top + first.height + gap > second.top;
    }

    function playerThemeV5SafeLayout(profileId) {
        return clonePlayerThemeV2Value(defaultPlayerThemeV2Layouts()[profileId]);
    }

    function playerThemeV5LayoutIsSafe(layout, profileId) {
        if (!layout) { return false; }
        var canvas = PLAYER_THEME_CANVAS_SIZES[profileId];
        var gap = "portrait" === profileId ? 20 : 0;
        var epsilon = .1;
        var rects = {};
        var metrics = {
            designWidth: canvas.width,
            designHeight: canvas.height
        };
        var safeMargin = "portrait" === profileId ? 20 : 24;
        var valid = PLAYER_THEME_V2_LAYER_IDS.every(function (layerId) {
            var layer = layout[layerId];
            if (!layer) { return false; }
            var rect = playerThemeV2LayerDesignRect(layer, metrics);
            rects[layerId] = rect;
            return rect.width + epsilon >= 44 && rect.height + epsilon >= 44
                && rect.left + epsilon >= safeMargin && rect.top + epsilon >= safeMargin
                && rect.left + rect.width <= canvas.width - safeMargin + epsilon
                && rect.top + rect.height <= canvas.height - safeMargin + epsilon;
        });
        if (!valid) { return false; }
        var radialVisualizer = rects.visualizer.left <= rects.artwork.left
            && rects.visualizer.top <= rects.artwork.top
            && rects.visualizer.left + rects.visualizer.width >= rects.artwork.left + rects.artwork.width
            && rects.visualizer.top + rects.visualizer.height >= rects.artwork.top + rects.artwork.height;
        if ("portrait" === profileId) {
            var order = radialVisualizer
                ? ["artwork", "metadata", "lyrics", "controlDock"]
                : ["artwork", "metadata", "lyrics", "visualizer", "controlDock"];
            for (var index = 1; index < order.length; index++) {
                var previous = rects[order[index - 1]];
                var current = rects[order[index]];
                if (!previous || !current
                    || previous.top + previous.height + gap > current.top + epsilon) { return false; }
            }
            return true;
        }
        return !playerThemeV5RectanglesOverlap(rects.artwork, rects.metadata, gap)
            && !playerThemeV5RectanglesOverlap(rects.artwork, rects.lyrics, gap)
            && !playerThemeV5RectanglesOverlap(rects.metadata, rects.lyrics, gap)
            && (radialVisualizer || !playerThemeV5RectanglesOverlap(rects.lyrics, rects.visualizer, gap))
            && !playerThemeV5RectanglesOverlap(rects.visualizer, rects.controlDock, gap);
    }

    function repairPlayerThemeV5Layout(layout, profileId) {
        var repaired = clonePlayerThemeV2Value(layout || {});
        var safe = playerThemeV5SafeLayout(profileId);
        var canvas = PLAYER_THEME_CANVAS_SIZES[profileId];
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            if (!repaired[layerId] || "object" !== typeof repaired[layerId]) {
                repaired[layerId] = clonePlayerThemeV2Value(safe[layerId]);
                return;
            }
            var layer = repaired[layerId];
            var fallback = safe[layerId];
            layer.width = Math.min(canvas.width - 40, Math.max(44, Number(layer.width) || fallback.width));
            layer.height = Math.min(canvas.height - 40, Math.max(44, Number(layer.height) || fallback.height));
            layer.hidden = "controlDock" === layerId ? false : !!layer.hidden;
        });
        if (!playerThemeV5LayoutIsSafe(repaired, profileId)) {
            // Keep the complete visual styling while replacing only unsafe geometry.
            PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
                var visual = repaired[layerId];
                var geometry = safe[layerId];
                ["anchorX", "anchorY", "x", "y", "width", "height"].forEach(function (key) {
                    visual[key] = geometry[key];
                });
                visual.hidden = "controlDock" === layerId ? false : !!visual.hidden;
            });
        }
        return repaired;
    }

    function repairPlayerThemeV5State(source) {
        var state = normalizePlayerThemeV2State(source);
        var changed = false;
        PLAYER_THEME_V2_PROFILE_IDS.forEach(function (profileId) {
            if (!playerThemeV5LayoutIsSafe(state.layouts[profileId], profileId)) {
                state.layouts[profileId] = repairPlayerThemeV5Layout(state.layouts[profileId], profileId);
                changed = true;
            }
        });
        if (changed && Number(state.layoutRepairRevision) < PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION) {
            state.layoutRepairRevision = PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION;
        }
        return { state: state, changed: changed };
    }

    function playerThemeV5PlaybackState(renderer, source) {
        var state = normalizePlayerThemeV2State(source, renderer && renderer.__elyricThemeBaseLayout);
        if (renderer && renderer.__elyricThemeV2DesignerOpen) { return state; }
        return repairPlayerThemeV5State(state).state;
    }

    function playerThemeV2RenderedRect(layer, metrics) {
        var design = playerThemeV2LayerDesignRect(layer, metrics);
        var point = metrics.forward(design.left, design.top);
        var width = design.width * metrics.scale;
        var height = design.height * metrics.scale;
        var grab = 44;
        var viewport = metrics.viewport;
        var editing = !!(metrics.renderer && metrics.renderer.__elyricThemeV2DesignerOpen);
        if (editing) {
            point.x = Math.min(viewport.left + viewport.width - grab, Math.max(viewport.left - width + grab, point.x));
            point.y = Math.min(viewport.top + viewport.height - grab, Math.max(viewport.top - height + grab, point.y));
        } else {
            point.x = Math.min(viewport.left + viewport.width - width, Math.max(viewport.left, point.x));
            point.y = Math.min(viewport.top + viewport.height - height, Math.max(viewport.top, point.y));
        }
        return { left: point.x, top: point.y, width: width, height: height };
    }

    function applyPlayerThemeV6Stage(renderer, metrics) {
        var stage = renderer && renderer.__elyricPlayerStage;
        if (!stage || !stage.style || !metrics) { return; }
        stage.style.setProperty("position", "fixed", "important");
        stage.style.setProperty("left", "0px", "important");
        stage.style.setProperty("top", "0px", "important");
        stage.style.setProperty("right", "auto", "important");
        stage.style.setProperty("bottom", "auto", "important");
        stage.style.setProperty("width", metrics.designWidth + "px", "important");
        stage.style.setProperty("height", metrics.designHeight + "px", "important");
        stage.style.setProperty("transform-origin", "top left", "important");
        stage.style.setProperty(
            "transform",
            "translate3d(" + metrics.originX + "px," + metrics.originY + "px,0) scale(" + metrics.scale + ")",
            "important"
        );
        stage.style.setProperty("--elyric-v6-stage-width", metrics.designWidth + "px");
        stage.style.setProperty("--elyric-v6-stage-height", metrics.designHeight + "px");
        stage.style.setProperty("--elyric-v6-stage-scale", String(metrics.scale));
        stage.setAttribute("data-elyric-canvas-profile", metrics.profileId);
    }

    function applyPlayerThemeV2Layer(renderer, layerId, layer) {
        var element = playerThemeV2LayerElement(renderer, layerId);
        if (!element || !element.style) { return; }
        if ("artwork" === layerId) {
            playerThemeV2ArtworkLayerElements(renderer).forEach(function (candidate) {
                if (candidate !== element) { clearPlayerThemeV2LayerElement(candidate, layerId); }
            });
        }
        var displayedLayer = layer;
        var metrics = playerThemeV2StageMetrics(renderer, renderer.__elyricThemeV2Profile);
        metrics.renderer = renderer;
        var rect = playerThemeV2LayerDesignRect(displayedLayer, metrics);
        applyPlayerThemeV6Stage(renderer, metrics);
        element.classList.add("elyric-player-v2-layer", "elyric-player-v2-layer-" + layerId);
        element.style.setProperty("position", "absolute", "important");
        element.style.setProperty("left", rect.left + "px", "important");
        element.style.setProperty("top", rect.top + "px", "important");
        element.style.setProperty("width", rect.width + "px", "important");
        element.style.setProperty("height", rect.height + "px", "important");
        element.style.setProperty("transform", "rotate(" + displayedLayer.rotation + "deg)", "important");
        element.style.setProperty("--elyric-v4-layer-left", rect.left + "px");
        element.style.setProperty("--elyric-v4-layer-top", rect.top + "px");
        element.style.setProperty("--elyric-v4-layer-width", rect.width + "px");
        element.style.setProperty("--elyric-v4-layer-height", rect.height + "px");
        element.style.setProperty("--elyric-v4-layer-rotation", displayedLayer.rotation + "deg");
        element.style.setProperty("transform-origin", "center", "important");
        element.style.setProperty("z-index", String(PLAYER_THEME_LAYER_Z[layerId]), "important");
        element.style.setProperty("opacity", String(displayedLayer.opacity), "important");
        if (displayedLayer.hidden && "controlDock" !== layerId) { element.style.setProperty("display", "none", "important"); }
        else { element.style.removeProperty("display"); }
        element.setAttribute("data-elyric-v2-layer", layerId);
    }

    if ("undefined" !== typeof window) {
        window.__elyricPlayerThemeV4Geometry = {
            profile: currentPlayerThemeV2Profile,
            metrics: playerThemeV2StageMetrics,
            designRect: playerThemeV2LayerDesignRect,
            renderedRect: playerThemeV2RenderedRect
        };
        window.__elyricPlayerThemeV5Geometry = window.__elyricPlayerThemeV4Geometry;
        window.__elyricPlayerThemeV6Geometry = window.__elyricPlayerThemeV4Geometry;
    }

    function applyPlayerThemeV2SemanticControls(renderer) {
        var state = renderer.__elyricThemeV2;
        if (!state) { return; }
        var overlayStyle = state.overlays || defaultPlayerThemeV2State().overlays;
        var consoleStyle = state.console || defaultPlayerThemeV2State().console;
        var chromeStyle = state.systemChrome || defaultPlayerThemeV2State().systemChrome;
        var popupOpacity = Math.min(100, Math.max(0,
            null == overlayStyle.opacity ? 92 : Number(overlayStyle.opacity) || 0));
        var popupRadius = Math.min(64, Math.max(0, Number(overlayStyle.radius) || 0));
        var safeArea = Math.min(180, Math.max(44, Number(state.controls.safeArea) || 64));
        var hosts = [renderer.__elyricThemeControl, renderer.__elyricMediaPanel, renderer.__elyricSettingsPanel,
            renderer.__elyricQueuePanel, renderer.__elyricCastPanel, renderer.__elyricVolumePanel];
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) { hosts.push(document.body); }
        hosts.forEach(function (host) {
            if (!host || !host.style) { return; }
            setDisplayStyle(host, "--elyric-v2-popup-opacity", popupOpacity + "%");
            setDisplayStyle(host, "--elyric-v2-popup-radius", popupRadius + "px");
            setDisplayStyle(host, "--elyric-v2-safe-area", safeArea + "px");
            setDisplayStyle(host, "--elyric-v6-overlay-bg", normalizeHexColor(overlayStyle.surfaceColor, "#111827"));
            setDisplayStyle(host, "--elyric-v6-overlay-text", normalizeHexColor(overlayStyle.textColor, "#ffffff"));
            setDisplayStyle(host, "--elyric-v6-overlay-accent", normalizeHexColor(overlayStyle.accentColor, "#ffffff"));
            setDisplayStyle(host, "--elyric-v6-overlay-blur", normalizePlayerThemeV2Number(overlayStyle.blur, 0, 64, 24) + "px");
            setDisplayStyle(host, "--elyric-v6-overlay-duration", normalizePlayerThemeV2Number(overlayStyle.durationMs, 0, 600, 200) + "ms");
            setDisplayStyle(host, "--elyric-v6-overlay-arrow", normalizePlayerThemeV2Number(overlayStyle.arrowSize, 4, 24, 10) + "px");
            setDisplayStyle(host, "--elyric-v6-console-bg", normalizeHexColor(consoleStyle.surfaceColor, "#111827"));
            setDisplayStyle(host, "--elyric-v6-console-text", normalizeHexColor(consoleStyle.textColor, "#ffffff"));
            setDisplayStyle(host, "--elyric-v6-console-accent", normalizeHexColor(consoleStyle.accentColor, "#ffffff"));
            setDisplayStyle(host, "--elyric-v6-console-gradient-a", normalizeHexColor(consoleStyle.gradientA, "#111827"));
            setDisplayStyle(host, "--elyric-v6-console-gradient-b", normalizeHexColor(consoleStyle.gradientB, "#334155"));
            setDisplayStyle(host, "--elyric-v6-console-gradient-angle",
                normalizePlayerThemeV2Number(consoleStyle.gradientAngle, 0, 360, 135) + "deg");
            setDisplayStyle(host, "--elyric-v6-console-radius", normalizePlayerThemeV2Number(consoleStyle.radius, 0, 64, 28) + "px");
            setDisplayStyle(host, "--elyric-v6-console-blur", normalizePlayerThemeV2Number(consoleStyle.blur, 0, 64, 26) + "px");
            setDisplayStyle(host, "--elyric-v6-console-opacity", normalizePlayerThemeV2Number(consoleStyle.opacity, 0, 100, 72) + "%");
            setDisplayStyle(host, "--elyric-v6-console-border", normalizePlayerThemeV2Number(consoleStyle.borderWidth, 0, 12, 1) + "px");
            setDisplayStyle(host, "--elyric-v6-console-shadow", normalizePlayerThemeV2Number(consoleStyle.shadow, 0, 64, 28) + "px");
            setDisplayStyle(host, "--elyric-v6-chrome-size", normalizePlayerThemeV2Number(chromeStyle.size, 44, 80, 52) + "px");
            setDisplayStyle(host, "--elyric-v6-chrome-color", normalizeHexColor(chromeStyle.color, "#ffffff"));
            setDisplayStyle(host, "--elyric-v6-chrome-bg", normalizeHexColor(chromeStyle.surfaceColor, "#111827"));
            setDisplayStyle(host, "--elyric-v6-chrome-radius", normalizePlayerThemeV2Number(chromeStyle.radius, 0, 50, 50) + "%");
            setDisplayStyle(host, "--elyric-v6-chrome-blur", normalizePlayerThemeV2Number(chromeStyle.blur, 0, 48, 18) + "px");
            setDisplayStyle(host, "--elyric-v6-chrome-shadow", normalizePlayerThemeV2Number(chromeStyle.shadow, 0, 64, 24) + "px");
            setAttributeIfChanged(host, "data-elyric-chrome-surface", chromeStyle.surface || "glass");
            setAttributeIfChanged(host, "data-elyric-overlay-surface", overlayStyle.surface || "glass");
            setAttributeIfChanged(host, "data-elyric-control-material", consoleStyle.material || "glass");
            setAttributeIfChanged(host, "data-elyric-volume-landscape-mode",
                state.volume && state.volume.landscapeMode || "expanded");
            setAttributeIfChanged(host, "data-elyric-volume-icon-fill",
                !state.volume || false !== state.volume.iconFill ? "true" : "false");
        });
        if (renderer.__elyricVolumePanel) {
            var volumeStyle = state.volume || defaultPlayerThemeV2State().volume;
            setDisplayStyle(renderer.__elyricVolumePanel, "--elyric-v6-volume-popover-width",
                normalizePlayerThemeV2Number(volumeStyle.popoverWidth, 64, 120, 72) + "px");
            setDisplayStyle(renderer.__elyricVolumePanel, "--elyric-v6-volume-popover-height",
                normalizePlayerThemeV2Number(volumeStyle.popoverHeight, 160, 360, 240) + "px");
        }
        if (renderer.__elyricOverlayScrim) {
            var backdrop = overlayStyle.backdrop || {};
            setDisplayStyle(renderer.__elyricOverlayScrim, "--elyric-v6-backdrop-dim",
                normalizePlayerThemeV2Number(backdrop.dim, 0, 100, 0) / 100);
            setDisplayStyle(renderer.__elyricOverlayScrim, "--elyric-v6-backdrop-blur",
                normalizePlayerThemeV2Number(backdrop.blur, 0, 48, 0) + "px");
        }
    }

    function playerControlDockCssAlignment(value) {
        if ("start" === value) { return "flex-start"; }
        if ("end" === value) { return "flex-end"; }
        return value;
    }

    function applyPlayerControlDock(renderer, profileOverride) {
        var dock = renderer.__elyricPlayerControlDock;
        var groups = renderer.__elyricControlDockGroups;
        var items = renderer.__elyricControlDockItems;
        if (!dock || !groups || !items || !renderer.__elyricThemeV2) { return; }
        var profileId = PLAYER_THEME_V2_PROFILE_IDS.indexOf(profileOverride) >= 0
            ? profileOverride : renderer.__elyricThemeV2Profile || currentPlayerThemeV2Profile();
        var profile = normalizePlayerControlDockProfile(
            renderer.__elyricThemeV2.controls
                && renderer.__elyricThemeV2.controls.profiles
                && renderer.__elyricThemeV2.controls.profiles[profileId],
            "portrait" === profileId
        );
        renderer.__elyricThemeV2.controls.profiles[profileId] = profile;
        while (dock.firstChild) { dock.removeChild(dock.firstChild); }
        var surface = document.createElement("div");
        surface.className = "elyric-player-control-dock-surface";
        surface.setAttribute("aria-hidden", "true");
        dock.appendChild(surface);
        profile.rows.forEach(function (rowDefinition, rowIndex) {
            var row = document.createElement("div");
            row.className = "elyric-player-control-row";
            row.setAttribute("data-elyric-control-row", String(rowIndex));
            row.setAttribute("data-elyric-justify", rowDefinition.justify);
            row.setAttribute("data-elyric-align", rowDefinition.align);
            row.style.justifyContent = playerControlDockCssAlignment(rowDefinition.justify);
            row.style.alignItems = playerControlDockCssAlignment(rowDefinition.align);
            row.style.gap = Number(rowDefinition.gap || 0) + "px";
            rowDefinition.groups.forEach(function (groupId) {
                var group = groups[groupId];
                var groupDefinition = profile.groups[groupId];
                if (!group || !groupDefinition) { return; }
                group.setAttribute("data-elyric-control-group", groupId);
                group.setAttribute("data-elyric-group-align", groupDefinition.align);
                group.style.alignItems = playerControlDockCssAlignment(groupDefinition.align);
                group.style.justifyContent = playerControlDockCssAlignment(groupDefinition.align);
                group.style.gap = Number(groupDefinition.gap || 0) + "px";
                group.style.setProperty("display", groupDefinition.visible ? "flex" : "none", "important");
                (groupDefinition.order || []).forEach(function (buttonId) {
                    var element = items[groupId] && items[groupId][buttonId];
                    if (!element) { return; }
                    var hidden = groupDefinition.hiddenButtons.indexOf(buttonId) >= 0
                        && "playPause" !== buttonId;
                    element.style.setProperty("display", hidden ? "none" : "inline-flex", "important");
                    element.setAttribute("data-elyric-control-item", buttonId);
                    group.appendChild(element);
                });
                row.appendChild(group);
            });
            dock.appendChild(row);
        });
        setAttributeIfChanged(dock, "data-elyric-control-profile", profileId);
    }

    function clearPlayerThemeV2Layout(renderer) {
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            var elements = "artwork" === layerId
                ? playerThemeV2ArtworkLayerElements(renderer)
                : [playerThemeV2LayerElement(renderer, layerId)];
            elements.forEach(function (element) { clearPlayerThemeV2LayerElement(element, layerId); });
        });
        removeAttributeIfPresent(renderer.__elyricThemeControl, "data-elyric-theme-v2");
        removeAttributeIfPresent(renderer.__elyricThemeControl, "data-elyric-theme-v2-profile");
        removeAttributeIfPresent(renderer.itemsContainer, "data-elyric-theme-v2");
        removeAttributeIfPresent(renderer.itemsContainer, "data-elyric-theme-v2-profile");
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            removeAttributeIfPresent(document.body, "data-elyric-theme-v2");
            removeAttributeIfPresent(document.body, "data-elyric-theme-v2-profile");
        }
        removePlayerThemeV2DesignerBoxes(renderer);
    }

    function applyPlayerThemeV2Typography(renderer) {
        if (!renderer.__elyricThemeV2 || !renderer.__elyricThemeControl) { return; }
        var styleHosts = [renderer.__elyricThemeControl, renderer.itemsContainer];
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) { styleHosts.push(document.body); }
        ["primary", "secondary", "tertiary"].forEach(function (lineId) {
            var style = renderer.__elyricThemeV2.typography[lineId];
            var prefix = "--elyric-v2-" + lineId + "-";
            styleHosts.forEach(function (styleHost) {
                setDisplayStyle(styleHost, prefix + "font", style.fontFamily || "inherit");
                setDisplayStyle(styleHost, prefix + "size", Number(style.size) + "%");
                setDisplayStyle(styleHost, prefix + "weight", String(style.weight));
                setDisplayStyle(styleHost, prefix + "style", style.italic ? "italic" : "normal");
                setDisplayStyle(styleHost, prefix + "spacing", Number(style.letterSpacing) + "px");
                setDisplayStyle(styleHost, prefix + "line-height", String(style.lineHeight));
                setDisplayStyle(styleHost, prefix + "color", normalizeHexColor(style.color, "#ffffff"));
                setDisplayStyle(styleHost, prefix + "opacity", String(style.opacity));
                setDisplayStyle(styleHost, prefix + "stroke-width", Number(style.strokeWidth) + "px");
                setDisplayStyle(styleHost, prefix + "stroke-color", normalizeHexColor(style.strokeColor, "#000000"));
                setDisplayStyle(styleHost, prefix + "shadow",
                    Number(style.shadowX) + "px " + Number(style.shadowY) + "px " + Number(style.shadowBlur) + "px "
                    + normalizeHexColor(style.shadowColor, "#000000") + ", 0 0 " + Number(style.glow) + "px "
                    + normalizeHexColor(style.color, "#ffffff"));
                ["past", "current", "future"].forEach(function (stateId) {
                    var stateStyle = style.states && style.states[stateId] ? style.states[stateId] : {};
                    setDisplayStyle(styleHost, prefix + stateId + "-color", normalizeHexColor(stateStyle.color, style.color));
                    setDisplayStyle(styleHost, prefix + stateId + "-opacity", String(null == stateStyle.opacity ? style.opacity : stateStyle.opacity));
                });
            });
        });
    }

    function playerThemeV2AssetUrl(renderer, assetId) {
        var apiClient = activeApiClient(renderer);
        if (!apiClient || !apiClient.getUrl || !assetId) { return ""; }
        var options = {};
        var token = apiClient.accessToken ? apiClient.accessToken() : "";
        if (token) { options.api_key = token; }
        return apiClient.getUrl(PLAYER_ASSETS_PATH + "/" + encodeURIComponent(assetId), options);
    }

    function applyPlayerThemeV2Artwork(renderer) {
        var state = renderer.__elyricThemeV2;
        var artwork = renderer.__elyricPlayerArtwork;
        if (!state || !artwork) { return; }
        var source = state.artwork;
        var applied = false;
        if ("emby" === source.source && renderer.__elyricPlayerEmbyArtworkUrl) {
            artwork.src = renderer.__elyricPlayerEmbyArtworkUrl;
            applied = true;
        } else if ("url" === source.source && /^https:\/\//i.test(source.url || "")) {
            artwork.src = source.url;
            applied = true;
        } else if ("asset" === source.source && source.assetId) {
            var assetUrl = playerThemeV2AssetUrl(renderer, source.assetId);
            if (assetUrl) {
                artwork.src = assetUrl;
                applied = true;
            }
        }
        if (applied) {
            artwork.removeAttribute("hidden");
        } else {
            artwork.removeAttribute("src");
            artwork.setAttribute("hidden", "hidden");
        }
        artwork.style.objectFit = source.fit;
        artwork.style.objectPosition = Number(source.focusX) + "% " + Number(source.focusY) + "%";
        artwork.style.clipPath = normalizePlayerThemeV2ClipPath(source.clipPath);
    }

    function setThirdLineOverride(renderer, show, persist) {
        renderer.__elyricLocalShowThird = !!show;
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-show-third-plus", show ? "true" : "false");
        if (renderer.__elyricThirdLineButton) {
            setAttributeIfChanged(renderer.__elyricThirdLineButton, "aria-pressed", show ? "true" : "false");
            setAttributeIfChanged(renderer.__elyricThirdLineButton, "data-elyric-active", show ? "true" : "false");
            setAttributeIfChanged(renderer.__elyricThirdLineButton, "title", show ? "隐藏翻译/第三行" : "显示翻译/第三行");
            setAttributeIfChanged(renderer.__elyricThirdLineButton, "data-elyric-tooltip", show ? "隐藏翻译" : "显示翻译");
        }
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function collectPlayerThemeV2State(renderer) {
        var state = normalizePlayerThemeV2State(
            renderer.__elyricThemeV2 || defaultPlayerThemeV2State(),
            renderer.__elyricThemeBaseLayout
        );
        state.lyrics.showSecondLine = false !== renderer.__elyricLocalShowSecond;
        state.lyrics.showThirdAndLaterLines = false !== renderer.__elyricLocalShowThird;
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            state.visualizer.analysis[definition.id] = isFinite(Number(renderer[definition.property]))
                ? Number(renderer[definition.property]) : definition.fallback;
        });
        state.visualizer.frequencyLayout = renderer.__elyricVisualizerFrequencyLayout || "centerOut";
        return clonePlayerThemeV2Value(state);
    }

    function applyPlayerThemeV2State(renderer, source, profileOverride) {
        if (!source || "object" !== typeof source) { return; }
        renderer.__elyricThemeV2 = normalizePlayerThemeV2State(source);
        renderer.__elyricThemeV2Profile = PLAYER_THEME_V2_PROFILE_IDS.indexOf(profileOverride) >= 0
            ? profileOverride
            : currentPlayerThemeV2Profile();
        var renderedState = renderer.__elyricThemeV2DesignerOpen
            ? renderer.__elyricThemeV2
            : repairPlayerThemeV5State(renderer.__elyricThemeV2).state;
        var profile = clonePlayerThemeV2Value(renderedState.layouts[renderer.__elyricThemeV2Profile]);
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            applyPlayerThemeV2Layer(renderer, layerId, profile[layerId]);
        });
        setSecondLineOverride(renderer, renderer.__elyricThemeV2.lyrics.showSecondLine, false);
        setThirdLineOverride(renderer, renderer.__elyricThemeV2.lyrics.showThirdAndLaterLines, false);
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            setVisualizerAnalysisSetting(
                renderer,
                definition.id,
                renderer.__elyricThemeV2.visualizer.analysis[definition.id],
                false
            );
        });
        setVisualizerFrequencyLayout(
            renderer,
            renderer.__elyricThemeV2.visualizer.frequencyLayout,
            false
        );
        applyPlayerThemeV2Typography(renderer);
        ["primary", "secondary", "tertiary"].forEach(function (lineId) {
            var typography = renderer.__elyricThemeV2.typography[lineId];
            if (typography.fontAssetId || typography.fontUrl) {
                installPlayerThemeV2Font(renderer, lineId);
            }
        });
        applyPlayerThemeV2Artwork(renderer);
        applyPlayerThemeV2SemanticControls(renderer);
        applyPlayerControlDock(renderer, renderer.__elyricThemeV2Profile);
        syncPlayerThemeV6Settings(renderer);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-theme-v2", "true");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-theme-v2-profile", renderer.__elyricThemeV2Profile);
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-theme-v2", "true");
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-theme-v2-profile", renderer.__elyricThemeV2Profile);
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-theme-v2", "true");
            setAttributeIfChanged(document.body, "data-elyric-theme-v2-profile", renderer.__elyricThemeV2Profile);
        }
        syncPlayerThemeV2Designer(renderer);
    }

    var PLAYER_PARAMETRIC_PRESETS = {
        album: {
            choices: {
                artworkMode: "single", artworkMaterial: "vinyl", controlMaterial: "minimal",
                metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            typographyShadowBlur: 0,
            tuning: {
                artworkInnerSize: 42,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 0,
                metadataTitleSize: 190
            },
            colors: {
                backgroundA: "#f4f0e9", backgroundB: "#d7c7b4", metadataText: "#17191d",
                lyricPast: "#765f57", lyricCurrent: "#d74642", lyricFuture: "#9e8f88",
                progressActive: "#d74642", artworkFrame: "#17191d"
            }
        },
        center: {
            choices: {
                artworkMode: "single", artworkMaterial: "poster", controlMaterial: "poster",
                metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkInnerSize: 100,
                artworkOuterRadius: 2, artworkInnerRadius: 2, artworkPadding: 0,
                metadataTitleSize: 210
            },
            colors: {
                backgroundA: "#0a0c0b", backgroundB: "#15231b", metadataText: "#ffffff",
                lyricPast: "#afbab3", lyricCurrent: "#1ed760", lyricFuture: "#78857d",
                progressActive: "#1ed760", artworkFrame: "#1ed760"
            }
        },
        mobile: {
            choices: {
                artworkMode: "single", artworkMaterial: "turntable", controlMaterial: "glass",
                metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "glass", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkInnerSize: 72,
                artworkOuterRadius: 18, artworkInnerRadius: 50, artworkPadding: 7,
                metadataTitleSize: 185
            },
            colors: {
                backgroundA: "#0e1724", backgroundB: "#22435e", metadataText: "#ffffff",
                metadataSurface: "#1b2f43", lyricPast: "#b7d3e5", lyricCurrent: "#ffffff",
                lyricFuture: "#7797ac", progressActive: "#b9f782"
            }
        },
        mint: {
            choices: {
                artworkMode: "single", artworkMaterial: "neumorphic", controlMaterial: "neumorphic",
                metadataAnchor: "center", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "inset", mediaSurface: "embossed"
            },
            typographyShadowBlur: 0,
            tuning: {
                artworkInnerSize: 88,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 6,
                metadataTitleSize: 155, lyricsOpacity: 82
            },
            colors: {
                backgroundA: "#e4f0eb", backgroundB: "#c7ddd4", metadataText: "#263a34",
                lyricsSurface: "#d9ebe4", lyricPast: "#70867f", lyricCurrent: "#405f56",
                lyricFuture: "#93a8a1", progressActive: "#617d76", artworkFrame: "#edf8f4"
            }
        },
        deck: {
            choices: {
                artworkMode: "single", artworkMaterial: "deck", controlMaterial: "deck",
                metadataAnchor: "start", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "embossed"
            },
            typographyShadowBlur: 0,
            tuning: {
                artworkInnerSize: 42,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 0,
                metadataTitleSize: 170
            },
            colors: {
                backgroundA: "#d7d8d8", backgroundB: "#afb1b3", metadataText: "#27292c",
                lyricPast: "#656970", lyricCurrent: "#555bd8", lyricFuture: "#8f9298",
                progressActive: "#7b80e8", artworkFrame: "#aeb0af"
            }
        },
        stack: {
            choices: {
                artworkMode: "single", artworkMaterial: "stack", controlMaterial: "minimal",
                metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkInnerSize: 100,
                artworkOuterRadius: 1, artworkInnerRadius: 1, artworkPadding: 0,
                metadataTitleSize: 185
            },
            colors: {
                backgroundA: "#151211", backgroundB: "#4a1d21", metadataText: "#ffffff",
                lyricPast: "#c8b3b5", lyricCurrent: "#ff525d", lyricFuture: "#866f72",
                progressActive: "#ff525d", artworkFrame: "#ffffff"
            }
        },
        coverflow: {
            choices: {
                artworkMode: "coverflow", artworkMaterial: "coverflow", controlMaterial: "glass",
                metadataAnchor: "center", metadataAlign: "center",
                metadataSurface: "glass", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                coverflowWidth: 82, coverflowHeight: 48,
                artworkOuterRadius: 8, artworkInnerRadius: 6, metadataTitleSize: 180
            },
            colors: {
                backgroundA: "#1b1512", backgroundB: "#663c20", metadataText: "#fff7e8",
                metadataSurface: "#302015", lyricPast: "#d8c2a7", lyricCurrent: "#ffb13b",
                lyricFuture: "#9e8569", progressActive: "#ffb13b", artworkFrame: "#f6e28f"
            }
        },
        lyrics: {
            choices: {
                artworkMode: "single", artworkMaterial: "vinyl", controlMaterial: "glass",
                metadataAnchor: "start", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkInnerSize: 56,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 0,
                metadataTitleSize: 170
            },
            colors: {
                backgroundA: "#101412", backgroundB: "#344139", metadataText: "#ffffff",
                lyricPast: "#ced7d1", lyricCurrent: "#ffffff", lyricFuture: "#839087",
                progressActive: "#dbe4dd", artworkFrame: "#dbe4dd"
            }
        },
        rose: {
            choices: {
                artworkMode: "single", artworkMaterial: "neumorphic", controlMaterial: "neumorphic",
                metadataAnchor: "center", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "embossed", mediaSurface: "embossed"
            },
            typographyShadowBlur: 0,
            tuning: {
                artworkInnerSize: 88,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 6,
                artworkShadowDepth: 34, metadataTitleSize: 170,
                metadataArtistSize: 120, lyricsOpacity: 84
            },
            colors: {
                backgroundA: "#fff0f4", backgroundB: "#f5d9e1", metadataText: "#27252a",
                lyricsSurface: "#fff0f4", mediaSurface: "#fff0f4", lyricPast: "#9b858e",
                lyricCurrent: "#ff2f72", lyricFuture: "#c4afb7", progressActive: "#ff2f72",
                artworkFrame: "#fff0f4"
            }
        }
    };

    function playerThemeV4PresetLayout(content, portrait) {
        var controls = portrait ? {
            progress: defaultPlayerThemeV2Layer(6, 85, 88, 5, 16),
            transport: defaultPlayerThemeV2Layer(30, 90, 40, 8, 17),
            volume: defaultPlayerThemeV2Layer(76, 92, 17, 6, 17, true),
            auxiliary: defaultPlayerThemeV2Layer(3, 90, 24, 8, 17)
        } : {
            progress: defaultPlayerThemeV2Layer(8, 84, 84, 5, 16),
            transport: defaultPlayerThemeV2Layer(40, 89, 20, 8, 17),
            volume: defaultPlayerThemeV2Layer(74, 90, 18, 6, 17),
            auxiliary: defaultPlayerThemeV2Layer(3, 89, 30, 7, 17)
        };
        Object.keys(content).forEach(function (layerId) {
            controls[layerId] = defaultPlayerThemeV2Layer.apply(null, content[layerId]);
        });
        return controls;
    }

    function playerThemeV4LayerFromPercent(layer, portrait) {
        var canvasWidth = portrait ? 1080 : 1920;
        var canvasHeight = portrait ? 1920 : 1080;
        return defaultPlayerThemeV2Layer(
            Math.round(Number(layer.x) / 100 * canvasWidth * 10) / 10,
            Math.round(Number(layer.y) / 100 * canvasHeight * 10) / 10,
            Math.round(Number(layer.width) / 100 * canvasWidth * 10) / 10,
            Math.round(Number(layer.height) / 100 * canvasHeight * 10) / 10,
            layer.z, layer.hidden, "start", "start"
        );
    }

    function playerThemeV4LayoutFromPercent(layout, portrait) {
        var converted = {};
        PLAYER_THEME_V4_LAYER_IDS.forEach(function (layerId) {
            converted[layerId] = playerThemeV4LayerFromPercent(layout[layerId], portrait);
        });
        return converted;
    }

    function playerThemeV6Layer(tuple, layerId) {
        return defaultPlayerThemeV2Layer(
            tuple[0], tuple[1], tuple[2], tuple[3], PLAYER_THEME_LAYER_Z[layerId], false
        );
    }

    function playerThemeV6Layout(profileId, specification) {
        var layout = { canvas: clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES[profileId]) };
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            layout[layerId] = playerThemeV6Layer(specification[layerId], layerId);
        });
        return layout;
    }

    var PLAYER_THEME_V6_BUILTIN_LAYOUTS = {
        album: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [96, 144, 568, 568], metadata: [96, 736, 568, 112],
                lyrics: [720, 120, 1104, 548], visualizer: [720, 692, 1104, 156],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [180, 112, 720, 720], metadata: [96, 856, 888, 152],
                lyrics: [80, 1032, 920, 372], visualizer: [80, 1428, 920, 124],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        center: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [88, 144, 520, 520], metadata: [648, 144, 400, 520],
                lyrics: [1088, 144, 744, 520], visualizer: [88, 696, 1744, 152],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [174, 104, 732, 732], metadata: [88, 860, 904, 192],
                lyrics: [88, 1076, 904, 328], visualizer: [88, 1428, 904, 124],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        mobile: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [88, 112, 736, 704], metadata: [880, 128, 872, 148],
                lyrics: [880, 300, 872, 356], visualizer: [880, 680, 872, 136],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [104, 104, 872, 720], metadata: [88, 848, 904, 164],
                lyrics: [88, 1036, 904, 368], visualizer: [88, 1428, 904, 124],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        mint: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [720, 104, 480, 480], metadata: [480, 600, 960, 104],
                lyrics: [320, 720, 1280, 128], visualizer: [600, 40, 720, 600],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [220, 120, 640, 640], metadata: [96, 784, 888, 148],
                lyrics: [88, 956, 904, 420], visualizer: [150, 70, 780, 740],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        deck: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [80, 112, 720, 704], metadata: [864, 124, 896, 154],
                lyrics: [864, 302, 896, 370], visualizer: [864, 696, 896, 120],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [140, 96, 800, 760], metadata: [88, 880, 904, 148],
                lyrics: [88, 1052, 904, 348], visualizer: [88, 1424, 904, 128],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        stack: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [96, 152, 480, 480], metadata: [624, 136, 1176, 156],
                lyrics: [624, 316, 1176, 368], visualizer: [96, 708, 1704, 140],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [180, 104, 720, 720], metadata: [88, 848, 904, 164],
                lyrics: [88, 1036, 904, 364], visualizer: [88, 1424, 904, 128],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        coverflow: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [160, 112, 1600, 408], metadata: [272, 544, 1376, 104],
                lyrics: [256, 672, 1408, 112], visualizer: [256, 808, 1408, 40],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [80, 112, 920, 592], metadata: [88, 728, 904, 148],
                lyrics: [88, 900, 904, 440], visualizer: [88, 1364, 904, 188],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        lyrics: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [96, 148, 536, 536], metadata: [96, 708, 536, 140],
                lyrics: [688, 112, 1136, 584], visualizer: [688, 720, 1136, 128],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [220, 104, 640, 640], metadata: [88, 768, 904, 144],
                lyrics: [72, 936, 936, 456], visualizer: [72, 1416, 936, 136],
                controlDock: [40, 1608, 1000, 264]
            })
        },
        rose: {
            landscape: playerThemeV6Layout("landscape", {
                artwork: [112, 144, 560, 560], metadata: [96, 728, 592, 120],
                lyrics: [752, 120, 1072, 548], visualizer: [752, 692, 1072, 156],
                controlDock: [64, 884, 1792, 160]
            }),
            portrait: playerThemeV6Layout("portrait", {
                artwork: [172, 104, 736, 736], metadata: [80, 864, 920, 172],
                lyrics: [72, 1060, 936, 344], visualizer: [72, 1428, 936, 124],
                controlDock: [40, 1608, 1000, 264]
            })
        }
    };

    // Retained only as a migration source for historical Theme V4 documents.
    var PLAYER_THEME_V4_BUILTIN_LAYOUTS = {
        album: {
            landscape: playerThemeV4PresetLayout({
                artwork: [7, 17, 30, 54, 12], metadata: [49, 10, 43, 16, 14],
                lyrics: [48, 29, 45, 45, 11], visualizer: [10, 75, 80, 7, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [20, 6, 60, 30, 12], metadata: [8, 38, 84, 13, 14],
                lyrics: [6, 52, 88, 29, 11], visualizer: [10, 78, 80, 6, 9]
            }, true)
        },
        center: {
            landscape: playerThemeV4PresetLayout({
                artwork: [6, 18, 30, 50, 12], metadata: [39, 22, 24, 22, 14],
                lyrics: [67, 18, 28, 56, 11], visualizer: [12, 75, 76, 7, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [16, 5, 68, 31, 12], metadata: [8, 38, 84, 13, 14],
                lyrics: [6, 52, 88, 29, 11], visualizer: [12, 78, 76, 6, 9]
            }, true)
        },
        mobile: {
            landscape: playerThemeV4PresetLayout({
                artwork: [7, 15, 32, 56, 12], metadata: [45, 13, 48, 18, 14],
                lyrics: [45, 34, 48, 40, 11], visualizer: [12, 75, 76, 7, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [18, 5, 64, 31, 12], metadata: [7, 38, 86, 14, 14],
                lyrics: [6, 53, 88, 28, 11], visualizer: [12, 78, 76, 6, 9]
            }, true)
        },
        mint: {
            landscape: playerThemeV4PresetLayout({
                artwork: [36, 5, 28, 38, 12], metadata: [25, 43, 50, 13, 14],
                lyrics: [8, 57, 84, 17, 11], visualizer: [14, 76, 72, 6, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [22, 5, 56, 30, 12], metadata: [8, 38, 84, 13, 14],
                lyrics: [6, 53, 88, 28, 11], visualizer: [14, 78, 72, 6, 9]
            }, true)
        },
        deck: {
            landscape: playerThemeV4PresetLayout({
                artwork: [6, 15, 34, 58, 12], metadata: [52, 12, 40, 15, 14],
                lyrics: [51, 31, 42, 43, 11], visualizer: [12, 75, 76, 7, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [19, 5, 62, 31, 12], metadata: [8, 38, 84, 13, 14],
                lyrics: [6, 52, 88, 29, 11], visualizer: [12, 78, 76, 6, 9]
            }, true)
        },
        stack: {
            landscape: playerThemeV4PresetLayout({
                artwork: [6, 18, 34, 52, 12], metadata: [46, 10, 47, 15, 14],
                lyrics: [45, 28, 48, 46, 11], visualizer: [10, 75, 80, 7, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [16, 5, 68, 31, 12], metadata: [7, 38, 86, 13, 14],
                lyrics: [6, 52, 88, 29, 11], visualizer: [10, 78, 80, 6, 9]
            }, true)
        },
        coverflow: {
            landscape: playerThemeV4PresetLayout({
                artwork: [8, 9, 84, 43, 12], metadata: [20, 52, 60, 13, 14],
                lyrics: [15, 65, 70, 10, 11], visualizer: [10, 76, 80, 6, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [4, 6, 92, 28, 12], metadata: [8, 36, 84, 13, 14],
                lyrics: [6, 51, 88, 30, 11], visualizer: [10, 78, 80, 6, 9]
            }, true)
        },
        lyrics: {
            landscape: playerThemeV4PresetLayout({
                artwork: [7, 17, 32, 56, 12], metadata: [50, 9, 43, 15, 14],
                lyrics: [49, 26, 44, 49, 11], visualizer: [12, 75, 76, 7, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [21, 5, 58, 29, 12], metadata: [8, 37, 84, 13, 14],
                lyrics: [6, 51, 88, 30, 11], visualizer: [12, 78, 76, 6, 9]
            }, true)
        },
        rose: {
            landscape: playerThemeV4PresetLayout({
                artwork: [8, 15, 34, 56, 12], metadata: [6, 72, 38, 10, 14],
                lyrics: [50, 12, 43, 62, 11], visualizer: [51, 76, 42, 6, 9]
            }, false),
            portrait: playerThemeV4PresetLayout({
                artwork: [20, 5, 60, 31, 12], metadata: [7, 38, 86, 13, 14],
                lyrics: [6, 52, 88, 29, 11], visualizer: [12, 78, 76, 6, 9]
            }, true)
        }
    };

    function builtInPlayerThemeV4State(layoutId, preset) {
        var state = defaultPlayerThemeV2State();
        var sourceLayouts = PLAYER_THEME_V6_BUILTIN_LAYOUTS[layoutId] || PLAYER_THEME_V6_BUILTIN_LAYOUTS.album;
        state.layouts = clonePlayerThemeV2Value(sourceLayouts);
        var colors = preset && preset.colors ? preset.colors : {};
        ["primary", "secondary", "tertiary"].forEach(function (lineId) {
            var typography = state.typography[lineId];
            typography.color = colors.lyricCurrent || "#ffffff";
            typography.states.past.color = colors.lyricPast || "#b8c1d1";
            typography.states.current.color = colors.lyricCurrent || "#ffffff";
            typography.states.future.color = colors.lyricFuture || "#8993a5";
            typography.shadowBlur = preset && preset.typographyShadowBlur >= 0
                ? preset.typographyShadowBlur : 18;
        });
        state.visualizer.frequencyLayout = "centerOut";
        state.console.material = preset && preset.choices && preset.choices.controlMaterial || "glass";
        state.console.surfaceColor = preset && preset.colors && preset.colors.mediaSurface || "#111827";
        state.console.accentColor = preset && preset.colors && preset.colors.progressActive || "#ffffff";
        state.systemChrome.surfaceColor = state.console.surfaceColor;
        state.systemChrome.color = preset && preset.colors && preset.colors.metadataText || "#ffffff";
        state.overlays.surfaceColor = state.console.surfaceColor;
        state.overlays.textColor = state.systemChrome.color;
        state.overlays.accentColor = state.console.accentColor;
        if ("mint" === layoutId) { state.visualizer.frequencyLayout = "radial"; }
        return normalizePlayerThemeV2State(state);
    }
    var DEFAULT_DISPLAY_CONFIGURATION = {
        defaultTheme: "classic",
        themeSchemaVersion: 0,
        allowUserThemeOverride: true,
        fontSizePercent: 100,
        lineHeight: 1.25,
        fontWeight: 600,
        useThemeColor: true,
        highlightColor: "#ffffff",
        pendingOpacity: .46,
        glowStrength: .45,
        currentLineScale: 1.08,
        otherLinesOpacity: .34,
        otherLinesBlurPixels: .4,
        showSecondLine: true,
        showThirdAndLaterLines: true
    };
    var serverConfigurationPromise = null;
    var originalVideoOsdOnResume = VideoOsd.prototype.onResume;
    var originalVideoOsdOnPause = VideoOsd.prototype.onPause;
    var originalVideoOsdDestroy = VideoOsd.prototype.destroy;

    function cloneEvent(event) {
        var clone = {};
        var key;
        for (key in event) {
            if (Object.prototype.hasOwnProperty.call(event, key)) {
                clone[key] = event[key];
            }
        }
        return clone;
    }

    function parseTimeTag(minutes, seconds, fraction) {
        var fractionTicks = 0;
        if (fraction) {
            fractionTicks = Math.round(Number("0." + fraction) * TICKS_PER_SECOND);
        }
        return (Number(minutes) * 60 + Number(seconds)) * TICKS_PER_SECOND + fractionTicks;
    }

    function parseEnhancedLine(value, fallbackEndTicks, allowOpenEnded) {
        var text = null == value ? "" : String(value);
        var pattern = /<(\d{1,4}):([0-5]\d)(?:[.:](\d{1,3}))?>/g;
        var markers = [];
        var match;

        while ((match = pattern.exec(text))) {
            markers.push({
                start: match.index,
                end: pattern.lastIndex,
                ticks: parseTimeTag(match[1], match[2], match[3])
            });
        }

        if (markers.length < 2 || text.slice(0, markers[0].start).trim()) {
            return null;
        }

        var words = [];
        var plainText = "";
        var i;
        for (i = 0; i < markers.length; i++) {
            if (i && markers[i].ticks < markers[i - 1].ticks) {
                return null;
            }

            var segmentEnd = i + 1 < markers.length ? markers[i + 1].start : text.length;
            var segment = text.slice(markers[i].end, segmentEnd);
            if (!segment) {
                if (i !== markers.length - 1) {
                    return null;
                }
                continue;
            }

            var endTicks = i + 1 < markers.length ? markers[i + 1].ticks : fallbackEndTicks;
            if (!(endTicks > markers[i].ticks)) {
                if (allowOpenEnded && i === markers.length - 1) {
                    endTicks = markers[i].ticks + TICKS_PER_SECOND;
                } else {
                    return null;
                }
            }

            words.push({
                text: segment,
                startTicks: markers[i].ticks,
                endTicks: endTicks
            });
            plainText += segment;
        }

        if (!words.length) {
            return null;
        }

        return {
            text: plainText,
            words: words,
            lastBoundaryTicks: Math.max(
                markers[markers.length - 1].ticks,
                words[words.length - 1].endTicks
            )
        };
    }

    function prepareEnhancedLyrics(events) {
        if (!Array.isArray(events) || !events.length) {
            return events || [];
        }

        var sorted = events.map(function (event, index) {
            return { event: cloneEvent(event), index: index };
        });

        sorted.sort(function (left, right) {
            var leftTicks = Number(left.event.StartPositionTicks);
            var rightTicks = Number(right.event.StartPositionTicks);
            var leftValid = isFinite(leftTicks);
            var rightValid = isFinite(rightTicks);
            if (leftValid && rightValid && leftTicks !== rightTicks) {
                return leftTicks - rightTicks;
            }
            if (leftValid !== rightValid) {
                return leftValid ? -1 : 1;
            }
            return left.index - right.index;
        });

        var groups = [];
        sorted.forEach(function (entry) {
            var ticks = Number(entry.event.StartPositionTicks);
            var previous = groups.length ? groups[groups.length - 1] : null;
            if (isFinite(ticks) && previous && previous.startTicks === ticks) {
                previous.events.push(entry.event);
            } else {
                groups.push({
                    startTicks: isFinite(ticks) ? ticks : null,
                    events: [entry.event]
                });
            }
        });

        return groups.map(function (group, groupIndex) {
            var item = cloneEvent(group.events[0]);
            if (null == group.startTicks) {
                return item;
            }

            var nextGroup = groupIndex + 1 < groups.length ? groups[groupIndex + 1] : null;
            var nextStartTicks = nextGroup && null != nextGroup.startTicks ? nextGroup.startTicks : null;
            var declaredEndTicks = group.startTicks;
            group.events.forEach(function (event) {
                var endTicks = Number(event.EndPositionTicks);
                if (isFinite(endTicks) && endTicks > declaredEndTicks) {
                    declaredEndTicks = endTicks;
                }
            });

            var fallbackEndTicks = nextStartTicks > group.startTicks
                ? nextStartTicks
                : declaredEndTicks > group.startTicks
                    ? declaredEndTicks
                    : group.startTicks + 5 * TICKS_PER_SECOND;

            var lastBoundaryTicks = group.startTicks;
            var allowOpenEnded = !(nextStartTicks > group.startTicks);
            var sublines = group.events.map(function (event) {
                var parsed = parseEnhancedLine(event.Text, fallbackEndTicks, allowOpenEnded);
                if (parsed) {
                    if (parsed.lastBoundaryTicks > lastBoundaryTicks) {
                        lastBoundaryTicks = parsed.lastBoundaryTicks;
                    }
                    return { text: parsed.text, words: parsed.words };
                }
                return { text: null == event.Text ? "" : String(event.Text), words: null };
            });

            var endPositionTicks = nextStartTicks > group.startTicks
                ? nextStartTicks
                : Math.max(declaredEndTicks, lastBoundaryTicks, fallbackEndTicks);

            item.Id = String(item.Id || "lyrics") + "_elyric_" + groupIndex;
            item.StartPositionTicks = group.startTicks;
            item.EndPositionTicks = endPositionTicks;
            item.Text = sublines.map(function (line) { return line.text; }).join(" · ");
            item.__elyric = {
                startTicks: group.startTicks,
                endTicks: endPositionTicks,
                sublines: sublines
            };
            return item;
        });
    }

    function appendTextWithBreaks(parent, value) {
        var parts = String(value).split(/<br\s*\/?>/gi);
        parts.forEach(function (part, index) {
            if (index) {
                parent.appendChild(document.createElement("br"));
            }
            parent.appendChild(document.createTextNode(part));
        });
    }

    function isKnownTheme(themeId) {
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].id === themeId) {
                return true;
            }
        }
        return false;
    }

    function configValue(source, camelName, pascalName) {
        if (!source) {
            return undefined;
        }
        if (Object.prototype.hasOwnProperty.call(source, camelName)) {
            return source[camelName];
        }
        return source[pascalName];
    }

    function finiteNumber(value, minimum, maximum, fallback) {
        value = Number(value);
        return isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
    }

    function booleanValue(value, fallback) {
        return "boolean" === typeof value ? value : fallback;
    }

    function normalizeColor(value) {
        value = null == value ? "" : String(value).trim();
        if (!/^#[0-9a-f]{6}$/i.test(value)) {
            return "#ffffff";
        }
        return value.toLowerCase();
    }

    function normalizeDisplayConfiguration(source) {
        var defaultTheme = configValue(source, "defaultTheme", "DefaultTheme");
        var fontWeight = finiteNumber(
            configValue(source, "fontWeight", "FontWeight"),
            300,
            900,
            DEFAULT_DISPLAY_CONFIGURATION.fontWeight
        );
        fontWeight = Math.round(fontWeight / 100) * 100;

        return {
            defaultTheme: isKnownTheme(defaultTheme) ? defaultTheme : DEFAULT_DISPLAY_CONFIGURATION.defaultTheme,
            themeSchemaVersion: finiteNumber(
                configValue(source, "themeSchemaVersion", "ThemeSchemaVersion"),
                0,
                PLAYER_THEME_SCHEMA_VERSION,
                DEFAULT_DISPLAY_CONFIGURATION.themeSchemaVersion
            ),
            allowUserThemeOverride: booleanValue(
                configValue(source, "allowUserThemeOverride", "AllowUserThemeOverride"),
                DEFAULT_DISPLAY_CONFIGURATION.allowUserThemeOverride
            ),
            fontSizePercent: finiteNumber(
                configValue(source, "fontSizePercent", "FontSizePercent"),
                70,
                180,
                DEFAULT_DISPLAY_CONFIGURATION.fontSizePercent
            ),
            lineHeight: finiteNumber(
                configValue(source, "lineHeight", "LineHeight"),
                1,
                2,
                DEFAULT_DISPLAY_CONFIGURATION.lineHeight
            ),
            fontWeight: fontWeight,
            useThemeColor: booleanValue(
                configValue(source, "useThemeColor", "UseThemeColor"),
                DEFAULT_DISPLAY_CONFIGURATION.useThemeColor
            ),
            highlightColor: normalizeColor(configValue(source, "highlightColor", "HighlightColor")),
            pendingOpacity: finiteNumber(
                configValue(source, "pendingOpacity", "PendingOpacity"),
                .1,
                .9,
                DEFAULT_DISPLAY_CONFIGURATION.pendingOpacity
            ),
            glowStrength: finiteNumber(
                configValue(source, "glowStrength", "GlowStrength"),
                0,
                1,
                DEFAULT_DISPLAY_CONFIGURATION.glowStrength
            ),
            currentLineScale: finiteNumber(
                configValue(source, "currentLineScale", "CurrentLineScale"),
                1,
                1.25,
                DEFAULT_DISPLAY_CONFIGURATION.currentLineScale
            ),
            otherLinesOpacity: finiteNumber(
                configValue(source, "otherLinesOpacity", "OtherLinesOpacity"),
                .1,
                1,
                DEFAULT_DISPLAY_CONFIGURATION.otherLinesOpacity
            ),
            otherLinesBlurPixels: finiteNumber(
                configValue(source, "otherLinesBlurPixels", "OtherLinesBlurPixels"),
                0,
                4,
                DEFAULT_DISPLAY_CONFIGURATION.otherLinesBlurPixels
            ),
            showSecondLine: booleanValue(
                configValue(source, "showSecondLine", "ShowSecondLine"),
                DEFAULT_DISPLAY_CONFIGURATION.showSecondLine
            ),
            showThirdAndLaterLines: booleanValue(
                configValue(source, "showThirdAndLaterLines", "ShowThirdAndLaterLines"),
                DEFAULT_DISPLAY_CONFIGURATION.showThirdAndLaterLines
            )
        };
    }

    function activeApiClient(renderer) {
        if (renderer && renderer.__elyricActiveApiClient) {
            return renderer.__elyricActiveApiClient;
        }
        if (renderer
            && renderer.currentItem
            && "undefined" !== typeof _connectionmanager
            && _connectionmanager
            && _connectionmanager.default
            && _connectionmanager.default.getApiClient) {
            var connectedClient = _connectionmanager.default.getApiClient(renderer.currentItem);
            if (connectedClient && connectedClient.getJSON) {
                renderer.__elyricActiveApiClient = connectedClient;
                return connectedClient;
            }
        }
        if ("undefined" !== typeof ApiClient && ApiClient && ApiClient.getJSON) {
            if (renderer) {
                renderer.__elyricActiveApiClient = ApiClient;
            }
            return ApiClient;
        }
        if ("undefined" !== typeof window && window.ApiClient && window.ApiClient.getJSON) {
            if (renderer) {
                renderer.__elyricActiveApiClient = window.ApiClient;
            }
            return window.ApiClient;
        }
        return null;
    }

    function createPlaybackBridge(videoOsd) {
        var manager = _playbackmanager && _playbackmanager.default;
        if (!manager || !manager.getCurrentPlayer || !manager.getPlayerState) {
            throw new Error("Emby playback manager is unavailable");
        }
        var destroyed = false;
        function player() { return manager.getCurrentPlayer() || videoOsd.currentPlayer; }
        function call(name) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (destroyed || "function" !== typeof manager[name]) {
                return Promise.reject(new Error("Unsupported playback capability: " + name));
            }
            return Promise.resolve(manager[name].apply(manager, args));
        }
        function castTargetId(target, index) {
            return String(target && (target.id || target.Id || target.deviceId || target.DeviceId
                || target.playerName || target.PlayerName) || "cast-target-" + String(index || 0));
        }
        function normalizeCastTarget(target, index) {
            target = target || {};
            return {
                id: castTargetId(target, index),
                name: String(target.name || target.Name || target.deviceName || target.DeviceName
                    || target.playerName || target.PlayerName || "Emby 播放设备"),
                playerName: String(target.playerName || target.PlayerName || target.name || target.Name || ""),
                local: !!(target.isLocalPlayer || target.IsLocalPlayer || target.local),
                raw: target
            };
        }
        var bridge = {
            capabilities: {},
            getSnapshot: function () {
                var currentPlayer = player();
                var state = currentPlayer ? manager.getPlayerState(currentPlayer) : { PlayState: {} };
                var playState = state && state.PlayState || {};
                var currentItem = manager.currentItem ? manager.currentItem(currentPlayer) : null;
                return {
                    player: currentPlayer,
                    item: currentItem || state && state.NowPlayingItem || null,
                    positionTicks: Number(playState.PositionTicks) || 0,
                    runtimeTicks: Number(state && state.NowPlayingItem && state.NowPlayingItem.RunTimeTicks)
                        || Number(currentItem && currentItem.RunTimeTicks) || 0,
                    paused: !!playState.IsPaused,
                    muted: !!playState.IsMuted,
                    volume: Number(playState.VolumeLevel) || 0,
                    shuffle: manager.getShuffle ? !!manager.getShuffle(currentPlayer) : false,
                    repeatMode: manager.getRepeatMode ? manager.getRepeatMode(currentPlayer) : "RepeatNone",
                    playlistItemId: state && state.PlaylistItemId || null,
                    playlistIndex: Number(state && state.PlaylistIndex),
                    playlistLength: Number(state && state.PlaylistLength) || 0
                };
            },
            subscribe: function (listener) {
                var eventNames = ["timeupdate", "playbackstart", "playbackstop", "pause", "unpause", "volumechange",
                    "shufflechange", "repeatmodechange", "playlistitemadd", "playlistitemremove", "playlistitemmove"];
                var boundPlayer = player();
                var handler = function () { if (!destroyed) { listener(bridge.getSnapshot()); } };
                var bindPlayer = function (nextPlayer) {
                    if (!_events || !_events.default || !_events.default.on || nextPlayer === boundPlayer) { return; }
                    if (boundPlayer && _events.default.off) {
                        eventNames.forEach(function (name) { _events.default.off(boundPlayer, name, handler); });
                    }
                    boundPlayer = nextPlayer;
                    if (boundPlayer) {
                        eventNames.forEach(function (name) { _events.default.on(boundPlayer, name, handler); });
                    }
                };
                var playerChangeHandler = function () {
                    bindPlayer(player());
                    handler();
                };
                if (_events && _events.default && _events.default.on) {
                    eventNames.forEach(function (name) {
                        _events.default.on(manager, name, handler);
                        if (boundPlayer) { _events.default.on(boundPlayer, name, handler); }
                    });
                    _events.default.on(manager, "playerchange", playerChangeHandler);
                }
                return function () {
                    if (_events && _events.default && _events.default.off) {
                        eventNames.forEach(function (name) {
                            _events.default.off(manager, name, handler);
                            if (boundPlayer) { _events.default.off(boundPlayer, name, handler); }
                        });
                        _events.default.off(manager, "playerchange", playerChangeHandler);
                    }
                };
            },
            seek: function (ticks) { return call("seek", Math.max(0, Number(ticks) || 0), player()); },
            playPause: function () { return call("playPause", player()); },
            previous: function () { return call("previousTrack", player()); },
            next: function () { return call("nextTrack", player()); },
            stop: function () { return call("stop", player()); },
            setVolume: function (value) { return call("setVolume", Math.max(0, Math.min(100, Number(value) || 0)), player()); },
            toggleMute: function () { return call("toggleMute", player()); },
            setShuffle: function (value) { return call("setShuffle", !!value, player()); },
            setRepeatMode: function (value) { return call("setRepeatMode", value, player()); },
            getQueue: function () { return call("getPlaylist", {}, player()); },
            playQueueItem: function (id) { return call("setCurrentPlaylistItem", id, player()); },
            removeQueueItems: function (ids) { return call("removeFromPlaylist", ids, player()); },
            moveQueueItem: function (id, index) { return call("movePlaylistItem", id, index, player()); },
            goBack: function () {
                if (_approuter && _approuter.default && _approuter.default.back) {
                    return Promise.resolve(_approuter.default.back());
                }
                return Promise.reject(new Error("Emby router is unavailable"));
            },
            getCastTargets: function () {
                if ("function" !== typeof manager.getTargets) { return Promise.resolve([]); }
                return Promise.resolve(manager.getTargets()).then(function (result) {
                    var targets = Array.isArray(result) ? result : result && (result.Items || result.Targets) || [];
                    return targets.map(normalizeCastTarget);
                });
            },
            getActiveCastTarget: function () {
                var current = player();
                var info = "function" === typeof manager.getPlayerInfo ? manager.getPlayerInfo(current) : null;
                var target = info && (info.target || info.Target || info) || current;
                return target ? normalizeCastTarget(target, 0) : null;
            },
            selectCastTarget: function (targetId) {
                if ("function" !== typeof manager.getTargets || "function" !== typeof manager.trySetActivePlayer) {
                    return Promise.reject(new Error("Emby 设备切换不可用"));
                }
                return bridge.getCastTargets().then(function (targets) {
                    var target = targets.filter(function (entry) { return entry.id === String(targetId); })[0];
                    if (!target) { throw new Error("播放设备已离线"); }
                    return manager.trySetActivePlayer(target.playerName, target.raw);
                });
            },
            selectLocalTarget: function () {
                return "function" === typeof manager.setDefaultPlayerActive
                    ? Promise.resolve(manager.setDefaultPlayerActive())
                    : Promise.reject(new Error("本机播放器切换不可用"));
            },
            canEndCurrentSession: function () {
                var current = player();
                if (!current || "function" !== typeof current.endSession) { return false; }
                var commands = "function" === typeof current.getSupportedCommands
                    ? current.getSupportedCommands() || [] : [];
                return !commands.length || commands.indexOf("EndSession") >= 0;
            },
            endCurrentSession: function () {
                var current = player();
                return current && "function" === typeof current.endSession
                    ? Promise.resolve(current.endSession())
                    : Promise.reject(new Error("当前会话不支持结束"));
            },
            subscribeCastTargets: function (listener) {
                if (!_events || !_events.default || !_events.default.on) { return function () {}; }
                var handler = function () { if (!destroyed) { listener(); } };
                ["playerchange", "availableplayerschanged"].forEach(function (name) {
                    _events.default.on(manager, name, handler);
                });
                return function () {
                    if (_events.default.off) {
                        ["playerchange", "availableplayerschanged"].forEach(function (name) {
                            _events.default.off(manager, name, handler);
                        });
                    }
                };
            },
            destroy: function () { destroyed = true; }
        };
        var managerCapabilities = {
            seek: "seek", playPause: "playPause", previous: "previousTrack", next: "nextTrack", stop: "stop",
            setVolume: "setVolume", toggleMute: "toggleMute", setShuffle: "setShuffle",
            setRepeatMode: "setRepeatMode", getQueue: "getPlaylist", playQueueItem: "setCurrentPlaylistItem",
            removeQueueItems: "removeFromPlaylist", moveQueueItem: "movePlaylistItem"
        };
        Object.keys(managerCapabilities).forEach(function (name) {
            bridge.capabilities[name] = "function" === typeof manager[managerCapabilities[name]];
        });
        bridge.capabilities.goBack = !!(_approuter && _approuter.default && _approuter.default.back);
        bridge.capabilities.cast = "function" === typeof manager.getTargets
            && "function" === typeof manager.trySetActivePlayer;
        bridge.capabilities.selectLocalTarget = "function" === typeof manager.setDefaultPlayerActive;
        return bridge;
    }

    function requestServerConfiguration(renderer) {
        if (serverConfigurationPromise) {
            return serverConfigurationPromise;
        }
        var apiClient = activeApiClient(renderer);
        if (!apiClient) {
            return null;
        }

        try {
            var url = apiClient.getUrl
                ? apiClient.getUrl(PUBLIC_CONFIGURATION_PATH)
                : PUBLIC_CONFIGURATION_PATH;
            serverConfigurationPromise = Promise.resolve(apiClient.getJSON(url)).then(
                normalizeDisplayConfiguration,
                function () { return normalizeDisplayConfiguration(null); }
            );
        } catch (error) {
            serverConfigurationPromise = Promise.resolve(normalizeDisplayConfiguration(null));
        }
        return serverConfigurationPromise;
    }

    function playerTuningDefinition(settingId) {
        for (var i = 0; i < PLAYER_TUNING_DEFINITIONS.length; i++) {
            if (PLAYER_TUNING_DEFINITIONS[i].id === settingId) {
                return PLAYER_TUNING_DEFINITIONS[i];
            }
        }
        return null;
    }

    function normalizePlayerTuningValue(definition, value) {
        value = Number(value);
        if (!isFinite(value)) {
            value = definition.fallback;
        }
        value = Math.min(definition.maximum, Math.max(definition.minimum, value));
        return Math.round(value / definition.step) * definition.step;
    }

    function loadStoredPlayerTuning(settingId) {
        var definition = playerTuningDefinition(settingId);
        if (!definition) {
            return 0;
        }
        try {
            if ("undefined" !== typeof localStorage) {
                var storedValue = localStorage.getItem(definition.storageKey);
                if (null === storedValue || "" === storedValue) {
                    return definition.fallback;
                }
                return normalizePlayerTuningValue(
                    definition,
                    storedValue
                );
            }
        } catch (error) {
            // Use the physically balanced default when browser storage is unavailable.
        }
        return definition.fallback;
    }

    function storePlayerTuning(settingId, value) {
        var definition = playerTuningDefinition(settingId);
        if (!definition) {
            return;
        }
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(definition.storageKey, String(value));
            }
        } catch (error) {
            // The current player still reflects the adjustment for this session.
        }
    }

    function shallowCopy(source) {
        var copy = {};
        source = source && "object" === typeof source ? source : {};
        Object.keys(source).forEach(function (key) { copy[key] = source[key]; });
        return copy;
    }

    function mergeThemeValues(target, source) {
        target = target || {};
        source = source && "object" === typeof source ? source : {};
        Object.keys(source).forEach(function (key) { target[key] = source[key]; });
        return target;
    }

    function themeColorDefinition(colorId) {
        for (var i = 0; i < PLAYER_THEME_COLOR_DEFINITIONS.length; i++) {
            if (PLAYER_THEME_COLOR_DEFINITIONS[i].id === colorId) {
                return PLAYER_THEME_COLOR_DEFINITIONS[i];
            }
        }
        return null;
    }

    function defaultPlayerThemeChoices() {
        return {
            artworkMode: "single",
            artworkMaterial: "plain",
            controlMaterial: "glass",
            metadataAnchor: "start",
            metadataAlign: "left",
            metadataSurface: "none",
            lyricsSurface: "none",
            mediaSurface: "glass"
        };
    }

    function normalizePlayerThemeChoices(source) {
        source = source && "object" === typeof source ? source : {};
        var fallback = defaultPlayerThemeChoices();
        return {
            artworkMode: knownChoice(PLAYER_ARTWORK_MODES, source.artworkMode, fallback.artworkMode),
            artworkMaterial: knownChoice(PLAYER_ARTWORK_MATERIALS, source.artworkMaterial, fallback.artworkMaterial),
            controlMaterial: knownChoice(PLAYER_CONTROL_MATERIALS, source.controlMaterial, fallback.controlMaterial),
            metadataAnchor: knownChoice(PLAYER_METADATA_ANCHORS, source.metadataAnchor, fallback.metadataAnchor),
            metadataAlign: knownChoice(LYRIC_ALIGNMENTS, source.metadataAlign, fallback.metadataAlign),
            metadataSurface: knownChoice(PLAYER_SURFACE_STYLES, source.metadataSurface, fallback.metadataSurface),
            lyricsSurface: knownChoice(PLAYER_SURFACE_STYLES, source.lyricsSurface, fallback.lyricsSurface),
            mediaSurface: knownChoice(PLAYER_SURFACE_STYLES, source.mediaSurface, fallback.mediaSurface)
        };
    }

    function defaultPlayerThemeColors() {
        var colors = {};
        PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
            colors[definition.id] = definition.fallback;
        });
        return colors;
    }

    function normalizePlayerThemeColors(source) {
        source = source && "object" === typeof source ? source : {};
        var colors = {};
        PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
            colors[definition.id] = normalizeHexColor(source[definition.id], definition.fallback);
        });
        return colors;
    }

    function defaultPlayerMediaFields() {
        return { overview: true, file: true, audio: true, image: false, lyrics: false };
    }

    function normalizePlayerMediaFields(source) {
        source = source && "object" === typeof source ? source : {};
        var fallback = defaultPlayerMediaFields();
        var fields = {};
        PLAYER_MEDIA_FIELDS.forEach(function (field) {
            fields[field.id] = "boolean" === typeof source[field.id]
                ? source[field.id]
                : fallback[field.id];
        });
        if (!Object.keys(fields).some(function (fieldId) { return fields[fieldId]; })) {
            fields.overview = true;
        }
        return fields;
    }

    function normalizePlayerThemeTuning(source) {
        source = source && "object" === typeof source ? source : {};
        var tuning = {};
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            tuning[definition.id] = normalizePlayerTuningValue(
                definition,
                Object.prototype.hasOwnProperty.call(source, definition.id)
                    ? source[definition.id]
                    : definition.fallback
            );
        });
        return tuning;
    }

    function normalizePlayerThemeName(value, fallback) {
        value = String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
        if (!value) {
            value = fallback || "我的主题";
        }
        return value.slice(0, 32);
    }

    function normalizeSavedPlayerTheme(source, index) {
        if (!source || "object" !== typeof source) {
            return null;
        }
        if (PLAYER_THEME_DOCUMENT_FORMAT === source.format
            && [3, 4, 5, 6].indexOf(Number(source.schemaVersion)) >= 0
            && !source.v2) {
            source = playerThemeInternalFromV3Document(source, index);
        }
        var id = String(source.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 48);
        if (!id) {
            id = "user-theme-" + String(index || 0);
        }
        var baseLayout = isKnownPlayerLayout(source.baseTheme || source.baseLayout)
            && "custom" !== (source.baseTheme || source.baseLayout)
            ? (source.baseTheme || source.baseLayout)
            : "album";
        var theme = {
            format: PLAYER_THEME_DOCUMENT_FORMAT,
            schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
            id: id,
            name: normalizePlayerThemeName(source.name, "我的主题 " + (Number(index || 0) + 1)),
            baseLayout: baseLayout,
            tuning: normalizePlayerThemeTuning(source.tuning),
            choices: normalizePlayerThemeChoices(source.choices),
            colors: normalizePlayerThemeColors(source.colors),
            mediaFields: normalizePlayerMediaFields(source.mediaFields),
            player: source.player && "object" === typeof source.player ? shallowCopy(source.player) : {},
            v2: source.v2 && "object" === typeof source.v2
                ? normalizePlayerThemeV2State(source.v2, baseLayout)
                : null,
            revision: isFinite(Number(source.revision))
                ? Math.max(0, Math.round(Number(source.revision)))
                : 0,
            updatedAt: isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now()
        };
        return theme.v2 ? normalizeRegisteredPlayerThemeV2Snapshot(theme) : theme;
    }

    function assignThemeSectionValues(target, source, mapping) {
        source = source && "object" === typeof source ? source : {};
        Object.keys(mapping).forEach(function (sourceKey) {
            if (Object.prototype.hasOwnProperty.call(source, sourceKey)) {
                target[mapping[sourceKey]] = source[sourceKey];
            }
        });
    }

    function playerThemeInternalFromV3Document(source, index) {
        source = source && "object" === typeof source ? source : {};
        if (Number(source.schemaVersion) < 4) {
            rememberPlayerThemeV3MigrationBackup(source);
        }
        var background = source.background || {};
        var artwork = source.artwork || {};
        var metadata = source.metadata || {};
        var lyrics = source.lyrics || {};
        var visualizer = source.visualizer || {};
        var consoleStyle = source.console || {};
        var mediaCard = source.mediaCard || source.overlays || {};
        var tuning = {};
        assignThemeSectionValues(tuning, background, {
            blur: "backgroundBlur", dim: "backgroundDim",
            saturation: "backgroundSaturation", angle: "backgroundAngle"
        });
        assignThemeSectionValues(tuning, artwork, {
            scale: "artworkScale", size: "artworkSize", x: "artworkX", y: "artworkY",
            innerSize: "artworkInnerSize", outerRadius: "artworkOuterRadius",
            innerRadius: "artworkInnerRadius", padding: "artworkPadding",
            borderWidth: "artworkBorderWidth", shadowDepth: "artworkShadowDepth",
            coverflowWidth: "coverflowWidth", coverflowHeight: "coverflowHeight"
        });
        assignThemeSectionValues(tuning, metadata, {
            width: "metadataWidth", x: "metadataX", y: "metadataY",
            titleSize: "metadataTitleSize", artistSize: "metadataArtistSize",
            albumSize: "metadataAlbumSize", letterSpacing: "metadataLetterSpacing",
            padding: "metadataPadding", radius: "metadataRadius",
            blur: "metadataBlur", opacity: "metadataOpacity"
        });
        assignThemeSectionValues(tuning, lyrics, {
            width: "lyricsWidth", height: "lyricsHeight", x: "lyricsX", y: "lyricsY",
            lineHeight: "lyricLineGap", inactiveOpacity: "lyricInactiveOpacity",
            padding: "lyricsPadding", radius: "lyricsRadius", blur: "lyricsBlur",
            opacity: "lyricsOpacity", letterSpacing: "lyricLetterSpacing",
            pastSize: "lyricPastSize", currentSize: "lyricCurrentSize",
            futureSize: "lyricFutureSize", currentWeight: "lyricCurrentWeight"
        });
        assignThemeSectionValues(tuning, visualizer, {
            x: "visualizerX", y: "visualizerY", rotation: "visualizerRotation",
            opacity: "visualizerOpacity"
        });
        assignThemeSectionValues(tuning, consoleStyle, {
            progressWidth: "progressWidth", progressHeight: "progressTrackHeight",
            progressThumbSize: "progressThumbSize", volumeWidth: "volumeWidth",
            volumeHeight: "volumeTrackHeight", volumeThumbSize: "volumeThumbSize",
            blur: "consoleBlur", opacity: "consoleOpacity"
        });
        assignThemeSectionValues(tuning, mediaCard, {
            width: "mediaWidth", maxHeight: "mediaMaxHeight", radius: "mediaRadius",
            blur: "mediaBlur", opacity: "mediaOpacity"
        });

        var colors = {
            backgroundA: background.colorA, backgroundB: background.colorB,
            artworkFrame: artwork.frameColor, metadataText: metadata.textColor,
            metadataSurface: metadata.surfaceColor, lyricsSurface: lyrics.surfaceColor,
            lyricPast: lyrics.pastColor, lyricCurrent: lyrics.currentColor,
            lyricFuture: lyrics.futureColor, progressActive: consoleStyle.progressActive,
            progressTrack: consoleStyle.progressTrack, volumeActive: consoleStyle.volumeActive,
            volumeTrack: consoleStyle.volumeTrack, mediaSurface: mediaCard.surfaceColor
        };
        Object.keys(colors).forEach(function (key) {
            if (null == colors[key]) { delete colors[key]; }
        });
        var choices = {
            artworkMode: artwork.mode, artworkMaterial: artwork.material,
            controlMaterial: consoleStyle.material, metadataAnchor: metadata.anchor,
            metadataAlign: metadata.align, metadataSurface: metadata.surface,
            lyricsSurface: lyrics.surface, mediaSurface: mediaCard.surface
        };
        Object.keys(choices).forEach(function (key) {
            if (null == choices[key]) { delete choices[key]; }
        });
        var player = {
            theme: lyrics.style, backgroundMode: background.mode,
            visualizerStyle: visualizer.style, visualizerWidth: visualizer.width,
            visualizerHeight: visualizer.height, visualizerAmplitude: visualizer.amplitude,
            visualizerColorMode: visualizer.colorMode, visualizerColors: visualizer.colors,
            lyricAlignment: lyrics.alignment, lyricScale: lyrics.scale,
            artworkRotation: artwork.rotation
        };
        Object.keys(player).forEach(function (key) {
            if (null == player[key]) { delete player[key]; }
        });
        var migratedState = builtInPlayerThemeV4State(source.baseTheme || "album", null);
        if (Number(source.schemaVersion) >= 4) {
            migratedState.layouts = Number(source.schemaVersion) >= 5
                && PLAYER_THEME_LAYOUT_MODEL === source.layoutModel
                ? clonePlayerThemeV2Value(source.layouts || migratedState.layouts)
                : {
                    landscape: playerThemeV5LayoutFromV4(
                        source.layouts && source.layouts.landscape, false, migratedState.layouts.landscape, true
                    ),
                    portrait: playerThemeV5LayoutFromV4(
                        source.layouts && source.layouts.portrait, true, migratedState.layouts.portrait, true
                    )
                };
        }
        migratedState.artwork = {
            source: artwork.source || "emby", url: artwork.url || "",
            assetId: artwork.assetId || "", fit: artwork.fit || "cover",
            focusX: null == artwork.focusX ? 50 : artwork.focusX,
            focusY: null == artwork.focusY ? 50 : artwork.focusY,
            clipPath: artwork.clipPath || "none"
        };
        migratedState.typography = lyrics.typography || defaultPlayerThemeV2Typography();
        migratedState.lyrics = {
            showSecondLine: false !== lyrics.showSecondLine,
            showThirdAndLaterLines: false !== lyrics.showThirdAndLaterLines,
            followDelayMs: lyrics.followDelayMs || LYRIC_FOLLOW_IDLE_MS
        };
        migratedState.visualizer = {
            frequencyLayout: visualizer.frequencyLayout || "centerOut",
            analysis: visualizer.analysis || {}
        };
        migratedState.popupStyle = {
            surfaceOpacity: null == mediaCard.popupOpacity ? 100 : mediaCard.popupOpacity,
            radius: null == mediaCard.popupRadius ? 24 : mediaCard.popupRadius
        };
        migratedState.controls = normalizePlayerControlDock(source.controls || {
            safeArea: consoleStyle.safeArea || 64
        });
        migratedState.viewport = normalizeThemeV6Section(source.viewport, migratedState.viewport);
        migratedState.metadata = normalizeThemeV6Section({ summaryFields: metadata.summaryFields }, migratedState.metadata);
        migratedState.systemChrome = normalizeThemeV6Section(source.systemChrome, migratedState.systemChrome);
        migratedState.overlays = normalizeThemeV6Section(source.overlays || {
            surface: mediaCard.surface, surfaceColor: mediaCard.surfaceColor,
            radius: mediaCard.popupRadius, blur: mediaCard.blur, opacity: mediaCard.popupOpacity
        }, migratedState.overlays);
        migratedState.console = normalizeThemeV6Section(consoleStyle, migratedState.console);
        migratedState.volume = normalizeThemeV6Section(source.volume, migratedState.volume);
        return {
            format: PLAYER_THEME_DOCUMENT_FORMAT,
            schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
            id: source.id || "imported-theme-" + String(index || 0),
            name: source.name || "导入主题",
            baseLayout: source.baseTheme || "album",
            tuning: tuning,
            choices: choices,
            colors: colors,
            mediaFields: source.mediaFields || {},
            player: player,
            v2: migratedState
        };
    }

    function portablePlayerThemeV5(theme, includePrivateAssets) {
        var state = normalizePlayerThemeV2State(theme.v2 || defaultPlayerThemeV2State());
        var tuning = theme.tuning || {};
        var choices = theme.choices || {};
        var colors = theme.colors || {};
        var player = theme.player || {};
        var artworkSource = clonePlayerThemeV2Value(state.artwork);
        var typography = clonePlayerThemeV2Value(state.typography);
        if (!includePrivateAssets) {
            if ("asset" === artworkSource.source || artworkSource.assetId) {
                artworkSource.source = "emby";
                artworkSource.assetId = "";
            }
            ["primary", "secondary", "tertiary"].forEach(function (lineId) {
                if (!typography[lineId]) { return; }
                if (typography[lineId].fontAssetId && !typography[lineId].fontUrl) {
                    typography[lineId].fontFamily = "inherit";
                }
                typography[lineId].fontAssetId = "";
            });
        }
        return {
            format: PLAYER_THEME_DOCUMENT_FORMAT,
            schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
            layoutModel: PLAYER_THEME_LAYOUT_MODEL,
            name: normalizePlayerThemeName(theme.name, "导出主题"),
            baseTheme: theme.baseLayout || "album",
            layouts: clonePlayerThemeV2Value(state.layouts),
            viewport: clonePlayerThemeV2Value(state.viewport),
            controls: clonePlayerThemeV2Value(state.controls),
            systemChrome: clonePlayerThemeV2Value(state.systemChrome),
            overlays: clonePlayerThemeV2Value(state.overlays),
            volume: clonePlayerThemeV2Value(state.volume),
            background: {
                mode: player.backgroundMode || "blur", blur: tuning.backgroundBlur,
                dim: tuning.backgroundDim, saturation: tuning.backgroundSaturation,
                angle: tuning.backgroundAngle, colorA: colors.backgroundA,
                colorB: colors.backgroundB
            },
            artwork: Object.assign(artworkSource, {
                mode: choices.artworkMode, material: choices.artworkMaterial,
                rotation: false !== player.artworkRotation,
                scale: tuning.artworkScale, innerSize: tuning.artworkInnerSize,
                outerRadius: tuning.artworkOuterRadius, innerRadius: tuning.artworkInnerRadius,
                padding: tuning.artworkPadding, borderWidth: tuning.artworkBorderWidth,
                shadowDepth: tuning.artworkShadowDepth, coverflowWidth: tuning.coverflowWidth,
                coverflowHeight: tuning.coverflowHeight, frameColor: colors.artworkFrame
            }),
            metadata: {
                anchor: choices.metadataAnchor, align: choices.metadataAlign,
                surface: choices.metadataSurface, titleSize: tuning.metadataTitleSize,
                artistSize: tuning.metadataArtistSize, albumSize: tuning.metadataAlbumSize,
                letterSpacing: tuning.metadataLetterSpacing, padding: tuning.metadataPadding,
                radius: tuning.metadataRadius, blur: tuning.metadataBlur,
                opacity: tuning.metadataOpacity, textColor: colors.metadataText,
                surfaceColor: colors.metadataSurface,
                summaryFields: clonePlayerThemeV2Value(state.metadata.summaryFields)
            },
            lyrics: {
                style: player.theme || "classic", alignment: player.lyricAlignment || "left",
                scale: player.lyricScale || 100, surface: choices.lyricsSurface,
                lineHeight: tuning.lyricLineGap,
                inactiveOpacity: tuning.lyricInactiveOpacity, padding: tuning.lyricsPadding,
                radius: tuning.lyricsRadius, blur: tuning.lyricsBlur,
                opacity: tuning.lyricsOpacity, letterSpacing: tuning.lyricLetterSpacing,
                pastSize: tuning.lyricPastSize, currentSize: tuning.lyricCurrentSize,
                futureSize: tuning.lyricFutureSize, currentWeight: tuning.lyricCurrentWeight,
                pastColor: colors.lyricPast, currentColor: colors.lyricCurrent,
                futureColor: colors.lyricFuture, surfaceColor: colors.lyricsSurface,
                showSecondLine: state.lyrics.showSecondLine,
                showThirdAndLaterLines: state.lyrics.showThirdAndLaterLines,
                followDelayMs: state.lyrics.followDelayMs,
                typography: typography
            },
            visualizer: {
                style: player.visualizerStyle || "spectrum",
                frequencyLayout: state.visualizer.frequencyLayout || "centerOut",
                width: player.visualizerWidth || 62, height: player.visualizerHeight || 8,
                amplitude: player.visualizerAmplitude || 70,
                colorMode: player.visualizerColorMode || "dual",
                colors: (player.visualizerColors || ["#a8e063", "#56d6c9", "#8b9dff"]).slice(0, 8),
                analysis: clonePlayerThemeV2Value(state.visualizer.analysis)
            },
            console: {
                material: state.console.material || choices.controlMaterial,
                surfaceColor: state.console.surfaceColor,
                textColor: state.console.textColor, accentColor: state.console.accentColor,
                gradientA: state.console.gradientA, gradientB: state.console.gradientB,
                gradientAngle: state.console.gradientAngle, radius: state.console.radius,
                borderWidth: state.console.borderWidth, shadow: state.console.shadow,
                progressHeight: tuning.progressTrackHeight,
                progressThumbSize: tuning.progressThumbSize,
                volumeHeight: tuning.volumeTrackHeight, volumeThumbSize: tuning.volumeThumbSize,
                blur: tuning.consoleBlur, opacity: tuning.consoleOpacity,
                progressActive: colors.progressActive, progressTrack: colors.progressTrack,
                volumeActive: colors.volumeActive, volumeTrack: colors.volumeTrack,
                safeArea: state.controls.safeArea
            },
            mediaCard: {
                surface: choices.mediaSurface, width: tuning.mediaWidth,
                maxHeight: tuning.mediaMaxHeight, radius: tuning.mediaRadius,
                blur: tuning.mediaBlur, opacity: tuning.mediaOpacity,
                surfaceColor: colors.mediaSurface,
                popupOpacity: state.popupStyle.surfaceOpacity,
                popupRadius: state.popupStyle.radius
            },
            mediaFields: clonePlayerThemeV2Value(theme.mediaFields || defaultPlayerMediaFields())
        };
    }

    if ("undefined" !== typeof window) {
        window.__elyricPlayerThemeV6Fixtures = PLAYER_LAYOUTS.filter(function (layout) {
            return "custom" !== layout.id;
        }).map(function (layout) {
            return portablePlayerThemeV5(resolvedBuiltInPlayerTheme(layout.id), false);
        });
        window.__elyricPortablePlayerThemeV6 = function (theme) {
            return portablePlayerThemeV5(theme, false);
        };
        window.__elyricPlayerThemeV6LayoutIsSafe = playerThemeV5LayoutIsSafe;
        window.__elyricPlayerThemeV5Fixtures = window.__elyricPlayerThemeV6Fixtures;
        window.__elyricPortablePlayerThemeV5 = window.__elyricPortablePlayerThemeV6;
        window.__elyricPlayerThemeV5LayoutIsSafe = window.__elyricPlayerThemeV6LayoutIsSafe;
        window.__elyricValidatePortablePlayerThemeV3 = validatePortablePlayerThemeV3Document;
        // Compatibility aliases for older test harnesses and exported tooling.
        window.__elyricPlayerThemeV4Fixtures = window.__elyricPlayerThemeV5Fixtures;
        window.__elyricPortablePlayerThemeV4 = window.__elyricPortablePlayerThemeV5;
    }

    function loadStoredPlayerThemes(renderer, legacy) {
        try {
            if ("undefined" !== typeof localStorage) {
                var key = legacy ? PLAYER_THEME_LIBRARY_STORAGE_KEY
                    : playerThemeV2ScopedKey(PLAYER_THEME_LIBRARY_STORAGE_KEY, renderer);
                var serialized = localStorage.getItem(key);
                var parsed = serialized ? JSON.parse(serialized) : [];
                if (Array.isArray(parsed)) {
                    return parsed.map(normalizeSavedPlayerTheme).filter(Boolean);
                }
            }
        } catch (error) {
            // A damaged user theme library must never prevent the playback page from opening.
        }
        return [];
    }

    function storePlayerThemeLibrary(renderer) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(
                    playerThemeV2ScopedKey(PLAYER_THEME_LIBRARY_STORAGE_KEY, renderer),
                    JSON.stringify(renderer.__elyricUserPlayerThemes || [])
                );
            }
        } catch (error) {
            // The in-memory theme remains usable when storage is unavailable.
        }
    }

    function ensurePlayerThemeLibrary(renderer) {
        if (!renderer.__elyricUserPlayerThemes) {
            // Theme summaries are populated by UserWorkspace/Themes (or its
            // confirmed account-scoped cache), never by an unconfirmed local
            // browser library during startup.
            renderer.__elyricUserPlayerThemes = [];
        }
        if (!renderer.__elyricPlayerThemeColors) {
            renderer.__elyricPlayerThemeColors = defaultPlayerThemeColors();
        }
        if (!renderer.__elyricPlayerThemeChoices) {
            renderer.__elyricPlayerThemeChoices = defaultPlayerThemeChoices();
        }
        if (!renderer.__elyricMediaFields) {
            renderer.__elyricMediaFields = defaultPlayerMediaFields();
        }
    }

    function activeUserPlayerTheme(renderer) {
        ensurePlayerThemeLibrary(renderer);
        for (var i = 0; i < renderer.__elyricUserPlayerThemes.length; i++) {
            if (renderer.__elyricUserPlayerThemes[i].id === renderer.__elyricActiveUserPlayerThemeId) {
                return renderer.__elyricUserPlayerThemes[i];
            }
        }
        return null;
    }

    function collectCurrentPlayerTheme(renderer, name, id) {
        ensurePlayerThemeLibrary(renderer);
        var tuning = {};
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            tuning[definition.id] = renderer.__elyricPlayerTuning
                && isFinite(Number(renderer.__elyricPlayerTuning[definition.id]))
                ? Number(renderer.__elyricPlayerTuning[definition.id])
                : definition.fallback;
        });
        return normalizeSavedPlayerTheme({
            id: id || "draft",
            name: name || "未命名主题",
            baseLayout: "custom" === renderer.__elyricPlayerLayout
                ? renderer.__elyricThemeBaseLayout || "album"
                : renderer.__elyricPlayerLayout || "album",
            tuning: tuning,
            choices: renderer.__elyricPlayerThemeChoices,
            colors: renderer.__elyricPlayerThemeColors,
            mediaFields: renderer.__elyricMediaFields,
            player: {
                theme: renderer.__elyricTheme || "classic",
                backgroundMode: renderer.__elyricBackgroundMode || "blur",
                visualizerStyle: renderer.__elyricVisualizerStyle || "spectrum",
                visualizerWidth: renderer.__elyricVisualizerWidth || 62,
                visualizerHeight: renderer.__elyricVisualizerHeight || 8,
                visualizerAmplitude: renderer.__elyricVisualizerAmplitude || 70,
                visualizerColorMode: renderer.__elyricVisualizerColorMode || "dual",
                visualizerColors: (renderer.__elyricVisualizerColors || ["#a8e063", "#56d6c9", "#8b9dff"]).slice(0, 3),
                lyricAlignment: renderer.__elyricLyricAlignment || "left",
                lyricScale: renderer.__elyricLyricScale || 100,
                artworkRotation: false !== renderer.__elyricArtworkRotation
            },
            v2: collectPlayerThemeV2State(renderer),
            updatedAt: Date.now()
        }, 0);
    }

    function storeCurrentPlayerThemeDesign(renderer) {
        if (!renderer || !renderer.__elyricThemeControl) {
            return;
        }
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(
                    playerThemeV2ScopedKey(PLAYER_THEME_DESIGN_STORAGE_KEY, renderer),
                    JSON.stringify(collectCurrentPlayerTheme(renderer, "当前设计", "draft"))
                );
            }
        } catch (error) {
            // Live editing remains available for the current session.
        }
    }

    function loadCurrentPlayerThemeDesign(renderer, legacy) {
        try {
            if ("undefined" !== typeof localStorage) {
                var key = legacy ? PLAYER_THEME_DESIGN_STORAGE_KEY
                    : playerThemeV2ScopedKey(PLAYER_THEME_DESIGN_STORAGE_KEY, renderer);
                var serialized = localStorage.getItem(key);
                return serialized ? normalizeSavedPlayerTheme(JSON.parse(serialized), 0) : null;
            }
        } catch (error) {
            // Fall back to the built-in album composition.
        }
        return null;
    }

    function setPlayerThemeChoice(renderer, choiceId, value, persist) {
        ensurePlayerThemeLibrary(renderer);
        var choices = defaultPlayerThemeChoices();
        var definitions = {
            artworkMode: PLAYER_ARTWORK_MODES,
            artworkMaterial: PLAYER_ARTWORK_MATERIALS,
            controlMaterial: PLAYER_CONTROL_MATERIALS,
            metadataAnchor: PLAYER_METADATA_ANCHORS,
            metadataAlign: LYRIC_ALIGNMENTS,
            metadataSurface: PLAYER_SURFACE_STYLES,
            lyricsSurface: PLAYER_SURFACE_STYLES,
            mediaSurface: PLAYER_SURFACE_STYLES
        };
        if (!definitions[choiceId]) {
            return;
        }
        value = knownChoice(definitions[choiceId], value, choices[choiceId]);
        renderer.__elyricPlayerThemeChoices[choiceId] = value;
        var attributeNames = {
            artworkMode: "data-elyric-artwork-mode",
            artworkMaterial: "data-elyric-artwork-material",
            controlMaterial: "data-elyric-control-material",
            metadataAnchor: "data-elyric-metadata-anchor",
            metadataAlign: "data-elyric-metadata-align",
            metadataSurface: "data-elyric-metadata-surface",
            lyricsSurface: "data-elyric-lyrics-surface",
            mediaSurface: "data-elyric-media-surface"
        };
        [renderer.__elyricThemeControl, renderer.itemsContainer, renderer.__elyricSettingsPanel,
            renderer.__elyricMediaPanel].forEach(function (element) {
            setAttributeIfChanged(element, attributeNames[choiceId], value);
        });
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, attributeNames[choiceId], value);
        }
        if ("metadataAnchor" === choiceId) {
            setDisplayStyle(
                renderer.__elyricThemeControl,
                "--elyric-design-metadata-shift",
                "center" === value ? "-50%" : ("end" === value ? "-100%" : "0%")
            );
        }
        if ("metadataAlign" === choiceId) {
            setDisplayStyle(renderer.__elyricThemeControl, "--elyric-v4-metadata-align", value);
        }
        var buttons = renderer.__elyricPlayerThemeChoiceButtons
            && renderer.__elyricPlayerThemeChoiceButtons[choiceId];
        syncSegmentedButtons(buttons, value);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function readablePlayerThemeForeground(hexColor) {
        var hex = normalizeHexColor(hexColor, "#111111").slice(1);
        var r = parseInt(hex.slice(0, 2), 16) / 255;
        var g = parseInt(hex.slice(2, 4), 16) / 255;
        var b = parseInt(hex.slice(4, 6), 16) / 255;
        function channel(value) { return value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); }
        var luminance = .2126 * channel(r) + .7152 * channel(g) + .0722 * channel(b);
        return luminance > .42 ? "#111318" : "#ffffff";
    }

    function syncPlayerThemeSemanticColors(renderer) {
        ensurePlayerThemeLibrary(renderer);
        var colors = renderer.__elyricPlayerThemeColors;
        var values = {
            "--elyric-v2-metadata-on": readablePlayerThemeForeground(colors.metadataSurface),
            "--elyric-v2-lyrics-on": readablePlayerThemeForeground(colors.lyricsSurface),
            "--elyric-v2-media-on": readablePlayerThemeForeground(colors.mediaSurface),
            "--elyric-v2-panel-bg": colors.backgroundA,
            "--elyric-v2-panel-on": readablePlayerThemeForeground(colors.backgroundA)
        };
        var targets = [renderer.__elyricThemeControl, renderer.itemsContainer,
            renderer.__elyricSettingsPanel, renderer.__elyricMediaPanel];
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            targets.push(document.body);
        }
        targets.forEach(function (element) {
            Object.keys(values).forEach(function (property) { setDisplayStyle(element, property, values[property]); });
        });
    }

    function setPlayerThemeColor(renderer, colorId, value, persist) {
        ensurePlayerThemeLibrary(renderer);
        var definition = themeColorDefinition(colorId);
        if (!definition) {
            return;
        }
        value = normalizeHexColor(value, definition.fallback);
        renderer.__elyricPlayerThemeColors[colorId] = value;
        [renderer.__elyricThemeControl, renderer.itemsContainer, renderer.__elyricSettingsPanel,
            renderer.__elyricMediaPanel].forEach(function (element) {
            setDisplayStyle(element, definition.cssProperty, value);
        });
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setDisplayStyle(document.body, definition.cssProperty, value);
        }
        var input = renderer.__elyricPlayerThemeColorInputs
            && renderer.__elyricPlayerThemeColorInputs[colorId];
        if (input) {
            input.value = value;
            input.setAttribute("value", value);
            removeAttributeIfPresent(input, "aria-invalid");
        }
        var swatch = renderer.__elyricPlayerThemeColorSwatches
            && renderer.__elyricPlayerThemeColorSwatches[colorId];
        if (swatch && swatch.style) {
            swatch.style.background = value;
        }
        syncPlayerThemeSemanticColors(renderer);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function syncPlayerThemePageStyles(renderer, body, visible) {
        if (!body) {
            return;
        }
        var attributeNames = {
            artworkMode: "data-elyric-artwork-mode",
            artworkMaterial: "data-elyric-artwork-material",
            controlMaterial: "data-elyric-control-material",
            metadataAnchor: "data-elyric-metadata-anchor",
            metadataAlign: "data-elyric-metadata-align",
            metadataSurface: "data-elyric-metadata-surface",
            lyricsSurface: "data-elyric-lyrics-surface",
            mediaSurface: "data-elyric-media-surface"
        };
        if (!visible) {
            Object.keys(attributeNames).forEach(function (choiceId) {
                removeAttributeIfPresent(body, attributeNames[choiceId]);
            });
            return;
        }
        ensurePlayerThemeLibrary(renderer);
        Object.keys(attributeNames).forEach(function (choiceId) {
            setAttributeIfChanged(
                body,
                attributeNames[choiceId],
                renderer.__elyricPlayerThemeChoices[choiceId]
            );
        });
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            var value = renderer.__elyricPlayerTuning
                && isFinite(Number(renderer.__elyricPlayerTuning[definition.id]))
                ? Number(renderer.__elyricPlayerTuning[definition.id])
                : definition.fallback;
            var cssValue = definition.ratio
                ? value / 100
                : definition.percentage
                    ? value + "%"
                    : value + (definition.cssUnit || "");
            setDisplayStyle(body, definition.cssProperty, cssValue);
        });
        PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
            setDisplayStyle(
                body,
                definition.cssProperty,
                renderer.__elyricPlayerThemeColors[definition.id]
            );
        });
    }

    function setPlayerMediaField(renderer, fieldId, visible, persist) {
        ensurePlayerThemeLibrary(renderer);
        if (!PLAYER_MEDIA_FIELDS.some(function (field) { return field.id === fieldId; })) {
            return;
        }
        renderer.__elyricMediaFields[fieldId] = !!visible;
        if (!Object.keys(renderer.__elyricMediaFields).some(function (id) {
            return renderer.__elyricMediaFields[id];
        })) {
            renderer.__elyricMediaFields.overview = true;
        }
        var buttons = renderer.__elyricMediaFieldButtons || [];
        buttons.forEach(function (button) {
            var id = button.getAttribute("data-elyric-choice");
            var active = !!renderer.__elyricMediaFields[id];
            setAttributeIfChanged(button, "aria-pressed", active ? "true" : "false");
            setAttributeIfChanged(button, "data-elyric-active", active ? "true" : "false");
        });
        if (renderer.__elyricMediaBody) {
            renderMediaInformation(renderer, renderer.__elyricDetailedMediaItem || renderer.currentItem || null);
        }
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function commitPlayerThemeV6Section(renderer, sectionId, patch, persist) {
        ensurePlayerThemeV2State(renderer);
        if (!renderer.__elyricThemeV2[sectionId] || "object" !== typeof renderer.__elyricThemeV2[sectionId]) {
            renderer.__elyricThemeV2[sectionId] = {};
        }
        Object.keys(patch || {}).forEach(function (key) {
            renderer.__elyricThemeV2[sectionId][key] = patch[key];
        });
        renderer.__elyricThemeV2 = normalizePlayerThemeV2State(renderer.__elyricThemeV2);
        applyPlayerThemeV2SemanticControls(renderer);
        repositionPlayerOverlays(renderer);
        syncPlayerThemeV6Settings(renderer);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function commitPlayerThemeV6Path(renderer, path, value, persist) {
        ensurePlayerThemeV2State(renderer);
        setPlayerThemeV2PathValue(renderer.__elyricThemeV2, path, value);
        renderer.__elyricThemeV2 = normalizePlayerThemeV2State(renderer.__elyricThemeV2);
        applyPlayerThemeV2SemanticControls(renderer);
        repositionPlayerOverlays(renderer);
        syncPlayerThemeV6Settings(renderer);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function setMetadataSummaryField(renderer, fieldId, visible, persist) {
        if (!PLAYER_METADATA_SUMMARY_FIELDS.some(function (field) { return field.id === fieldId; })) { return; }
        ensurePlayerThemeV2State(renderer);
        var fields = Array.isArray(renderer.__elyricThemeV2.metadata.summaryFields)
            ? renderer.__elyricThemeV2.metadata.summaryFields.slice() : [];
        var index = fields.indexOf(fieldId);
        if (visible && index < 0) { fields.push(fieldId); }
        if (!visible && index >= 0) { fields.splice(index, 1); }
        renderer.__elyricThemeV2.metadata.summaryFields = fields;
        updatePlayerMetadata(renderer);
        syncPlayerThemeV6Settings(renderer);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function syncPlayerThemeV6Settings(renderer) {
        var state = renderer && renderer.__elyricThemeV2;
        if (!state) { return; }
        var fields = state.metadata && state.metadata.summaryFields || [];
        (renderer.__elyricMetadataSummaryButtons || []).forEach(function (button) {
            var active = fields.indexOf(button.getAttribute("data-elyric-choice")) >= 0;
            setAttributeIfChanged(button, "aria-pressed", active ? "true" : "false");
            setAttributeIfChanged(button, "data-elyric-active", active ? "true" : "false");
        });
        Object.keys(renderer.__elyricThemeV6RangeControls || {}).forEach(function (path) {
            var control = renderer.__elyricThemeV6RangeControls[path];
            var value = playerThemeV2PathValue(state, path);
            control.input.value = String(value);
            control.input.setAttribute("value", String(value));
            replaceElementText(control.value, String(value));
        });
        Object.keys(renderer.__elyricThemeV6SegmentControls || {}).forEach(function (path) {
            syncSegmentedButtons(renderer.__elyricThemeV6SegmentControls[path], playerThemeV2PathValue(state, path));
        });
        Object.keys(renderer.__elyricThemeV6ColorControls || {}).forEach(function (path) {
            var control = renderer.__elyricThemeV6ColorControls[path];
            var value = normalizeHexColor(playerThemeV2PathValue(state, path), "#ffffff");
            control.input.value = value;
            control.input.setAttribute("value", value);
            control.swatch.style.background = value;
        });
    }

    function applyPlayerThemeDefinition(renderer, source) {
        if (!source) {
            return;
        }
        ensurePlayerThemeLibrary(renderer);
        var theme = normalizeSavedPlayerTheme(source, 0);
        if (!theme) {
            return;
        }
        renderer.__elyricThemeBaseLayout = theme.baseLayout || renderer.__elyricThemeBaseLayout || "album";
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-parametric", "true");
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-parametric", "true");
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-parametric", "true");
        }
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            setPlayerTuning(renderer, definition.id, theme.tuning[definition.id], false);
        });
        Object.keys(theme.choices).forEach(function (choiceId) {
            setPlayerThemeChoice(renderer, choiceId, theme.choices[choiceId], false);
        });
        Object.keys(theme.colors).forEach(function (colorId) {
            setPlayerThemeColor(renderer, colorId, theme.colors[colorId], false);
        });
        renderer.__elyricMediaFields = normalizePlayerMediaFields(theme.mediaFields);
        PLAYER_MEDIA_FIELDS.forEach(function (field) {
            setPlayerMediaField(renderer, field.id, renderer.__elyricMediaFields[field.id], false);
        });
        var player = theme.player || {};
        if (player.theme) { applyTheme(renderer, player.theme, false); }
        if (player.backgroundMode) { setBackgroundMode(renderer, player.backgroundMode, false); }
        if (player.visualizerStyle) { setVisualizerStyle(renderer, player.visualizerStyle, false); }
        if (isFinite(Number(player.visualizerWidth))) { setVisualizerWidth(renderer, player.visualizerWidth, false); }
        if (isFinite(Number(player.visualizerHeight))) { setVisualizerHeight(renderer, player.visualizerHeight, false); }
        if (isFinite(Number(player.visualizerAmplitude))) { setVisualizerAmplitude(renderer, player.visualizerAmplitude, false); }
        if (player.visualizerColorMode) {
            setVisualizerColorMode(renderer, player.visualizerColorMode, false);
        }
        if (Array.isArray(player.visualizerColors)) {
            player.visualizerColors.forEach(function (color, index) {
                setVisualizerColor(renderer, index, color, false);
            });
        }
        if (player.lyricAlignment) { setLyricAlignment(renderer, player.lyricAlignment, false); }
        if (isFinite(Number(player.lyricScale))) { setLyricScale(renderer, player.lyricScale, false); }
        if ("boolean" === typeof player.artworkRotation) {
            setArtworkRotation(renderer, player.artworkRotation, false);
        }
        if (theme.v2) {
            applyPlayerThemeV2State(renderer, theme.v2);
        } else {
            renderer.__elyricThemeV2 = null;
            renderer.__elyricThemeV2Profile = null;
            clearPlayerThemeV2Layout(renderer);
        }
        renderer.__elyricStoredTheme = renderer.__elyricTheme;
        renderer.__elyricThemeBaseLayout = theme.baseLayout;
        syncPlayerThemeLibraryControls(renderer);
    }

    function resolvedBuiltInPlayerTheme(layoutId) {
        var preset = PLAYER_PARAMETRIC_PRESETS[layoutId];
        if (!preset) {
            return null;
        }
        var tuning = {};
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            tuning[definition.id] = definition.fallback;
        });
        mergeThemeValues(tuning, preset.tuning);
        var choices = mergeThemeValues(defaultPlayerThemeChoices(), preset.choices);
        return {
            format: PLAYER_THEME_DOCUMENT_FORMAT,
            schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
            id: "builtin-" + layoutId,
            name: PLAYER_LAYOUTS.filter(function (layout) { return layout.id === layoutId; })[0].label,
            baseLayout: layoutId,
            tuning: tuning,
            choices: choices,
            colors: mergeThemeValues(defaultPlayerThemeColors(), preset.colors),
            mediaFields: defaultPlayerMediaFields(),
            player: shallowCopy(PLAYER_LAYOUT_PRESET_DEFAULTS[layoutId] || {}),
            v2: builtInPlayerThemeV4State(layoutId, preset)
        };
    }

    function applyStoredOrBuiltInPlayerTheme(renderer) {
        ensurePlayerThemeLibrary(renderer);
        if (renderer.__elyricWorkspaceReady && "custom" === renderer.__elyricPlayerLayout) {
            var activeTheme = activeUserPlayerTheme(renderer) || loadCurrentPlayerThemeDesign(renderer, false);
            if (activeTheme) {
                applyPlayerThemeDefinition(renderer, activeTheme);
                return;
            }
        }
        var preset = resolvedBuiltInPlayerTheme(
            "custom" === renderer.__elyricPlayerLayout
                ? renderer.__elyricThemeBaseLayout || "album"
                : renderer.__elyricPlayerLayout || "album"
        );
        applyPlayerThemeDefinition(renderer, preset);
    }

    function normalizeUserPlayerPreferences(source) {
        if (!source || "object" !== typeof source) {
            return null;
        }
        var preferences = { version: PLAYER_PREFERENCES_VERSION, tuning: {} };
        preferences.layoutRepairRevision = Math.max(
            0,
            Math.min(
                PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION,
                Math.round(Number(source.layoutRepairRevision) || 0)
            )
        );
        if (isKnownTheme(source.theme)) {
            preferences.theme = source.theme;
        }
        if (isKnownPlayerLayout(source.layout)) {
            preferences.layout = source.layout;
        }
        if ("boolean" === typeof source.artworkRotation) {
            preferences.artworkRotation = source.artworkRotation;
        }
        if ("boolean" === typeof source.showSecondLine) {
            preferences.showSecondLine = source.showSecondLine;
        }
        preferences.backgroundMode = knownChoice(BACKGROUND_MODES, source.backgroundMode, null);
        preferences.visualizerStyle = knownChoice(VISUALIZER_STYLES, source.visualizerStyle, null);
        preferences.visualizerColorMode = knownChoice(
            VISUALIZER_COLOR_MODES,
            source.visualizerColorMode,
            null
        );
        preferences.lyricAlignment = knownChoice(LYRIC_ALIGNMENTS, source.lyricAlignment, null);
        if (isFinite(Number(source.visualizerWidth))) {
            preferences.visualizerWidth = Math.min(100, Math.max(10, Math.round(Number(source.visualizerWidth))));
        }
        if (isFinite(Number(source.visualizerHeight))) {
            preferences.visualizerHeight = Math.min(30, Math.max(2, Math.round(Number(source.visualizerHeight))));
        }
        if (isFinite(Number(source.visualizerAmplitude))) {
            preferences.visualizerAmplitude = Math.min(140, Math.max(25, Math.round(Number(source.visualizerAmplitude))));
        }
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            var preferenceName = "visualizer"
                + definition.id.charAt(0).toUpperCase()
                + definition.id.slice(1);
            if (isFinite(Number(source[preferenceName]))) {
                preferences[preferenceName] = Math.min(
                    definition.maximum,
                    Math.max(definition.minimum, Math.round(Number(source[preferenceName])))
                );
            }
        });
        if (isFinite(Number(source.lyricScale))) {
            preferences.lyricScale = Math.min(170, Math.max(70, Math.round(Number(source.lyricScale))));
        }
        if (Array.isArray(source.visualizerColors)) {
            preferences.visualizerColors = ["#a8e063", "#56d6c9", "#8b9dff"].map(
                function (fallback, index) {
                    return normalizeHexColor(source.visualizerColors[index], fallback);
                }
            );
        }
        var tuningSource = source.tuning && "object" === typeof source.tuning ? source.tuning : {};
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            if (Object.prototype.hasOwnProperty.call(tuningSource, definition.id)) {
                preferences.tuning[definition.id] = normalizePlayerTuningValue(
                    definition,
                    tuningSource[definition.id]
                );
            }
        });
        if (Array.isArray(source.playerThemes)) {
            preferences.playerThemes = source.playerThemes
                .slice(0, MAX_LEGACY_USER_PLAYER_THEMES)
                .map(normalizeSavedPlayerTheme)
                .filter(Boolean);
        }
        if (source.activePlayerThemeId) {
            preferences.activePlayerThemeId = String(source.activePlayerThemeId)
                .replace(/[^a-z0-9_-]/gi, "")
                .slice(0, 48);
        }
        if (source.playerThemeDesign && "object" === typeof source.playerThemeDesign) {
            preferences.playerThemeDesign = normalizeSavedPlayerTheme(source.playerThemeDesign, 0);
        }
        return preferences;
    }

    function collectUserPlayerPreferences(renderer) {
        var tuning = {};
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            tuning[definition.id] = renderer.__elyricPlayerTuning
                && isFinite(Number(renderer.__elyricPlayerTuning[definition.id]))
                ? Number(renderer.__elyricPlayerTuning[definition.id])
                : loadStoredPlayerTuning(definition.id);
        });
        var preferences = {
            version: PLAYER_PREFERENCES_VERSION,
            layoutRepairRevision: Number(renderer.__elyricLayoutRepairRevision || PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION),
            theme: renderer.__elyricTheme || "classic",
            layout: renderer.__elyricPlayerLayout || "album",
            artworkRotation: false !== renderer.__elyricArtworkRotation,
            showSecondLine: false !== renderer.__elyricLocalShowSecond,
            backgroundMode: renderer.__elyricBackgroundMode || "blur",
            visualizerStyle: renderer.__elyricVisualizerStyle || "spectrum",
            visualizerWidth: renderer.__elyricVisualizerWidth || 62,
            visualizerHeight: renderer.__elyricVisualizerHeight || 8,
            visualizerAmplitude: renderer.__elyricVisualizerAmplitude || 70,
            visualizerColorMode: renderer.__elyricVisualizerColorMode || "dual",
            visualizerColors: (renderer.__elyricVisualizerColors || ["#a8e063", "#56d6c9", "#8b9dff"]).slice(0, 3),
            lyricAlignment: renderer.__elyricLyricAlignment || "left",
            lyricScale: renderer.__elyricLyricScale || 100,
            tuning: tuning,
            playerThemes: [],
            activePlayerThemeId: renderer.__elyricActiveUserPlayerThemeId || null,
            playerThemeDesign: collectCurrentPlayerTheme(renderer, "当前设计", "draft")
        };
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            var preferenceName = "visualizer"
                + definition.id.charAt(0).toUpperCase()
                + definition.id.slice(1);
            preferences[preferenceName] = isFinite(Number(renderer[definition.property]))
                ? Number(renderer[definition.property])
                : definition.fallback;
        });
        return preferences;
    }

    function updatePreferenceStatus(renderer, state, text) {
        renderer.__elyricPreferenceState = state;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-preference-state", state);
        if (renderer.__elyricPreferenceStatus) {
            replaceElementText(renderer.__elyricPreferenceStatus, text);
            setAttributeIfChanged(renderer.__elyricPreferenceStatus, "data-elyric-state", state);
        }
    }

    function playerThemeV2ResponseValue(source, camelName, pascalName, fallback) {
        if (!source) { return fallback; }
        if (Object.prototype.hasOwnProperty.call(source, camelName)) { return source[camelName]; }
        if (Object.prototype.hasOwnProperty.call(source, pascalName)) { return source[pascalName]; }
        return fallback;
    }

    function playerThemeV2AccountScope(renderer) {
        var apiClient = activeApiClient(renderer);
        var userId = apiClient && apiClient.getCurrentUserId ? apiClient.getCurrentUserId() : "anonymous";
        var serverId = "";
        try {
            serverId = apiClient && apiClient.serverId
                ? ("function" === typeof apiClient.serverId ? apiClient.serverId() : apiClient.serverId) : "";
        } catch (error) {}
        try {
            if (!serverId && apiClient && apiClient.serverInfo) {
                var info = "function" === typeof apiClient.serverInfo ? apiClient.serverInfo() : apiClient.serverInfo;
                serverId = info && (info.Id || info.id || info.ServerId || info.serverId) || "";
            }
        } catch (error) {}
        try {
            if (!serverId && apiClient && apiClient.serverAddress) {
                serverId = "function" === typeof apiClient.serverAddress
                    ? apiClient.serverAddress() : apiClient.serverAddress;
            }
        } catch (error) {}
        if (!serverId && "undefined" !== typeof location) { serverId = location.origin || location.host || "unknown"; }
        function safe(value) {
            return encodeURIComponent(String(value || "unknown").toLowerCase()).replace(/%/g, "_").slice(0, 160);
        }
        return { serverId: String(serverId || "unknown"), userId: String(userId || "anonymous"), key: safe(serverId) + "." + safe(userId) };
    }

    function playerThemeV2ScopedKey(base, renderer) {
        return base + "." + playerThemeV2AccountScope(renderer).key;
    }

    function archiveLegacyPlayerThemeV2Queue(renderer) {
        if ("undefined" === typeof localStorage) { return; }
        try {
            var legacyKeys = ["emby-lyric-enhance.theme-v2.offline-queue", PLAYER_THEME_V2_OFFLINE_QUEUE_KEY];
            legacyKeys.forEach(function (key) {
                if (key === playerThemeV2ScopedKey(PLAYER_THEME_V2_OFFLINE_QUEUE_KEY, renderer)) { return; }
                var raw = localStorage.getItem(key);
                if (!raw) { return; }
                localStorage.setItem(PLAYER_THEME_V2_LEGACY_ARCHIVE_KEY + "." + Date.now(), raw);
                localStorage.removeItem(key);
            });
        } catch (error) {}
    }

    function storeConfirmedPlayerThemeV2Workspace(renderer, workspace, summaries) {
        if ("undefined" === typeof localStorage) { return; }
        try {
            localStorage.setItem(playerThemeV2ScopedKey(PLAYER_THEME_V2_WORKSPACE_CACHE_KEY, renderer), JSON.stringify({
                confirmedAt: Date.now(), workspace: workspace || {}, summaries: summaries || []
            }));
        } catch (error) {}
    }

    function backupPlayerThemeV5Repair(renderer, theme, workspaceRevision) {
        if (!theme || "undefined" === typeof localStorage) { return; }
        try {
            var key = playerThemeV2ScopedKey(PLAYER_THEME_V5_REPAIR_BACKUP_KEY, renderer);
            var backups = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(backups)) { backups = []; }
            var serialized = JSON.stringify(theme);
            if (!backups.some(function (entry) { return entry && entry.json === serialized; })) {
                backups.push({
                    repairedAt: Date.now(),
                    workspaceRevision: Number(workspaceRevision || 0),
                    readOnly: true,
                    json: serialized
                });
                localStorage.setItem(key, JSON.stringify(backups.slice(-12)));
            }
        } catch (error) {}
    }

    function loadPlayerThemeV5RepairBackups(renderer) {
        if ("undefined" === typeof localStorage) { return []; }
        try {
            var key = playerThemeV2ScopedKey(PLAYER_THEME_V5_REPAIR_BACKUP_KEY, renderer);
            var backups = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(backups) ? backups.filter(function (entry) {
                return entry && entry.readOnly && "string" === typeof entry.json;
            }) : [];
        } catch (error) { return []; }
    }

    function restoreLatestPlayerThemeV5RepairBackup(renderer) {
        var backups = loadPlayerThemeV5RepairBackups(renderer);
        var entry = backups[backups.length - 1];
        var original = null;
        try { original = entry ? normalizeSavedPlayerTheme(JSON.parse(entry.json), 0) : null; }
        catch (error) { original = null; }
        if (!original || !original.v2) {
            updatePlayerThemeLibraryStatus(renderer, "当前账号没有可回退的布局修复备份", "error");
            syncPlayerThemeLibraryControls(renderer);
            return false;
        }
        renderer.__elyricActiveUserPlayerThemeId = null;
        renderer.__elyricThemeBaseLayout = original.baseLayout;
        renderer.__elyricPlayerLayout = "custom";
        renderer.__elyricLayoutRepairRevision = PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION;
        applyPlayerLayout(renderer, "custom", false);
        applyPlayerThemeDefinition(renderer, original);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        syncPlayerThemeLibraryControls(renderer);
        updatePlayerThemeLibraryStatus(
            renderer,
            "已回退到修复前只读备份；播放态仍会应用最低安全约束，可在画布编辑中继续调整",
            "synced"
        );
        return true;
    }

    function repairPlayerThemeV5PreferenceDraft(renderer, preferences, workspaceRevision) {
        var theme = preferences && preferences.playerThemeDesign;
        if (!theme || !theme.v2
            || Number(preferences.layoutRepairRevision) >= PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION) {
            return false;
        }
        var repaired = repairPlayerThemeV5State(theme.v2);
        if (!repaired.changed) { return false; }
        backupPlayerThemeV5Repair(renderer, theme, workspaceRevision);
        var repairCopy = clonePlayerThemeV2Value(theme);
        repairCopy.id = "layout-repair-" + Date.now().toString(36);
        repairCopy.name = normalizePlayerThemeName(theme.name + "（安全修复）", "布局安全修复");
        repairCopy.v2 = repaired.state;
        repairCopy.revision = 0;
        repairCopy.updatedAt = Date.now();
        repairCopy.repairSourceId = theme.id || "draft";
        preferences.playerThemeDesign = repairCopy;
        preferences.layoutRepairRevision = PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION;
        renderer.__elyricLayoutRepairRevision = PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION;
        renderer.__elyricPendingLayoutRepair = true;
        return true;
    }

    function loadConfirmedPlayerThemeV2Workspace(renderer) {
        try {
            var raw = localStorage.getItem(playerThemeV2ScopedKey(PLAYER_THEME_V2_WORKSPACE_CACHE_KEY, renderer));
            var cached = raw ? JSON.parse(raw) : null;
            return cached && cached.workspace ? cached : null;
        } catch (error) { return null; }
    }

    function playerThemeV2ApiRequest(renderer, method, path, body, formData) {
        var apiClient = activeApiClient(renderer);
        if (!apiClient || !apiClient.getUrl) {
            return Promise.reject(new Error("当前 Emby 连接不支持主题库接口"));
        }
        var url = apiClient.getUrl(path);
        var parsePayload = function (value) {
            if (null == value || "" === value) { return {}; }
            if ("string" === typeof value) {
                try { return JSON.parse(value); } catch (error) { return {}; }
            }
            return value;
        };
        if (apiClient.ajax) {
            var request = {
                url: url,
                type: method,
                method: method,
                dataType: "json",
                headers: { Accept: "application/json" }
            };
            if (formData) {
                request.data = formData;
                request.processData = false;
                request.contentType = false;
            } else if (null != body) {
                request.data = JSON.stringify(body);
                request.contentType = "application/json";
            }
            return Promise.resolve(apiClient.ajax(request)).then(parsePayload, function (error) {
                var status = Number(error && (error.status || error.statusCode) || 0);
                var rawPayload = error && (error.responseJSON || error.responseText || error.body || {});
                if (409 === status) {
                    return parsePayload(rawPayload);
                }
                var requestError = error instanceof Error
                    ? error : new Error("主题服务请求失败（HTTP " + (status || "未知") + "）");
                requestError.status = status;
                requestError.payload = parsePayload(rawPayload);
                requestError.detail = playerThemeV2SafeServerDetail(rawPayload);
                throw requestError;
            });
        }
        if ("GET" === method && apiClient.getJSON) {
            return Promise.resolve(apiClient.getJSON(url)).then(parsePayload);
        }
        if ("undefined" === typeof fetch) {
            return Promise.reject(new Error("当前 Emby Web 缺少可用的已认证主题请求通道"));
        }
        var headers = { Accept: "application/json" };
        var token = apiClient.accessToken ? apiClient.accessToken() : "";
        if (token) { headers["X-Emby-Token"] = token; }
        var options = { method: method, headers: headers, credentials: "same-origin" };
        if (formData) {
            options.body = formData;
        } else if (null != body) {
            headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }
        return fetch(url, options).then(function (response) {
            return response.text().then(function (text) {
                var payload = null;
                try { payload = text ? JSON.parse(text) : {}; } catch (error) { payload = {}; }
                if (!response.ok && 409 !== response.status) {
                    var requestError = new Error("主题服务请求失败（HTTP " + response.status + "）");
                    requestError.status = response.status;
                    requestError.payload = payload;
                    requestError.detail = playerThemeV2SafeServerDetail(text || payload);
                    throw requestError;
                }
                return payload;
            });
        });
    }

    function playerThemeV2SafeServerDetail(value) {
        var candidate = value;
        if (candidate && "object" === typeof candidate) {
            candidate = candidate.message || candidate.Message || candidate.error || candidate.Error
                || candidate.responseStatus && (candidate.responseStatus.message || candidate.responseStatus.Message)
                || "";
        }
        candidate = String(candidate || "")
            .replace(/https?:\/\/\S+/gi, "[地址已隐藏]")
            .replace(/(X-Emby-Token|api_key|token)\s*[=:]\s*[^\s&]+/gi, "$1=[已隐藏]")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ").trim();
        return candidate.slice(0, 240);
    }

    function playerThemeV2FailureMessage(error, localAction) {
        var status = Number(error && (error.status || error.statusCode) || 0);
        var prefix = localAction || "当前修改已保存在本地";
        if (404 === status) {
            return "服务器未加载主题同步接口（HTTP 404）；" + prefix;
        }
        if (401 === status || 403 === status) {
            return "当前 Emby 登录无权访问主题库（HTTP " + status + "）；" + prefix;
        }
        if (409 === status) {
            return "服务器检测到主题 revision 冲突；" + prefix;
        }
        if (400 === status) {
            var detail = error && (error.detail || playerThemeV2SafeServerDetail(error.payload));
            return "主题数据被服务器拒绝（HTTP 400）"
                + (detail ? "：" + detail : "；请确认插件 DLL 支持 Theme V6")
                + "；" + prefix;
        }
        if (status >= 500) {
            return "主题服务端处理失败（HTTP " + status
                + "）；请确认插件 DLL 已更新，并检查主题存储目录权限；" + prefix;
        }
        if (status) {
            return "主题同步失败（HTTP " + status + "）；" + prefix;
        }
        return "无法连接服务器主题库；" + prefix;
    }

    function playerThemeV2WorkspaceUnavailableStatus(error) {
        var status = Number(error && (error.status || error.statusCode) || 0);
        if (404 === status) { return "主题同步接口未加载（HTTP 404）；请重新安装插件 DLL 并重启 Emby"; }
        if (401 === status || 403 === status) { return "当前 Emby 登录无权读取主题同步接口（HTTP " + status + "）"; }
        if (status >= 500) { return "主题同步接口异常（HTTP " + status + "）；请检查插件日志与存储目录权限"; }
        return "无法连接账号主题同步接口；当前仅使用安全默认主题";
    }

    function normalizeRemotePlayerTheme(record) {
        var serialized = playerThemeV2ResponseValue(record, "themeJson", "ThemeJson", "{}");
        var source = {};
        try { source = JSON.parse(serialized); } catch (error) { source = {}; }
        source.id = playerThemeV2ResponseValue(record, "id", "Id", source.id);
        source.name = playerThemeV2ResponseValue(record, "name", "Name", source.name);
        var theme = normalizeSavedPlayerTheme(source, 0);
        if (theme) {
            theme.revision = Number(playerThemeV2ResponseValue(record, "revision", "Revision", 0));
            theme.remoteOnly = false;
        }
        return theme;
    }

    function mergeRemotePlayerThemeSummaries(renderer, summaries) {
        ensurePlayerThemeLibrary(renderer);
        var remoteThemes = [];
        (summaries || []).forEach(function (summary) {
            var id = String(playerThemeV2ResponseValue(summary, "id", "Id", ""));
            if (!id) { return; }
            var remote = normalizeSavedPlayerTheme({
                id: id,
                name: playerThemeV2ResponseValue(summary, "name", "Name", "远程主题"),
                baseLayout: "album"
            }, remoteThemes.length);
            remote.revision = Number(playerThemeV2ResponseValue(summary, "revision", "Revision", 0));
            remote.remoteOnly = true;
            remoteThemes.push(remote);
        });
        // A successful server read replaces the local summary list. Theme
        // documents are fetched lazily when selected; stale browser copies can
        // therefore never masquerade as the authenticated account version.
        renderer.__elyricUserPlayerThemes = remoteThemes;
        storePlayerThemeLibrary(renderer);
        syncPlayerThemeLibraryControls(renderer);
    }

    function requestPlayerThemeV2Workspace(renderer) {
        var themesRequest = playerThemeV2ApiRequest(renderer, "GET", PLAYER_THEMES_PATH).then(function (summaries) {
            return { summaries: Array.isArray(summaries) ? summaries : [], error: null };
        }, function (error) {
            return { summaries: null, error: error };
        });
        return Promise.all([
            playerThemeV2ApiRequest(renderer, "GET", PLAYER_WORKSPACE_PATH),
            themesRequest
        ]).then(function (results) {
            var workspace = results[0] || {};
            var themesResult = results[1] || {};
            var summaries = Array.isArray(themesResult.summaries)
                ? themesResult.summaries
                : playerThemeV2ResponseValue(workspace, "themes", "Themes", []);
            summaries = Array.isArray(summaries) ? summaries : [];
            renderer.__elyricWorkspaceRevision = Number(
                playerThemeV2ResponseValue(workspace, "revision", "Revision", 0)
            );
            renderer.__elyricWorkspaceLegacyImported = !!playerThemeV2ResponseValue(
                workspace, "legacyImported", "LegacyImported", false
            );
            renderer.__elyricActiveUserPlayerThemeId = playerThemeV2ResponseValue(
                workspace, "activeThemeId", "ActiveThemeId", renderer.__elyricActiveUserPlayerThemeId || null
            );
            mergeRemotePlayerThemeSummaries(renderer, summaries);
            storeConfirmedPlayerThemeV2Workspace(renderer, workspace, summaries);
            renderer.__elyricThemeLibraryApiError = themesResult.error || null;
            return workspace;
        });
    }

    function applyPlayerThemeV2WorkspaceToPreferences(renderer, workspace, preferences) {
        preferences = preferences || {};
        var draftJson = playerThemeV2ResponseValue(workspace, "draftJson", "DraftJson", "{}");
        var globalJson = playerThemeV2ResponseValue(workspace, "globalStateJson", "GlobalStateJson", "{}");
        try {
            var globalState = JSON.parse(globalJson);
            Object.keys(globalState).forEach(function (key) { preferences[key] = globalState[key]; });
        } catch (error) {}
        try {
            var draft = normalizeSavedPlayerTheme(JSON.parse(draftJson), 0);
            if (draft) {
                preferences.playerThemeDesign = draft;
                // The Workspace draft is the complete active composition. Once
                // edited it must restore independently of its original preset.
            }
        } catch (error) {}
        repairPlayerThemeV5PreferenceDraft(
            renderer,
            preferences,
            playerThemeV2ResponseValue(workspace, "revision", "Revision", 0)
        );
        if (Number(preferences.layoutRepairRevision) >= PLAYER_THEME_V5_LAYOUT_REPAIR_REVISION
            && Array.isArray(preferences.playerThemes)) {
            preferences.playerThemes = preferences.playerThemes.map(function (theme) {
                if (!theme || !theme.v2) { return theme; }
                var repairedTheme = clonePlayerThemeV2Value(theme);
                repairedTheme.v2 = repairPlayerThemeV5State(repairedTheme.v2).state;
                return repairedTheme;
            });
        }
        preferences.activePlayerThemeId = renderer.__elyricActiveUserPlayerThemeId || null;
        return preferences;
    }

    function playerThemeV2OperationTargetsTheme(operation, themeId) {
        if (!operation || !themeId) { return false; }
        if (String(operation.themeId || "") === String(themeId)) { return true; }
        var path = String(operation.path || "");
        var themePath = PLAYER_THEMES_PATH + "/" + encodeURIComponent(themeId);
        return path === themePath || 0 === path.indexOf(themePath + "?");
    }

    function removeQueuedPlayerThemeV2Operations(themeId) {
        var renderer = arguments.length > 1 ? arguments[1] : null;
        try {
            var key = playerThemeV2ScopedKey(PLAYER_THEME_V2_OFFLINE_QUEUE_KEY, renderer);
            var queue = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(queue)) { queue = []; }
            queue = queue.filter(function (operation) {
                return !playerThemeV2OperationTargetsTheme(operation, themeId);
            });
            if (queue.length) {
                localStorage.setItem(key, JSON.stringify(queue));
            } else if (localStorage.removeItem) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, "[]");
            }
        } catch (error) {}
    }

    function queuePlayerThemeV2Operation(renderer, operation) {
        try {
            var key = playerThemeV2ScopedKey(PLAYER_THEME_V2_OFFLINE_QUEUE_KEY, renderer);
            var queue = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(queue)) { queue = []; }
            if ("workspace" === operation.kind) {
                queue = queue.filter(function (item) { return "workspace" !== item.kind; });
            }
            if (operation.themeId) {
                queue = queue.filter(function (item) {
                    return !playerThemeV2OperationTargetsTheme(item, operation.themeId);
                });
            }
            var scope = playerThemeV2AccountScope(renderer);
            operation.scope = scope.key;
            operation.baseRevision = Number(operation.baseRevision || renderer && renderer.__elyricWorkspaceRevision || 0);
            operation.updatedAt = Number(operation.updatedAt || Date.now());
            queue.push(operation);
            localStorage.setItem(key, JSON.stringify(queue.slice(-100)));
        } catch (error) {}
    }

    function flushPlayerThemeV2OfflineQueue(renderer) {
        var queue = [];
        var key = playerThemeV2ScopedKey(PLAYER_THEME_V2_OFFLINE_QUEUE_KEY, renderer);
        try { queue = JSON.parse(localStorage.getItem(key) || "[]"); } catch (error) {}
        if (!Array.isArray(queue) || !queue.length) { return Promise.resolve(); }
        var scope = playerThemeV2AccountScope(renderer);
        queue = queue.filter(function (operation) { return operation.scope === scope.key; });
        var hadConflict = false;
        var chain = requestPlayerThemeV2Workspace(renderer).then(function () {});
        queue.forEach(function (operation) {
            chain = chain.then(function () {
                return playerThemeV2ApiRequest(renderer, operation.method, operation.path, operation.body).then(function (result) {
                    if (playerThemeV2ResponseValue(result, "conflict", "Conflict", false)) {
                        hadConflict = true;
                        renderer.__elyricWorkspaceSource = "conflict";
                        updatePreferenceStatus(renderer, "conflict", "revision 冲突：服务端版本继续生效，本地版本已保存为冲突副本");
                    }
                    return result;
                });
            });
        });
        return chain.then(function () {
            localStorage.removeItem(key);
            return requestPlayerThemeV2Workspace(renderer).then(function (workspace) {
                var preferences = applyPlayerThemeV2WorkspaceToPreferences(renderer, workspace, {});
                return finalizeUserPlayerPreferencesRestore(
                    renderer,
                    preferences,
                    hadConflict ? "conflict" : "server"
                );
            });
        }).catch(function () {});
    }

    function persistPlayerThemeV2Workspace(renderer) {
        renderer.__elyricLastWorkspaceConflict = false;
        var preferences = collectUserPlayerPreferences(renderer);
        delete preferences.playerThemes;
        delete preferences.playerThemeDesign;
        var body = {
            ExpectedRevision: Number(renderer.__elyricWorkspaceRevision || 0),
            ActiveThemeId: renderer.__elyricActiveUserPlayerThemeId || null,
            DraftJson: JSON.stringify(portablePlayerThemeV5(
                collectCurrentPlayerTheme(renderer, "当前设计", "draft"),
                true
            )),
            GlobalStateJson: JSON.stringify(preferences),
            LegacyImported: true
        };
        return playerThemeV2ApiRequest(renderer, "PUT", PLAYER_WORKSPACE_PATH, body).then(function (result) {
            renderer.__elyricWorkspaceWriteBlocked = false;
            var value = playerThemeV2ResponseValue(result, "value", "Value", result);
            var conflict = !!playerThemeV2ResponseValue(result, "conflict", "Conflict", false);
            var previousRevision = Number(renderer.__elyricWorkspaceRevision || 0);
            var confirmedRevision = Number(playerThemeV2ResponseValue(value, "revision", "Revision", 0));
            if (!(confirmedRevision > previousRevision) && !conflict) {
                var invalidWorkspaceResponse = new Error("服务器 Workspace 接口未确认新的 revision");
                invalidWorkspaceResponse.status = 502;
                throw invalidWorkspaceResponse;
            }
            renderer.__elyricWorkspaceRevision = confirmedRevision || previousRevision;
            renderer.__elyricWorkspaceLegacyImported = !!playerThemeV2ResponseValue(
                value, "legacyImported", "LegacyImported", true
            );
            renderer.__elyricActiveUserPlayerThemeId = playerThemeV2ResponseValue(
                value, "activeThemeId", "ActiveThemeId", renderer.__elyricActiveUserPlayerThemeId || null
            );
            var summaries = playerThemeV2ResponseValue(value, "themes", "Themes", []);
            mergeRemotePlayerThemeSummaries(renderer, Array.isArray(summaries) ? summaries : []);
            storeConfirmedPlayerThemeV2Workspace(renderer, value, summaries);
            var conflictCopy = playerThemeV2ResponseValue(result, "conflictCopy", "ConflictCopy", null);
            if (conflictCopy) {
                var theme = normalizeRemotePlayerTheme(conflictCopy);
                if (theme) { renderer.__elyricUserPlayerThemes.push(theme); storePlayerThemeLibrary(renderer); }
                updatePlayerThemeLibraryStatus(renderer, "检测到跨设备修改，已保留为冲突副本", "error");
            }
            if (conflict) {
                renderer.__elyricLastWorkspaceConflict = true;
                renderer.__elyricWorkspaceSource = "conflict";
                finalizeUserPlayerPreferencesRestore(
                    renderer,
                    applyPlayerThemeV2WorkspaceToPreferences(renderer, value, {}),
                    "conflict"
                );
            }
            setAttributeIfChanged(
                renderer.__elyricThemeControl,
                "data-elyric-workspace-revision",
                String(renderer.__elyricWorkspaceRevision || 0)
            );
            if ("undefined" !== typeof window && window.__elyricPlayerDiagnostics) {
                window.__elyricPlayerDiagnostics.workspaceRevision = Number(renderer.__elyricWorkspaceRevision || 0);
                window.__elyricPlayerDiagnostics.syncSource = conflict ? "conflict" : "server";
            }
            return !conflict;
        }).catch(function (error) {
            var status = Number(error && (error.status || error.statusCode) || 0);
            renderer.__elyricWorkspaceLastErrorStatus = status;
            renderer.__elyricWorkspaceLastErrorMessage = String(
                error && (error.detail || error.message) || "Workspace write failed"
            );
            if (400 !== status && 413 !== status) {
                queuePlayerThemeV2Operation(renderer, { kind: "workspace", method: "PUT", path: PLAYER_WORKSPACE_PATH, body: body });
            } else {
                renderer.__elyricWorkspaceWriteBlocked = true;
            }
            updatePreferenceStatus(renderer, "local", playerThemeV2FailureMessage(
                error,
                400 === status || 413 === status
                    ? "当前修改仅保存在本地，未加入无效重试队列"
                    : "离线修改已进入待同步队列"
            ));
            return false;
        });
    }

    function syncNamedPlayerThemeV2(renderer, theme, create) {
        if (!theme) { return Promise.resolve(null); }
        var path = create ? PLAYER_THEMES_PATH : PLAYER_THEMES_PATH + "/" + encodeURIComponent(theme.id);
        var method = create ? "POST" : "PUT";
        var body = {
            Id: theme.id,
            ExpectedRevision: Number(theme.revision || 0),
            Name: theme.name,
            ThemeJson: JSON.stringify(portablePlayerThemeV5(theme, true))
        };
        return playerThemeV2ApiRequest(renderer, method, path, body).then(function (record) {
            var resultRecord = playerThemeV2ResponseValue(record, "value", "Value", record);
            var synced = normalizeRemotePlayerTheme(resultRecord);
            if (!synced || !(synced.revision > 0)) {
                var invalidResponse = new Error("服务器主题接口未返回有效 revision");
                invalidResponse.status = 502;
                throw invalidResponse;
            }
            if (synced) {
                var index = renderer.__elyricUserPlayerThemes.findIndex(function (item) { return item.id === synced.id; });
                if (index >= 0) { renderer.__elyricUserPlayerThemes[index] = synced; }
                else { renderer.__elyricUserPlayerThemes.push(synced); }
            }
            removeQueuedPlayerThemeV2Operations(theme.id, renderer);
            var conflictCopy = playerThemeV2ResponseValue(record, "conflictCopy", "ConflictCopy", null);
            if (conflictCopy) {
                var copy = normalizeRemotePlayerTheme(conflictCopy);
                if (copy) { renderer.__elyricUserPlayerThemes.push(copy); }
            }
            storePlayerThemeLibrary(renderer);
            syncPlayerThemeLibraryControls(renderer);
            if (playerThemeV2ResponseValue(record, "conflict", "Conflict", false)) {
                updatePlayerThemeLibraryStatus(renderer, "检测到跨设备修改；当前版本已重新读取，你的修改已保留为冲突副本", "error");
            } else {
                updatePlayerThemeLibraryStatus(renderer, "主题“" + synced.name + "”已同步到服务器（revision " + synced.revision + "）", "synced");
            }
            return synced;
        }).catch(function (error) {
            queuePlayerThemeV2Operation(renderer, {
                kind: create ? "theme-create" : "theme-update",
                themeId: theme.id,
                method: method,
                path: path,
                body: body
            });
            updatePlayerThemeLibraryStatus(
                renderer,
                playerThemeV2FailureMessage(error, "主题已保存在本地待同步"),
                "error"
            );
            return null;
        });
    }

    function uploadPlayerThemeV2Asset(renderer, file, kind, lineId) {
        var id = ("font" === kind ? "font-" : "image-") + Date.now().toString(36)
            + "-" + Math.random().toString(36).slice(2, 8);
        var form = new FormData();
        form.append("file", file, file.name);
        updatePreferenceStatus(renderer, "saving", "正在上传私有主题资源…");
        return playerThemeV2ApiRequest(renderer, "POST", PLAYER_ASSETS_PATH + "/" + id, null, form).then(function () {
            ensurePlayerThemeV2State(renderer);
            if ("artwork" === kind) {
                renderer.__elyricThemeV2.artwork.source = "asset";
                renderer.__elyricThemeV2.artwork.assetId = id;
                applyPlayerThemeV2Artwork(renderer);
            } else {
                renderer.__elyricThemeV2.typography[lineId].fontAssetId = id;
                renderer.__elyricThemeV2.typography[lineId].fontUrl = "";
                installPlayerThemeV2Font(renderer, lineId);
            }
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
            updatePreferenceStatus(renderer, "synced", "主题资源已加密隔离到当前 Emby 用户");
        }).catch(function (error) {
            updatePreferenceStatus(renderer, "local", "资源上传失败；未改变当前主题");
            return Promise.reject(error);
        });
    }

    function installPlayerThemeV2Font(renderer, lineId) {
        ensurePlayerThemeV2State(renderer);
        var style = renderer.__elyricThemeV2.typography[lineId];
        var url = style.fontAssetId ? playerThemeV2AssetUrl(renderer, style.fontAssetId) : style.fontUrl;
        if (!url || (style.fontUrl && !/^https:\/\//i.test(style.fontUrl))) { return; }
        var family = "ElyricUserFont-" + lineId + "-" + (style.fontAssetId || "url").replace(/[^a-z0-9_-]/gi, "");
        var styleElement = renderer.__elyricThemeV2FontStyle || document.createElement("style");
        renderer.__elyricThemeV2FontStyle = styleElement;
        if (!styleElement.parentNode) { document.head.appendChild(styleElement); }
        var rules = renderer.__elyricThemeV2FontRules || {};
        rules[lineId] = "@font-face{font-family:'" + family + "';src:url('" + String(url).replace(/[\"'()\\]/g, "") + "') format('woff2');font-display:swap;}";
        renderer.__elyricThemeV2FontRules = rules;
        styleElement.textContent = Object.keys(rules).map(function (key) { return rules[key]; }).join("\n");
        style.fontFamily = "'" + family + "'";
        applyPlayerThemeV2Typography(renderer);
    }

    function legacyRequestUserPlayerPreferences(renderer) {
        if (renderer.__elyricUserPreferencesPromise) {
            return renderer.__elyricUserPreferencesPromise;
        }
        var apiClient = activeApiClient(renderer);
        var userId = apiClient && apiClient.getCurrentUserId
            ? apiClient.getCurrentUserId()
            : null;
        if (!apiClient || !userId || !apiClient.getDisplayPreferences) {
            renderer.__elyricUserPreferencesPromise = Promise.resolve(null);
            return renderer.__elyricUserPreferencesPromise;
        }
        updatePreferenceStatus(renderer, "loading", "正在读取 Emby 账户设置…");
        var legacyPreferencesPromise = Promise.resolve(
            apiClient.getDisplayPreferences(userId)
        ).then(function (displayPreferences) {
            var preferenceMap = displayPreferences
                && (displayPreferences.CustomPrefs || displayPreferences.customPrefs);
            preferenceMap = preferenceMap || displayPreferences || {};
            renderer.__elyricDisplayPreferences = preferenceMap;
            renderer.__elyricPreferenceApiClient = apiClient;
            renderer.__elyricPreferenceUserId = userId;
            var serialized = preferenceMap[PLAYER_PREFERENCES_KEY];
            if (!serialized) {
                updatePreferenceStatus(renderer, "ready", "已连接 Emby 账户；首次修改后自动同步");
                setTimeout(function () {
                    scheduleUserPlayerPreferencesSave(renderer);
                }, 0);
                return null;
            }
            try {
                updatePreferenceStatus(renderer, "synced", "已从 Emby 账户恢复设置");
                return normalizeUserPlayerPreferences(JSON.parse(serialized));
            } catch (error) {
                updatePreferenceStatus(renderer, "ready", "账户设置格式已更新；下次修改将重新同步");
                return null;
            }
        }, function () {
            updatePreferenceStatus(renderer, "local", "账户同步暂不可用；当前设置保存在本浏览器");
            return null;
        });
        renderer.__elyricUserPreferencesPromise = legacyPreferencesPromise.then(function (preferences) {
            ensurePlayerThemeLibrary(renderer);
            var localLegacyThemes = (renderer.__elyricUserPlayerThemes || []).filter(function (theme) {
                return !theme.remoteOnly;
            }).slice(0, MAX_LEGACY_USER_PLAYER_THEMES);
            return requestPlayerThemeV2Workspace(renderer).then(function (workspace) {
                var merged = applyPlayerThemeV2WorkspaceToPreferences(renderer, workspace, preferences || {});
                var legacyThemes = [];
                var legacyIds = {};
                var preferenceThemes = preferences && Array.isArray(preferences.playerThemes)
                    ? preferences.playerThemes
                    : [];
                preferenceThemes.concat(localLegacyThemes).some(function (theme) {
                    if (legacyThemes.length >= MAX_LEGACY_USER_PLAYER_THEMES) { return true; }
                    var normalized = normalizeSavedPlayerTheme(theme, legacyThemes.length);
                    if (!normalized || legacyIds[normalized.id]) { return false; }
                    legacyIds[normalized.id] = true;
                    legacyThemes.push(normalized);
                    return false;
                });
                if (!renderer.__elyricWorkspaceLegacyImported && legacyThemes.length) {
                    Promise.all(legacyThemes.map(function (theme) {
                        return syncNamedPlayerThemeV2(renderer, theme, true);
                    })).then(function () { return persistPlayerThemeV2Workspace(renderer); });
                }
                flushPlayerThemeV2OfflineQueue(renderer);
                updatePreferenceStatus(renderer, "synced", "已从当前 Emby 用户主题库恢复并同步");
                return merged;
            }, function () {
                return preferences;
            });
        });
        return renderer.__elyricUserPreferencesPromise;
    }

    function legacyPersistUserPlayerPreferences(renderer) {
        var apiClient = renderer.__elyricPreferenceApiClient || activeApiClient(renderer);
        var userId = renderer.__elyricPreferenceUserId
            || (apiClient && apiClient.getCurrentUserId ? apiClient.getCurrentUserId() : null);
        if (!apiClient || !userId
            || (!apiClient.updateDisplayPreferences && !apiClient.updatePartialDisplayPreferences)) {
            updatePreferenceStatus(renderer, "local", "当前设置保存在本浏览器");
            return Promise.resolve(false);
        }
        return Promise.resolve(requestUserPlayerPreferences(renderer)).then(function () {
            var displayPreferences = renderer.__elyricDisplayPreferences || {};
            var serialized = JSON.stringify(collectUserPlayerPreferences(renderer));
            displayPreferences[PLAYER_PREFERENCES_KEY] = serialized;
            updatePreferenceStatus(renderer, "saving", "正在同步到 Emby 账户…");
            var saveRequest;
            var supportsPartialSave = false;
            try {
                supportsPartialSave = !!(apiClient.updatePartialDisplayPreferences
                    && apiClient.isMinServerVersion
                    && apiClient.isMinServerVersion("4.9.0.23"));
            } catch (error) {
                supportsPartialSave = false;
            }
            if (supportsPartialSave) {
                var partialPreferences = {};
                partialPreferences[PLAYER_PREFERENCES_KEY] = serialized;
                saveRequest = apiClient.updatePartialDisplayPreferences(partialPreferences, userId);
            } else {
                saveRequest = apiClient.updateDisplayPreferences(displayPreferences, userId);
            }
            return Promise.resolve(saveRequest).then(function () {
                return persistPlayerThemeV2Workspace(renderer).then(function (workspaceSaved) {
                    updatePreferenceStatus(
                        renderer,
                        workspaceSaved ? "synced" : "local",
                        workspaceSaved ? "已同步到当前 Emby 用户主题库" : "已保存本地，等待网络恢复后同步"
                    );
                    return workspaceSaved;
                });
            }, function () {
                updatePreferenceStatus(renderer, "local", "同步失败；当前设置仍保存在本浏览器");
                return false;
            });
        });
    }

    function legacyScheduleUserPlayerPreferencesSave(renderer) {
        if (!renderer || !renderer.__elyricThemeControl || renderer.__elyricApplyingUserPreferences) {
            return;
        }
        var apiClient = activeApiClient(renderer);
        if (!apiClient || !apiClient.getCurrentUserId
            || (!apiClient.updateDisplayPreferences && !apiClient.updatePartialDisplayPreferences)) {
            updatePreferenceStatus(renderer, "local", "当前设置保存在本浏览器");
            return;
        }
        if (renderer.__elyricPreferenceSaveTimer) {
            clearTimeout(renderer.__elyricPreferenceSaveTimer);
        }
        renderer.__elyricPreferenceSaveTimer = setTimeout(function () {
            renderer.__elyricPreferenceSaveTimer = 0;
            persistUserPlayerPreferences(renderer);
        }, PLAYER_PREFERENCES_SAVE_DELAY);
    }

    function readLegacyUserPlayerPreferences(renderer, apiClient, userId) {
        var request = apiClient && apiClient.getDisplayPreferences
            ? Promise.resolve(apiClient.getDisplayPreferences(userId)) : Promise.resolve({});
        return request.then(function (displayPreferences) {
            var map = displayPreferences && (displayPreferences.CustomPrefs || displayPreferences.customPrefs);
            map = map || displayPreferences || {};
            renderer.__elyricDisplayPreferences = map;
            var preferences = null;
            try {
                preferences = map[PLAYER_PREFERENCES_KEY]
                    ? normalizeUserPlayerPreferences(JSON.parse(map[PLAYER_PREFERENCES_KEY])) : null;
            } catch (error) {}
            preferences = preferences || { version: PLAYER_PREFERENCES_VERSION, tuning: {} };
            var legacyDesign = loadCurrentPlayerThemeDesign(renderer, true);
            var legacyThemes = loadStoredPlayerThemes(renderer, true).slice(0, MAX_LEGACY_USER_PLAYER_THEMES);
            if (!preferences.playerThemeDesign && legacyDesign) { preferences.playerThemeDesign = legacyDesign; }
            if (!preferences.playerThemes && legacyThemes.length) { preferences.playerThemes = legacyThemes; }
            return preferences;
        }, function () { return { version: PLAYER_PREFERENCES_VERSION, tuning: {} }; });
    }

    function finalizeUserPlayerPreferencesRestore(renderer, preferences, source) {
        if (preferences) { applyUserPlayerPreferences(renderer, preferences); }
        renderer.__elyricWorkspaceReady = true;
        renderer.__elyricWorkspaceSource = source;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-ready", "true");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-source", source);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-revision", String(renderer.__elyricWorkspaceRevision || 0));
        var scope = playerThemeV2AccountScope(renderer);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-account-scope", scope.key);
        var apiAvailable = ["server", "legacy-import", "conflict"].indexOf(source) >= 0;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-api-available", apiAvailable ? "true" : "false");
        if ("undefined" !== typeof window) {
            window.__elyricPlayerDiagnostics = {
                buildId: PLAYER_BUILD_ID,
                apiAvailable: apiAvailable,
                accountScope: scope.key,
                workspaceRevision: Number(renderer.__elyricWorkspaceRevision || 0),
                schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
                profile: renderer.__elyricThemeV2Profile || currentPlayerThemeV2Profile(),
                rootCount: document.querySelectorAll ? document.querySelectorAll(".elyric-player-root").length : 1,
                syncSource: source,
                workspaceErrorStatus: Number(renderer.__elyricWorkspaceLastErrorStatus || 0),
                workspaceErrorMessage: renderer.__elyricWorkspaceLastErrorMessage || "",
                themeLibraryApiAvailable: !renderer.__elyricThemeLibraryApiError
            };
        }
        if (renderer.__elyricPlayerStage) { renderer.__elyricPlayerStage.removeAttribute("aria-busy"); }
        var statusText = "已使用安全默认主题";
        if ("server" === source) { statusText = "账号已同步"; }
        else if ("offline-cache" === source) { statusText = "已使用本账号离线缓存"; }
        else if ("legacy-import" === source) { statusText = "正在迁移旧设置"; }
        else if ("conflict" === source) { statusText = "revision 冲突：服务端版本继续生效，本地版本已保存为冲突副本"; }
        updatePreferenceStatus(renderer, "server" === source ? "synced" : source, statusText);
        if (renderer.__elyricThemeControl) {
            setTimeout(function () {
                if (renderer.__elyricThemeControl) {
                    syncPlayerPageState(renderer, isThemeContextVisible(renderer));
                }
            }, 0);
        }
        if (renderer.__elyricPendingLayoutRepair && "server" === source) {
            renderer.__elyricPendingLayoutRepair = false;
            setTimeout(function () {
                if (renderer.__elyricThemeControl && renderer.__elyricWorkspaceReady) {
                    persistUserPlayerPreferences(renderer);
                }
            }, 0);
        }
        return preferences;
    }

    function requestUserPlayerPreferences(renderer, force) {
        if (renderer.__elyricUserPreferencesPromise && !force) { return renderer.__elyricUserPreferencesPromise; }
        if (force) { renderer.__elyricWorkspaceWriteBlocked = false; }
        var apiClient = activeApiClient(renderer);
        var scope = playerThemeV2AccountScope(renderer);
        var userId = scope.userId;
        var previousReady = !!renderer.__elyricWorkspaceReady;
        if (renderer.__elyricPreferenceSaveTimer) {
            clearTimeout(renderer.__elyricPreferenceSaveTimer);
            renderer.__elyricPreferenceSaveTimer = 0;
        }
        renderer.__elyricPreferenceApiClient = apiClient;
        renderer.__elyricPreferenceUserId = userId;
        renderer.__elyricWorkspaceReady = false;
        renderer.__elyricWorkspaceSource = "loading";
        renderer.__elyricWorkspaceLastErrorStatus = 0;
        renderer.__elyricWorkspaceLastErrorMessage = "";
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-ready", "false");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-source", "loading");
        if (renderer.__elyricPlayerStage) { renderer.__elyricPlayerStage.setAttribute("aria-busy", "true"); }
        updatePreferenceStatus(renderer, "loading", "正在读取当前 Emby 账号主题…");
        archiveLegacyPlayerThemeV2Queue(renderer);
        if (!apiClient || !apiClient.getUrl || !userId || "anonymous" === userId) {
            renderer.__elyricUserPreferencesPromise = Promise.resolve(
                finalizeUserPlayerPreferencesRestore(renderer, null, "api-unavailable")
            );
            return renderer.__elyricUserPreferencesPromise;
        }
        renderer.__elyricUserPreferencesPromise = requestPlayerThemeV2Workspace(renderer).then(function (workspace) {
            var revision = Number(playerThemeV2ResponseValue(workspace, "revision", "Revision", 0));
            var draftJson = playerThemeV2ResponseValue(workspace, "draftJson", "DraftJson", "{}");
            var legacyImported = !!playerThemeV2ResponseValue(workspace, "legacyImported", "LegacyImported", false);
            var hasDraft = !!draftJson && "{}" !== String(draftJson).trim();
            if (revision > 0 || hasDraft || legacyImported) {
                var authoritative = applyPlayerThemeV2WorkspaceToPreferences(renderer, workspace, {});
                finalizeUserPlayerPreferencesRestore(renderer, authoritative, "server");
                flushPlayerThemeV2OfflineQueue(renderer);
                return authoritative;
            }
            return readLegacyUserPlayerPreferences(renderer, apiClient, userId).then(function (legacy) {
                applyUserPlayerPreferences(renderer, legacy);
                renderer.__elyricWorkspaceSource = "legacy-import";
                setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-source", "legacy-import");
                updatePreferenceStatus(renderer, "loading", "正在一次性迁移旧设置…");
                var legacyThemes = (legacy.playerThemes || []).slice(0, MAX_LEGACY_USER_PLAYER_THEMES);
                return Promise.all(legacyThemes.map(function (theme) {
                    return syncNamedPlayerThemeV2(renderer, theme, true);
                })).then(function () {
                    return persistPlayerThemeV2Workspace(renderer).then(function (saved) {
                        var restoreSource = renderer.__elyricLastWorkspaceConflict
                            ? "conflict" : (saved ? "server" : "legacy-import");
                        finalizeUserPlayerPreferencesRestore(
                            renderer,
                            null,
                            restoreSource
                        );
                        if (saved && "conflict" !== restoreSource) {
                            updatePreferenceStatus(renderer, "synced", "旧设置已一次性迁移到当前账号");
                        }
                        return legacy;
                    });
                });
            });
        }).catch(function (error) {
            renderer.__elyricWorkspaceLastErrorStatus = Number(error && (error.status || error.statusCode) || 0);
            renderer.__elyricWorkspaceLastErrorMessage = String(error && error.message || "Workspace request failed");
            var cached = loadConfirmedPlayerThemeV2Workspace(renderer);
            if (cached) {
                mergeRemotePlayerThemeSummaries(renderer, cached.summaries || []);
                var preferences = applyPlayerThemeV2WorkspaceToPreferences(renderer, cached.workspace, {});
                return finalizeUserPlayerPreferencesRestore(renderer, preferences, "offline-cache");
            }
            var unavailable = 404 === Number(error && (error.status || error.statusCode));
            if (previousReady) {
                renderer.__elyricWorkspaceReady = true;
                renderer.__elyricWorkspaceSource = "pending";
                setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-ready", "true");
                setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-workspace-source", "pending");
                if (renderer.__elyricPlayerStage) { renderer.__elyricPlayerStage.removeAttribute("aria-busy"); }
                updatePreferenceStatus(renderer, "pending", "账号刷新失败；保留当前界面并等待重试");
                return null;
            }
            var restored = finalizeUserPlayerPreferencesRestore(
                renderer,
                null,
                unavailable ? "api-unavailable" : "safe-default"
            );
            updatePreferenceStatus(
                renderer,
                unavailable ? "api-unavailable" : "safe-default",
                playerThemeV2WorkspaceUnavailableStatus(error)
            );
            return restored;
        });
        return renderer.__elyricUserPreferencesPromise;
    }

    function persistUserPlayerPreferences(renderer) {
        if (!renderer || !renderer.__elyricWorkspaceReady) { return Promise.resolve(false); }
        if (renderer.__elyricWorkspaceWriteBlocked) {
            updatePreferenceStatus(renderer, "local", "服务器仍拒绝 Theme V6；当前修改仅保存在本地，请更新插件 DLL 后刷新重试");
            return Promise.resolve(false);
        }
        updatePreferenceStatus(renderer, "saving", "正在同步到当前 Emby 账号…");
        return persistPlayerThemeV2Workspace(renderer).then(function (saved) {
            if (renderer.__elyricWorkspaceWriteBlocked) { return false; }
            if (renderer.__elyricLastWorkspaceConflict) {
                updatePreferenceStatus(renderer, "conflict", "revision 冲突：服务端版本继续生效，本地版本已保存为冲突副本");
            } else {
                updatePreferenceStatus(renderer, saved ? "synced" : "pending", saved ? "账号已同步" : "本地待同步");
            }
            return saved;
        });
    }

    function scheduleUserPlayerPreferencesSave(renderer) {
        if (!renderer || !renderer.__elyricThemeControl || !renderer.__elyricWorkspaceReady
            || renderer.__elyricApplyingUserPreferences) { return; }
        if (renderer.__elyricWorkspaceWriteBlocked) { return; }
        if (renderer.__elyricPreferenceSaveTimer) { clearTimeout(renderer.__elyricPreferenceSaveTimer); }
        updatePreferenceStatus(renderer, "pending", "修改待同步");
        renderer.__elyricPreferenceSaveTimer = setTimeout(function () {
            renderer.__elyricPreferenceSaveTimer = 0;
            persistUserPlayerPreferences(renderer);
        }, PLAYER_PREFERENCES_SAVE_DELAY);
    }

    function applyUserPlayerPreferences(renderer, preferences) {
        if (!preferences) {
            return;
        }
        renderer.__elyricApplyingUserPreferences = true;
        renderer.__elyricLayoutRepairRevision = Number(
            preferences.layoutRepairRevision || renderer.__elyricLayoutRepairRevision || 0
        );
        if (Array.isArray(preferences.playerThemes)) {
            renderer.__elyricUserPlayerThemes = preferences.playerThemes.slice(0, MAX_LEGACY_USER_PLAYER_THEMES);
            storePlayerThemeLibrary(renderer);
        }
        if (preferences.activePlayerThemeId) {
            renderer.__elyricActiveUserPlayerThemeId = preferences.activePlayerThemeId;
        }
        syncPlayerThemeLibraryControls(renderer);
        if (preferences.theme
            && !(renderer.__elyricDisplayConfiguration
                && !renderer.__elyricDisplayConfiguration.allowUserThemeOverride)) {
            applyTheme(renderer, preferences.theme, false);
        }
        if (preferences.layout) {
            applyPlayerLayout(renderer, preferences.layout, false);
        }
        if ("boolean" === typeof preferences.artworkRotation) {
            setArtworkRotation(renderer, preferences.artworkRotation, false);
        }
        if (preferences.backgroundMode) {
            setBackgroundMode(renderer, preferences.backgroundMode, false);
        }
        if (preferences.visualizerStyle) {
            setVisualizerStyle(renderer, preferences.visualizerStyle, false);
        }
        if (isFinite(Number(preferences.visualizerWidth))) {
            setVisualizerWidth(renderer, preferences.visualizerWidth, false);
        }
        if (isFinite(Number(preferences.visualizerHeight))) {
            setVisualizerHeight(renderer, preferences.visualizerHeight, false);
        }
        if (isFinite(Number(preferences.visualizerAmplitude))) {
            setVisualizerAmplitude(renderer, preferences.visualizerAmplitude, false);
        }
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            var preferenceName = "visualizer"
                + definition.id.charAt(0).toUpperCase()
                + definition.id.slice(1);
            if (isFinite(Number(preferences[preferenceName]))) {
                setVisualizerAnalysisSetting(
                    renderer,
                    definition.id,
                    preferences[preferenceName],
                    false
                );
            }
        });
        if (preferences.visualizerColorMode) {
            setVisualizerColorMode(renderer, preferences.visualizerColorMode, false);
        }
        if (preferences.visualizerColors) {
            preferences.visualizerColors.forEach(function (color, index) {
                setVisualizerColor(renderer, index, color, false);
            });
        }
        if (preferences.lyricAlignment) {
            setLyricAlignment(renderer, preferences.lyricAlignment, false);
        }
        if (isFinite(Number(preferences.lyricScale))) {
            setLyricScale(renderer, preferences.lyricScale, false);
        }
        if ("boolean" === typeof preferences.showSecondLine) {
            setSecondLineOverride(renderer, preferences.showSecondLine, false);
        }
        PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
            if (preferences.tuning
                && Object.prototype.hasOwnProperty.call(preferences.tuning, definition.id)) {
                setPlayerTuning(renderer, definition.id, preferences.tuning[definition.id], false);
            }
        });
        if (preferences.playerThemeDesign) {
            applyPlayerThemeDefinition(
                renderer,
                preferences.playerThemeDesign
            );
        } else if ("custom" === renderer.__elyricPlayerLayout && activeUserPlayerTheme(renderer)) {
            applyPlayerThemeDefinition(renderer, activeUserPlayerTheme(renderer));
        } else if ("custom" !== renderer.__elyricPlayerLayout) {
            applyPlayerLayoutPresetDefaults(renderer, renderer.__elyricPlayerLayout);
        }
        renderer.__elyricApplyingUserPreferences = false;
        syncVisualizerAnimation(renderer);
    }

    function loadStoredTheme() {
        try {
            if ("undefined" !== typeof localStorage) {
                var themeId = localStorage.getItem(THEME_STORAGE_KEY);
                if (isKnownTheme(themeId)) {
                    return themeId;
                }
            }
        } catch (error) {
            // Storage can be disabled by browser privacy settings.
        }
        return null;
    }

    function ensureThemeState(renderer) {
        if (renderer.__elyricThemeInitialized) {
            return;
        }
        // Unscoped browser storage is legacy migration input only. The live
        // player starts safely and waits for the authenticated UserWorkspace.
        renderer.__elyricStoredTheme = null;
        renderer.__elyricTheme = "classic";
        renderer.__elyricThemeInitialized = true;
    }

    function storeTheme(themeId) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(THEME_STORAGE_KEY, themeId);
            }
        } catch (error) {
            // Theme switching still works for the current page without storage.
        }
    }

    function isKnownPlayerLayout(layoutId) {
        for (var i = 0; i < PLAYER_LAYOUTS.length; i++) {
            if (PLAYER_LAYOUTS[i].id === layoutId) {
                return true;
            }
        }
        return false;
    }

    function loadStoredPlayerLayout() {
        try {
            if ("undefined" !== typeof localStorage) {
                var layoutId = localStorage.getItem(LAYOUT_STORAGE_KEY);
                if (isKnownPlayerLayout(layoutId)) {
                    return layoutId;
                }
            }
        } catch (error) {
            // The default layout remains usable when browser storage is disabled.
        }
        return "album";
    }

    function storePlayerLayout(layoutId) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(LAYOUT_STORAGE_KEY, layoutId);
            }
        } catch (error) {
            // Layout switching still works for the current lyric view.
        }
    }

    function loadStoredArtworkRotation() {
        try {
            if ("undefined" !== typeof localStorage) {
                return "false" !== localStorage.getItem(ARTWORK_ROTATION_STORAGE_KEY);
            }
        } catch (error) {
            // Circular artwork rotates by default when browser storage is disabled.
        }
        return true;
    }

    function loadStoredBoolean(storageKey, fallback) {
        try {
            if ("undefined" !== typeof localStorage) {
                var value = localStorage.getItem(storageKey);
                if ("true" === value || "false" === value) {
                    return "true" === value;
                }
            }
        } catch (error) {
            // Use the supplied fallback when storage is disabled.
        }
        return !!fallback;
    }

    function storeArtworkRotation(enabled) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(ARTWORK_ROTATION_STORAGE_KEY, enabled ? "true" : "false");
            }
        } catch (error) {
            // The current lyric view can still toggle rotation.
        }
    }

    function knownChoice(items, choiceId, fallback) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === choiceId) {
                return choiceId;
            }
        }
        return fallback;
    }

    function loadVisualizerChoice(storageKey, items, fallback) {
        try {
            if ("undefined" !== typeof localStorage) {
                return knownChoice(items, localStorage.getItem(storageKey), fallback);
            }
        } catch (error) {
            // Visualizer defaults remain available when browser storage is disabled.
        }
        return fallback;
    }

    function storeVisualizerValue(storageKey, value) {
        try {
            if ("undefined" !== typeof localStorage) {
                localStorage.setItem(storageKey, String(value));
            }
        } catch (error) {
            // The current player can still use the visualizer setting.
        }
    }

    function loadVisualizerAmplitude() {
        try {
            if ("undefined" !== typeof localStorage) {
                var value = Number(localStorage.getItem(VISUALIZER_AMPLITUDE_STORAGE_KEY));
                if (isFinite(value) && value >= 25 && value <= 140) {
                    return Math.round(value);
                }
            }
        } catch (error) {
            // Fall through to the balanced default.
        }
        return 70;
    }

    function loadStoredNumber(storageKey, minimum, maximum, fallback) {
        try {
            if ("undefined" !== typeof localStorage) {
                var storedValue = localStorage.getItem(storageKey);
                if (null === storedValue || "" === storedValue) {
                    return fallback;
                }
                var value = Number(storedValue);
                if (isFinite(value) && value >= minimum && value <= maximum) {
                    return Math.round(value);
                }
            }
        } catch (error) {
            // Use the responsive default when browser storage is disabled.
        }
        return fallback;
    }

    function visualizerAnalysisDefinition(settingId) {
        for (var i = 0; i < VISUALIZER_ANALYSIS_DEFINITIONS.length; i++) {
            if (VISUALIZER_ANALYSIS_DEFINITIONS[i].id === settingId) {
                return VISUALIZER_ANALYSIS_DEFINITIONS[i];
            }
        }
        return null;
    }

    function setVisualizerAnalysisSetting(renderer, settingId, value, persist) {
        var definition = visualizerAnalysisDefinition(settingId);
        if (!definition) {
            return;
        }
        value = Number(value);
        if (!isFinite(value)) {
            value = definition.fallback;
        }
        value = Math.min(definition.maximum, Math.max(definition.minimum, value));
        value = Math.round(value / definition.step) * definition.step;
        renderer[definition.property] = value;
        var input = renderer.__elyricVisualizerAnalysisInputs
            && renderer.__elyricVisualizerAnalysisInputs[settingId];
        var output = renderer.__elyricVisualizerAnalysisValues
            && renderer.__elyricVisualizerAnalysisValues[settingId];
        if (input) {
            input.value = String(value);
            input.setAttribute("value", String(value));
        }
        replaceElementText(output, value + definition.valueUnit);
        if ("smoothing" === settingId && renderer.__elyricVisualizerAnalyser) {
            renderer.__elyricVisualizerAnalyser.smoothingTimeConstant = value / 100;
        }
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function visualizerWidthForRange(rangeId) {
        for (var i = 0; i < VISUALIZER_RANGES.length; i++) {
            if (VISUALIZER_RANGES[i].id === rangeId) {
                return VISUALIZER_RANGES[i].width;
            }
        }
        return 62;
    }

    function rangeForVisualizerWidth(width) {
        for (var i = 0; i < VISUALIZER_RANGES.length; i++) {
            if (VISUALIZER_RANGES[i].width === width) {
                return VISUALIZER_RANGES[i].id;
            }
        }
        return "custom";
    }

    function setVisualizerStyle(renderer, styleId, persist) {
        styleId = knownChoice(VISUALIZER_STYLES, styleId, "spectrum");
        renderer.__elyricVisualizerStyle = styleId;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-visualizer-style", styleId);
        setAttributeIfChanged(renderer.__elyricVisualizer, "data-elyric-visualizer-style", styleId);
        syncSegmentedButtons(renderer.__elyricVisualizerStyleButtons, styleId);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function setVisualizerFrequencyLayout(renderer, layoutId, persist) {
        layoutId = normalizePlayerThemeV2Enum(
            layoutId,
            VISUALIZER_FREQUENCY_LAYOUTS.map(function (item) { return item.id; }),
            "centerOut"
        );
        renderer.__elyricVisualizerFrequencyLayout = layoutId;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-frequency-layout", layoutId);
        setAttributeIfChanged(renderer.__elyricVisualizer, "data-elyric-frequency-layout", layoutId);
        var buttons = renderer.__elyricVisualizerFrequencyLayoutButtons || [];
        buttons.forEach(function (button) {
            var active = button.getAttribute("data-elyric-choice") === layoutId;
            setAttributeIfChanged(button, "aria-pressed", active ? "true" : "false");
            setAttributeIfChanged(button, "data-elyric-active", active ? "true" : "false");
        });
        if (renderer.__elyricThemeV2 && renderer.__elyricThemeV2.visualizer) {
            renderer.__elyricThemeV2.visualizer.frequencyLayout = layoutId;
        }
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function setVisualizerRange(renderer, rangeId, persist) {
        rangeId = knownChoice(VISUALIZER_RANGES, rangeId, "wide");
        setVisualizerWidth(renderer, visualizerWidthForRange(rangeId), persist);
    }

    function setVisualizerWidth(renderer, width, persist) {
        width = Math.min(100, Math.max(10, Math.round(Number(width) || 62)));
        renderer.__elyricVisualizerWidth = width;
        renderer.__elyricVisualizerRange = rangeForVisualizerWidth(width);
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-visualizer-range",
            renderer.__elyricVisualizerRange
        );
        setAttributeIfChanged(
            renderer.__elyricVisualizer,
            "data-elyric-visualizer-range",
            renderer.__elyricVisualizerRange
        );
        setDisplayStyle(renderer.__elyricThemeControl, "--elyric-visualizer-width", width + "vw");
        syncSegmentedButtons(renderer.__elyricVisualizerRangeButtons, renderer.__elyricVisualizerRange);
        if (renderer.__elyricVisualizerWidthInput) {
            renderer.__elyricVisualizerWidthInput.value = String(width);
            renderer.__elyricVisualizerWidthInput.setAttribute("value", String(width));
        }
        replaceElementText(renderer.__elyricVisualizerWidthValue, width + "%");
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function setVisualizerHeight(renderer, height, persist) {
        height = Math.min(30, Math.max(2, Math.round(Number(height) || 8)));
        renderer.__elyricVisualizerHeight = height;
        setDisplayStyle(renderer.__elyricThemeControl, "--elyric-visualizer-height", height + "vh");
        if (renderer.__elyricVisualizerHeightInput) {
            renderer.__elyricVisualizerHeightInput.value = String(height);
            renderer.__elyricVisualizerHeightInput.setAttribute("value", String(height));
        }
        replaceElementText(renderer.__elyricVisualizerHeightValue, height + "%");
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function setVisualizerAmplitude(renderer, amplitude, persist) {
        amplitude = Math.min(140, Math.max(25, Math.round(Number(amplitude) || 70)));
        renderer.__elyricVisualizerAmplitude = amplitude;
        setDisplayStyle(renderer.__elyricThemeControl, "--elyric-visualizer-amplitude", amplitude / 100);
        if (renderer.__elyricVisualizerAmplitudeInput) {
            renderer.__elyricVisualizerAmplitudeInput.value = String(amplitude);
            renderer.__elyricVisualizerAmplitudeInput.setAttribute("value", String(amplitude));
        }
        replaceElementText(renderer.__elyricVisualizerAmplitudeValue, amplitude + "%");
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function normalizeHexColor(value, fallback) {
        value = String(value || "").trim();
        if (/^#[0-9a-f]{6}$/i.test(value)) {
            return value.toLowerCase();
        }
        if (/^[0-9a-f]{6}$/i.test(value)) {
            return ("#" + value).toLowerCase();
        }
        return fallback;
    }

    function loadStoredHexColor(storageKey, fallback) {
        try {
            if ("undefined" !== typeof localStorage) {
                return normalizeHexColor(localStorage.getItem(storageKey), fallback);
            }
        } catch (error) {
            // Fall through to the visible default color.
        }
        return fallback;
    }

    function setBackgroundMode(renderer, modeId, persist) {
        modeId = knownChoice(BACKGROUND_MODES, modeId, "blur");
        renderer.__elyricBackgroundMode = modeId;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-background-mode", modeId);
        setAttributeIfChanged(renderer.__elyricSettingsPanel, "data-elyric-background-mode", modeId);
        setAttributeIfChanged(renderer.__elyricMediaPanel, "data-elyric-background-mode", modeId);
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-background-mode", modeId);
        }
        syncSegmentedButtons(renderer.__elyricBackgroundButtons, modeId);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function setVisualizerColorMode(renderer, modeId, persist) {
        modeId = knownChoice(VISUALIZER_COLOR_MODES, modeId, "dual");
        renderer.__elyricVisualizerColorMode = modeId;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-visualizer-color-mode", modeId);
        setAttributeIfChanged(renderer.__elyricSettingsPanel, "data-elyric-visualizer-color-mode", modeId);
        syncSegmentedButtons(renderer.__elyricVisualizerColorModeButtons, modeId);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function setVisualizerColor(renderer, colorIndex, value, persist) {
        var defaults = ["#a8e063", "#56d6c9", "#8b9dff"];
        var color = normalizeHexColor(value, defaults[colorIndex]);
        if (!renderer.__elyricVisualizerColors) {
            renderer.__elyricVisualizerColors = defaults.slice(0);
        }
        renderer.__elyricVisualizerColors[colorIndex] = color;
        setDisplayStyle(renderer.__elyricThemeControl, "--elyric-visualizer-color-" + (colorIndex + 1), color);
        var input = renderer.__elyricVisualizerColorInputs && renderer.__elyricVisualizerColorInputs[colorIndex];
        if (input) {
            input.value = color.toUpperCase();
            input.setAttribute("value", input.value);
            setAttributeIfChanged(input, "aria-invalid", "false");
        }
        var swatch = renderer.__elyricVisualizerColorSwatches && renderer.__elyricVisualizerColorSwatches[colorIndex];
        if (swatch) {
            setDisplayStyle(swatch, "--elyric-swatch-color", color);
        }
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function loadLyricScale(renderer) {
        try {
            if ("undefined" !== typeof localStorage) {
                var value = Number(localStorage.getItem(LYRIC_SCALE_STORAGE_KEY));
                if (isFinite(value) && value >= 70 && value <= 170) {
                    return Math.round(value);
                }
            }
        } catch (error) {
            // Use the configured server size below.
        }
        return renderer.__elyricDisplayConfiguration
            ? renderer.__elyricDisplayConfiguration.fontSizePercent
            : 100;
    }

    function setLyricAlignment(renderer, alignmentId, persist) {
        alignmentId = knownChoice(LYRIC_ALIGNMENTS, alignmentId, "left");
        renderer.__elyricLyricAlignment = alignmentId;
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-alignment", alignmentId);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-alignment", alignmentId);
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-alignment", alignmentId);
        }
        syncSegmentedButtons(renderer.__elyricAlignmentButtons, alignmentId);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function setLyricScale(renderer, scale, persist) {
        scale = Math.min(170, Math.max(70, Math.round(Number(scale) || 100)));
        renderer.__elyricLyricScale = scale;
        setDisplayStyle(renderer.itemsContainer, "--elyric-font-size", scale + "%");
        if (renderer.__elyricLyricScaleInput) {
            renderer.__elyricLyricScaleInput.value = String(scale);
            renderer.__elyricLyricScaleInput.setAttribute("value", String(scale));
        }
        replaceElementText(renderer.__elyricLyricScaleValue, scale + "%");
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function setPlayerTuning(renderer, settingId, value, persist) {
        var definition = playerTuningDefinition(settingId);
        if (!definition) {
            return;
        }
        value = normalizePlayerTuningValue(definition, value);
        if (!renderer.__elyricPlayerTuning) {
            renderer.__elyricPlayerTuning = {};
        }
        renderer.__elyricPlayerTuning[settingId] = value;
        var cssValue = definition.ratio
            ? value / 100
            : definition.percentage
                ? value + "%"
                : value + (definition.cssUnit || "");
        setDisplayStyle(renderer.__elyricThemeControl, definition.cssProperty, cssValue);
        setDisplayStyle(renderer.itemsContainer, definition.cssProperty, cssValue);
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setDisplayStyle(document.body, definition.cssProperty, cssValue);
        }
        var input = renderer.__elyricPlayerTuningInputs
            && renderer.__elyricPlayerTuningInputs[settingId];
        if (input) {
            input.value = String(value);
            input.setAttribute("value", String(value));
        }
        var output = renderer.__elyricPlayerTuningValues
            && renderer.__elyricPlayerTuningValues[settingId];
        replaceElementText(output, value + (definition.valueUnit || ""));
        if ("artworkOuterRadius" === settingId) {
            syncSegmentedButtons(renderer.__elyricArtworkOuterShapeButtons, String(value));
        } else if ("artworkInnerRadius" === settingId) {
            syncSegmentedButtons(renderer.__elyricArtworkInnerShapeButtons, String(value));
        }
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function syncSegmentedButtons(buttons, selectedId, disabled) {
        if (!buttons) {
            return;
        }
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var active = selectedId === button.getAttribute("data-elyric-choice");
            setAttributeIfChanged(button, "aria-pressed", active ? "true" : "false");
            setAttributeIfChanged(button, "data-elyric-active", active ? "true" : "false");
            if ("boolean" === typeof disabled) {
                button.disabled = disabled;
                setAttributeIfChanged(button, "aria-disabled", disabled ? "true" : "false");
            }
        }
    }

    function syncArtworkRotationAvailability(renderer) {
        var button = renderer.__elyricArtworkRotationButton;
        if (!button) {
            return;
        }
        var circular = renderer.__elyricPlayerThemeChoices
            && "single" === renderer.__elyricPlayerThemeChoices.artworkMode;
        button.disabled = !circular;
        setAttributeIfChanged(button, "aria-disabled", circular ? "false" : "true");
        setAttributeIfChanged(
            button,
            "title",
            circular
                ? (renderer.__elyricArtworkRotation ? "停止专辑图旋转" : "开启专辑图旋转")
                : "当前界面不支持封面旋转"
        );
        setAttributeIfChanged(button, "data-elyric-tooltip", button.getAttribute("title"));
    }

    function setArtworkRotation(renderer, enabled, persist) {
        enabled = !!enabled;
        renderer.__elyricArtworkRotation = enabled;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-artwork-rotate",
            enabled ? "true" : "false"
        );
        if (renderer.__elyricArtworkRotationButton) {
            setAttributeIfChanged(
                renderer.__elyricArtworkRotationButton,
                "aria-pressed",
                enabled ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricArtworkRotationButton,
                "data-elyric-active",
                enabled ? "true" : "false"
            );
        }
        syncSegmentedButtons(
            renderer.__elyricArtworkRotationSettingsButtons,
            enabled ? "on" : "off"
        );
        syncArtworkRotationAvailability(renderer);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function getPlayerOverlayFocusableElements(panel) {
        if (!panel || !panel.querySelectorAll) {
            return [];
        }
        var elements = [];
        ["button", "input", "select", "textarea", "a", "[tabindex]"].forEach(function (selector) {
            var matches = panel.querySelectorAll(selector);
            for (var index = 0; index < matches.length; index++) {
                if (elements.indexOf(matches[index]) < 0) {
                    elements.push(matches[index]);
                }
            }
        });
        return elements.filter(function (element) {
            if (!element || element.disabled
                || "-1" === (element.getAttribute && element.getAttribute("tabindex"))
                || null !== (element.getAttribute && element.getAttribute("hidden"))
                || "true" === (element.getAttribute && element.getAttribute("aria-hidden"))) {
                return false;
            }
            if ("a" === element.tagName
                && null === element.getAttribute("href")
                && null === element.getAttribute("tabindex")) {
                return false;
            }
            return !element.getClientRects || element.getClientRects().length > 0;
        });
    }

    function focusPlayerOverlay(panel) {
        var focusable = getPlayerOverlayFocusableElements(panel);
        var target = focusable[0] || panel;
        if (target && target.focus) {
            target.focus();
        }
    }

    function restorePlayerOverlayFocus(panel, button) {
        if (!button || !button.focus) {
            return;
        }
        var activeElement = document.activeElement;
        if (!activeElement
            || activeElement === document.body
            || (panel && panel.contains && panel.contains(activeElement))) {
            button.focus();
        }
    }

    function trapPlayerOverlayFocus(panel, event) {
        if (!panel || !event || "Tab" !== event.key) {
            return false;
        }
        var focusable = getPlayerOverlayFocusableElements(panel);
        if (!focusable.length) {
            return false;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        var activeElement = document.activeElement;
        var shouldWrapBackward = !!event.shiftKey
            && (activeElement === first || !(panel.contains && panel.contains(activeElement)));
        var shouldWrapForward = !event.shiftKey
            && (activeElement === last || !(panel.contains && panel.contains(activeElement)));
        if (!shouldWrapBackward && !shouldWrapForward) {
            return false;
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        (shouldWrapBackward ? last : first).focus();
        return true;
    }

    var PLAYER_OVERLAY_LAYOUTS = {
        media: { minimumWidth: 360, maximumWidth: 480, landscapeHeight: .56, portraitHeight: .54 },
        queue: { minimumWidth: 380, maximumWidth: 460, landscapeHeight: .66, portraitHeight: .66 },
        settings: { minimumWidth: 420, maximumWidth: 560, landscapeHeight: .78, portraitHeight: .78 },
        cast: { minimumWidth: 320, maximumWidth: 420, landscapeHeight: .56, portraitHeight: .56 },
        volume: { minimumWidth: 64, maximumWidth: 96, landscapeHeight: .32, portraitHeight: .32 }
    };

    function playerOverlayParts(renderer, kind) {
        var anchored = renderer.__elyricOverlayAnchors && renderer.__elyricOverlayAnchors[kind];
        if ("media" === kind) {
            return { panel: renderer.__elyricMediaPanel, button: anchored || renderer.__elyricMediaButton };
        }
        if ("queue" === kind) {
            return {
                panel: renderer.__elyricQueuePanel,
                button: anchored || renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.queue
            };
        }
        if ("cast" === kind) {
            return { panel: renderer.__elyricCastPanel, button: anchored || renderer.__elyricPlayerButtons.cast };
        }
        if ("volume" === kind) {
            return { panel: renderer.__elyricVolumePanel, button: anchored || renderer.__elyricPlayerButtons.mute };
        }
        return { panel: renderer.__elyricSettingsPanel, button: anchored || renderer.__elyricSettingsButton };
    }

    function clearPlayerOverlayPosition(renderer, kind, mode) {
        var panel = playerOverlayParts(renderer, kind).panel;
        if (!panel) { return; }
        ["top", "right", "bottom", "left", "width", "height", "max-height", "--elyric-overlay-anchor-tip-x",
            "--elyric-media-anchor-tip-x"].forEach(function (propertyName) {
            if (panel.style && panel.style.removeProperty) { panel.style.removeProperty(propertyName); }
        });
        setAttributeIfChanged(panel, "data-elyric-overlay-kind", kind);
        setAttributeIfChanged(panel, "data-elyric-anchor-mode", mode || "drawer");
        removeAttributeIfPresent(panel, "data-elyric-anchor-placement");
    }

    function positionPlayerOverlay(renderer, kind) {
        var parts = playerOverlayParts(renderer, kind);
        var panel = parts.panel;
        var button = parts.button;
        var spec = PLAYER_OVERLAY_LAYOUTS[kind];
        if (!panel || !spec || !panel.getBoundingClientRect) { return; }
        var viewport = playerThemeV2ViewportRect();
        var overlayStyle = renderer.__elyricThemeV2 && renderer.__elyricThemeV2.overlays || {};
        var margin = normalizePlayerThemeV2Number(overlayStyle.margin, 8, 48, 16);
        var gap = normalizePlayerThemeV2Number(overlayStyle.gap, 4, 32, 12);
        var userHeightRatio = "media" === kind
            ? Math.max(.28, Math.min(.88, Number(renderer.__elyricPlayerTuning
                && renderer.__elyricPlayerTuning.mediaMaxHeight || 72) / 100))
            : 1;
        if (!button || !button.getBoundingClientRect) { return; }
        var buttonRect = button.getBoundingClientRect();
        var panelRect = panel.getBoundingClientRect();
        var configuredSize = overlayStyle.sizes && overlayStyle.sizes[kind] || {};
        var minimumWidth = normalizePlayerThemeV2Number(
            configuredSize.minWidth, 48, spec.maximumWidth, spec.minimumWidth
        );
        var maximumWidth = normalizePlayerThemeV2Number(
            configuredSize.maxWidth, minimumWidth, 720, spec.maximumWidth
        );
        var desiredWidth = Math.min(
            viewport.width - margin * 2,
            Math.max(minimumWidth, Math.min(maximumWidth, Number(panelRect.width) || maximumWidth))
        );
        var profileHeight = "portrait" === currentPlayerThemeV2Profile() ? spec.portraitHeight : spec.landscapeHeight;
        if (isFinite(Number(configuredSize.maxHeight))) {
            profileHeight = Math.min(profileHeight, Number(configuredSize.maxHeight) / 100);
        }
        var contentHeight = Number(panel.scrollHeight) || Number(panelRect.height) || viewport.height * profileHeight;
        if ("volume" === kind) {
            var volumeStyle = renderer.__elyricThemeV2 && renderer.__elyricThemeV2.volume || {};
            desiredWidth = Math.min(viewport.width - margin * 2,
                normalizePlayerThemeV2Number(volumeStyle.popoverWidth, 64, 120, 72));
            contentHeight = normalizePlayerThemeV2Number(volumeStyle.popoverHeight, 160, 360, 240);
        }
        var desiredHeight = Math.min(
            contentHeight,
            viewport.height * Math.min(profileHeight, userHeightRatio),
            viewport.height - margin * 2
        );
        var buttonLeft = Number(buttonRect.left) || 0;
        var buttonRight = Number(buttonRect.right) || buttonLeft + 44;
        var buttonTop = Number(buttonRect.top) || 0;
        var buttonBottom = Number(buttonRect.bottom) || buttonTop + 44;
        var availableAbove = Math.max(0, buttonTop - viewport.top - gap - margin);
        var availableBelow = Math.max(0, viewport.top + viewport.height - buttonBottom - gap - margin);
        var availableLeft = Math.max(0, buttonLeft - viewport.left - gap - margin);
        var availableRight = Math.max(0, viewport.left + viewport.width - buttonRight - gap - margin);
        var preferred = renderer.__elyricOverlayPreferredPlacements
            && renderer.__elyricOverlayPreferredPlacements[kind] || "above";
        var center = (buttonLeft + buttonRight) / 2;
        var centerY = (buttonTop + buttonBottom) / 2;
        var placements = [preferred, "above", "below", "left", "right"].filter(function (placement, index, list) {
            return ["above", "below", "left", "right"].indexOf(placement) >= 0 && list.indexOf(placement) === index;
        });
        var requiredHeight = Math.min(desiredHeight, "volume" === kind ? 120 : 260);
        var requiredWidth = Math.min(desiredWidth, "volume" === kind ? 48 : 260);
        var placement = placements.filter(function (candidate) {
            if ("above" === candidate) { return availableAbove >= requiredHeight; }
            if ("below" === candidate) { return availableBelow >= requiredHeight; }
            if ("left" === candidate) { return availableLeft >= requiredWidth; }
            return availableRight >= requiredWidth;
        })[0];
        if (!placement) {
            placement = placements.sort(function (first, second) {
                var spaces = { above: availableAbove, below: availableBelow, left: availableLeft, right: availableRight };
                return spaces[second] - spaces[first];
            })[0] || "above";
        }
        var verticalPlacement = "above" === placement || "below" === placement;
        var availableHeight = "above" === placement ? availableAbove
            : "below" === placement ? availableBelow : viewport.height - margin * 2;
        var finalHeight = Math.max("volume" === kind ? 96 : 120, Math.min(desiredHeight, availableHeight));
        var left = verticalPlacement
            ? Math.min(viewport.left + viewport.width - desiredWidth - margin,
                Math.max(viewport.left + margin, center - desiredWidth / 2))
            : ("left" === placement ? buttonLeft - gap - desiredWidth : buttonRight + gap);
        var top = verticalPlacement
            ? ("above" === placement
                ? Math.max(viewport.top + margin, buttonTop - gap - finalHeight)
                : Math.min(viewport.top + viewport.height - margin - finalHeight, buttonBottom + gap))
            : Math.min(viewport.top + viewport.height - margin - finalHeight,
                Math.max(viewport.top + margin, centerY - finalHeight / 2));
        panel.style.setProperty("left", Math.round(left) + "px", "important");
        panel.style.setProperty("top", Math.round(top) + "px", "important");
        panel.style.setProperty("right", "auto", "important");
        panel.style.setProperty("bottom", "auto", "important");
        panel.style.setProperty("width", Math.round(desiredWidth) + "px", "important");
        panel.style.setProperty("height", "auto", "important");
        panel.style.setProperty("max-height", Math.round(finalHeight) + "px", "important");
        var renderedRect = panel.getBoundingClientRect();
        var renderedWidth = Math.min(desiredWidth, Math.max(1, Number(renderedRect.width) || desiredWidth));
        var renderedHeight = Math.min(finalHeight, Math.max(1, Number(renderedRect.height) || finalHeight));
        left = verticalPlacement
            ? Math.min(viewport.left + viewport.width - renderedWidth - margin,
                Math.max(viewport.left + margin, center - renderedWidth / 2))
            : ("left" === placement ? buttonLeft - gap - renderedWidth : buttonRight + gap);
        top = verticalPlacement
            ? ("above" === placement
                ? Math.max(viewport.top + margin, buttonTop - gap - renderedHeight)
                : Math.min(viewport.top + viewport.height - margin - renderedHeight, buttonBottom + gap))
            : Math.min(viewport.top + viewport.height - margin - renderedHeight,
                Math.max(viewport.top + margin, centerY - renderedHeight / 2));
        var anchorX = Math.min(renderedWidth - 18, Math.max(18, center - left));
        var anchorY = Math.min(renderedHeight - 18, Math.max(18, centerY - top));
        panel.style.setProperty("left", Math.round(left) + "px", "important");
        panel.style.setProperty("top", Math.round(top) + "px", "important");
        panel.style.setProperty("--elyric-overlay-anchor-tip-x", Math.round(anchorX) + "px");
        panel.style.setProperty("--elyric-overlay-anchor-tip-y", Math.round(anchorY) + "px");
        panel.style.setProperty("--elyric-media-anchor-tip-x", Math.round(anchorX) + "px");
        setAttributeIfChanged(panel, "data-elyric-overlay-kind", kind);
        setAttributeIfChanged(panel, "data-elyric-anchor-mode", "button");
        setAttributeIfChanged(panel, "data-elyric-anchor-placement", placement);
    }

    function repositionPlayerOverlays(renderer) {
        if (renderer.__elyricSettingsOpen) { positionPlayerOverlay(renderer, "settings"); }
        if (renderer.__elyricMediaOpen) { positionPlayerOverlay(renderer, "media"); }
        if (renderer.__elyricQueueOpen) { positionPlayerOverlay(renderer, "queue"); }
        if (renderer.__elyricCastOpen) { positionPlayerOverlay(renderer, "cast"); }
        if (renderer.__elyricVolumeOpen) { positionPlayerOverlay(renderer, "volume"); }
    }

    function createPlayerOverlayManager(renderer) {
        renderer.__elyricOverlayAnchors = renderer.__elyricOverlayAnchors || {};
        renderer.__elyricOverlayPreferredPlacements = renderer.__elyricOverlayPreferredPlacements || {};
        return {
            open: function (options) {
                var kind = options && options.kind;
                if (options && options.anchorElement) {
                    renderer.__elyricOverlayAnchors[kind] = options.anchorElement;
                }
                renderer.__elyricOverlayPreferredPlacements[kind]
                    = options && options.preferredPlacement || "above";
                if ("media" === kind) { setMediaPanelOpen(renderer, true); }
                else if ("queue" === kind) { setQueueOpen(renderer, true); }
                else if ("settings" === kind) { setSettingsPanelOpen(renderer, true); }
                else if ("cast" === kind) { setCastPanelOpen(renderer, true); }
                else if ("volume" === kind) { setVolumePanelOpen(renderer, true); }
                else if ("designer" === kind) {
                    setSettingsPanelOpen(renderer, false, true);
                    setMediaPanelOpen(renderer, false);
                    setQueueOpen(renderer, false);
                    setCastPanelOpen(renderer, false);
                    setVolumePanelOpen(renderer, false);
                    setPlayerThemeV2DesignerOpen(renderer, true);
                }
            },
            close: function (kind) {
                if ("media" === kind) { setMediaPanelOpen(renderer, false); }
                else if ("queue" === kind) { setQueueOpen(renderer, false); }
                else if ("settings" === kind) { setSettingsPanelOpen(renderer, false); }
                else if ("cast" === kind) { setCastPanelOpen(renderer, false); }
                else if ("volume" === kind) { setVolumePanelOpen(renderer, false); }
                else if ("designer" === kind) { setPlayerThemeV2DesignerOpen(renderer, false); }
            },
            reposition: function () { repositionPlayerOverlays(renderer); }
        };
    }

    function requestPlayerOverlayOpen(renderer, kind, anchorElement, preferredPlacement) {
        if (renderer.__elyricOverlayManager) {
            renderer.__elyricOverlayManager.open({
                kind: kind,
                anchorElement: anchorElement,
                preferredPlacement: preferredPlacement || "above"
            });
            return;
        }
        if ("media" === kind) { setMediaPanelOpen(renderer, true); }
        else if ("queue" === kind) { setQueueOpen(renderer, true); }
        else if ("settings" === kind) { setSettingsPanelOpen(renderer, true); }
        else if ("cast" === kind) { setCastPanelOpen(renderer, true); }
        else if ("volume" === kind) { setVolumePanelOpen(renderer, true); }
        else if ("designer" === kind) { setPlayerThemeV2DesignerOpen(renderer, true); }
    }

    function requestPlayerOverlayClose(renderer, kind) {
        if (renderer.__elyricOverlayManager) {
            renderer.__elyricOverlayManager.close(kind);
            return;
        }
        if ("media" === kind) { setMediaPanelOpen(renderer, false); }
        else if ("queue" === kind) { setQueueOpen(renderer, false); }
        else if ("settings" === kind) { setSettingsPanelOpen(renderer, false); }
        else if ("cast" === kind) { setCastPanelOpen(renderer, false); }
        else if ("volume" === kind) { setVolumePanelOpen(renderer, false); }
        else if ("designer" === kind) { setPlayerThemeV2DesignerOpen(renderer, false); }
    }

    function setCastPanelOpen(renderer, open) {
        open = !!open;
        var wasOpen = !!renderer.__elyricCastOpen;
        if (open) {
            setSettingsPanelOpen(renderer, false);
            setMediaPanelOpen(renderer, false);
            if (renderer.__elyricQueueOpen) { setQueueOpen(renderer, false); }
            if (renderer.__elyricVolumeOpen) { setVolumePanelOpen(renderer, false); }
        }
        renderer.__elyricCastOpen = open;
        if (renderer.__elyricCastPanel) {
            if (open) { removeAttributeIfPresent(renderer.__elyricCastPanel, "hidden"); }
            else { setAttributeIfChanged(renderer.__elyricCastPanel, "hidden", "hidden"); }
        }
        var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.cast;
        if (button) { setAttributeIfChanged(button, "aria-expanded", open ? "true" : "false"); }
        syncPlayerOverlayScrim(renderer);
        if (open) {
            renderOwnedCastTargets(renderer); positionPlayerOverlay(renderer, "cast");
            if (!wasOpen) { focusPlayerOverlay(renderer.__elyricCastPanel); }
        } else if (wasOpen) { restorePlayerOverlayFocus(renderer.__elyricCastPanel, button); }
    }

    function setVolumePanelOpen(renderer, open) {
        open = !!open;
        var wasOpen = !!renderer.__elyricVolumeOpen;
        renderer.__elyricVolumeOpen = open;
        if (renderer.__elyricVolumePanel) {
            if (open) { removeAttributeIfPresent(renderer.__elyricVolumePanel, "hidden"); }
            else { setAttributeIfChanged(renderer.__elyricVolumePanel, "hidden", "hidden"); }
        }
        var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.mute;
        if (button) { setAttributeIfChanged(button, "aria-expanded", open ? "true" : "false"); }
        syncPlayerOverlayScrim(renderer);
        if (open) {
            positionPlayerOverlay(renderer, "volume");
            if (!wasOpen) { focusPlayerOverlay(renderer.__elyricVolumePanel); }
        } else if (wasOpen) { restorePlayerOverlayFocus(renderer.__elyricVolumePanel, button); }
    }

    function setSettingsPanelOpen(renderer, open, preserveDesigner) {
        open = !!open;
        var wasOpen = !!renderer.__elyricSettingsOpen;
        if (open) {
            if (renderer.__elyricThemeV2DesignerOpen) {
                setPlayerThemeV2DesignerOpen(renderer, false);
            }
            setMediaPanelOpen(renderer, false);
            if (renderer.__elyricQueueOpen) {
                setQueueOpen(renderer, false);
            }
            if (renderer.__elyricCastOpen) { setCastPanelOpen(renderer, false); }
            if (renderer.__elyricVolumeOpen) { setVolumePanelOpen(renderer, false); }
        }
        renderer.__elyricSettingsOpen = open;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-settings-open",
            open ? "true" : "false"
        );
        if (renderer.__elyricSettingsPanel) {
            if (open) {
                if (!wasOpen) {
                    if (renderer.__elyricSettingsBody) { renderer.__elyricSettingsBody.scrollTop = 0; }
                }
                removeAttributeIfPresent(renderer.__elyricSettingsPanel, "hidden");
                positionPlayerOverlay(renderer, "settings");
            } else {
                setAttributeIfChanged(renderer.__elyricSettingsPanel, "hidden", "hidden");
            }
        }
        if (renderer.__elyricSettingsButton) {
            setAttributeIfChanged(renderer.__elyricSettingsButton, "aria-expanded", open ? "true" : "false");
            setAttributeIfChanged(renderer.__elyricSettingsButton, "data-elyric-active", open ? "true" : "false");
        }
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-settings-open", open ? "true" : "false");
        }
        syncPlayerOverlayScrim(renderer);
        if (open && !wasOpen) {
            focusPlayerOverlay(renderer.__elyricSettingsPanel);
        }
        if (wasOpen && !open) {
            if (renderer.__elyricThemeV2DesignerOpen && !preserveDesigner) {
                setPlayerThemeV2DesignerOpen(renderer, false);
            }
            scrollCurrentLyricIntoView(renderer, false);
            resumeLyricFollowing(renderer, false);
            restorePlayerOverlayFocus(renderer.__elyricSettingsPanel, renderer.__elyricSettingsButton);
        }
    }

    function clearMediaPanelAnchor(renderer, mode) {
        var panel = renderer && renderer.__elyricMediaPanel;
        if (!panel) {
            return;
        }
        ["top", "right", "bottom", "left", "height", "max-height", "--elyric-media-anchor-tip-x"]
            .forEach(function (propertyName) {
                if (panel.style && panel.style.removeProperty) {
                    panel.style.removeProperty(propertyName);
                }
            });
        setAttributeIfChanged(panel, "data-elyric-anchor-mode", mode || "drawer");
        removeAttributeIfPresent(panel, "data-elyric-anchor-placement");
    }

    function positionMediaPanelNearTrigger(renderer) {
        positionPlayerOverlay(renderer, "media");
    }

    function setMediaPanelOpen(renderer, open) {
        open = !!open;
        var wasOpen = !!renderer.__elyricMediaOpen;
        if (open) {
            setSettingsPanelOpen(renderer, false);
            if (renderer.__elyricQueueOpen) {
                setQueueOpen(renderer, false);
            }
            if (renderer.__elyricCastOpen) { setCastPanelOpen(renderer, false); }
            if (renderer.__elyricVolumeOpen) { setVolumePanelOpen(renderer, false); }
        }
        renderer.__elyricMediaOpen = open;
        if (renderer.__elyricMediaPanel) {
            if (open) {
                removeAttributeIfPresent(renderer.__elyricMediaPanel, "hidden");
            } else {
                setAttributeIfChanged(renderer.__elyricMediaPanel, "hidden", "hidden");
            }
        }
        if (renderer.__elyricMediaButton) {
            setAttributeIfChanged(renderer.__elyricMediaButton, "aria-expanded", open ? "true" : "false");
            setAttributeIfChanged(renderer.__elyricMediaButton, "data-elyric-active", open ? "true" : "false");
        }
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-media-open", open ? "true" : "false");
        }
        if (open) {
            positionMediaPanelNearTrigger(renderer);
            refreshMediaInformation(renderer);
        }
        syncPlayerOverlayScrim(renderer);
        if (open && !wasOpen) {
            focusPlayerOverlay(renderer.__elyricMediaPanel);
        }
        if (wasOpen && !open) {
            scrollCurrentLyricIntoView(renderer, false);
            resumeLyricFollowing(renderer, false);
            restorePlayerOverlayFocus(renderer.__elyricMediaPanel, renderer.__elyricMediaButton);
        }
    }

    function syncPlayerOverlayScrim(renderer, pageVisible) {
        var scrim = renderer && renderer.__elyricOverlayScrim;
        if (!scrim) {
            return;
        }
            if (false !== pageVisible
            && (renderer.__elyricSettingsOpen || renderer.__elyricMediaOpen || renderer.__elyricQueueOpen
                || renderer.__elyricCastOpen || renderer.__elyricVolumeOpen)) {
            removeAttributeIfPresent(scrim, "hidden");
        } else {
            setAttributeIfChanged(scrim, "hidden", "hidden");
        }
    }

    function syncSettingsPanelVisibility(renderer, pageVisible) {
        var panel = renderer.__elyricSettingsPanel;
        if (!panel) {
            return;
        }
        if (pageVisible && renderer.__elyricSettingsOpen) {
            removeAttributeIfPresent(panel, "hidden");
        } else {
            setAttributeIfChanged(panel, "hidden", "hidden");
        }
    }

    function syncMediaPanelVisibility(renderer, pageVisible) {
        var panel = renderer.__elyricMediaPanel;
        if (!panel) {
            return;
        }
        if (pageVisible && renderer.__elyricMediaOpen) {
            removeAttributeIfPresent(panel, "hidden");
        } else {
            setAttributeIfChanged(panel, "hidden", "hidden");
        }
    }

    function findPlayerPage(renderer) {
        if (renderer && renderer.__elyricPlayerPage) {
            return renderer.__elyricPlayerPage;
        }
        var element = renderer.itemsContainer;
        while (element) {
            if (element.classList && element.classList.contains("view-videoosd-videoosd")) {
                return element;
            }
            element = element.parentNode;
        }
        return null;
    }

    function hasMeaningfulLyricItems(items) {
        if (!items || !items.length) {
            return false;
        }
        var texts = [];
        items.forEach(function (item) {
            if (item && item.__elyric && item.__elyric.sublines) {
                item.__elyric.sublines.forEach(function (line) {
                    var lineText = String(line && line.text || "").trim();
                    if (lineText) {
                        texts.push(lineText);
                    }
                });
                return;
            }
            var text = String(item && item.Text || "").trim();
            if (text) {
                texts.push(text);
            }
        });
        if (!texts.length) {
            return false;
        }
        var instrumentalPlaceholder = /^(?:纯音乐(?:[，,\s]*(?:请欣赏)?)?|暂无(?:同步)?歌词|没有歌词|无歌词|instrumental|no lyrics)[。.!！]?$/i;
        var hasPlaceholder = texts.some(function (text) {
            return instrumentalPlaceholder.test(text);
        });
        return !(texts.length <= 3 && hasPlaceholder);
    }

    function syncLyricAvailability(renderer) {
        var items = renderer.__elyricItems;
        var hasLyrics = hasMeaningfulLyricItems(items);
        renderer.__elyricHasLyrics = hasLyrics;
        setAttributeIfChanged(
            renderer.itemsContainer,
            "data-elyric-has-lyrics",
            hasLyrics ? "true" : "false"
        );
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-has-lyrics",
            hasLyrics ? "true" : "false"
        );
        if (hasLyrics) { setOwnedLyricStatus(renderer, "ready"); }
        else if (!renderer.__elyricLyricStatusState || "ready" === renderer.__elyricLyricStatusState) {
            setOwnedLyricStatus(renderer, "empty");
        }
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(
                document.body,
                "data-elyric-has-lyrics",
                hasLyrics ? "true" : "false"
            );
        }
    }

    function syncPlayerPageState(renderer, visible) {
        var body = document.body;
        if (!body || !body.classList) {
            return;
        }
        if (visible) {
            body.__elyricPlayerPageOwner = renderer;
            if (!body.classList.contains("elyric-player-active-page")) {
                body.classList.add("elyric-player-active-page");
            }
            setAttributeIfChanged(body, "data-elyric-queue-open", renderer.__elyricQueueOpen ? "true" : "false");
            setAttributeIfChanged(body, "data-elyric-background-mode", renderer.__elyricBackgroundMode || "blur");
            setAttributeIfChanged(body, "data-elyric-alignment", renderer.__elyricLyricAlignment || "left");
            setAttributeIfChanged(body, "data-elyric-settings-open", renderer.__elyricSettingsOpen ? "true" : "false");
            setAttributeIfChanged(body, "data-elyric-media-open", renderer.__elyricMediaOpen ? "true" : "false");
            setAttributeIfChanged(body, "data-elyric-parametric", "true");
            setAttributeIfChanged(
                body,
                "data-elyric-has-lyrics",
                false === renderer.__elyricHasLyrics ? "false" : "true"
            );
            syncPlayerThemePageStyles(renderer, body, true);
        } else if (body.__elyricPlayerPageOwner === renderer) {
            body.__elyricPlayerPageOwner = null;
            if (body.classList.contains("elyric-player-active-page")) {
                body.classList.remove("elyric-player-active-page");
            }
            removeAttributeIfPresent(body, "data-elyric-queue-open");
            removeAttributeIfPresent(body, "data-elyric-background-mode");
            removeAttributeIfPresent(body, "data-elyric-alignment");
            removeAttributeIfPresent(body, "data-elyric-settings-open");
            removeAttributeIfPresent(body, "data-elyric-media-open");
            removeAttributeIfPresent(body, "data-elyric-has-lyrics");
            removeAttributeIfPresent(body, "data-elyric-parametric");
            syncPlayerThemePageStyles(renderer, body, false);
        }
    }

    function applyPlayerLayoutPresetDefaults(renderer, layoutId) {
        var preset = resolvedBuiltInPlayerTheme(layoutId);
        if (!preset) {
            return;
        }
        applyPlayerThemeDefinition(renderer, preset);
    }

    function applyPlayerLayout(renderer, layoutId, persist) {
        layoutId = isKnownPlayerLayout(layoutId) ? layoutId : "album";
        renderer.__elyricPlayerLayout = layoutId;
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-parametric", "true");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-parametric", "true");
        if (renderer.__elyricLayoutSelect) {
            renderer.__elyricLayoutSelect.value = layoutId;
        }
        syncSegmentedButtons(renderer.__elyricLayoutButtons, layoutId);
        if (persist) {
            if ("custom" === layoutId) {
                var savedTheme = activeUserPlayerTheme(renderer) || loadCurrentPlayerThemeDesign(renderer, false);
                if (savedTheme) {
                    applyPlayerThemeDefinition(renderer, savedTheme);
                }
            } else {
                renderer.__elyricActiveUserPlayerThemeId = null;
                applyPlayerLayoutPresetDefaults(renderer, layoutId);
            }
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        if (renderer.__elyricPlayerThemeChoices
            && "coverflow" === renderer.__elyricPlayerThemeChoices.artworkMode) {
            renderer.__elyricCoverflowPreviewAt = 0;
            syncPlayerCoverflowPreview(renderer, true);
        }
        syncArtworkRotationAvailability(renderer);
        syncPlayerPageState(renderer, isThemeContextVisible(renderer));
        syncPlayerThemeLibraryControls(renderer);
        resumeLyricFollowing(renderer, false);
    }

    function applyTheme(renderer, themeId, persist) {
        ensureThemeState(renderer);
        if (persist
            && renderer.__elyricDisplayConfiguration
            && !renderer.__elyricDisplayConfiguration.allowUserThemeOverride) {
            if (renderer.__elyricThemeSelect) {
                renderer.__elyricThemeSelect.value = renderer.__elyricTheme;
            }
            syncSegmentedButtons(renderer.__elyricThemeButtons, renderer.__elyricTheme, true);
            return;
        }
        themeId = isKnownTheme(themeId) ? themeId : "classic";
        renderer.__elyricTheme = themeId;

        var container = renderer.itemsContainer;
        if (renderer.__elyricThemeContainer
            && renderer.__elyricThemeContainer !== container
            && renderer.__elyricThemeContainer.removeAttribute) {
            renderer.__elyricThemeContainer.removeAttribute("data-elyric-theme");
        }
        if (container && container.setAttribute) {
            container.setAttribute("data-elyric-theme", themeId);
            renderer.__elyricThemeContainer = container;
        }
        if (renderer.__elyricThemeSelect) {
            renderer.__elyricThemeSelect.value = themeId;
        }
        syncSegmentedButtons(renderer.__elyricThemeButtons, themeId);
        if (persist) {
            renderer.__elyricStoredTheme = themeId;
            renderer.__elyricUserSelectedTheme = true;
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function setDisplayStyle(container, propertyName, value) {
        if (container && container.style && container.style.setProperty) {
            container.style.setProperty(propertyName, String(value));
        }
    }

    function applyPlayerShellConfiguration(renderer, configuration) {
        var control = renderer.__elyricThemeControl;
        if (!control || !configuration) {
            return;
        }
        if (configuration.useThemeColor && control.style && control.style.removeProperty) {
            control.style.removeProperty("--elyric-highlight-color");
        } else {
            setDisplayStyle(control, "--elyric-highlight-color", configuration.highlightColor);
        }
        setDisplayStyle(control, "--elyric-glow-percent", Math.round(configuration.glowStrength * 100) + "%");
    }

    function applyDisplayConfiguration(renderer, configuration) {
        ensureThemeState(renderer);
        configuration = normalizeDisplayConfiguration(configuration);
        renderer.__elyricDisplayConfiguration = configuration;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-server-theme-schema",
            String(Math.round(Number(configuration.themeSchemaVersion) || 0))
        );

        var container = renderer.itemsContainer;
        if (container) {
            setDisplayStyle(container, "--elyric-font-size", configuration.fontSizePercent + "%");
            setDisplayStyle(container, "--elyric-line-height", configuration.lineHeight);
            setDisplayStyle(container, "--elyric-font-weight", configuration.fontWeight);
            setDisplayStyle(container, "--elyric-pending-opacity", configuration.pendingOpacity);
            setDisplayStyle(container, "--elyric-glow-size", configuration.glowStrength + "em");
            setDisplayStyle(container, "--elyric-glow-percent", Math.round(configuration.glowStrength * 100) + "%");
            setDisplayStyle(container, "--elyric-current-scale", configuration.currentLineScale);
            setDisplayStyle(container, "--elyric-other-lines-opacity", configuration.otherLinesOpacity);
            setDisplayStyle(container, "--elyric-other-lines-blur", configuration.otherLinesBlurPixels + "px");
            if (configuration.useThemeColor && container.style && container.style.removeProperty) {
                container.style.removeProperty("--elyric-highlight-color");
            } else {
                setDisplayStyle(container, "--elyric-highlight-color", configuration.highlightColor);
            }
            if (!renderer.__elyricSecondLineOverridden) {
                setSecondLineOverride(renderer, configuration.showSecondLine);
            } else {
                setSecondLineOverride(renderer, renderer.__elyricLocalShowSecond);
            }
            container.setAttribute(
                "data-elyric-show-third-plus",
                configuration.showThirdAndLaterLines ? "true" : "false"
            );
        }

        var effectiveTheme = configuration.defaultTheme;
        if (renderer.__elyricWorkspaceReady) {
            effectiveTheme = renderer.__elyricTheme || effectiveTheme;
        } else if (configuration.allowUserThemeOverride && renderer.__elyricStoredTheme) {
            effectiveTheme = renderer.__elyricStoredTheme;
        }
        if (!renderer.__elyricWorkspaceReady) { applyTheme(renderer, effectiveTheme, false); }

        if (renderer.__elyricThemeSelect) {
            renderer.__elyricThemeSelect.disabled = !configuration.allowUserThemeOverride;
            renderer.__elyricThemeSelect.setAttribute(
                "aria-disabled",
                configuration.allowUserThemeOverride ? "false" : "true"
            );
        }
        syncSegmentedButtons(
            renderer.__elyricThemeButtons,
            effectiveTheme,
            !configuration.allowUserThemeOverride
        );
        if (renderer.__elyricThemeControl) {
            renderer.__elyricThemeControl.setAttribute(
                "data-elyric-theme-locked",
                configuration.allowUserThemeOverride ? "false" : "true"
            );
        }
        applyPlayerShellConfiguration(renderer, configuration);
        if (renderer.__elyricThemeControl && !renderer.__elyricWorkspaceReady) {
            setLyricScale(renderer, configuration.fontSizePercent, false);
        }
    }

    function ensureDisplayConfiguration(renderer) {
        if (!renderer.__elyricDisplayConfiguration) {
            applyDisplayConfiguration(renderer, null);
        }
        if (renderer.__elyricConfigurationRequested) {
            return;
        }
        var request = requestServerConfiguration(renderer);
        if (!request) {
            return;
        }
        renderer.__elyricConfigurationRequested = true;
        request.then(function (configuration) {
            if (!renderer.__elyricDestroyed) {
                applyDisplayConfiguration(renderer, configuration);
                ensureThemeControl(renderer);
            }
        });
    }

    function removeDisplayConfiguration(renderer) {
        var container = renderer.itemsContainer;
        if (container) {
            container.removeAttribute("data-elyric-show-second");
            container.removeAttribute("data-elyric-show-third-plus");
            if (container.style && container.style.removeProperty) {
    [
                    "--elyric-font-size",
                    "--elyric-line-height",
                    "--elyric-font-weight",
                    "--elyric-pending-opacity",
                    "--elyric-glow-size",
                    "--elyric-glow-percent",
                    "--elyric-current-scale",
                    "--elyric-other-lines-opacity",
                    "--elyric-other-lines-blur",
                    "--elyric-highlight-color"
                ].forEach(function (propertyName) {
                    container.style.removeProperty(propertyName);
                });
            }
        }
        renderer.__elyricDisplayConfiguration = null;
        renderer.__elyricConfigurationRequested = false;
        renderer.__elyricStoredTheme = null;
        renderer.__elyricUserSelectedTheme = false;
        renderer.__elyricThemeInitialized = false;
        renderer.__elyricLocalShowSecond = null;
        renderer.__elyricSecondLineOverridden = false;
        // Share one request between renderers that overlap during page transitions,
        // but fetch again after leaving lyrics so newly saved server settings apply.
        serverConfigurationPromise = null;
    }

    function stopControlEvent(event) {
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
    }

    function replaceElementText(element, value) {
        if (!element) {
            return;
        }
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        element.appendChild(document.createTextNode(null == value ? "" : String(value)));
    }

    function setAttributeIfChanged(element, name, value) {
        value = String(value);
        if (element && element.getAttribute && element.getAttribute(name) !== value) {
            element.setAttribute(name, value);
        }
    }

    function removeAttributeIfPresent(element, name) {
        if (element && element.getAttribute && null !== element.getAttribute(name)) {
            element.removeAttribute(name);
        }
    }

    function formatPlayerTime(ticks) {
        ticks = Number(ticks);
        if (!isFinite(ticks) || ticks < 0) {
            ticks = 0;
        }
        var totalSeconds = Math.floor(ticks / TICKS_PER_SECOND);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor(totalSeconds % 3600 / 60);
        var seconds = totalSeconds % 60;
        return (hours ? hours + ":" + String(minutes).padStart(2, "0") : String(minutes))
            + ":" + String(seconds).padStart(2, "0");
    }


    function setPlayPausePresentation(renderer, playing) {
        renderer.__elyricPlaybackActive = !!playing;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-playback-active",
            playing ? "true" : "false"
        );
        var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.playPause;
        if (!button) {
            return;
        }
        setButtonIcon(button, playing ? "pause" : "play");
        setAttributeIfChanged(button, "aria-label", playing ? "暂停" : "播放");
        setAttributeIfChanged(button, "title", playing ? "暂停" : "播放");
        setAttributeIfChanged(button, "data-elyric-tooltip", playing ? "暂停" : "播放");
        setAttributeIfChanged(button, "data-elyric-playing", playing ? "true" : "false");
        syncVisualizerAnimation(renderer);
    }

    function visualizerGradient(renderer, context, width) {
        var colors = renderer.__elyricVisualizerColors || ["#a8e063", "#56d6c9", "#8b9dff"];
        var mode = renderer.__elyricVisualizerColorMode || "dual";
        if ("solid" === mode || !context.createLinearGradient) {
            return colors[0];
        }
        var gradient = context.createLinearGradient(0, 0, width, 0);
        if ("dual" === mode) {
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(1, colors[1]);
        } else if ("multi" === mode) {
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(.5, colors[1]);
            gradient.addColorStop(1, colors[2]);
        } else {
            ["#ff4d6d", "#ffad3d", "#ffe66d", "#48df9b", "#4db7ff", "#9670ff", "#ff5dcc"]
                .forEach(function (color, index, values) {
                    gradient.addColorStop(index / (values.length - 1), color);
                });
        }
        return gradient;
    }

    function visualizerEnvelope(x, time, phase, amplitude) {
        var taper = .16 + Math.pow(Math.max(0, Math.sin(Math.PI * x)), .72) * .84;
        var pulse = .38
            + Math.sin(time * 1.12 + x * 10.5 + phase) * .13
            + Math.sin(time * .61 - x * 18 + phase * .45) * .09
            + Math.sin(time * 1.86 + x * 4.2) * .045;
        return Math.min(1.12, Math.max(.035, taper * Math.max(.12, pulse) * amplitude));
    }

    function updateVisualizerSourceStatus(renderer, state, text) {
        if (renderer.__elyricVisualizerSourceState === state
            && renderer.__elyricVisualizerSourceText === text) {
            return;
        }
        renderer.__elyricVisualizerSourceState = state;
        renderer.__elyricVisualizerSourceText = text;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-visualizer-source", state);
        setAttributeIfChanged(renderer.__elyricVisualizer, "data-elyric-visualizer-source", state);
        setAttributeIfChanged(renderer.__elyricVisualizerSourceStatus, "data-elyric-state", state);
        replaceElementText(renderer.__elyricVisualizerSourceStatus, text);
    }

    function findVisualizerMediaElement(renderer) {
        var roots = [renderer.__elyricPlayerPage, document.body];
        var elements = [];
        roots.forEach(function (root) {
            if (!root || !root.querySelectorAll) {
                return;
            }
            ["audio", "video"].forEach(function (selector) {
                var matches = root.querySelectorAll(selector);
                for (var i = 0; i < matches.length; i++) {
                    if (elements.indexOf(matches[i]) < 0) {
                        elements.push(matches[i]);
                    }
                }
            });
        });
        var fallback = null;
        for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            var element = elements[elementIndex];
            if (!fallback) {
                fallback = element;
            }
            if (!element.paused && !element.ended) {
                return element;
            }
        }
        return fallback;
    }

    function disconnectVisualizerAnalyser(renderer) {
        if (renderer.__elyricVisualizerAudioSource
            && renderer.__elyricVisualizerAudioSource.disconnect) {
            try {
                renderer.__elyricVisualizerAudioSource.disconnect();
            } catch (error) {
                // A detached media stream source is already safe to discard.
            }
        }
        if (renderer.__elyricVisualizerAnalyser
            && renderer.__elyricVisualizerAnalyser.disconnect) {
            try {
                renderer.__elyricVisualizerAnalyser.disconnect();
            } catch (error) {
                // The analyser never connects to the audio destination.
            }
        }
        renderer.__elyricVisualizerAudioSource = null;
        renderer.__elyricVisualizerAnalyser = null;
        renderer.__elyricVisualizerMediaElement = null;
        renderer.__elyricVisualizerMediaStream = null;
        renderer.__elyricVisualizerFrequencyData = null;
        renderer.__elyricVisualizerWaveformData = null;
        renderer.__elyricVisualizerEnergy = null;
        renderer.__elyricVisualizerRawBands = null;
        renderer.__elyricVisualizerMetrics = null;
        renderer.__elyricVisualizerAgcGain = null;
        renderer.__elyricVisualizerWaveformGain = null;
    }

    function releaseVisualizerAudio(renderer) {
        disconnectVisualizerAnalyser(renderer);
        var audioContext = renderer.__elyricVisualizerAudioContext;
        renderer.__elyricVisualizerAudioContext = null;
        if (audioContext && audioContext.close) {
            try {
                audioContext.close();
            } catch (error) {
                // Closing is best-effort during Emby page transitions.
            }
        }
    }

    function ensureVisualizerAnalyser(renderer) {
        var mediaElement = findVisualizerMediaElement(renderer);
        if (renderer.__elyricVisualizerAnalyser
            && renderer.__elyricVisualizerMediaElement === mediaElement) {
            var currentContext = renderer.__elyricVisualizerAudioContext;
            if (currentContext && "suspended" === currentContext.state && currentContext.resume) {
                Promise.resolve(currentContext.resume()).catch(function () {});
            }
            return true;
        }
        if (renderer.__elyricVisualizerAnalyser
            && renderer.__elyricVisualizerMediaElement !== mediaElement) {
            disconnectVisualizerAnalyser(renderer);
        }
        var now = Date.now();
        if (renderer.__elyricVisualizerAnalyserRetryAt
            && now < renderer.__elyricVisualizerAnalyserRetryAt) {
            return false;
        }
        renderer.__elyricVisualizerAnalyserRetryAt = now + 1500;
        var AudioContextConstructor = "undefined" !== typeof window
            && (window.AudioContext || window.webkitAudioContext);
        var capture = mediaElement
            && (mediaElement.captureStream || mediaElement.mozCaptureStream);
        if (!AudioContextConstructor || !mediaElement || !capture) {
            updateVisualizerSourceStatus(
                renderer,
                "estimated",
                "节奏估算 · 当前播放端未开放媒体流分析"
            );
            return false;
        }
        try {
            disconnectVisualizerAnalyser(renderer);
            var stream = capture.call(mediaElement);
            var audioTracks = stream && stream.getAudioTracks ? stream.getAudioTracks() : [];
            if (!stream || !audioTracks.length) {
                updateVisualizerSourceStatus(renderer, "waiting", "正在等待可分析的音频轨道…");
                return false;
            }
            var audioContext = renderer.__elyricVisualizerAudioContext;
            if (!audioContext || "closed" === audioContext.state) {
                audioContext = new AudioContextConstructor();
                renderer.__elyricVisualizerAudioContext = audioContext;
            }
            var source = audioContext.createMediaStreamSource(stream);
            var analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096;
            analyser.minDecibels = -92;
            analyser.maxDecibels = -12;
            analyser.smoothingTimeConstant = (null != renderer.__elyricVisualizerSmoothing
                ? renderer.__elyricVisualizerSmoothing
                : 25) / 100;
            source.connect(analyser);
            renderer.__elyricVisualizerMediaElement = mediaElement;
            renderer.__elyricVisualizerMediaStream = stream;
            renderer.__elyricVisualizerAudioSource = source;
            renderer.__elyricVisualizerAnalyser = analyser;
            renderer.__elyricVisualizerAnalyserRetryAt = 0;
            if ("suspended" === audioContext.state && audioContext.resume) {
                Promise.resolve(audioContext.resume()).catch(function () {});
            }
            updateVisualizerSourceStatus(renderer, "live", "实时音频 · 低延迟分析中");
            return true;
        } catch (error) {
            disconnectVisualizerAnalyser(renderer);
            updateVisualizerSourceStatus(renderer, "estimated", "节奏估算 · 实时分析暂不可用");
            return false;
        }
    }

    function visualizerMediaIsSilent(renderer) {
        var mediaElement = renderer.__elyricVisualizerMediaElement || findVisualizerMediaElement(renderer);
        return !!(mediaElement && (mediaElement.paused || mediaElement.ended
            || mediaElement.muted || 0 === Number(mediaElement.volume)));
    }

    function readVisualizerWaveform(renderer, analyser) {
        if (!analyser || !analyser.getByteTimeDomainData) { return null; }
        if (!renderer.__elyricVisualizerWaveformData
            || renderer.__elyricVisualizerWaveformData.length !== analyser.fftSize) {
            renderer.__elyricVisualizerWaveformData = new Uint8Array(analyser.fftSize);
        }
        analyser.getByteTimeDomainData(renderer.__elyricVisualizerWaveformData);
        var energy = 0;
        var peak = 0;
        for (var i = 0; i < renderer.__elyricVisualizerWaveformData.length; i++) {
            var value = (renderer.__elyricVisualizerWaveformData[i] - 128) / 128;
            energy += value * value;
            peak = Math.max(peak, Math.abs(value));
        }
        return {
            data: renderer.__elyricVisualizerWaveformData,
            rms: Math.sqrt(energy / Math.max(1, renderer.__elyricVisualizerWaveformData.length)),
            peak: peak
        };
    }

    function visualizerLogBandBounds(index, bandCount, minimumFrequency, maximumFrequency,
        fftSize, sampleRate, frequencyBinCount) {
        var startRatio = index / bandCount;
        var endRatio = (index + 1) / bandCount;
        var startFrequency = minimumFrequency
            * Math.pow(maximumFrequency / minimumFrequency, startRatio);
        var endFrequency = minimumFrequency
            * Math.pow(maximumFrequency / minimumFrequency, endRatio);
        var startBinFloat = Math.max(1, Math.min(
            frequencyBinCount - 1,
            startFrequency * fftSize / sampleRate
        ));
        var endBinFloat = Math.max(startBinFloat + .001, Math.min(
            frequencyBinCount,
            endFrequency * fftSize / sampleRate
        ));
        return {
            startFrequency: startFrequency,
            endFrequency: endFrequency,
            startBinFloat: startBinFloat,
            endBinFloat: endBinFloat
        };
    }

    function visualizerLogBands(renderer, analyser, bandCount, amplitude) {
        if (!renderer.__elyricVisualizerFrequencyData
            || renderer.__elyricVisualizerFrequencyData.length !== analyser.frequencyBinCount) {
            renderer.__elyricVisualizerFrequencyData = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(renderer.__elyricVisualizerFrequencyData);
        var audioContext = renderer.__elyricVisualizerAudioContext;
        var sampleRate = audioContext && Number(audioContext.sampleRate) || 48000;
        var nyquist = sampleRate / 2;
        var minimumFrequency = Math.max(20, Math.min(
            Number(renderer.__elyricVisualizerMinFrequency) || 30,
            nyquist - 100
        ));
        var maximumFrequency = Math.max(minimumFrequency * 2, Math.min(
            Number(renderer.__elyricVisualizerMaxFrequency) || 16000,
            nyquist
        ));
        var sensitivity = (renderer.__elyricVisualizerSensitivity || 125) / 100;
        var bassBoost = (null != renderer.__elyricVisualizerBassBoost
            ? renderer.__elyricVisualizerBassBoost
            : 100) / 100;
        var rawBands = new Array(bandCount);
        var frequencies = new Array(bandCount);
        var framePeak = 0;
        var i;
        for (i = 0; i < bandCount; i++) {
            var bounds = visualizerLogBandBounds(
                i, bandCount, minimumFrequency, maximumFrequency,
                analyser.fftSize, sampleRate, analyser.frequencyBinCount
            );
            var startFrequency = bounds.startFrequency;
            var endFrequency = bounds.endFrequency;
            var startBinFloat = bounds.startBinFloat;
            var endBinFloat = bounds.endBinFloat;
            var firstBin = Math.max(1, Math.floor(startBinFloat));
            var lastBin = Math.min(analyser.frequencyBinCount - 1, Math.ceil(endBinFloat));
            var total = 0;
            var weightTotal = 0;
            var peak = 0;
            for (var binIndex = firstBin; binIndex <= lastBin; binIndex++) {
                var overlap = Math.max(0, Math.min(endBinFloat, binIndex + 1) - Math.max(startBinFloat, binIndex));
                if (!overlap && firstBin === lastBin) { overlap = 1; }
                var binValue = renderer.__elyricVisualizerFrequencyData[binIndex] || 0;
                var nextValue = renderer.__elyricVisualizerFrequencyData[Math.min(
                    analyser.frequencyBinCount - 1,
                    binIndex + 1
                )] || binValue;
                var interpolated = binValue + (nextValue - binValue) * .5;
                total += interpolated * overlap;
                weightTotal += overlap;
                peak = Math.max(peak, interpolated);
            }
            var average = total / Math.max(.001, weightTotal);
            var raw = (average * .72 + peak * .28) / 255;
            raw = Math.max(0, (raw - .018) / .982);
            var normalizedFrequency = bandCount > 1 ? i / (bandCount - 1) : 0;
            var spectralTilt = .72 + Math.pow(normalizedFrequency, .58) * .78;
            var lowFrequencyGain = 1
                + (bassBoost - 1) * Math.pow(1 - normalizedFrequency, 1.85);
            rawBands[i] = Math.pow(raw, .72) * spectralTilt * lowFrequencyGain;
            frequencies[i] = Math.sqrt(startFrequency * endFrequency);
            framePeak = Math.max(framePeak, rawBands[i]);
        }
        var targetGain = framePeak > .008
            ? Math.min(5.2, Math.max(.72, .82 / framePeak))
            : .72;
        var previousGain = Number(renderer.__elyricVisualizerAgcGain);
        if (!isFinite(previousGain) || previousGain <= 0) { previousGain = 1; }
        var gainRate = targetGain < previousGain ? .12 : .018;
        var agcGain = previousGain + (targetGain - previousGain) * gainRate;
        renderer.__elyricVisualizerAgcGain = agcGain;

        var previousRaw = renderer.__elyricVisualizerRawBands;
        var currentRaw = rawBands.slice(0);
        var flux = 0;
        var low = 0;
        var middle = 0;
        var high = 0;
        var lowCount = 0;
        var middleCount = 0;
        var highCount = 0;
        for (i = 0; i < bandCount; i++) {
            var energy = Math.min(1.25, rawBands[i] * agcGain * sensitivity * amplitude);
            flux += Math.max(0, rawBands[i] - (previousRaw && previousRaw[i] || 0));
            rawBands[i] = energy;
            if (frequencies[i] < 250) { low += energy; lowCount++; }
            else if (frequencies[i] < 4000) { middle += energy; middleCount++; }
            else { high += energy; highCount++; }
        }
        renderer.__elyricVisualizerRawBands = currentRaw;
        renderer.__elyricVisualizerMetrics = renderer.__elyricVisualizerMetrics || {};
        renderer.__elyricVisualizerMetrics.low = low / Math.max(1, lowCount);
        renderer.__elyricVisualizerMetrics.mid = middle / Math.max(1, middleCount);
        renderer.__elyricVisualizerMetrics.high = high / Math.max(1, highCount);
        renderer.__elyricVisualizerMetrics.flux = flux / Math.max(1, bandCount);
        return rawBands;
    }

    function mapVisualizerFrequencyLayout(values, count, layoutId) {
        var samples = new Array(count);
        var i;
        if ("centerOut" === layoutId) {
            var half = Math.ceil(count / 2);
            for (i = 0; i < half; i++) {
                var sourceIndex = Math.min(values.length - 1, i);
                var mirroredValue = values[sourceIndex] || 0;
                samples[half - 1 - i] = mirroredValue;
                samples[count - half + i] = mirroredValue;
            }
            return samples;
        }
        for (i = 0; i < count; i++) {
            samples[i] = values[Math.min(values.length - 1, i)] || 0;
        }
        return samples;
    }

    if ("undefined" !== typeof window) {
        window.__elyricVisualizerV5 = {
            logBandBounds: visualizerLogBandBounds,
            mapFrequencyLayout: mapVisualizerFrequencyLayout
        };
    }

    function visualizerSamples(renderer, count, time, amplitude, waveform) {
        count = Math.max(2, Math.round(count));
        var analyser = ensureVisualizerAnalyser(renderer) ? renderer.__elyricVisualizerAnalyser : null;
        var samples = new Array(count);
        var i;
        if (analyser) {
            var waveformData = readVisualizerWaveform(renderer, analyser);
            renderer.__elyricVisualizerMetrics = renderer.__elyricVisualizerMetrics || {};
            renderer.__elyricVisualizerMetrics.rms = waveformData ? waveformData.rms : 0;
            renderer.__elyricVisualizerMetrics.peak = waveformData ? waveformData.peak : 0;
            var silent = visualizerMediaIsSilent(renderer)
                || (waveformData && waveformData.rms < .0015 && waveformData.peak < .004);
            if (waveform && waveformData) {
                var targetWaveformGain = waveformData.rms > .004
                    ? Math.min(4.8, Math.max(.8, .2 / waveformData.rms))
                    : .8;
                var waveformGain = Number(renderer.__elyricVisualizerWaveformGain);
                if (!isFinite(waveformGain) || waveformGain <= 0) { waveformGain = 1; }
                waveformGain += (targetWaveformGain - waveformGain)
                    * (targetWaveformGain < waveformGain ? .12 : .022);
                renderer.__elyricVisualizerWaveformGain = waveformGain;
                for (i = 0; i < count; i++) {
                    var waveformIndex = Math.min(
                        waveformData.data.length - 1,
                        Math.round(i / (count - 1) * (waveformData.data.length - 1))
                    );
                    samples[i] = silent ? 0 : (waveformData.data[waveformIndex] - 128)
                        / 128 * waveformGain * amplitude;
                }
                return samples;
            }
            var layoutId = renderer.__elyricVisualizerFrequencyLayout || "centerOut";
            var bandCount = "centerOut" === layoutId ? Math.max(2, Math.ceil(count / 2)) : count;
            var rawBands = visualizerLogBands(renderer, analyser, bandCount, amplitude);
            var targets = mapVisualizerFrequencyLayout(rawBands, count, layoutId);
            if (!renderer.__elyricVisualizerEnergy
                || renderer.__elyricVisualizerEnergy.length !== count) {
                renderer.__elyricVisualizerEnergy = new Array(count).fill(0);
            }
            var response = (renderer.__elyricVisualizerResponse || 80) / 100;
            for (i = 0; i < count; i++) {
                var target = silent ? 0 : targets[i];
                var previous = renderer.__elyricVisualizerEnergy[i] || 0;
                var rate = target > previous ? .32 + response * .56 : .07 + response * .3;
                samples[i] = previous + (target - previous) * rate;
                renderer.__elyricVisualizerEnergy[i] = samples[i];
            }
            if ("centerOut" === layoutId) {
                for (i = 0; i < Math.floor(count / 2); i++) {
                    var pair = count - 1 - i;
                    var symmetric = (samples[i] + samples[pair]) / 2;
                    samples[i] = symmetric;
                    samples[pair] = symmetric;
                    renderer.__elyricVisualizerEnergy[i] = symmetric;
                    renderer.__elyricVisualizerEnergy[pair] = symmetric;
                }
            }
            return samples;
        }
        if (!renderer.__elyricPlaybackActive) {
            for (i = 0; i < count; i++) { samples[i] = 0; }
            return samples;
        }
        var estimatedLayout = renderer.__elyricVisualizerFrequencyLayout || "centerOut";
        var estimatedCount = "centerOut" === estimatedLayout ? Math.max(2, Math.ceil(count / 2)) : count;
        var estimatedBands = new Array(estimatedCount);
        for (i = 0; i < estimatedCount; i++) {
            var estimatedX = i / (estimatedCount - 1);
            estimatedBands[i] = visualizerEnvelope(estimatedX, time, i % 7 * .17, amplitude);
        }
        if (waveform) {
            for (i = 0; i < count; i++) {
                var x = i / (count - 1);
                samples[i] = Math.sin(time * 4.8 + x * 18)
                    * visualizerEnvelope(x, time, .6, amplitude) * .62;
            }
            return samples;
        }
        return mapVisualizerFrequencyLayout(estimatedBands, count, estimatedLayout);
    }

    function drawVisualizerFrame(renderer, timestamp) {
        var canvas = renderer.__elyricVisualizerCanvas;
        if (!canvas || !canvas.getContext || !canvas.getBoundingClientRect) {
            return;
        }
        var context = renderer.__elyricVisualizerContext || canvas.getContext("2d");
        if (!context) {
            return;
        }
        renderer.__elyricVisualizerContext = context;
        var rect = canvas.getBoundingClientRect();
        var width = Math.max(1, Math.round(rect.width || 720));
        var height = Math.max(1, Math.round(rect.height || 90));
        var pixelRatio = "undefined" !== typeof window && window.devicePixelRatio
            ? Math.min(2, Math.max(1, window.devicePixelRatio))
            : 1;
        var targetWidth = Math.round(width * pixelRatio);
        var targetHeight = Math.round(height * pixelRatio);
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);
        var styleId = renderer.__elyricVisualizerStyle || "spectrum";
        var amplitude = (renderer.__elyricVisualizerAmplitude || 100) / 100;
        var time = Number(timestamp || 0) / 1000;
        var paint = visualizerGradient(renderer, context, width);
        var baseline = height * .54;
        var count;
        var i;
        var x;
        var value;
        var density = renderer.__elyricVisualizerDensity || 56;

        context.fillStyle = paint;
        context.strokeStyle = paint;
        context.globalAlpha = .92;
        context.lineCap = "round";
        context.lineJoin = "round";

        if ("waveform" === styleId) {
            context.lineWidth = Math.max(1.4, height * .02);
            context.beginPath();
            count = Math.max(48, density * 2);
            var waveformSamples = visualizerSamples(renderer, count, time, amplitude, true);
            for (i = 0; i < count; i++) {
                x = i / (count - 1);
                var waveformY = baseline + waveformSamples[i] * height * .37;
                if (i) {
                    context.lineTo(x * width, waveformY);
                } else {
                    context.moveTo(0, waveformY);
                }
            }
            context.stroke();
        } else if ("curve" === styleId) {
            context.lineWidth = Math.max(1.4, height * .018);
            count = Math.max(32, density);
            var curveSamples = visualizerSamples(renderer, count, time, amplitude, false);
            for (var curveIndex = 0; curveIndex < 3; curveIndex++) {
                context.globalAlpha = .9 - curveIndex * .22;
                context.beginPath();
                for (i = 0; i < count; i++) {
                    x = i / (count - 1);
                    value = curveSamples[i];
                    var curveEnergy = Math.pow(Math.max(0, value), .66);
                    var curveY = height * (.54 + (curveIndex - 1) * .1)
                        - Math.sin(x * 7 + curveIndex * .85)
                            * height * (.055 + curveEnergy * .35);
                    if (i) {
                        context.lineTo(x * width, curveY);
                    } else {
                        context.moveTo(0, curveY);
                    }
                }
                context.stroke();
            }
        } else if ("line" === styleId) {
            context.lineWidth = Math.max(1.5, height * .02);
            context.beginPath();
            count = Math.max(24, density);
            var lineSamples = visualizerSamples(renderer, count, time, amplitude, false);
            for (i = 0; i < count; i++) {
                x = i / (count - 1);
                value = lineSamples[i];
                var lineY = baseline - Math.pow(Math.max(0, value), .72) * height * .78;
                if (i) {
                    context.lineTo(x * width, lineY);
                } else {
                    context.moveTo(0, lineY);
                }
            }
            context.stroke();
        } else if ("chroma" === styleId) {
            count = Math.max(32, Math.round(density * .82));
            var chromaSamples = visualizerSamples(renderer, count, time, amplitude, false);
            var chromaSlot = width / count;
            context.lineCap = "round";
            for (i = 0; i < count; i++) {
                x = (i + .5) / count;
                value = chromaSamples[i];
                var chromaEnergy = Math.pow(Math.max(0, value), .66);
                var chromaHeight = Math.max(2, chromaEnergy * height * .88);
                var chromaX = i * chromaSlot + chromaSlot / 2;
                context.globalAlpha = .18 + chromaEnergy * .58;
                context.lineWidth = Math.max(2.2, Math.min(9, chromaSlot * .74));
                context.beginPath();
                context.moveTo(chromaX, baseline - chromaHeight * .62);
                context.lineTo(chromaX, baseline + chromaHeight * .62);
                context.stroke();
                context.globalAlpha = .82;
                context.lineWidth = Math.max(1.4, Math.min(5.5, chromaSlot * .4));
                context.beginPath();
                context.moveTo(chromaX, baseline - chromaHeight * .42);
                context.lineTo(chromaX, baseline + chromaHeight * .42);
                context.stroke();
            }
            context.globalAlpha = .92;
        } else if ("balls" === styleId) {
            count = Math.max(24, Math.round(density * .58));
            var ballSamples = visualizerSamples(renderer, count, time, amplitude, false);
            context.shadowColor = renderer.__elyricVisualizerColors
                && renderer.__elyricVisualizerColors[0]
                ? renderer.__elyricVisualizerColors[0]
                : "#a8e063";
            if ("radial" === (renderer.__elyricVisualizerFrequencyLayout || "centerOut")) {
                var radialMetrics = renderer.__elyricVisualizerMetrics || {};
                var radialBase = Math.min(width, height) * (.16 + (radialMetrics.low || 0) * .08);
                for (i = 0; i < count; i++) {
                    value = ballSamples[i];
                    var radialEnergy = Math.pow(Math.max(0, value), .64);
                    var angle = -Math.PI / 2 + i / count * Math.PI * 2;
                    var radialDistance = radialBase
                        + radialEnergy * Math.min(width * .18, height * .32);
                    var radialX = width / 2 + Math.cos(angle) * radialDistance;
                    var radialY = baseline + Math.sin(angle) * radialDistance * .72;
                    var radialRadius = Math.max(1.5, Math.min(5.2, 1.8 + radialEnergy * 3.4));
                    context.globalAlpha = .32 + radialEnergy * .66;
                    context.shadowBlur = radialRadius * (1.3 + radialEnergy * 2.2);
                    context.beginPath();
                    context.arc(radialX, radialY, radialRadius, 0, Math.PI * 2);
                    context.fill();
                }
            } else for (i = 0; i < count; i++) {
                x = i / (count - 1);
                value = ballSamples[i];
                var ballEnergy = Math.pow(Math.max(0, value), .62);
                var baseRadius = Math.max(1.7, Math.min(3.6, height * .075, width / count * .31));
                var radius = baseRadius * (.82 + ballEnergy * .32);
                var particleGap = radius * 2.65;
                var particleSpan = ballEnergy * height * .46;
                var particleRows = Math.max(0, Math.floor(particleSpan / particleGap));
                context.shadowBlur = radius * (1.2 + ballEnergy * 2.1);
                for (var particleRow = 0; particleRow <= particleRows; particleRow++) {
                    var particleAlpha = Math.max(.2, .92 - particleRow / Math.max(2, particleRows + 1) * .62);
                    context.globalAlpha = particleAlpha;
                    context.beginPath();
                    context.arc(
                        x * width,
                        baseline - particleRow * particleGap,
                        radius,
                        0,
                        Math.PI * 2
                    );
                    context.fill();
                    if (particleRow) {
                        context.globalAlpha = particleAlpha * .62;
                        context.beginPath();
                        context.arc(
                            x * width,
                            baseline + particleRow * particleGap,
                            Math.max(1.1, radius * .72),
                            0,
                            Math.PI * 2
                        );
                        context.fill();
                    }
                }
                if (particleSpan > radius * 1.15) {
                    context.globalAlpha = .96;
                    context.beginPath();
                    context.arc(x * width, baseline - particleSpan, radius * 1.08, 0, Math.PI * 2);
                    context.fill();
                    context.globalAlpha = .58;
                    context.beginPath();
                    context.arc(x * width, baseline + particleSpan, radius * .76, 0, Math.PI * 2);
                    context.fill();
                }
            }
            context.shadowBlur = 0;
            context.globalAlpha = .92;
        } else if ("pulse" === styleId) {
            count = Math.max(24, Math.round(density * .7));
            visualizerSamples(renderer, count, time, amplitude, false);
            var pulseMetrics = renderer.__elyricVisualizerMetrics || {};
            var pulseEnergy = Math.pow(Math.max(
                0,
                (pulseMetrics.low || 0) * .78 + (pulseMetrics.flux || 0) * 2.4
            ), .58);
            for (i = 0; i < 5; i++) {
                context.globalAlpha = .55 - i * .09;
                context.lineWidth = Math.max(1.2, height * (.035 - i * .004));
                context.beginPath();
                context.arc(
                    width / 2,
                    baseline,
                    Math.max(4, height * (.07 + i * .072) + pulseEnergy * height * .34),
                    0,
                    Math.PI * 2
                );
                context.stroke();
            }
        } else {
            count = Math.max(24, density);
            var slot = width / count;
            var barWidth = Math.max(2, Math.min(7, slot * .44));
            var barSamples = visualizerSamples(renderer, count, time, amplitude, false);
            if (!renderer.__elyricVisualizerPeaks || renderer.__elyricVisualizerPeaks.length !== count) {
                renderer.__elyricVisualizerPeaks = new Array(count).fill(0);
            }
            context.globalAlpha = .13;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(0, baseline);
            context.lineTo(width, baseline);
            context.stroke();
            context.globalAlpha = .72;
            context.lineWidth = barWidth;
            context.lineCap = "round";
            for (i = 0; i < count; i++) {
                x = (i + .5) / count;
                value = barSamples[i];
                var barHeight = Math.max(2, Math.pow(Math.max(0, value), .68) * height * .78);
                var centerX = i * slot + slot / 2;
                context.beginPath();
                if ("mirror" === styleId) {
                    context.moveTo(centerX, baseline - barHeight / 2);
                    context.lineTo(centerX, baseline + barHeight / 2);
                } else {
                    context.moveTo(centerX, height * .9);
                    context.lineTo(centerX, height * .9 - barHeight);
                }
                context.stroke();
                if ("fall" === styleId) {
                    renderer.__elyricVisualizerPeaks[i] = Math.max(
                        barHeight,
                        renderer.__elyricVisualizerPeaks[i] - Math.max(.7, height * .009)
                    );
                    context.globalAlpha = .48;
                    context.beginPath();
                    context.arc(
                        centerX,
                        height * .9 - renderer.__elyricVisualizerPeaks[i] - 3,
                        Math.max(1.2, barWidth * .28),
                        0,
                        Math.PI * 2
                    );
                    context.fill();
                    context.globalAlpha = .72;
                }
            }
        }
        context.globalAlpha = 1;
    }

    function syncVisualizerAnimation(renderer) {
        if (renderer.__elyricVisualizerFrameId) {
            cancelAnimationFrame(renderer.__elyricVisualizerFrameId);
            renderer.__elyricVisualizerFrameId = 0;
        }
        var canvas = renderer.__elyricVisualizerCanvas;
        if (!canvas || !canvas.getContext || false === renderer.__elyricVisualizerEnabled) {
            if (renderer.__elyricVisualizer) { renderer.__elyricVisualizer.setAttribute("data-elyric-disabled", "true"); }
            return;
        }
        if (renderer.__elyricVisualizer) { renderer.__elyricVisualizer.setAttribute("data-elyric-disabled", "false"); }
        var reducedMotion = "undefined" !== typeof window
            && window.matchMedia
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
        function hasResidualEnergy() {
            return !!(renderer.__elyricVisualizerEnergy
                && renderer.__elyricVisualizerEnergy.some(function (value) { return Math.abs(value) > .002; }));
        }
        if ((!renderer.__elyricPlaybackActive && !hasResidualEnergy())
            || reducedMotion
            || (renderer.__elyricThemeControl
                && null !== renderer.__elyricThemeControl.getAttribute("hidden"))) {
            return;
        }
        var step = function (timestamp) {
            renderer.__elyricVisualizerFrameId = 0;
            if (!renderer.__elyricVisualizerCanvas
                || (!renderer.__elyricPlaybackActive && !hasResidualEnergy())) {
                return;
            }
            drawVisualizerFrame(renderer, timestamp);
            renderer.__elyricVisualizerFrameId = requestAnimationFrame(step);
        };
        renderer.__elyricVisualizerFrameId = requestAnimationFrame(step);
    }

    function renderOwnedQueue(renderer) {
        var panel = renderer.__elyricQueuePanel;
        var bridge = renderer.__elyricPlaybackBridge;
        if (!panel || !bridge) { return Promise.resolve(); }
        panel.setAttribute("data-elyric-loading", "true");
        return bridge.getQueue().then(function (result) {
            if (!renderer.__elyricQueuePanel) { return; }
            var items = result && result.Items || (Array.isArray(result) ? result : []);
            var snapshot = bridge.getSnapshot();
            var body = renderer.__elyricQueueBody;
            while (body.firstChild) { body.removeChild(body.firstChild); }
            if (!items.length) {
                var empty = document.createElement("p");
                empty.className = "elyric-player-queue-empty";
                empty.appendChild(document.createTextNode("播放队列为空"));
                body.appendChild(empty);
            }
            items.forEach(function (item, index) {
                var playlistItemId = item.PlaylistItemId || "";
                var row = document.createElement("div");
                row.className = "elyric-player-queue-row";
                row.setAttribute("data-playlist-item-id", playlistItemId);
                row.setAttribute("aria-current", playlistItemId === snapshot.playlistItemId || index === snapshot.playlistIndex ? "true" : "false");
                row.setAttribute("draggable", bridge.capabilities.moveQueueItem && playlistItemId ? "true" : "false");
                var playButton = document.createElement("button");
                playButton.className = "elyric-player-queue-main";
                playButton.setAttribute("type", "button");
                playButton.setAttribute("aria-label", "播放 " + (item.Name || "未命名曲目"));
                var title = document.createElement("strong");
                title.appendChild(document.createTextNode(item.Name || "未命名曲目"));
                var detail = document.createElement("span");
                detail.appendChild(document.createTextNode(playerArtistText(item)));
                playButton.appendChild(title); playButton.appendChild(detail);
                playButton.addEventListener("click", function () {
                    if (playlistItemId) { bridge.playQueueItem(playlistItemId); }
                });
                row.appendChild(playButton);
                var removeButton = document.createElement("button");
                removeButton.className = "elyric-player-queue-remove";
                removeButton.setAttribute("type", "button");
                removeButton.setAttribute("aria-label", "从队列移除 " + (item.Name || "未命名曲目"));
                removeButton.disabled = !bridge.capabilities.removeQueueItems || !playlistItemId;
                setButtonIcon(removeButton, "close");
                removeButton.addEventListener("click", function (event) {
                    stopControlEvent(event);
                    if (!removeButton.disabled) {
                        bridge.removeQueueItems([playlistItemId]).then(function () {
                            return renderOwnedQueue(renderer);
                        });
                    }
                });
                row.appendChild(removeButton);
                row.addEventListener("dragstart", function (event) {
                    if (!bridge.capabilities.moveQueueItem || !playlistItemId) {
                        if (event.preventDefault) { event.preventDefault(); }
                        return;
                    }
                    renderer.__elyricDraggedQueueItem = { id: playlistItemId, index: index };
                    row.setAttribute("data-elyric-dragging", "true");
                    if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", playlistItemId);
                    }
                });
                row.addEventListener("dragend", function () {
                    renderer.__elyricDraggedQueueItem = null;
                    row.removeAttribute("data-elyric-dragging");
                });
                row.addEventListener("dragover", function (event) {
                    if (renderer.__elyricDraggedQueueItem && event.preventDefault) {
                        event.preventDefault();
                        if (event.dataTransfer) { event.dataTransfer.dropEffect = "move"; }
                    }
                });
                row.addEventListener("drop", function (event) {
                    var dragged = renderer.__elyricDraggedQueueItem;
                    if (event.preventDefault) { event.preventDefault(); }
                    renderer.__elyricDraggedQueueItem = null;
                    if (!dragged || dragged.index === index) { return; }
                    bridge.moveQueueItem(dragged.id, index).then(function () {
                        return renderOwnedQueue(renderer);
                    });
                });
                body.appendChild(row);
            });
            panel.setAttribute("data-elyric-loading", "false");
        }, function () {
            if (renderer.__elyricQueuePanel) {
                renderer.__elyricQueuePanel.setAttribute("data-elyric-loading", "error");
            }
        });
    }

    function resetDisplayConfigurationRequest(renderer) {
        renderer.__elyricConfigurationRequested = false;
        renderer.__elyricActiveApiClient = null;
    }

    function setQueueOpen(renderer, open) {
        open = !!open;
        var wasOpen = !!renderer.__elyricQueueOpen;
        if (open) {
            setSettingsPanelOpen(renderer, false);
            setMediaPanelOpen(renderer, false);
            if (renderer.__elyricCastOpen) { setCastPanelOpen(renderer, false); }
            if (renderer.__elyricVolumeOpen) { setVolumePanelOpen(renderer, false); }
        }
        renderer.__elyricQueueOpen = open;
        var queueButton = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.queue;
        setAttributeIfChanged(queueButton, "aria-pressed", open ? "true" : "false");
        setAttributeIfChanged(queueButton, "data-elyric-active", open ? "true" : "false");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-queue-open", open ? "true" : "false");
        if (renderer.__elyricQueuePanel) {
            if (open) {
                removeAttributeIfPresent(renderer.__elyricQueuePanel, "hidden");
                positionPlayerOverlay(renderer, "queue");
            }
            else { setAttributeIfChanged(renderer.__elyricQueuePanel, "hidden", "hidden"); }
        }
        syncPlayerPageState(renderer, isThemeContextVisible(renderer));
        syncPlayerOverlayScrim(renderer);
        if (open) {
            renderOwnedQueue(renderer);
            if (!wasOpen) { focusPlayerOverlay(renderer.__elyricQueuePanel); }
        } else if (wasOpen) {
            scrollCurrentLyricIntoView(renderer, false);
            resumeLyricFollowing(renderer, false);
            restorePlayerOverlayFocus(renderer.__elyricQueuePanel, queueButton);
        }
    }

    function isQueueInteractionTarget(renderer, target) {
        var queueButton = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.queue;
        if (queueButton && queueButton.contains && queueButton.contains(target)) {
            return true;
        }
        while (target) {
            if (target === renderer.__elyricQueuePanel
                || (renderer.__elyricQueuePanel && renderer.__elyricQueuePanel.contains(target))) {
                return true;
            }
            target = target.parentNode;
        }
        return false;
    }

    function installQueueDismissHandler(renderer) {
        var eventHost = document.addEventListener ? document : document.body;
        if (!eventHost || !eventHost.addEventListener) {
            return;
        }
        var handler = function (event) {
            if (renderer.__elyricQueueOpen
                && !isQueueInteractionTarget(renderer, event && event.target)) {
                setQueueOpen(renderer, false);
            }
        };
        eventHost.addEventListener("pointerdown", handler, true);
        renderer.__elyricQueueDismissHost = eventHost;
        renderer.__elyricQueueDismissHandler = handler;
    }

    function activatePlayerAction(renderer, action) {
        if ("back" === action || "cast" === action || "queue" === action) {
            setSettingsPanelOpen(renderer, false);
            setMediaPanelOpen(renderer, false);
        }
        if ("queue" === action) {
            if (renderer.__elyricQueueOpen) { requestPlayerOverlayClose(renderer, "queue"); }
            else {
                requestPlayerOverlayOpen(
                    renderer,
                    "queue",
                    renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.queue,
                    "above"
                );
            }
            return;
        }
        if ("cast" === action) {
            if (renderer.__elyricCastOpen) { requestPlayerOverlayClose(renderer, "cast"); }
            else { requestPlayerOverlayOpen(renderer, "cast", renderer.__elyricPlayerButtons.cast, "above"); }
            return;
        }
        if ("mute" === action) {
            var volumeStyle = renderer.__elyricThemeV2 && renderer.__elyricThemeV2.volume || {};
            if ("portrait" === currentPlayerThemeV2Profile() || "iconPopover" === volumeStyle.landscapeMode) {
                if (renderer.__elyricVolumeOpen) { requestPlayerOverlayClose(renderer, "volume"); }
                else { requestPlayerOverlayOpen(renderer, "volume", renderer.__elyricPlayerButtons.mute, "above"); }
            } else if (renderer.__elyricPlaybackBridge) { renderer.__elyricPlaybackBridge.toggleMute(); }
            return;
        }
        if ("playPause" === action) {
            var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.playPause;
            var playing = !!(button && "true" === button.getAttribute("data-elyric-playing"));
            renderer.__elyricOptimisticPlaying = !playing;
            renderer.__elyricOptimisticPlayingUntil = Date.now() + 1200;
            setPlayPausePresentation(renderer, !playing);
        }
        var bridge = renderer.__elyricPlaybackBridge;
        if (!bridge) { return; }
        var actions = {
            back: "goBack", previous: "previous", playPause: "playPause",
            stop: "stop", next: "next"
        };
        if ("settings" === action) {
            if (renderer.__elyricSettingsOpen) { requestPlayerOverlayClose(renderer, "settings"); }
            else { requestPlayerOverlayOpen(renderer, "settings", renderer.__elyricPlayerButtons.settings, "above"); }
            return;
        }
        if ("visualizerToggle" === action) {
            renderer.__elyricVisualizerEnabled = false === renderer.__elyricVisualizerEnabled;
            setAttributeIfChanged(renderer.__elyricPlayerButtons.visualizerToggle, "aria-pressed",
                renderer.__elyricVisualizerEnabled ? "true" : "false");
            syncVisualizerAnimation(renderer); return;
        }
        if ("secondaryLyrics" === action) {
            setSecondLineOverride(renderer, !renderer.__elyricLocalShowSecond, true); return;
        }
        if ("tertiaryLyrics" === action) {
            setThirdLineOverride(renderer, !renderer.__elyricLocalShowThird, true); return;
        }
        if ("artworkRotation" === action) {
            setArtworkRotation(renderer, !renderer.__elyricArtworkRotation, true); return;
        }
        if ("shuffle" === action) {
            var shuffleSnapshot = bridge.getSnapshot();
            bridge.setShuffle(!shuffleSnapshot.shuffle);
        } else if ("repeat" === action) {
            var repeatSnapshot = bridge.getSnapshot();
            var repeatModes = ["RepeatNone", "RepeatAll", "RepeatOne"];
            var repeatIndex = repeatModes.indexOf(repeatSnapshot.repeatMode);
            bridge.setRepeatMode(repeatModes[(repeatIndex + 1) % repeatModes.length]);
        } else if (actions[action]) { bridge[actions[action]](); }
    }

    var PLAYER_ICON_PATHS = {
        back: "M15 18l-6-6 6-6",
        cast: "M4 18a2 2 0 0 0-2-2 M8 18a6 6 0 0 0-6-6 M12 18A10 10 0 0 0 2 8 M10 5h9a2 2 0 0 1 2 2v8",
        previous: "M6 5v14 M18 6l-8 6 8 6z",
        play: "M8 5l11 7-11 7z",
        pause: "M8 5v14 M16 5v14",
        next: "M18 5v14 M6 6l8 6-8 6z",
        volume: "M11 5L6 9H2v6h4l5 4z M15 9c1.4 1.4 1.4 4.6 0 6 M18 6c3.2 3.2 3.2 8.8 0 12",
        volumeMute: "M11 5L6 9H2v6h4l5 4z M16 10l5 5 M21 10l-5 5",
        shuffle: "M4 7h3c4.5 0 5.5 10 10 10h3 M17 14l3 3-3 3 M4 17h3c1.6 0 2.8-1.2 3.8-2.8 M14 9.8C15 8.2 16 7 17 7h3 M17 4l3 3-3 3",
        repeat: "M17 2l3 3-3 3 M20 5H8a5 5 0 0 0-5 5 M7 22l-3-3 3-3 M4 19h12a5 5 0 0 0 5-5",
        stop: "M7 7h10v10H7z",
        queue: "M4 6h12 M4 12h12 M4 18h8 M19 15v6 M16 18h6",
        info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 11v6 M12 7h.01",
        subtitle: "M4 5h16v14H4z M7 14h4 M7 17h7 M13 14h4 M16 17h1",
        visualizer: "M3 12h2 M7 7v10 M11 4v16 M15 8v8 M19 6v12 M23 11v2",
        translation: "M4 5h9 M8.5 3v2 M6 9c1.5 2.5 3.5 4.5 6 6 M12 9c-1.3 2.2-3.2 4.2-6 6 M15 19l3-8 3 8 M16 16h4",
        rotation: "M20 7v5h-5 M4 17v-5h5 M18.5 9A7 7 0 0 0 6.2 6.2L4 8 M5.5 15A7 7 0 0 0 17.8 17.8L20 16",
        settings: "M4 7h8 M16 7h4 M4 17h2 M10 17h10 M12 4v6 M6 14v6",
        close: "M6 6l12 12 M18 6L6 18",
        locate: "M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
        reset: "M4 4v6h6 M5.5 15a7 7 0 1 0 1.2-7.5L4 10"
    };

    function createPlayerIcon(iconName) {
        if (!document.createElementNS || !PLAYER_ICON_PATHS[iconName]) {
            var fallback = document.createElement("span");
            fallback.className = "elyric-player-icon elyric-player-icon-fallback";
            fallback.setAttribute("data-elyric-icon", iconName);
            fallback.setAttribute("aria-hidden", "true");
            return fallback;
        }
        var namespace = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(namespace, "svg");
        svg.setAttribute("class", "elyric-player-icon");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "1.8");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("focusable", "false");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("data-elyric-icon", iconName);
        var path = document.createElementNS(namespace, "path");
        path.setAttribute("d", PLAYER_ICON_PATHS[iconName]);
        svg.appendChild(path);
        return svg;
    }

    function setButtonIcon(button, iconName) {
        if (!button) {
            return;
        }
        while (button.firstChild) {
            button.removeChild(button.firstChild);
        }
        button.setAttribute("data-elyric-icon", iconName);
        button.appendChild(createPlayerIcon(iconName));
    }

    function createPlayerButton(renderer, action, label, iconName) {
        var button = document.createElement("button");
        button.className = "elyric-player-button elyric-player-button-" + action;
        button.setAttribute("type", "button");
        button.setAttribute("data-elyric-player-action", action);
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.setAttribute("data-elyric-tooltip", label);
        setButtonIcon(button, iconName);
        var activatedOnPointerDown = false;
        button.addEventListener("click", function (event) {
            stopControlEvent(event);
            if ("playPause" === action && activatedOnPointerDown) {
                activatedOnPointerDown = false;
                return;
            }
            activatePlayerAction(renderer, action);
        });
        button.addEventListener("pointerdown", function (event) {
            stopControlEvent(event);
            if ("playPause" === action) {
                activatedOnPointerDown = true;
                activatePlayerAction(renderer, action);
            }
        });
        button.addEventListener("pointercancel", function () {
            activatedOnPointerDown = false;
        });
        if (!renderer.__elyricPlayerButtons) {
            renderer.__elyricPlayerButtons = {};
        }
        renderer.__elyricPlayerButtons[action] = button;
        return button;
    }


    function seekFromPlayerControl(renderer) {
        var control = renderer.__elyricProgressSlider;
        var bridge = renderer.__elyricPlaybackBridge;
        if (!control || !bridge || !bridge.capabilities.seek) {
            renderer.__elyricScrubbing = false;
            return;
        }
        var controlMaximum = Number(control.max) || 1000;
        var percentage = Math.min(1, Math.max(0, Number(control.value) / controlMaximum));
        bridge.seek(percentage * (renderer.__elyricLastRuntimeTicks || 0));
        renderer.__elyricScrubbing = false;
    }

    function volumeFromPlayerControl(renderer, eventType) {
        var control = renderer.__elyricVolumeSlider;
        var bridge = renderer.__elyricPlaybackBridge;
        if (!control || !bridge || !bridge.capabilities.setVolume) {
            renderer.__elyricVolumeScrubbing = false;
            return;
        }
        var percentage = Math.min(100, Math.max(0, Number(control.value) || 0));
        setDisplayStyle(control, "--elyric-player-volume", percentage + "%");
        syncVolumePresentation(renderer, percentage);
        if (percentage > 0) {
            renderer.__elyricLastAudibleVolume = percentage;
        }
        bridge.setVolume(percentage);
        if ("change" === eventType) {
            renderer.__elyricVolumeScrubbing = false;
        }
    }

    function syncVolumePresentation(renderer, value) {
        value = Math.min(100, Math.max(0, Number(value) || 0));
        replaceElementText(renderer.__elyricVolumeValue, Math.round(value) + "%");
        if (renderer.__elyricPortraitVolumeSlider) {
            renderer.__elyricPortraitVolumeSlider.value = String(Math.round(value));
            renderer.__elyricPortraitVolumeSlider.setAttribute("value", String(Math.round(value)));
            setDisplayStyle(renderer.__elyricPortraitVolumeSlider, "--elyric-player-volume", value + "%");
        }
        var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.mute;
        if (!button) {
            return;
        }
        var muted = arguments.length > 2 ? !!arguments[2] : value <= 0;
        setButtonIcon(button, muted ? "volumeMute" : "volume");
        setAttributeIfChanged(button, "aria-label", muted ? "取消静音" : "静音");
        setAttributeIfChanged(button, "title", muted ? "取消静音" : "静音");
        setAttributeIfChanged(button, "data-elyric-tooltip", muted ? "取消静音" : "静音");
        setAttributeIfChanged(button, "aria-pressed", muted ? "true" : "false");
        setAttributeIfChanged(button, "data-elyric-active", muted ? "true" : "false");
        setDisplayStyle(button, "--elyric-volume-fill", value + "%");
        setAttributeIfChanged(button, "data-elyric-volume", String(Math.round(value)));
    }

    function togglePlayerMute(renderer) {
        var bridge = renderer.__elyricPlaybackBridge;
        var control = renderer.__elyricVolumeSlider;
        if (!bridge || !control) {
            return false;
        }
        var current = Math.min(100, Math.max(0, Number(bridge.getSnapshot().volume) || 0));
        var next;
        if (current > 0) {
            renderer.__elyricLastAudibleVolume = current;
            next = 0;
        } else {
            next = Math.min(100, Math.max(1, Number(renderer.__elyricLastAudibleVolume) || 50));
        }
        control.value = String(next);
        control.setAttribute("value", String(next));
        setDisplayStyle(control, "--elyric-player-volume", next + "%");
        syncVolumePresentation(renderer, next);
        bridge.setVolume(next);
        return true;
    }

    function updateVolumeControl(renderer) {
        var control = renderer.__elyricVolumeSlider;
        if (!control || renderer.__elyricVolumeScrubbing) {
            return;
        }
        var bridge = renderer.__elyricPlaybackBridge;
        var snapshot = bridge && bridge.getSnapshot ? bridge.getSnapshot() : null;
        var value = snapshot ? Math.min(100, Math.max(0, Number(snapshot.volume) || 0)) : 0;
        var enabled = !!(bridge && bridge.capabilities.setVolume);
        control.disabled = !enabled;
        control.setAttribute("aria-disabled", enabled ? "false" : "true");
        control.value = String(value);
        control.setAttribute("value", control.value);
        setDisplayStyle(control, "--elyric-player-volume", value + "%");
        if (value > 0) {
            renderer.__elyricLastAudibleVolume = value;
        }
        syncVolumePresentation(renderer, value, !!(snapshot && snapshot.muted) || value <= 0);
    }

    function playerArtistText(item) {
        if (!item) {
            return "Emby 音乐";
        }
        if (Array.isArray(item.Artists) && item.Artists.length) {
            return item.Artists.join(" · ");
        }
        return item.AlbumArtist || item.Album || "Emby 音乐";
    }

    function playerArtworkUrl(renderer, item) {
        var primaryTag = item && item.ImageTags && item.ImageTags.Primary;
        var apiClient = primaryTag ? activeApiClient(renderer) : null;
        if (!apiClient || !item.Id) {
            return "";
        }
        try {
            if (apiClient.getScaledImageUrl) {
                return apiClient.getScaledImageUrl(item.Id, {
                    type: "Primary",
                    tag: primaryTag,
                    maxWidth: 1200
                });
            }
            if (apiClient.getUrl) {
                return apiClient.getUrl("Items/" + encodeURIComponent(item.Id) + "/Images/Primary", {
                    maxWidth: 1200,
                    tag: primaryTag
                });
            }
        } catch (error) {
            // Metadata and transport controls remain available without artwork.
        }
        return "";
    }

    function mediaText(value, fallback) {
        if (null === value || "undefined" === typeof value || "" === value) {
            return fallback || "—";
        }
        return String(value);
    }

    function formatMediaBytes(value) {
        value = Number(value);
        if (!isFinite(value) || value < 0) {
            return "—";
        }
        var units = ["B", "KB", "MB", "GB", "TB"];
        var unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        var decimals = unitIndex > 1 ? 1 : (unitIndex ? 0 : 0);
        return value.toFixed(decimals) + " " + units[unitIndex];
    }

    function formatMediaRate(value) {
        value = Number(value);
        if (!isFinite(value) || value <= 0) {
            return "—";
        }
        return value >= 1000000
            ? (value / 1000000).toFixed(value >= 10000000 ? 1 : 2).replace(/\.0+$/, "") + " Mbps"
            : Math.round(value / 1000) + " kbps";
    }

    function formatMediaDate(value) {
        if (!value) {
            return "—";
        }
        var date = new Date(value);
        if (!isFinite(date.getTime())) {
            return mediaText(value);
        }
        try {
            return date.toLocaleString("zh-CN", { hour12: false });
        } catch (error) {
            return date.toISOString();
        }
    }

    function mediaBoolean(value) {
        return value ? "是" : "否";
    }

    function formatMediaNumber(value) {
        value = Number(value);
        return isFinite(value) ? value.toLocaleString("en-US") : "—";
    }

    function compactMediaSummary(item, visibleFields) {
        var source = item && item.MediaSources && item.MediaSources[0] || item || {};
        var streams = source.MediaStreams || item && item.MediaStreams || [];
        var audio = null;
        for (var i = 0; i < streams.length; i++) {
            if ("audio" === String(streams[i] && streams[i].Type || "").toLowerCase()) {
                audio = streams[i];
                break;
            }
        }
        visibleFields = Array.isArray(visibleFields) ? visibleFields : defaultPlayerThemeV2State().metadata.summaryFields;
        var parts = [];
        if (source.Container && visibleFields.indexOf("container") >= 0) {
            parts.push(String(source.Container).toUpperCase());
        }
        if (audio && audio.Codec && visibleFields.indexOf("codec") >= 0) {
            parts.push(String(audio.Codec).toUpperCase());
        }
        if (audio && audio.SampleRate && visibleFields.indexOf("sampleRate") >= 0) {
            parts.push((Number(audio.SampleRate) / 1000).toFixed(1).replace(/\.0$/, "") + " kHz");
        }
        if (audio && audio.BitDepth && visibleFields.indexOf("bitDepth") >= 0) {
            parts.push(audio.BitDepth + " bit");
        }
        if (audio && (audio.ChannelLayout || audio.Channels) && visibleFields.indexOf("channels") >= 0) {
            parts.push(audio.ChannelLayout || audio.Channels + " ch");
        }
        if (audio && audio.BitRate && visibleFields.indexOf("bitrate") >= 0) { parts.push(formatMediaRate(audio.BitRate)); }
        return parts.join(" · ");
    }

    function appendMediaField(container, label, value, wide) {
        var row = document.createElement("div");
        row.className = "elyric-player-media-row" + (wide ? " elyric-player-media-row-wide" : "");
        var name = document.createElement("span");
        name.className = "elyric-player-media-label";
        name.appendChild(document.createTextNode(label));
        var content = document.createElement("span");
        content.className = "elyric-player-media-value";
        content.appendChild(document.createTextNode(mediaText(value)));
        row.appendChild(name);
        row.appendChild(content);
        container.appendChild(row);
    }

    function appendMediaSection(container, title, fields) {
        var section = document.createElement("section");
        section.className = "elyric-player-media-section";
        var heading = document.createElement("h3");
        heading.appendChild(document.createTextNode(title));
        section.appendChild(heading);
        for (var i = 0; i < fields.length; i++) {
            appendMediaField(section, fields[i][0], fields[i][1], fields[i][2]);
        }
        container.appendChild(section);
    }

    function streamTitle(stream) {
        return mediaText(stream.DisplayTitle || stream.Title || stream.Codec);
    }

    function renderMediaInformation(renderer, item, statusText) {
        var summaryFields = renderer.__elyricThemeV2 && renderer.__elyricThemeV2.metadata
            && renderer.__elyricThemeV2.metadata.summaryFields;
        var technicalSummary = compactMediaSummary(item, summaryFields);
        replaceElementText(renderer.__elyricPlayerFormat, technicalSummary);
        if (renderer.__elyricPlayerFormat) { renderer.__elyricPlayerFormat.hidden = !technicalSummary; }
        var body = renderer.__elyricMediaBody;
        if (!body) {
            return;
        }
        while (body.firstChild) {
            body.removeChild(body.firstChild);
        }
        if (!item) {
            var empty = document.createElement("div");
            empty.className = "elyric-player-media-empty";
            empty.appendChild(document.createTextNode(statusText || "当前没有可显示的媒体信息。"));
            body.appendChild(empty);
            if (renderer.__elyricMediaOpen) {
                positionMediaPanelNearTrigger(renderer);
            }
            repositionPlayerOverlays(renderer);
            return;
        }

        var sources = item.MediaSources || [];
        var source = sources[0] || item;
        var streams = source.MediaStreams || item.MediaStreams || [];
        var visibleFields = normalizePlayerMediaFields(renderer.__elyricMediaFields);
        var renderedSections = 0;
        if (visibleFields.overview) {
            appendMediaSection(body, "正在播放", [
                ["标题", item.Name || item.OriginalTitle, true],
                ["歌手", playerArtistText(item), true],
                ["专辑", item.Album, true],
                ["年份", item.ProductionYear || item.PremiereDate && String(item.PremiereDate).slice(0, 4)]
            ]);
            renderedSections++;
        }
        if (visibleFields.file) {
            appendMediaSection(body, "媒体文件", [
                ["路径", source.Path || item.Path, true],
                ["容器", source.Container ? String(source.Container).toUpperCase() : "—"],
                ["文件大小", formatMediaBytes(source.Size || item.Size)],
                ["添加于", formatMediaDate(item.DateCreated || source.DateCreated)]
            ]);
            renderedSections++;
        }

        var audioIndex = 0;
        var imageIndex = 0;
        var lyricIndex = 0;
        for (var i = 0; i < streams.length; i++) {
            var stream = streams[i] || {};
            var type = String(stream.Type || "").toLowerCase();
            if ("audio" === type && visibleFields.audio) {
                audioIndex++;
                appendMediaSection(body, "音频" + (audioIndex > 1 ? " " + audioIndex : ""), [
                    ["标题", streamTitle(stream), true],
                    ["编解码器", stream.Codec ? String(stream.Codec).toUpperCase() : "—"],
                    ["频道", stream.ChannelLayout || (stream.Channels ? stream.Channels + " ch" : "—")],
                    ["比特率", formatMediaRate(stream.BitRate)],
                    ["采样率", stream.SampleRate ? formatMediaNumber(stream.SampleRate) + " Hz" : "—"],
                    ["位深度", stream.BitDepth ? stream.BitDepth + " bit" : "—"],
                    ["默认", mediaBoolean(stream.IsDefault)]
                ]);
                renderedSections++;
            } else if (("video" === type || "embeddedimage" === type || "image" === type)
                && visibleFields.image) {
                imageIndex++;
                appendMediaSection(body, "图像" + (imageIndex > 1 ? " " + imageIndex : ""), [
                    ["标题", streamTitle(stream), true],
                    ["编解码器", stream.Codec ? String(stream.Codec).toUpperCase() : "—"],
                    ["配置", stream.Profile],
                    ["等级", stream.Level],
                    ["分辨率", stream.Width && stream.Height ? stream.Width + "×" + stream.Height : "—"],
                    ["帧率", stream.RealFrameRate || stream.AverageFrameRate
                        ? formatMediaNumber(stream.RealFrameRate || stream.AverageFrameRate)
                        : "—"],
                    ["色域", stream.ColorSpace],
                    ["位深度", stream.BitDepth ? stream.BitDepth + " bit" : "—"],
                    ["像素格式", stream.PixelFormat],
                    ["参考帧", stream.RefFrames],
                    ["默认", mediaBoolean(stream.IsDefault)]
                ]);
                renderedSections++;
            } else if (("subtitle" === type || "text" === type) && visibleFields.lyrics) {
                lyricIndex++;
                appendMediaSection(body, "歌词" + (lyricIndex > 1 ? " " + lyricIndex : ""), [
                    ["标题", streamTitle(stream), true],
                    ["内嵌标题", stream.Title],
                    ["编解码器", stream.Codec ? String(stream.Codec).toUpperCase() : "—"],
                    ["默认", mediaBoolean(stream.IsDefault)],
                    ["外部", mediaBoolean(stream.IsExternal)]
                ]);
                renderedSections++;
            }
        }

        if (!renderedSections) {
            var note = document.createElement("div");
            note.className = "elyric-player-media-empty";
            note.appendChild(document.createTextNode(statusText || "当前信息范围没有可显示的内容。"));
            body.appendChild(note);
        }
        if (renderer.__elyricMediaOpen) {
            positionMediaPanelNearTrigger(renderer);
        }
    }

    function requestDetailedMediaItem(renderer, item) {
        var apiClient = activeApiClient(renderer);
        if (!apiClient || !item || !item.Id) {
            return null;
        }
        try {
            var userId = apiClient.getCurrentUserId ? apiClient.getCurrentUserId() : null;
            if (apiClient.getItem && userId) {
                return Promise.resolve(apiClient.getItem(userId, item.Id));
            }
            if (apiClient.getJSON && apiClient.getUrl && userId) {
                return Promise.resolve(apiClient.getJSON(apiClient.getUrl(
                    "Users/" + encodeURIComponent(userId) + "/Items/" + encodeURIComponent(item.Id)
                )));
            }
        } catch (error) {
            return Promise.reject(error);
        }
        return null;
    }

    function refreshMediaInformation(renderer) {
        var item = renderer.currentItem || null;
        if (!item) {
            renderMediaInformation(renderer, null);
            return;
        }
        if (renderer.__elyricDetailedMediaItem
            && renderer.__elyricDetailedMediaItem.Id === item.Id) {
            renderMediaInformation(renderer, renderer.__elyricDetailedMediaItem);
            return;
        }
        renderMediaInformation(renderer, item, "正在从 Emby 读取完整媒体流信息…");
        var request = requestDetailedMediaItem(renderer, item);
        if (!request) {
            return;
        }
        var requestId = (renderer.__elyricMediaRequestId || 0) + 1;
        renderer.__elyricMediaRequestId = requestId;
        Promise.resolve(request).then(function (detailedItem) {
            if (renderer.__elyricMediaRequestId !== requestId || !renderer.__elyricMediaBody) {
                return;
            }
            renderer.__elyricDetailedMediaItem = detailedItem || item;
            renderMediaInformation(renderer, renderer.__elyricDetailedMediaItem);
        }, function () {
            if (renderer.__elyricMediaRequestId === requestId && renderer.__elyricMediaBody) {
                renderMediaInformation(renderer, item, "Emby 暂未返回更完整的媒体流信息。 ");
            }
        });
    }

    function updatePlayerMetadata(renderer) {
        var item = renderer.currentItem || null;
        var metadataState = renderer.__elyricThemeV2 && renderer.__elyricThemeV2.metadata || {};
        var summaryFields = Array.isArray(metadataState.summaryFields) ? metadataState.summaryFields : [];
        var signature = item
            ? [item.Id, item.Name, playerArtistText(item), item.Album, item.ImageTags && item.ImageTags.Primary].join("|")
            : "";
        if (renderer.__elyricPlayerItemSignature === signature) {
            return;
        }
        renderer.__elyricPlayerItemSignature = signature;
        if (renderer.__elyricDetailedMediaItem
            && (!item || renderer.__elyricDetailedMediaItem.Id !== item.Id)) {
            renderer.__elyricDetailedMediaItem = null;
        }
        replaceElementText(renderer.__elyricPlayerTitle, item && (item.Name || item.OriginalTitle) || "正在播放");
        replaceElementText(renderer.__elyricPlayerArtist, playerArtistText(item));
        replaceElementText(renderer.__elyricPlayerAlbum, item && item.Album || "");
        if (renderer.__elyricPlayerTitle) { renderer.__elyricPlayerTitle.hidden = summaryFields.indexOf("title") < 0; }
        if (renderer.__elyricPlayerArtist) { renderer.__elyricPlayerArtist.hidden = summaryFields.indexOf("artist") < 0; }
        if (renderer.__elyricPlayerAlbum) { renderer.__elyricPlayerAlbum.hidden = summaryFields.indexOf("album") < 0; }

        var artworkUrl = playerArtworkUrl(renderer, item);
        renderer.__elyricPlayerEmbyArtworkUrl = artworkUrl || "";
        [renderer.__elyricPlayerArtwork, renderer.__elyricPlayerBackground]
            .concat(renderer.__elyricCoverflowArtworks || [])
            .forEach(function (imageElement) {
                if (!imageElement) {
                    return;
                }
                if (artworkUrl) {
                    imageElement.setAttribute("src", artworkUrl);
                    imageElement.setAttribute("alt", "");
                    imageElement.removeAttribute("hidden");
                } else {
                    imageElement.removeAttribute("src");
                    imageElement.setAttribute("hidden", "hidden");
                }
            });
        if (renderer.__elyricThemeV2) {
            applyPlayerThemeV2Artwork(renderer);
        }
        (renderer.__elyricCoverflowCaptions || []).forEach(function (caption, index) {
            replaceElementText(
                caption,
                2 === index
                    ? item && (item.Name || item.OriginalTitle) || "正在播放"
                    : playerArtistText(item)
            );
        });
        renderer.__elyricCoverflowPreviewAt = 0;
        renderMediaInformation(renderer, item);
        syncPlayerCoverflowPreview(renderer, true);
        if (renderer.__elyricMediaOpen) {
            refreshMediaInformation(renderer);
        }
    }

    function syncPlayerCoverflowPreview(renderer, force) {
        if (!renderer.__elyricCoverflowArtworks
            || !renderer.__elyricPlayerThemeChoices
            || "coverflow" !== renderer.__elyricPlayerThemeChoices.artworkMode) {
            return;
        }
        var now = Date.now();
        if (!force && renderer.__elyricCoverflowPreviewAt
            && now < renderer.__elyricCoverflowPreviewAt) {
            return;
        }
        renderer.__elyricCoverflowPreviewAt = now + 2000;
        var bridge = renderer.__elyricPlaybackBridge;
        if (!bridge || !bridge.getQueue) { return; }
        bridge.getQueue().then(function (result) {
            var rows = result && result.Items || [];
            var sideIndexes = [0, 1, Math.max(0, bridge.getSnapshot().playlistIndex), 2, 3];
            sideIndexes.forEach(function (rowIndex, cardIndex) {
                var item = rows[rowIndex];
                if (!item || !renderer.__elyricCoverflowArtworks) { return; }
                var sourceUrl = playerArtworkUrl(renderer, item);
                if (sourceUrl) {
                    renderer.__elyricCoverflowArtworks[cardIndex].setAttribute("src", sourceUrl);
                    renderer.__elyricCoverflowArtworks[cardIndex].removeAttribute("hidden");
                }
                replaceElementText(renderer.__elyricCoverflowCaptions[cardIndex], item.Name || playerArtistText(item));
            });
        }).catch(function () {});
    }

    function updatePlayerTransportState(renderer) {
        var buttons = renderer.__elyricPlayerButtons;
        if (!buttons) {
            return;
        }
        var bridge = renderer.__elyricPlaybackBridge;
        var snapshot = bridge && bridge.getSnapshot ? bridge.getSnapshot() : null;
        ["back", "cast", "previous", "playPause", "stop", "next", "shuffle", "repeat", "queue", "mute"].forEach(function (action) {
            var button = buttons[action];
            if (!button) {
                return;
            }
            var capabilityNames = { previous: "previous", next: "next", playPause: "playPause", stop: "stop",
                shuffle: "setShuffle", repeat: "setRepeatMode", queue: "getQueue", mute: "toggleMute",
                back: "goBack", cast: "cast" };
            var enabled = !!(bridge && bridge.capabilities[capabilityNames[action]]);
            button.disabled = !enabled;
            button.setAttribute("aria-disabled", enabled ? "false" : "true");
            if ("playPause" === action && snapshot) {
                var playing = !snapshot.paused;
                var optimisticUntil = Number(renderer.__elyricOptimisticPlayingUntil) || 0;
                if (optimisticUntil > Date.now()) {
                    if (playing === renderer.__elyricOptimisticPlaying) {
                        renderer.__elyricOptimisticPlayingUntil = 0;
                    } else {
                        playing = !!renderer.__elyricOptimisticPlaying;
                    }
                } else {
                    renderer.__elyricOptimisticPlayingUntil = 0;
                }
                setPlayPausePresentation(renderer, playing);
            }
            var active = "mute" === action
                ? !!(snapshot && snapshot.muted)
                : ("queue" === action
                ? !!renderer.__elyricQueueOpen
                : "shuffle" === action ? !!(snapshot && snapshot.shuffle)
                : "repeat" === action ? !!(snapshot && snapshot.repeatMode !== "RepeatNone") : false);
            button.setAttribute("data-elyric-active", active ? "true" : "false");
            if ("queue" === action || "mute" === action) {
                button.setAttribute("aria-pressed", active ? "true" : "false");
            }
        });
    }

    function updatePlayerControl(renderer, positionTicks, runtimeTicks) {
        renderer.__elyricLastPositionTicks = isFinite(Number(positionTicks)) ? Number(positionTicks) : 0;
        renderer.__elyricLastRuntimeTicks = isFinite(Number(runtimeTicks)) ? Number(runtimeTicks) : 0;
        if (!renderer.__elyricThemeControl) {
            return;
        }
        updatePlayerMetadata(renderer);
        syncPlayerCoverflowPreview(renderer, false);
        updatePlayerTransportState(renderer);
        updateVolumeControl(renderer);
        if (renderer.__elyricScrubbing) {
            return;
        }

        var safeRuntime = Math.max(0, renderer.__elyricLastRuntimeTicks);
        var safePosition = Math.max(0, renderer.__elyricLastPositionTicks);
        var progress = safeRuntime > 0 ? Math.min(1, safePosition / safeRuntime) : 0;
        if (renderer.__elyricProgressSlider) {
            var seekEnabled = !!(renderer.__elyricPlaybackBridge
                && renderer.__elyricPlaybackBridge.capabilities.seek && safeRuntime > 0);
            renderer.__elyricProgressSlider.disabled = !seekEnabled;
            renderer.__elyricProgressSlider.setAttribute("aria-disabled", seekEnabled ? "false" : "true");
            renderer.__elyricProgressSlider.value = String(Math.round(progress * 1000));
            renderer.__elyricProgressSlider.setAttribute("value", renderer.__elyricProgressSlider.value);
            renderer.__elyricProgressSlider.setAttribute(
                "aria-valuetext",
                formatPlayerTime(safePosition) + " / " + formatPlayerTime(safeRuntime)
            );
            setDisplayStyle(renderer.__elyricProgressSlider, "--elyric-player-progress", progress * 100 + "%");
        }
        replaceElementText(renderer.__elyricPlayerPosition, formatPlayerTime(safePosition));
        replaceElementText(renderer.__elyricPlayerDuration, formatPlayerTime(safeRuntime));
    }

    function setSecondLineOverride(renderer, show, persist) {
        renderer.__elyricLocalShowSecond = !!show;
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-show-second", show ? "true" : "false");
        if (renderer.__elyricSecondLineButton) {
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "aria-pressed",
                show ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "data-elyric-active",
                show ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "title",
                show ? "隐藏注音/第二行" : "显示注音/第二行"
            );
            setAttributeIfChanged(
                renderer.__elyricSecondLineButton,
                "data-elyric-tooltip",
                show ? "隐藏注音 / 翻译" : "显示注音 / 翻译"
            );
        }
        syncSegmentedButtons(renderer.__elyricSecondLineSettingsButtons, show ? "on" : "off");
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
    }

    function createSegmentedControl(renderer, items, groupClass, buttonClass, ariaLabel, onSelect) {
        var group = document.createElement("div");
        group.className = "elyric-player-segmented " + groupClass;
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", ariaLabel);
        var buttons = [];
        items.forEach(function (item) {
            var button = document.createElement("button");
            button.className = "elyric-player-segment " + buttonClass;
            button.setAttribute("type", "button");
            button.setAttribute("data-elyric-choice", item.id);
            button.setAttribute("aria-pressed", "false");
            button.appendChild(document.createTextNode(item.label));
            button.addEventListener("click", function (event) {
                stopControlEvent(event);
                onSelect(item.id);
            });
            button.addEventListener("pointerdown", stopControlEvent);
            group.appendChild(button);
            buttons.push(button);
        });
        return { element: group, buttons: buttons };
    }

    function createSettingsSection(panel, title, className) {
        var section = document.createElement("section");
        section.className = "elyric-player-settings-section " + className;
        var heading = document.createElement("h3");
        heading.className = "elyric-player-settings-section-title";
        heading.appendChild(document.createTextNode(title));
        section.appendChild(heading);
        (panel.__elyricSettingsBody || panel).appendChild(section);
        return section;
    }

    function createRangeSetting(section, label, className, minimum, maximum, step, ariaLabel, onInput) {
        var row = document.createElement("div");
        row.className = "elyric-player-range-setting " + className + "-setting";
        var header = document.createElement("div");
        header.className = "elyric-player-range-header";
        var labelElement = document.createElement("span");
        labelElement.appendChild(document.createTextNode(label));
        var valueElement = document.createElement("output");
        valueElement.className = className + "-value";
        header.appendChild(labelElement);
        header.appendChild(valueElement);
        var input = document.createElement("input");
        input.className = "elyric-player-range " + className;
        input.setAttribute("type", "range");
        input.setAttribute("min", String(minimum));
        input.setAttribute("max", String(maximum));
        input.setAttribute("step", String(step));
        input.setAttribute("aria-label", ariaLabel);
        input.min = String(minimum);
        input.max = String(maximum);
        input.step = String(step);
        input.addEventListener("input", function (event) {
            stopControlEvent(event);
            onInput(input.value);
        });
        input.addEventListener("pointerdown", stopControlEvent);
        row.appendChild(header);
        row.appendChild(input);
        section.appendChild(row);
        return { input: input, value: valueElement };
    }

    function createPlayerTuningControls(renderer, section, settingIds, inputs, values) {
        settingIds.forEach(function (settingId) {
            var definition = playerTuningDefinition(settingId);
            if (!definition) {
                return;
            }
            var setting = createRangeSetting(
                section,
                definition.label,
                "elyric-player-tuning-" + settingId,
                definition.minimum,
                definition.maximum,
                definition.step,
                definition.label,
                function (value) { setPlayerTuning(renderer, settingId, value, true); }
            );
            inputs[settingId] = setting.input;
            values[settingId] = setting.value;
        });
    }

    function createVisualizerColorSetting(renderer, section, colorIndex, label) {
        var row = document.createElement("label");
        row.className = "elyric-player-color-setting";
        row.setAttribute("data-elyric-color-index", String(colorIndex));
        var labelElement = document.createElement("span");
        labelElement.appendChild(document.createTextNode(label));
        var field = document.createElement("span");
        field.className = "elyric-player-color-field";
        var swatch = document.createElement("span");
        swatch.className = "elyric-player-color-swatch";
        swatch.setAttribute("aria-hidden", "true");
        var input = document.createElement("input");
        input.className = "elyric-player-color-input";
        input.setAttribute("type", "text");
        input.setAttribute("inputmode", "text");
        input.setAttribute("maxlength", "7");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("aria-label", label + "十六进制颜色");
        input.setAttribute("placeholder", "#86D41F");
        input.addEventListener("input", function (event) {
            stopControlEvent(event);
            var value = String(input.value || "").trim();
            if (/^#?[0-9a-f]{6}$/i.test(value)) {
                setVisualizerColor(renderer, colorIndex, value, true);
            } else {
                setAttributeIfChanged(input, "aria-invalid", "true");
            }
        });
        input.addEventListener("pointerdown", stopControlEvent);
        field.appendChild(swatch);
        field.appendChild(input);
        row.appendChild(labelElement);
        row.appendChild(field);
        section.appendChild(row);
        return { input: input, swatch: swatch };
    }

    function resetCustomPlayerLayout(renderer) {
        applyPlayerThemeDefinition(renderer, resolvedBuiltInPlayerTheme("album"));
        renderer.__elyricActiveUserPlayerThemeId = null;
        applyPlayerLayout(renderer, "custom", false);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        syncPlayerThemeLibraryControls(renderer);
    }

    function playerThemeLibrarySelection(renderer) {
        if ("custom" === renderer.__elyricPlayerLayout) {
            return renderer.__elyricActiveUserPlayerThemeId
                ? "user:" + renderer.__elyricActiveUserPlayerThemeId
                : "draft";
        }
        return "builtin:" + (renderer.__elyricPlayerLayout || "album");
    }

    function updatePlayerThemeLibraryStatus(renderer, text, state) {
        if (renderer.__elyricPlayerThemeLibraryStatus) {
            replaceElementText(renderer.__elyricPlayerThemeLibraryStatus, text);
            setAttributeIfChanged(
                renderer.__elyricPlayerThemeLibraryStatus,
                "data-elyric-state",
                state || "ready"
            );
        }
    }

    function syncPlayerThemeLibraryControls(renderer) {
        if (!renderer) {
            return;
        }
        ensurePlayerThemeLibrary(renderer);
        var select = renderer.__elyricPlayerThemeLibrarySelect;
        if (select) {
            var active = activeUserPlayerTheme(renderer);
            if (renderer.__elyricActiveUserPlayerThemeId && !active) {
                renderer.__elyricActiveUserPlayerThemeId = null;
            }
            while (select.firstChild) {
                select.removeChild(select.firstChild);
            }
            PLAYER_LAYOUTS.forEach(function (layout) {
                if ("custom" === layout.id) {
                    return;
                }
                var option = document.createElement("option");
                option.setAttribute("value", "builtin:" + layout.id);
                option.value = "builtin:" + layout.id;
                option.appendChild(document.createTextNode("内置 · " + layout.label));
                select.appendChild(option);
            });
            if ("custom" === renderer.__elyricPlayerLayout && !active) {
                var draftOption = document.createElement("option");
                var baseLayout = renderer.__elyricThemeBaseLayout || "album";
                var baseDefinition = PLAYER_LAYOUTS.filter(function (layout) {
                    return layout.id === baseLayout;
                })[0];
                draftOption.value = "draft";
                draftOption.appendChild(document.createTextNode(
                    "草稿 · 基于" + (baseDefinition ? baseDefinition.label : "编辑唱片")
                ));
                select.appendChild(draftOption);
            }
            renderer.__elyricUserPlayerThemes.forEach(function (theme) {
                var option = document.createElement("option");
                option.setAttribute("value", "user:" + theme.id);
                option.value = "user:" + theme.id;
                option.appendChild(document.createTextNode("我的 · " + theme.name));
                select.appendChild(option);
            });
            select.value = playerThemeLibrarySelection(renderer);
            if (select.selectedIndex < 0 && "custom" === renderer.__elyricPlayerLayout) {
                renderer.__elyricActiveUserPlayerThemeId = null;
                var fallbackDraftOption = document.createElement("option");
                fallbackDraftOption.value = "draft";
                fallbackDraftOption.appendChild(document.createTextNode("草稿 · 未保存的自定义主题"));
                select.appendChild(fallbackDraftOption);
                select.value = "draft";
            }
            select.setAttribute("value", select.value);
        }
        var active = activeUserPlayerTheme(renderer);
        if (renderer.__elyricPlayerThemeNameInput) {
            var activeName = active ? active.name : "";
            renderer.__elyricPlayerThemeNameInput.value = activeName;
            renderer.__elyricPlayerThemeNameInput.setAttribute("value", activeName);
        }
        if (renderer.__elyricPlayerThemeSaveButton) {
            renderer.__elyricPlayerThemeSaveButton.disabled = !active;
        }
        if (renderer.__elyricPlayerThemeRenameButton) {
            renderer.__elyricPlayerThemeRenameButton.disabled = !active;
        }
        if (renderer.__elyricPlayerThemeDeleteButton) {
            renderer.__elyricPlayerThemeDeleteButton.disabled = !active;
        }
    }

    function selectPlayerThemeLibraryEntry(renderer, value) {
        value = String(value || "");
        if ("draft" === value) {
            syncPlayerThemeLibraryControls(renderer);
            return;
        }
        if (0 === value.indexOf("builtin:")) {
            var layoutId = value.slice(8);
            renderer.__elyricThemeResetUndo = renderer.__elyricThemeV2
                ? clonePlayerThemeV2Value(renderer.__elyricThemeV2) : null;
            renderer.__elyricActiveUserPlayerThemeId = null;
            applyPlayerLayout(renderer, layoutId, true);
            updatePlayerThemeLibraryStatus(renderer, "已重置为内置主题并保留一次撤销快照；修改后可另存为我的主题", "ready");
            syncPlayerThemeLibraryControls(renderer);
            return;
        }
        if (0 !== value.indexOf("user:")) {
            return;
        }
        var themeId = value.slice(5);
        renderer.__elyricActiveUserPlayerThemeId = themeId;
        var theme = activeUserPlayerTheme(renderer);
        if (!theme) {
            syncPlayerThemeLibraryControls(renderer);
            return;
        }
        if (theme.remoteOnly) {
            playerThemeV2ApiRequest(
                renderer,
                "GET",
                PLAYER_THEMES_PATH + "/" + encodeURIComponent(theme.id)
            ).then(function (record) {
                var loaded = normalizeRemotePlayerTheme(record);
                if (!loaded) { return; }
                if (loaded.v2) {
                    var repaired = repairPlayerThemeV5State(loaded.v2);
                    if (repaired.changed) {
                        backupPlayerThemeV5Repair(renderer, loaded, renderer.__elyricWorkspaceRevision);
                        var repairCopy = clonePlayerThemeV2Value(loaded);
                        repairCopy.id = "layout-repair-" + Date.now().toString(36);
                        repairCopy.name = normalizePlayerThemeName(loaded.name + "（安全修复）", "布局安全修复");
                        repairCopy.v2 = repaired.state;
                        repairCopy.revision = 0;
                        repairCopy.updatedAt = Date.now();
                        repairCopy.repairSourceId = loaded.id;
                        renderer.__elyricUserPlayerThemes.push(repairCopy);
                        renderer.__elyricActiveUserPlayerThemeId = repairCopy.id;
                        storePlayerThemeLibrary(renderer);
                        applyPlayerThemeDefinition(renderer, repairCopy);
                        storeCurrentPlayerThemeDesign(renderer);
                        syncNamedPlayerThemeV2(renderer, repairCopy, true).then(function () {
                            return persistPlayerThemeV2Workspace(renderer);
                        });
                        return;
                    }
                }
                var index = renderer.__elyricUserPlayerThemes.indexOf(theme);
                renderer.__elyricUserPlayerThemes[index] = loaded;
                selectPlayerThemeLibraryEntry(renderer, "user:" + loaded.id);
            }).catch(function () {
                updatePlayerThemeLibraryStatus(renderer, "远程主题暂时无法读取，请检查网络", "error");
            });
            return;
        }
        renderer.__elyricThemeBaseLayout = theme.baseLayout;
        renderer.__elyricPlayerLayout = "custom";
        applyPlayerLayout(renderer, "custom", false);
        applyPlayerThemeDefinition(renderer, theme);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已应用“" + theme.name + "”", "synced");
        syncPlayerThemeLibraryControls(renderer);
    }

    function newPlayerThemeId(renderer) {
        var base = "theme-" + Date.now().toString(36);
        var id = base;
        var suffix = 2;
        while ((renderer.__elyricUserPlayerThemes || []).some(function (theme) { return theme.id === id; })) {
            id = base + "-" + suffix++;
        }
        return id;
    }

    function playerThemeNameFromInput(renderer, fallback) {
        return normalizePlayerThemeName(
            renderer.__elyricPlayerThemeNameInput
                ? renderer.__elyricPlayerThemeNameInput.value
                : "",
            fallback
        );
    }

    function createUserPlayerTheme(renderer, duplicate) {
        ensurePlayerThemeLibrary(renderer);
        var active = activeUserPlayerTheme(renderer);
        var fallbackName = duplicate && active ? active.name + " 副本" : "我的主题 " + (renderer.__elyricUserPlayerThemes.length + 1);
        var id = newPlayerThemeId(renderer);
        var name = duplicate && active
            ? fallbackName
            : playerThemeNameFromInput(renderer, fallbackName);
        var theme = collectCurrentPlayerTheme(renderer, name, id);
        renderer.__elyricUserPlayerThemes.push(theme);
        renderer.__elyricActiveUserPlayerThemeId = id;
        renderer.__elyricPlayerLayout = "custom";
        renderer.__elyricThemeBaseLayout = theme.baseLayout;
        applyPlayerLayout(renderer, "custom", false);
        storePlayerThemeLibrary(renderer);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已在本地新建“" + theme.name + "”，正在同步服务器…", "saving");
        syncPlayerThemeLibraryControls(renderer);
        syncNamedPlayerThemeV2(renderer, theme, true);
    }

    function saveActiveUserPlayerTheme(renderer) {
        var active = activeUserPlayerTheme(renderer);
        if (!active) {
            createUserPlayerTheme(renderer, false);
            return;
        }
        var saved = collectCurrentPlayerTheme(
            renderer,
            playerThemeNameFromInput(renderer, active.name),
            active.id
        );
        saved.revision = Number(active.revision || 0);
        var index = renderer.__elyricUserPlayerThemes.indexOf(active);
        renderer.__elyricUserPlayerThemes[index] = saved;
        renderer.__elyricActiveUserPlayerThemeId = saved.id;
        storePlayerThemeLibrary(renderer);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        var createOnServer = !(saved.revision > 0);
        updatePlayerThemeLibraryStatus(
            renderer,
            "已在本地保存“" + saved.name + "”，正在同步服务器…",
            "saving"
        );
        syncPlayerThemeLibraryControls(renderer);
        syncNamedPlayerThemeV2(renderer, saved, createOnServer);
    }

    function renameActiveUserPlayerTheme(renderer) {
        var active = activeUserPlayerTheme(renderer);
        if (!active) {
            return;
        }
        active.name = playerThemeNameFromInput(renderer, active.name);
        active.updatedAt = Date.now();
        storePlayerThemeLibrary(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已在本地重命名为“" + active.name + "”，正在同步服务器…", "saving");
        syncPlayerThemeLibraryControls(renderer);
        syncNamedPlayerThemeV2(renderer, active, !(active.revision > 0));
    }

    function deleteActiveUserPlayerTheme(renderer) {
        var active = activeUserPlayerTheme(renderer);
        if (!active) {
            return;
        }
        if ("undefined" !== typeof window && window.confirm
            && !window.confirm("删除用户主题“" + active.name + "”？此操作不可撤销。")) {
            return;
        }
        var finishLocalDelete = function (message, state) {
            renderer.__elyricUserPlayerThemes = renderer.__elyricUserPlayerThemes.filter(function (theme) {
                return theme.id !== active.id;
            });
            renderer.__elyricActiveUserPlayerThemeId = null;
            storePlayerThemeLibrary(renderer);
            applyPlayerLayout(renderer, active.baseLayout || "album", true);
            scheduleUserPlayerPreferencesSave(renderer);
            updatePlayerThemeLibraryStatus(
                renderer,
                message || "已删除“" + active.name + "”并恢复内置主题",
                state || "ready"
            );
            syncPlayerThemeLibraryControls(renderer);
        };
        if (!(active.revision > 0)) {
            removeQueuedPlayerThemeV2Operations(active.id, renderer);
            finishLocalDelete("已删除本地待同步主题“" + active.name + "”，不会再上传服务器", "ready");
            return;
        }
        playerThemeV2ApiRequest(
            renderer,
            "DELETE",
            PLAYER_THEMES_PATH + "/" + encodeURIComponent(active.id)
                + "?ExpectedRevision=" + encodeURIComponent(active.revision || 0)
        ).then(function (result) {
            if (playerThemeV2ResponseValue(result, "conflict", "Conflict", false)) {
                updatePlayerThemeLibraryStatus(renderer, "主题已在其他设备修改，未执行删除并已重新读取主题库", "error");
                requestPlayerThemeV2Workspace(renderer).catch(function () {});
                return;
            }
            removeQueuedPlayerThemeV2Operations(active.id, renderer);
            finishLocalDelete();
        }).catch(function (error) {
            queuePlayerThemeV2Operation(renderer, {
                kind: "theme-delete",
                themeId: active.id,
                method: "DELETE",
                path: PLAYER_THEMES_PATH + "/" + encodeURIComponent(active.id)
                    + "?ExpectedRevision=" + encodeURIComponent(active.revision || 0)
            });
            finishLocalDelete(
                playerThemeV2FailureMessage(error, "主题已从本地删除，服务器删除操作进入待同步队列"),
                "error"
            );
        });
    }

    function currentPlayerThemeForExport(renderer) {
        var active = activeUserPlayerTheme(renderer);
        return active || collectCurrentPlayerTheme(
            renderer,
            playerThemeNameFromInput(renderer, "当前播放器主题"),
            "draft"
        );
    }

    function playerThemeHasPrivateAssets(theme) {
        var state = theme && theme.v2 ? theme.v2 : {};
        if (state.artwork && (state.artwork.assetId || "asset" === state.artwork.source)) {
            return true;
        }
        return ["primary", "secondary", "tertiary"].some(function (lineId) {
            return !!(state.typography && state.typography[lineId]
                && state.typography[lineId].fontAssetId);
        });
    }

    function serializedPortablePlayerTheme(renderer) {
        var theme = currentPlayerThemeForExport(renderer);
        return JSON.stringify(portablePlayerThemeV5(theme, false), null, 2);
    }

    function copyPortablePlayerTheme(renderer) {
        var serialized = serializedPortablePlayerTheme(renderer);
        var copied = false;
        var done = function () {
            updatePlayerThemeLibraryStatus(
                renderer,
                playerThemeHasPrivateAssets(currentPlayerThemeForExport(renderer))
                    ? "主题 JSON 已复制；私有图片或字体已安全回退，分享后需重新上传"
                    : "主题 JSON 已复制，可以直接分享",
                "synced"
            );
        };
        if ("undefined" !== typeof navigator && navigator.clipboard
            && navigator.clipboard.writeText) {
            Promise.resolve(navigator.clipboard.writeText(serialized)).then(done).catch(function () {
                updatePlayerThemeLibraryStatus(renderer, "浏览器未允许写入剪贴板，请使用下载 JSON", "error");
            });
            return;
        }
        try {
            var textarea = document.createElement("textarea");
            textarea.value = serialized;
            textarea.setAttribute("readonly", "readonly");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            copied = !!(document.execCommand && document.execCommand("copy"));
            document.body.removeChild(textarea);
        } catch (error) {}
        if (copied) { done(); }
        else { updatePlayerThemeLibraryStatus(renderer, "无法访问剪贴板，请使用下载 JSON", "error"); }
    }

    function downloadPortablePlayerTheme(renderer) {
        if ("undefined" === typeof Blob || "undefined" === typeof URL || !URL.createObjectURL) {
            updatePlayerThemeLibraryStatus(renderer, "当前浏览器不支持下载主题 JSON", "error");
            return;
        }
        var theme = currentPlayerThemeForExport(renderer);
        var blob = new Blob([serializedPortablePlayerTheme(renderer)], { type: "application/json;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = normalizePlayerThemeName(theme.name, "elyric-theme")
            .replace(/[^\w\u4e00-\u9fff-]+/g, "-") + ".elyric-theme.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        updatePlayerThemeLibraryStatus(
            renderer,
            playerThemeHasPrivateAssets(theme)
                ? "主题 JSON 已下载；私有图片或字体未写入分享文件"
                : "主题 JSON 已下载",
            "synced"
        );
    }

    function validateImportedThemeForbiddenFields(value, path) {
        if (!value || "object" !== typeof value) { return; }
        if (Array.isArray(value)) {
            value.forEach(function (item, index) {
                validateImportedThemeForbiddenFields(item, path + "[" + index + "]");
            });
            return;
        }
        Object.keys(value).forEach(function (key) {
            var normalized = key.toLowerCase();
            if (["userid", "user_id", "path", "filepath", "filesystempath", "revision", "updatedat"]
                .indexOf(normalized) >= 0) {
                throw new Error(path + "." + key + " 不允许出现在分享主题中");
            }
            validateImportedThemeForbiddenFields(value[key], path + "." + key);
        });
    }

    function validateImportedThemeObject(value, sectionName, allowedKeys) {
        if (!value || "object" !== typeof value || Array.isArray(value)) {
            throw new Error(sectionName + " 必须是对象");
        }
        Object.keys(value).forEach(function (key) {
            if (allowedKeys.indexOf(key) < 0) {
                throw new Error(sectionName + " 包含未知字段 " + key);
            }
        });
    }

    function validateImportedThemeNumber(host, key, minimum, maximum, sectionName) {
        if (!Object.prototype.hasOwnProperty.call(host, key)) { return; }
        var value = host[key];
        if ("number" !== typeof value || !isFinite(value) || value < minimum || value > maximum) {
            throw new Error(sectionName + "." + key + " 超出允许范围");
        }
    }

    function validateImportedThemeBoolean(host, key, sectionName) {
        if (Object.prototype.hasOwnProperty.call(host, key) && "boolean" !== typeof host[key]) {
            throw new Error(sectionName + "." + key + " 必须是布尔值");
        }
    }

    function validateImportedThemeEnum(host, key, allowed, sectionName) {
        if (Object.prototype.hasOwnProperty.call(host, key) && allowed.indexOf(host[key]) < 0) {
            throw new Error(sectionName + "." + key + " 包含不支持的值");
        }
    }

    function validateImportedThemeColor(host, key, sectionName) {
        if (Object.prototype.hasOwnProperty.call(host, key)
            && !/^#[0-9a-f]{6}$/i.test(String(host[key] || ""))) {
            throw new Error(sectionName + "." + key + " 必须是六位十六进制颜色");
        }
    }

    function validateImportedThemeHttpsUrl(host, key, sectionName) {
        if (!Object.prototype.hasOwnProperty.call(host, key) || !host[key]) { return; }
        if ("string" !== typeof host[key] || host[key].length > 2048 || !/^https:\/\/[^\s]+$/i.test(host[key])) {
            throw new Error(sectionName + "." + key + " 只允许 HTTPS 地址");
        }
    }

    function validateImportedThemeMappedTuning(section, sectionName, mapping) {
        Object.keys(mapping).forEach(function (key) {
            var definition = playerTuningDefinition(mapping[key]);
            if (definition) {
                validateImportedThemeNumber(section, key, definition.minimum, definition.maximum, sectionName);
            }
        });
    }

    function validateImportedThemeLayer(layer, sectionName, fixedCanvas) {
        var keys = ["x", "y", "width", "height", "rotation", "z", "opacity", "hidden", "locked"];
        if (!fixedCanvas) { keys = ["anchorX", "anchorY"].concat(keys); }
        validateImportedThemeObject(
            layer,
            sectionName,
            keys
        );
        if (!fixedCanvas) {
            validateImportedThemeEnum(layer, "anchorX", PLAYER_THEME_V2_ANCHORS, sectionName);
            validateImportedThemeEnum(layer, "anchorY", PLAYER_THEME_V2_ANCHORS, sectionName);
        }
        validateImportedThemeNumber(layer, "x", -1920, 1920, sectionName);
        validateImportedThemeNumber(layer, "y", -1920, 1920, sectionName);
        validateImportedThemeNumber(layer, "width", 44, 3840, sectionName);
        validateImportedThemeNumber(layer, "height", 44, 3840, sectionName);
        validateImportedThemeNumber(layer, "rotation", -360, 360, sectionName);
        validateImportedThemeNumber(layer, "z", 0, 1000, sectionName);
        validateImportedThemeNumber(layer, "opacity", 0, 1, sectionName);
        validateImportedThemeBoolean(layer, "hidden", sectionName);
        validateImportedThemeBoolean(layer, "locked", sectionName);
        keys.forEach(function (key) {
                if (!Object.prototype.hasOwnProperty.call(layer, key)) {
                    throw new Error(sectionName + " 缺少 " + key);
                }
            });
    }

    function validateImportedThemeTypography(typography) {
        validateImportedThemeObject(typography, "lyrics.typography", ["primary", "secondary", "tertiary"]);
        ["primary", "secondary", "tertiary"].forEach(function (lineId) {
            if (!typography[lineId]) { return; }
            var style = typography[lineId];
            var sectionName = "lyrics.typography." + lineId;
            validateImportedThemeObject(style, sectionName, [
                "fontFamily", "fontAssetId", "fontUrl", "size", "weight", "italic", "letterSpacing",
                "lineHeight", "color", "opacity", "strokeWidth", "strokeColor", "shadowX", "shadowY",
                "shadowBlur", "shadowColor", "glow", "states"
            ]);
            if (style.fontAssetId) {
                throw new Error(sectionName + ".fontAssetId 是私有资产，分享主题不能引用");
            }
            if (Object.prototype.hasOwnProperty.call(style, "fontFamily")
                && ("string" !== typeof style.fontFamily || style.fontFamily.length > 160
                    || /[\u0000-\u001f\u007f]/.test(style.fontFamily))) {
                throw new Error(sectionName + ".fontFamily 无效");
            }
            validateImportedThemeHttpsUrl(style, "fontUrl", sectionName);
            validateImportedThemeNumber(style, "size", 40, 300, sectionName);
            validateImportedThemeNumber(style, "weight", 100, 900, sectionName);
            validateImportedThemeBoolean(style, "italic", sectionName);
            validateImportedThemeNumber(style, "letterSpacing", -5, 20, sectionName);
            validateImportedThemeNumber(style, "lineHeight", .8, 3, sectionName);
            validateImportedThemeNumber(style, "opacity", 0, 1, sectionName);
            validateImportedThemeNumber(style, "strokeWidth", 0, 8, sectionName);
            validateImportedThemeNumber(style, "shadowX", -30, 30, sectionName);
            validateImportedThemeNumber(style, "shadowY", -30, 30, sectionName);
            validateImportedThemeNumber(style, "shadowBlur", 0, 60, sectionName);
            validateImportedThemeNumber(style, "glow", 0, 60, sectionName);
            ["color", "strokeColor", "shadowColor"].forEach(function (key) {
                validateImportedThemeColor(style, key, sectionName);
            });
            if (style.states) {
                validateImportedThemeObject(style.states, sectionName + ".states", ["past", "current", "future"]);
                ["past", "current", "future"].forEach(function (stateId) {
                    if (!style.states[stateId]) { return; }
                    var stateName = sectionName + ".states." + stateId;
                    validateImportedThemeObject(style.states[stateId], stateName, ["color", "opacity"]);
                    validateImportedThemeColor(style.states[stateId], "color", stateName);
                    validateImportedThemeNumber(style.states[stateId], "opacity", 0, 1, stateName);
                });
            }
        });
    }

    function validatePortablePlayerThemeV3Document(documentValue) {
        var portableVersion = Number(documentValue && documentValue.schemaVersion);
        var legacyGeometry = 3 === portableVersion;
        validateImportedThemeForbiddenFields(documentValue, "theme");
        validateImportedThemeObject(documentValue, "theme", [
            "format", "schemaVersion", "layoutModel", "name", "baseTheme", "layouts", "viewport", "viewportTransforms",
            "background", "artwork", "metadata", "lyrics", "visualizer", "systemChrome", "console", "controls",
            "volume", "overlays", "mediaCard", "mediaFields"
        ]);
        if (PLAYER_THEME_DOCUMENT_FORMAT !== documentValue.format
            || [3, 4, 5, 6].indexOf(Number(documentValue.schemaVersion)) < 0) {
            throw new Error("主题格式或版本不是 Theme V3");
        }
        if ("string" !== typeof documentValue.name || !documentValue.name.trim()
            || documentValue.name.length > 80 || /[\u0000-\u001f\u007f]/.test(documentValue.name)) {
            throw new Error("主题名称无效");
        }
        validateImportedThemeEnum(
            documentValue,
            "baseTheme",
            ["album", "center", "mobile", "mint", "deck", "stack", "coverflow", "lyrics", "rose"],
            "theme"
        );
        if (portableVersion >= 4) {
            var expectedLayoutModel = portableVersion >= 5
                ? PLAYER_THEME_LAYOUT_MODEL : PLAYER_THEME_PREVIOUS_LAYOUT_MODEL;
            var allowedLayoutModels = portableVersion >= 5
                ? [PLAYER_THEME_LAYOUT_MODEL, PLAYER_THEME_LEGACY_V5_LAYOUT_MODEL]
                : [expectedLayoutModel];
            if (allowedLayoutModels.indexOf(documentValue.layoutModel) < 0) {
                throw new Error("Theme V4 必须声明 anchored-canvas-v1 布局模型");
            }
            if (portableVersion < 6 && !documentValue.viewportTransforms) {
                throw new Error("Theme V4 缺少 viewportTransforms");
            }
            validateImportedThemeEnum(documentValue, "layoutModel", allowedLayoutModels, "theme");
            if (portableVersion < 6) {
                validateImportedThemeObject(documentValue.viewportTransforms, "viewportTransforms", ["landscape", "portrait"]);
                ["landscape", "portrait"].forEach(function (profileId) {
                    var transform = documentValue.viewportTransforms[profileId];
                    if (!transform) { throw new Error("viewportTransforms 缺少 " + profileId); }
                    validateImportedThemeObject(transform, "viewportTransforms." + profileId, ["scale", "offsetX", "offsetY"]);
                    ["scale", "offsetX", "offsetY"].forEach(function (key) {
                        if (!Object.prototype.hasOwnProperty.call(transform, key)) {
                            throw new Error("viewportTransforms." + profileId + " 缺少 " + key);
                        }
                    });
                    validateImportedThemeNumber(transform, "scale", .5, 1.6, "viewportTransforms." + profileId);
                    validateImportedThemeNumber(transform, "offsetX", -600, 600, "viewportTransforms." + profileId);
                    validateImportedThemeNumber(transform, "offsetY", -600, 600, "viewportTransforms." + profileId);
                });
            }
        }
        if (!documentValue.layouts) {
            throw new Error("theme 缺少 layouts");
        }
        validateImportedThemeObject(documentValue.layouts, "layouts", ["landscape", "portrait"]);
        ["landscape", "portrait"].forEach(function (profileId) {
            var layout = documentValue.layouts[profileId];
            if (!layout) {
                throw new Error("layouts 缺少 " + profileId);
            }
            var layerIds = portableVersion >= 5 ? PLAYER_THEME_V2_LAYER_IDS
                : (4 === portableVersion ? PLAYER_THEME_V4_LAYER_IDS : PLAYER_THEME_V2_LAYER_IDS);
            validateImportedThemeObject(layout, "layouts." + profileId, layerIds.concat(portableVersion >= 6 ? ["canvas"] : []));
            if (portableVersion >= 6) {
                var canvas = layout.canvas;
                var expectedCanvas = PLAYER_THEME_CANVAS_SIZES[profileId];
                validateImportedThemeObject(canvas, "layouts." + profileId + ".canvas", ["width", "height"]);
                if (!canvas || Number(canvas.width) !== expectedCanvas.width || Number(canvas.height) !== expectedCanvas.height) {
                    throw new Error("layouts." + profileId + ".canvas 必须为固定 V6 画布尺寸");
                }
            }
            layerIds.forEach(function (layerId) {
                if (!layout[layerId]) {
                    throw new Error("layouts." + profileId + " 缺少 " + layerId + " 图层");
                }
                if (portableVersion >= 4) {
                    validateImportedThemeLayer(
                        layout[layerId], "layouts." + profileId + "." + layerId, portableVersion >= 6
                    );
                }
            });
        });
        if (portableVersion >= 5) {
            var controls = normalizePlayerControlDock(documentValue.controls);
            if (!documentValue.controls || !documentValue.controls.profiles) {
                throw new Error("Theme V6 缺少 controls.profiles");
            }
            ["landscape", "portrait"].forEach(function (profileId) {
                var original = documentValue.controls.profiles[profileId];
                if (!original || !Array.isArray(original.rows) || !original.groups) {
                    throw new Error("controls.profiles." + profileId + " 无效");
                }
                if (JSON.stringify(original) !== JSON.stringify(controls.profiles[profileId])) {
                    throw new Error("controls.profiles." + profileId + " 含非法或重复的控制项");
                }
            });
        }

        var background = documentValue.background || {};
        validateImportedThemeObject(background, "background", ["mode", "blur", "dim", "saturation", "angle", "colorA", "colorB"]);
        validateImportedThemeEnum(background, "mode", ["black", "white", "blur", "gradient"], "background");
        validateImportedThemeMappedTuning(background, "background", {
            blur: "backgroundBlur", dim: "backgroundDim", saturation: "backgroundSaturation", angle: "backgroundAngle"
        });
        validateImportedThemeColor(background, "colorA", "background");
        validateImportedThemeColor(background, "colorB", "background");

        var artwork = documentValue.artwork || {};
        validateImportedThemeObject(artwork, "artwork", [
            "source", "url", "assetId", "fit", "focusX", "focusY", "clipPath", "mode", "material", "rotation",
            "scale", "innerSize", "outerRadius", "innerRadius", "padding",
            "borderWidth", "shadowDepth", "coverflowWidth", "coverflowHeight", "frameColor"
        ].concat(legacyGeometry ? ["size", "x", "y"] : []));
        if (artwork.assetId) { throw new Error("artwork.assetId 是私有资产，分享主题不能引用"); }
        validateImportedThemeEnum(artwork, "source", ["emby", "url"], "artwork");
        validateImportedThemeEnum(artwork, "fit", ["cover", "contain", "fill", "none", "scale-down"], "artwork");
        validateImportedThemeEnum(artwork, "mode", ["single", "coverflow"], "artwork");
        validateImportedThemeEnum(artwork, "material", PLAYER_ARTWORK_MATERIALS.map(function (item) { return item.id; }), "artwork");
        validateImportedThemeBoolean(artwork, "rotation", "artwork");
        validateImportedThemeNumber(artwork, "focusX", 0, 100, "artwork");
        validateImportedThemeNumber(artwork, "focusY", 0, 100, "artwork");
        validateImportedThemeHttpsUrl(artwork, "url", "artwork");
        if (Object.prototype.hasOwnProperty.call(artwork, "clipPath")
            && !/^(?:none|polygon\([\d\s.,%+-]+\))$/i.test(String(artwork.clipPath))) {
            throw new Error("artwork.clipPath 只允许 none 或 polygon() ");
        }
        validateImportedThemeColor(artwork, "frameColor", "artwork");
        validateImportedThemeMappedTuning(artwork, "artwork", {
            scale: "artworkScale",
            innerSize: "artworkInnerSize", outerRadius: "artworkOuterRadius", innerRadius: "artworkInnerRadius",
            padding: "artworkPadding", borderWidth: "artworkBorderWidth", shadowDepth: "artworkShadowDepth",
            coverflowWidth: "coverflowWidth", coverflowHeight: "coverflowHeight"
        });
        if (legacyGeometry) {
            validateImportedThemeMappedTuning(artwork, "artwork", {
                size: "artworkSize", x: "artworkX", y: "artworkY"
            });
        }

        var metadata = documentValue.metadata || {};
        validateImportedThemeObject(metadata, "metadata", [
            "anchor", "align", "surface", "titleSize", "artistSize", "albumSize",
            "letterSpacing", "padding", "radius", "blur", "opacity", "textColor", "surfaceColor", "summaryFields"
        ].concat(legacyGeometry ? ["width", "x", "y"] : []));
        validateImportedThemeEnum(metadata, "anchor", ["start", "center", "end"], "metadata");
        validateImportedThemeEnum(metadata, "align", ["left", "center", "right"], "metadata");
        validateImportedThemeEnum(metadata, "surface", ["none", "glass", "inset", "embossed", "floating"], "metadata");
        validateImportedThemeMappedTuning(metadata, "metadata", {
            titleSize: "metadataTitleSize",
            artistSize: "metadataArtistSize", albumSize: "metadataAlbumSize", letterSpacing: "metadataLetterSpacing",
            padding: "metadataPadding", radius: "metadataRadius", blur: "metadataBlur", opacity: "metadataOpacity"
        });
        if (legacyGeometry) {
            validateImportedThemeMappedTuning(metadata, "metadata", {
                width: "metadataWidth", x: "metadataX", y: "metadataY"
            });
        }
        validateImportedThemeColor(metadata, "textColor", "metadata");
        validateImportedThemeColor(metadata, "surfaceColor", "metadata");

        if (portableVersion >= 6) {
            var viewportV6 = documentValue.viewport || {};
            validateImportedThemeObject(viewportV6, "viewport", ["fit", "alignX", "alignY"]);
            validateImportedThemeEnum(viewportV6, "fit", ["contain"], "viewport");
            validateImportedThemeEnum(viewportV6, "alignX", ["center"], "viewport");
            validateImportedThemeEnum(viewportV6, "alignY", ["end"], "viewport");
            var chrome = documentValue.systemChrome || {};
            validateImportedThemeObject(chrome, "systemChrome", [
                "size", "surface", "color", "surfaceColor", "radius", "blur", "shadow", "showLabels"
            ]);
            validateImportedThemeNumber(chrome, "size", 44, 80, "systemChrome");
            validateImportedThemeEnum(chrome, "surface", ["none", "glass", "black", "white", "gradient"], "systemChrome");
            validateImportedThemeColor(chrome, "color", "systemChrome");
            validateImportedThemeColor(chrome, "surfaceColor", "systemChrome");
            validateImportedThemeNumber(chrome, "radius", 0, 50, "systemChrome");
            validateImportedThemeNumber(chrome, "blur", 0, 48, "systemChrome");
            validateImportedThemeNumber(chrome, "shadow", 0, 64, "systemChrome");
            validateImportedThemeBoolean(chrome, "showLabels", "systemChrome");

            var overlayV6 = documentValue.overlays || {};
            validateImportedThemeObject(overlayV6, "overlays", [
                "surface", "surfaceColor", "textColor", "accentColor", "radius", "blur", "opacity",
                "backdrop", "gap", "margin", "arrowSize", "durationMs", "sizes"
            ]);
            validateImportedThemeEnum(overlayV6, "surface", ["none", "glass", "black", "white", "gradient"], "overlays");
            ["surfaceColor", "textColor", "accentColor"].forEach(function (key) {
                validateImportedThemeColor(overlayV6, key, "overlays");
            });
            validateImportedThemeNumber(overlayV6, "radius", 0, 64, "overlays");
            validateImportedThemeNumber(overlayV6, "blur", 0, 64, "overlays");
            validateImportedThemeNumber(overlayV6, "opacity", 0, 100, "overlays");
            validateImportedThemeNumber(overlayV6, "gap", 4, 32, "overlays");
            validateImportedThemeNumber(overlayV6, "margin", 8, 48, "overlays");
            validateImportedThemeNumber(overlayV6, "arrowSize", 4, 24, "overlays");
            validateImportedThemeNumber(overlayV6, "durationMs", 0, 600, "overlays");
            var backdrop = overlayV6.backdrop || {};
            validateImportedThemeObject(backdrop, "overlays.backdrop", ["dim", "blur"]);
            validateImportedThemeNumber(backdrop, "dim", 0, 100, "overlays.backdrop");
            validateImportedThemeNumber(backdrop, "blur", 0, 48, "overlays.backdrop");
            var overlaySizes = overlayV6.sizes || {};
            validateImportedThemeObject(overlaySizes, "overlays.sizes", ["media", "queue", "settings", "cast", "volume"]);
            ["media", "queue", "settings", "cast", "volume"].forEach(function (kind) {
                var size = overlaySizes[kind] || {};
                validateImportedThemeObject(size, "overlays.sizes." + kind, ["minWidth", "maxWidth", "maxHeight"]);
                validateImportedThemeNumber(size, "minWidth", 48, 720, "overlays.sizes." + kind);
                validateImportedThemeNumber(size, "maxWidth", 48, 720, "overlays.sizes." + kind);
                validateImportedThemeNumber(size, "maxHeight", 10, 100, "overlays.sizes." + kind);
                if (Number(size.minWidth) > Number(size.maxWidth)) {
                    throw new Error("overlays.sizes." + kind + " 的最小宽度不能大于最大宽度");
                }
            });

            var volumeV6 = documentValue.volume || {};
            validateImportedThemeObject(volumeV6, "volume", [
                "landscapeMode", "portraitMode", "iconFill", "popoverWidth", "popoverHeight"
            ]);
            validateImportedThemeEnum(volumeV6, "landscapeMode", ["expanded", "iconPopover"], "volume");
            validateImportedThemeEnum(volumeV6, "portraitMode", ["iconPopover"], "volume");
            validateImportedThemeBoolean(volumeV6, "iconFill", "volume");
            validateImportedThemeNumber(volumeV6, "popoverWidth", 64, 120, "volume");
            validateImportedThemeNumber(volumeV6, "popoverHeight", 160, 360, "volume");
        }

        var lyrics = documentValue.lyrics || {};
        validateImportedThemeObject(lyrics, "lyrics", [
            "style", "alignment", "scale", "surface", "lineHeight",
            "inactiveOpacity", "padding", "radius", "blur", "opacity", "letterSpacing", "pastSize",
            "currentSize", "futureSize", "currentWeight", "pastColor", "currentColor", "futureColor",
            "surfaceColor", "showSecondLine", "showThirdAndLaterLines", "followDelayMs", "typography"
        ].concat(legacyGeometry ? ["width", "height", "x", "y"] : []));
        validateImportedThemeEnum(lyrics, "style", THEMES.map(function (item) { return item.id; }), "lyrics");
        validateImportedThemeEnum(lyrics, "alignment", ["left", "center", "right"], "lyrics");
        validateImportedThemeEnum(lyrics, "surface", ["none", "glass", "inset", "embossed", "floating"], "lyrics");
        validateImportedThemeNumber(lyrics, "scale", 70, 170, "lyrics");
        validateImportedThemeBoolean(lyrics, "showSecondLine", "lyrics");
        validateImportedThemeBoolean(lyrics, "showThirdAndLaterLines", "lyrics");
        validateImportedThemeNumber(lyrics, "followDelayMs", 1000, 60000, "lyrics");
        validateImportedThemeMappedTuning(lyrics, "lyrics", {
            lineHeight: "lyricLineGap", inactiveOpacity: "lyricInactiveOpacity", padding: "lyricsPadding",
            radius: "lyricsRadius", blur: "lyricsBlur", opacity: "lyricsOpacity",
            letterSpacing: "lyricLetterSpacing", pastSize: "lyricPastSize", currentSize: "lyricCurrentSize",
            futureSize: "lyricFutureSize", currentWeight: "lyricCurrentWeight"
        });
        if (legacyGeometry) {
            validateImportedThemeMappedTuning(lyrics, "lyrics", {
                width: "lyricsWidth", height: "lyricsHeight", x: "lyricsX", y: "lyricsY"
            });
        }
        ["pastColor", "currentColor", "futureColor", "surfaceColor"].forEach(function (key) {
            validateImportedThemeColor(lyrics, key, "lyrics");
        });
        if (lyrics.typography) { validateImportedThemeTypography(lyrics.typography); }

        var visualizer = documentValue.visualizer || {};
        validateImportedThemeObject(visualizer, "visualizer", [
            "style", "frequencyLayout", "width", "height", "amplitude", "colorMode", "colors", "analysis"
        ].concat(legacyGeometry ? ["x", "y", "rotation", "opacity"] : []));
        validateImportedThemeEnum(visualizer, "style", VISUALIZER_STYLES.map(function (item) { return item.id; }), "visualizer");
        validateImportedThemeEnum(visualizer, "frequencyLayout", VISUALIZER_FREQUENCY_LAYOUTS.map(function (item) { return item.id; }), "visualizer");
        validateImportedThemeEnum(visualizer, "colorMode", VISUALIZER_COLOR_MODES.map(function (item) { return item.id; }), "visualizer");
        validateImportedThemeNumber(visualizer, "width", 10, 100, "visualizer");
        validateImportedThemeNumber(visualizer, "height", 2, 30, "visualizer");
        validateImportedThemeNumber(visualizer, "amplitude", 25, 140, "visualizer");
        if (legacyGeometry) {
            validateImportedThemeMappedTuning(visualizer, "visualizer", {
                x: "visualizerX", y: "visualizerY", rotation: "visualizerRotation", opacity: "visualizerOpacity"
            });
        }
        if (visualizer.colors) {
            if (!Array.isArray(visualizer.colors) || !visualizer.colors.length || visualizer.colors.length > 8
                || visualizer.colors.some(function (color) { return !/^#[0-9a-f]{6}$/i.test(String(color)); })) {
                throw new Error("visualizer.colors 必须包含一到八个六位十六进制颜色");
            }
        }
        var analysis = visualizer.analysis || {};
        validateImportedThemeObject(
            analysis,
            "visualizer.analysis",
            VISUALIZER_ANALYSIS_DEFINITIONS.map(function (definition) { return definition.id; })
        );
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            validateImportedThemeNumber(analysis, definition.id, definition.minimum, definition.maximum, "visualizer.analysis");
        });
        if (analysis.minFrequency && analysis.maxFrequency && analysis.minFrequency >= analysis.maxFrequency) {
            throw new Error("visualizer.analysis 的最高频率必须大于最低频率");
        }

        var consoleStyle = documentValue.console || {};
        validateImportedThemeObject(consoleStyle, "console", [
            "material", "progressHeight", "progressThumbSize", "volumeHeight",
            "volumeThumbSize", "blur", "opacity", "progressActive", "progressTrack", "volumeActive",
            "volumeTrack", "safeArea", "surfaceColor", "textColor", "accentColor", "gradientA", "gradientB",
            "gradientAngle", "radius", "borderWidth", "shadow"
        ].concat(legacyGeometry ? ["progressWidth", "volumeWidth"] : []));
        validateImportedThemeEnum(consoleStyle, "material", PLAYER_CONTROL_MATERIALS.map(function (item) { return item.id; }), "console");
        validateImportedThemeMappedTuning(consoleStyle, "console", {
            progressHeight: "progressTrackHeight", progressThumbSize: "progressThumbSize",
            volumeHeight: "volumeTrackHeight", volumeThumbSize: "volumeThumbSize",
            blur: "consoleBlur", opacity: "consoleOpacity"
        });
        if (legacyGeometry) {
            validateImportedThemeMappedTuning(consoleStyle, "console", {
                progressWidth: "progressWidth", volumeWidth: "volumeWidth"
            });
        }
        validateImportedThemeNumber(consoleStyle, "safeArea", 44, 180, "console");
        ["progressActive", "progressTrack", "volumeActive", "volumeTrack"].forEach(function (key) {
            validateImportedThemeColor(consoleStyle, key, "console");
        });

        var mediaCard = documentValue.mediaCard || {};
        validateImportedThemeObject(mediaCard, "mediaCard", [
            "surface", "width", "maxHeight", "radius", "blur", "opacity", "surfaceColor",
            "popupOpacity", "popupRadius"
        ]);
        validateImportedThemeEnum(mediaCard, "surface", ["none", "glass", "inset", "embossed", "floating"], "mediaCard");
        validateImportedThemeMappedTuning(mediaCard, "mediaCard", {
            width: "mediaWidth", maxHeight: "mediaMaxHeight", radius: "mediaRadius",
            blur: "mediaBlur", opacity: "mediaOpacity"
        });
        validateImportedThemeColor(mediaCard, "surfaceColor", "mediaCard");
        validateImportedThemeNumber(mediaCard, "popupOpacity", 35, 100, "mediaCard");
        validateImportedThemeNumber(mediaCard, "popupRadius", 0, 64, "mediaCard");

        var mediaFields = documentValue.mediaFields || {};
        validateImportedThemeObject(mediaFields, "mediaFields", PLAYER_MEDIA_FIELDS.map(function (field) { return field.id; }));
        PLAYER_MEDIA_FIELDS.forEach(function (field) {
            validateImportedThemeBoolean(mediaFields, field.id, "mediaFields");
        });
        return true;
    }

    function applyImportedPlayerThemePreview(renderer, serialized) {
        serialized = String(serialized || "").trim();
        if (!serialized || serialized.length > 512 * 1024) {
            updatePlayerThemeLibraryStatus(renderer, "主题 JSON 为空或超过 512 KB", "error");
            return false;
        }
        var documentValue;
        try { documentValue = JSON.parse(serialized); }
        catch (error) {
            updatePlayerThemeLibraryStatus(renderer, "主题 JSON 语法无效", "error");
            return false;
        }
        try {
            validatePortablePlayerThemeV3Document(documentValue);
        } catch (validationError) {
            updatePlayerThemeLibraryStatus(
                renderer,
                "主题校验失败：" + String(validationError && validationError.message || validationError),
                "error"
            );
            return false;
        }
        documentValue.id = "import-preview";
        var imported = normalizeSavedPlayerTheme(documentValue, 0);
        if (!imported || !imported.v2) {
            updatePlayerThemeLibraryStatus(renderer, "主题参数未通过安全校验", "error");
            return false;
        }
        var baseDefinition = PLAYER_LAYOUTS.filter(function (layout) {
            return layout.id === imported.baseLayout;
        })[0];
        if ("undefined" !== typeof window && window.confirm
            && !window.confirm(
                "导入主题“" + imported.name + "”作为预览草稿？\n"
                + "基础主题：" + (baseDefinition ? baseDefinition.label : imported.baseLayout) + "\n"
                + "布局：Landscape + Portrait\n确认后可继续微调，再另存为用户主题。"
            )) {
            return false;
        }
        renderer.__elyricActiveUserPlayerThemeId = null;
        renderer.__elyricThemeBaseLayout = imported.baseLayout;
        renderer.__elyricPlayerLayout = "custom";
        applyPlayerLayout(renderer, "custom", false);
        applyPlayerThemeDefinition(renderer, imported);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        syncPlayerThemeLibraryControls(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已导入预览草稿；确认效果后请另存为新主题", "synced");
        return true;
    }

    function promptImportPortablePlayerTheme(renderer) {
        if ("undefined" === typeof window || !window.prompt) {
            updatePlayerThemeLibraryStatus(renderer, "当前浏览器不支持粘贴导入", "error");
            return;
        }
        var serialized = window.prompt("粘贴完整的 Emby Lyric Theme V3 JSON");
        if (null != serialized) { applyImportedPlayerThemePreview(renderer, serialized); }
    }

    function importPortablePlayerThemeFile(renderer, file) {
        if (!file || file.size > 512 * 1024 || "undefined" === typeof FileReader) {
            updatePlayerThemeLibraryStatus(renderer, "请选择不超过 512 KB 的主题 JSON 文件", "error");
            return;
        }
        var reader = new FileReader();
        reader.onload = function () { applyImportedPlayerThemePreview(renderer, reader.result); };
        reader.onerror = function () { updatePlayerThemeLibraryStatus(renderer, "无法读取主题 JSON 文件", "error"); };
        reader.readAsText(file, "utf-8");
    }

    function ensurePlayerThemeV2State(renderer) {
        if (!renderer.__elyricThemeV2) {
            renderer.__elyricThemeV2 = defaultPlayerThemeV2State();
        }
        renderer.__elyricThemeV2 = normalizePlayerThemeV2State(renderer.__elyricThemeV2);
        renderer.__elyricThemeV2Profile = renderer.__elyricThemeV2Profile || currentPlayerThemeV2Profile();
        renderer.__elyricThemeV2SelectedLayer = renderer.__elyricThemeV2SelectedLayer || "lyrics";
        renderer.__elyricThemeV2Undo = renderer.__elyricThemeV2Undo || [];
        renderer.__elyricThemeV2Redo = renderer.__elyricThemeV2Redo || [];
        return renderer.__elyricThemeV2;
    }

    function pushPlayerThemeV2History(renderer) {
        ensurePlayerThemeV2State(renderer);
        renderer.__elyricThemeV2Undo.push(clonePlayerThemeV2Value(renderer.__elyricThemeV2));
        if (renderer.__elyricThemeV2Undo.length > 80) {
            renderer.__elyricThemeV2Undo.shift();
        }
        renderer.__elyricThemeV2Redo = [];
    }

    function restorePlayerThemeV2History(renderer, direction) {
        ensurePlayerThemeV2State(renderer);
        var source = "undo" === direction ? renderer.__elyricThemeV2Undo : renderer.__elyricThemeV2Redo;
        var destination = "undo" === direction ? renderer.__elyricThemeV2Redo : renderer.__elyricThemeV2Undo;
        if (!source.length) { return; }
        destination.push(clonePlayerThemeV2Value(renderer.__elyricThemeV2));
        renderer.__elyricThemeV2 = source.pop();
        applyPlayerThemeV2State(renderer, renderer.__elyricThemeV2, renderer.__elyricThemeV2Profile);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
    }

    function activePlayerThemeV2Layer(renderer) {
        ensurePlayerThemeV2State(renderer);
        return resolvedPlayerThemeV2Layout(renderer, renderer.__elyricThemeV2Profile)
            [renderer.__elyricThemeV2SelectedLayer];
    }

    function snapPlayerThemeV2Value(value, anchors) {
        var snapped = value;
        var distance = 10;
        anchors.forEach(function (anchor) {
            if (Math.abs(value - anchor) <= distance) { snapped = anchor; }
        });
        return Math.round(snapped * 10) / 10;
    }

    function setPlayerThemeV2DesignerGuides(renderer, metrics, x, y) {
        var host = renderer.__elyricThemeV2Guides;
        if (!host || !host.children || host.children.length < 2) { return; }
        var vertical = host.children[0];
        var horizontal = host.children[1];
        if (isFinite(Number(x))) {
            vertical.style.left = metrics.forward(Number(x), 0).x + "px";
            vertical.style.display = "block";
        } else {
            vertical.style.display = "none";
        }
        if (isFinite(Number(y))) {
            horizontal.style.top = metrics.forward(0, Number(y)).y + "px";
            horizontal.style.display = "block";
        } else {
            horizontal.style.display = "none";
        }
    }

    function snapPlayerThemeV2LayerGeometry(renderer, layerId, proposed, metrics, resizing) {
        var layout = resolvedPlayerThemeV2Layout(renderer, renderer.__elyricThemeV2Profile);
        var horizontal = [0, metrics.designWidth / 2, metrics.designWidth];
        var vertical = [0, metrics.designHeight / 2, metrics.designHeight];
        var siblings = [];
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (siblingId) {
            if (siblingId === layerId || !layout[siblingId] || layout[siblingId].hidden) { return; }
            var rect = playerThemeV2LayerDesignRect(layout[siblingId], metrics);
            rect.right = rect.left + rect.width;
            rect.bottom = rect.top + rect.height;
            siblings.push(rect);
            horizontal.push(rect.left, rect.left + rect.width / 2, rect.right);
            vertical.push(rect.top, rect.top + rect.height / 2, rect.bottom);
        });
        siblings.forEach(function (first) {
            siblings.forEach(function (second) {
                if (first === second) { return; }
                if (first.right <= second.left) {
                    var horizontalGap = second.left - first.right;
                    horizontal.push(first.left - horizontalGap, second.right + horizontalGap);
                }
                if (first.bottom <= second.top) {
                    var verticalGap = second.top - first.bottom;
                    vertical.push(first.top - verticalGap, second.bottom + verticalGap);
                }
            });
        });
        var rect = playerThemeV2LayerDesignRect(proposed, metrics);
        var xPoints = resizing
            ? [{ value: rect.left + rect.width, adjust: "width" }]
            : [
                { value: rect.left, adjust: "x" },
                { value: rect.left + rect.width / 2, adjust: "x" },
                { value: rect.left + rect.width, adjust: "x" }
            ];
        var yPoints = resizing
            ? [{ value: rect.top + rect.height, adjust: "height" }]
            : [
                { value: rect.top, adjust: "y" },
                { value: rect.top + rect.height / 2, adjust: "y" },
                { value: rect.top + rect.height, adjust: "y" }
            ];
        function closest(points, candidates) {
            var match = null;
            points.forEach(function (point) {
                candidates.forEach(function (candidate) {
                    var distance = candidate - point.value;
                    if (Math.abs(distance) <= 10 && (!match || Math.abs(distance) < Math.abs(match.distance))) {
                        match = { distance: distance, candidate: candidate, adjust: point.adjust };
                    }
                });
            });
            return match;
        }
        var xMatch = closest(xPoints, horizontal);
        var yMatch = closest(yPoints, vertical);
        if (xMatch) { proposed[xMatch.adjust] += xMatch.distance; }
        if (yMatch) { proposed[yMatch.adjust] += yMatch.distance; }
        proposed.width = Math.max(44, proposed.width);
        proposed.height = Math.max(44, proposed.height);
        setPlayerThemeV2DesignerGuides(
            renderer, metrics,
            xMatch ? xMatch.candidate : null,
            yMatch ? yMatch.candidate : null
        );
        return proposed;
    }

    function updatePlayerThemeV2Layer(renderer, patch, recordHistory) {
        var inheritedLayer = activePlayerThemeV2Layer(renderer);
        if (inheritedLayer.locked && !Object.prototype.hasOwnProperty.call(patch, "locked")) { return; }
        if ("controlDock" === renderer.__elyricThemeV2SelectedLayer
            && Object.prototype.hasOwnProperty.call(patch, "hidden")) {
            delete patch.hidden;
        }
        if (false !== recordHistory) { pushPlayerThemeV2History(renderer); }
        ensurePlayerThemeV2ProfileOverride(renderer);
        var layer = activePlayerThemeV2Layer(renderer);
        Object.keys(patch).forEach(function (key) { layer[key] = patch[key]; });
        renderer.__elyricThemeV2 = normalizePlayerThemeV2State(renderer.__elyricThemeV2);
        applyPlayerThemeV2Layer(renderer, renderer.__elyricThemeV2SelectedLayer, activePlayerThemeV2Layer(renderer));
        syncPlayerThemeV2Designer(renderer);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
    }

    function commitPlayerControlDockEdit(renderer, mutator) {
        ensurePlayerThemeV2State(renderer);
        var profileId = renderer.__elyricThemeV2Profile || currentPlayerThemeV2Profile();
        var current = normalizePlayerControlDockProfile(
            renderer.__elyricThemeV2.controls.profiles[profileId], "portrait" === profileId
        );
        pushPlayerThemeV2History(renderer);
        mutator(current);
        renderer.__elyricThemeV2.controls.profiles[profileId]
            = normalizePlayerControlDockProfile(current, "portrait" === profileId);
        applyPlayerControlDock(renderer, profileId);
        syncPlayerThemeV2Designer(renderer);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
    }

    function movePlayerControlDockEntry(renderer, groupId, direction, targetRowDelta) {
        commitPlayerControlDockEdit(renderer, function (profile) {
            var rowIndex = profile.rows.findIndex(function (row) { return row.groups.indexOf(groupId) >= 0; });
            if (rowIndex < 0) { return; }
            var row = profile.rows[rowIndex];
            var index = row.groups.indexOf(groupId);
            if (targetRowDelta) {
                var targetRowIndex = Math.max(0, Math.min(profile.rows.length - 1, rowIndex + targetRowDelta));
                if (targetRowIndex === rowIndex) { return; }
                row.groups.splice(index, 1);
                profile.rows[targetRowIndex].groups.push(groupId);
                profile.rows = profile.rows.filter(function (candidate) { return candidate.groups.length; });
            } else {
                var next = Math.max(0, Math.min(row.groups.length - 1, index + direction));
                if (next === index) { return; }
                row.groups.splice(index, 1);
                row.groups.splice(next, 0, groupId);
            }
        });
    }

    function movePlayerControlDockButton(renderer, groupId, buttonId, direction) {
        commitPlayerControlDockEdit(renderer, function (profile) {
            var order = profile.groups[groupId].order;
            var index = order.indexOf(buttonId);
            var next = Math.max(0, Math.min(order.length - 1, index + direction));
            if (index < 0 || next === index) { return; }
            order.splice(index, 1);
            order.splice(next, 0, buttonId);
        });
    }

    function selectPlayerThemeV2Layer(renderer, layerId) {
        if (PLAYER_THEME_V2_LAYER_IDS.indexOf(layerId) < 0) { return; }
        renderer.__elyricThemeV2SelectedLayer = layerId;
        syncPlayerThemeV2Designer(renderer);
    }

    function playerThemeV2Align(renderer, mode) {
        var layer = activePlayerThemeV2Layer(renderer);
        var patch = {};
        var canvas = PLAYER_THEME_CANVAS_SIZES[renderer.__elyricThemeV2Profile || currentPlayerThemeV2Profile()];
        if ("left" === mode) { patch.x = 0; }
        if ("center" === mode) { patch.x = (canvas.width - layer.width) / 2; }
        if ("right" === mode) { patch.x = canvas.width - layer.width; }
        if ("top" === mode) { patch.y = 0; }
        if ("middle" === mode) { patch.y = (canvas.height - layer.height) / 2; }
        if ("bottom" === mode) { patch.y = canvas.height - layer.height; }
        updatePlayerThemeV2Layer(renderer, patch, true);
    }

    function removePlayerThemeV2DesignerBoxes(renderer) {
        (renderer.__elyricThemeV2Boxes || []).forEach(function (box) {
            if (box.parentNode) { box.parentNode.removeChild(box); }
        });
        renderer.__elyricThemeV2Boxes = [];
        if (renderer.__elyricThemeV2Guides && renderer.__elyricThemeV2Guides.parentNode) {
            renderer.__elyricThemeV2Guides.parentNode.removeChild(renderer.__elyricThemeV2Guides);
        }
        renderer.__elyricThemeV2Guides = null;
        if (renderer.__elyricThemeV2ExitButton && renderer.__elyricThemeV2ExitButton.parentNode) {
            renderer.__elyricThemeV2ExitButton.parentNode.removeChild(renderer.__elyricThemeV2ExitButton);
        }
        renderer.__elyricThemeV2ExitButton = null;
    }

    function installPlayerThemeV2BoxPointer(renderer, box, layerId, handle) {
        box.addEventListener("pointerdown", function (event) {
            if (!renderer.__elyricThemeV2DesignerOpen) { return; }
            selectPlayerThemeV2Layer(renderer, layerId);
            var layer = activePlayerThemeV2Layer(renderer);
            if (layer.locked) { return; }
            stopControlEvent(event);
            pushPlayerThemeV2History(renderer);
            ensurePlayerThemeV2ProfileOverride(renderer);
            layer = activePlayerThemeV2Layer(renderer);
            var frozenMetrics = playerThemeV2StageMetrics(
                renderer, renderer.__elyricThemeV2Profile, playerThemeV2ViewportRect()
            );
            var startPoint = frozenMetrics.inverse(event.clientX, event.clientY);
            var original = clonePlayerThemeV2Value(layer);
            var pendingEvent = null;
            var moveFrame = 0;
            if (box.setPointerCapture) { box.setPointerCapture(event.pointerId); }
            var renderMove = function () {
                moveFrame = 0;
                if (!pendingEvent) { return; }
                var movePoint = frozenMetrics.inverse(pendingEvent.clientX, pendingEvent.clientY);
                var dx = movePoint.x - startPoint.x;
                var dy = movePoint.y - startPoint.y;
                var proposed = clonePlayerThemeV2Value(original);
                if (handle) {
                    var angle = -(Number(original.rotation) || 0) * Math.PI / 180;
                    var localDx = dx * Math.cos(angle) - dy * Math.sin(angle);
                    var localDy = dx * Math.sin(angle) + dy * Math.cos(angle);
                    proposed.width = snapPlayerThemeV2Value(Math.max(44, original.width + localDx), [120, 240, 300, 360, 480, 600, 900, 1200]);
                    proposed.height = snapPlayerThemeV2Value(Math.max(44, original.height + localDy), [72, 120, 240, 300, 360, 450, 600, 900]);
                } else {
                    proposed.x = snapPlayerThemeV2Value(original.x + dx, [-600, -300, -120, -72, 0, 72, 120, 300, 600]);
                    proposed.y = snapPlayerThemeV2Value(original.y + dy, [-600, -300, -120, -72, 0, 72, 120, 300, 600]);
                }
                proposed = snapPlayerThemeV2LayerGeometry(renderer, layerId, proposed, frozenMetrics, !!handle);
                Object.keys(proposed).forEach(function (key) { layer[key] = proposed[key]; });
                applyPlayerThemeV2Layer(renderer, layerId, layer);
                syncPlayerThemeV2Designer(renderer);
            };
            var move = function (moveEvent) {
                pendingEvent = moveEvent;
                if (!moveFrame) { moveFrame = requestAnimationFrame(renderMove); }
            };
            var end = function () {
                if (moveFrame) { cancelAnimationFrame(moveFrame); renderMove(); }
                setPlayerThemeV2DesignerGuides(renderer, frozenMetrics, null, null);
                if (box.releasePointerCapture) {
                    try { box.releasePointerCapture(event.pointerId); } catch (error) { /* already released */ }
                }
                box.removeEventListener("pointermove", move);
                box.removeEventListener("pointerup", end);
                box.removeEventListener("pointercancel", end);
                storeCurrentPlayerThemeDesign(renderer);
                scheduleUserPlayerPreferencesSave(renderer);
            };
            box.addEventListener("pointermove", move);
            box.addEventListener("pointerup", end);
            box.addEventListener("pointercancel", end);
        });
    }

    function buildPlayerThemeV2DesignerBoxes(renderer) {
        removePlayerThemeV2DesignerBoxes(renderer);
        var designerHost = renderer.__elyricRoot;
        if (!renderer.__elyricThemeV2DesignerOpen || !designerHost) { return; }
        ensurePlayerThemeV2State(renderer);
        renderer.__elyricThemeV2Boxes = [];
        var guideHost = document.createElement("div");
        guideHost.className = "elyric-v2-alignment-guides";
        guideHost.setAttribute("aria-hidden", "true");
        guideHost.appendChild(document.createElement("i"));
        guideHost.appendChild(document.createElement("i"));
        designerHost.appendChild(guideHost);
        renderer.__elyricThemeV2Guides = guideHost;
        var profileLayout = resolvedPlayerThemeV2Layout(renderer, renderer.__elyricThemeV2Profile);
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            var layer = profileLayout[layerId];
            var box = document.createElement("div");
            box.className = "elyric-v2-layer-box";
            box.setAttribute("data-elyric-v2-box", layerId);
            box.setAttribute("data-selected", layerId === renderer.__elyricThemeV2SelectedLayer ? "true" : "false");
            box.setAttribute("data-locked", layer.locked ? "true" : "false");
            box.setAttribute("data-hidden-layer", layer.hidden ? "true" : "false");
            var label = document.createElement("span");
            label.appendChild(document.createTextNode(PLAYER_THEME_V2_LAYER_LABELS[layerId]));
            box.appendChild(label);
            var handle = document.createElement("b");
            handle.className = "elyric-v2-resize-handle";
            handle.setAttribute("aria-hidden", "true");
            box.appendChild(handle);
            designerHost.appendChild(box);
            installPlayerThemeV2BoxPointer(renderer, box, layerId, false);
            installPlayerThemeV2BoxPointer(renderer, handle, layerId, true);
            renderer.__elyricThemeV2Boxes.push(box);
        });
        var exitButton = document.createElement("button");
        exitButton.type = "button";
        exitButton.className = "elyric-v2-designer-exit";
        exitButton.setAttribute("aria-label", "完成画布编辑并返回设置");
        exitButton.appendChild(document.createTextNode("完成编辑"));
        exitButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            requestPlayerOverlayClose(renderer, "designer");
            requestPlayerOverlayOpen(renderer, "settings", renderer.__elyricSettingsButton, "above");
        });
        designerHost.appendChild(exitButton);
        renderer.__elyricThemeV2ExitButton = exitButton;
        syncPlayerThemeV2Designer(renderer);
    }

    function setPlayerThemeV2DesignerOpen(renderer, open) {
        renderer.__elyricThemeV2DesignerOpen = !!open;
        ensurePlayerThemeV2State(renderer);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-designer-open", open ? "true" : "false");
        setAttributeIfChanged(renderer.__elyricSettingsPanel, "data-elyric-designer-open", open ? "true" : "false");
        if (document.body && document.body.__elyricPlayerPageOwner === renderer) {
            setAttributeIfChanged(document.body, "data-elyric-designer-open", open ? "true" : "false");
        }
        if (renderer.__elyricThemeV2DesignerToggle) {
            setAttributeIfChanged(renderer.__elyricThemeV2DesignerToggle, "aria-pressed", open ? "true" : "false");
        }
        buildPlayerThemeV2DesignerBoxes(renderer);
    }

    function syncPlayerThemeV2Designer(renderer) {
        if (!renderer.__elyricThemeV2) { return; }
        var layer = activePlayerThemeV2Layer(renderer);
        if (renderer.__elyricThemeV2ProfileSelect) {
            renderer.__elyricThemeV2ProfileSelect.value = renderer.__elyricThemeV2Profile;
        }
        if (renderer.__elyricThemeV2InheritanceStatus) {
            replaceElementText(
                renderer.__elyricThemeV2InheritanceStatus,
                "landscape" === renderer.__elyricThemeV2Profile
                    ? "横屏独立布局 · 1920 × 1080"
                    : "竖屏独立布局 · 1080 × 1920"
            );
        }
        if (renderer.__elyricThemeV2InheritanceReset) {
            renderer.__elyricThemeV2InheritanceReset.disabled = false;
        }
        (renderer.__elyricThemeV2LayerButtons || []).forEach(function (button) {
            var selected = button.getAttribute("data-layer") === renderer.__elyricThemeV2SelectedLayer;
            setAttributeIfChanged(button, "aria-pressed", selected ? "true" : "false");
        });
        var controls = renderer.__elyricThemeV2GeometryInputs || {};
        ["x", "y", "width", "height", "rotation", "z", "opacity"].forEach(function (key) {
            if (!controls[key]) { return; }
            controls[key].value = "opacity" === key ? Math.round(layer[key] * 100) : layer[key];
            controls[key].setAttribute("value", controls[key].value);
        });
        if (renderer.__elyricThemeV2LockButton) {
            setAttributeIfChanged(renderer.__elyricThemeV2LockButton, "aria-pressed", layer.locked ? "true" : "false");
            replaceElementText(renderer.__elyricThemeV2LockButton, layer.locked ? "解锁" : "锁定");
        }
        if (renderer.__elyricThemeV2HideButton) {
            setAttributeIfChanged(renderer.__elyricThemeV2HideButton, "aria-pressed", layer.hidden ? "true" : "false");
            replaceElementText(renderer.__elyricThemeV2HideButton, layer.hidden ? "显示" : "隐藏");
            renderer.__elyricThemeV2HideButton.disabled = "controlDock" === renderer.__elyricThemeV2SelectedLayer;
        }
        var artwork = renderer.__elyricThemeV2.artwork;
        if (renderer.__elyricThemeV2ArtworkSource) { renderer.__elyricThemeV2ArtworkSource.value = artwork.source; }
        if (renderer.__elyricThemeV2ArtworkUrl) { renderer.__elyricThemeV2ArtworkUrl.value = artwork.url || ""; }
        if (renderer.__elyricThemeV2ArtworkFit) { renderer.__elyricThemeV2ArtworkFit.value = artwork.fit; }
        if (renderer.__elyricThemeV2ArtworkClip) { renderer.__elyricThemeV2ArtworkClip.value = artwork.clipPath || "none"; }
        if (renderer.__elyricThemeV2ArtworkFocusX) { renderer.__elyricThemeV2ArtworkFocusX.value = artwork.focusX; }
        if (renderer.__elyricThemeV2ArtworkFocusY) { renderer.__elyricThemeV2ArtworkFocusY.value = artwork.focusY; }
        if (renderer.__elyricThemeV2FollowInput) {
            renderer.__elyricThemeV2FollowInput.value = Math.round(renderer.__elyricThemeV2.lyrics.followDelayMs / 1000);
        }
        if (renderer.__elyricThemeV2PopupOpacity) {
            renderer.__elyricThemeV2PopupOpacity.value = renderer.__elyricThemeV2.popupStyle.surfaceOpacity;
        }
        if (renderer.__elyricThemeV2PopupRadius) {
            renderer.__elyricThemeV2PopupRadius.value = renderer.__elyricThemeV2.popupStyle.radius;
        }
        if (renderer.__elyricThemeV2SafeArea) {
            renderer.__elyricThemeV2SafeArea.value = renderer.__elyricThemeV2.controls.safeArea;
        }
        if (renderer.__elyricThemeV2ThirdLineInput) {
            renderer.__elyricThemeV2ThirdLineInput.checked = renderer.__elyricThemeV2.lyrics.showThirdAndLaterLines;
        }
        renderPlayerControlDockDesigner(renderer);
        var typographyInputs = renderer.__elyricThemeV2TypographyInputs || {};
        ["primary", "secondary", "tertiary"].forEach(function (lineId) {
            var inputs = typographyInputs[lineId];
            var style = renderer.__elyricThemeV2.typography[lineId];
            if (!inputs) { return; }
            Object.keys(inputs).forEach(function (key) {
                var stateMatch = /^(past|current|future)(Color|Opacity)$/.exec(key);
                if (stateMatch) {
                    var stateValue = style.states[stateMatch[1]]["Color" === stateMatch[2] ? "color" : "opacity"];
                    inputs[key].value = stateValue;
                } else if ("italic" === key) { inputs[key].checked = !!style[key]; }
                else { inputs[key].value = null == style[key] ? "" : style[key]; }
            });
        });
        (renderer.__elyricThemeV2Boxes || []).forEach(function (box) {
            var id = box.getAttribute("data-elyric-v2-box");
            var boxLayer = resolvedPlayerThemeV2Layout(renderer, renderer.__elyricThemeV2Profile)[id];
            var metrics = playerThemeV2StageMetrics(renderer, renderer.__elyricThemeV2Profile);
            var rect = playerThemeV2RenderedRect(boxLayer, metrics);
            box.style.left = rect.left + "px";
            box.style.top = rect.top + "px";
            box.style.width = rect.width + "px";
            box.style.height = rect.height + "px";
            box.style.transform = "rotate(" + boxLayer.rotation + "deg)";
            box.setAttribute("data-selected", id === renderer.__elyricThemeV2SelectedLayer ? "true" : "false");
            box.setAttribute("data-locked", boxLayer.locked ? "true" : "false");
            box.setAttribute("data-hidden-layer", boxLayer.hidden ? "true" : "false");
        });
        if (renderer.__elyricThemeV2Guides) {
            var previewMetrics = playerThemeV2StageMetrics(renderer, renderer.__elyricThemeV2Profile);
            var simulated = renderer.__elyricThemeV2Profile !== currentPlayerThemeV2Profile();
            setAttributeIfChanged(
                renderer.__elyricThemeV2Guides,
                "data-simulated",
                simulated ? "true" : "false"
            );
            setAttributeIfChanged(
                renderer.__elyricThemeV2Guides,
                "data-preview-label",
                simulated ? ("portrait" === renderer.__elyricThemeV2Profile
                    ? "竖屏预览 · 1080 × 1920" : "横屏预览 · 1920 × 1080") : "安全画布"
            );
            setDisplayStyle(renderer.__elyricThemeV2Guides, "--elyric-preview-left", previewMetrics.available.left + "px");
            setDisplayStyle(renderer.__elyricThemeV2Guides, "--elyric-preview-top", previewMetrics.available.top + "px");
            setDisplayStyle(renderer.__elyricThemeV2Guides, "--elyric-preview-width", previewMetrics.available.width + "px");
            setDisplayStyle(renderer.__elyricThemeV2Guides, "--elyric-preview-height", previewMetrics.available.height + "px");
        }
    }

    function playerControlDockLabel(id) {
        return {
            progress: "进度", transport: "主播放", volume: "音量", auxiliary: "辅助按钮",
            previous: "上一首", playPause: "播放 / 暂停", next: "下一首",
            mute: "静音", slider: "滑杆", value: "数值",
            shuffle: "随机", repeat: "循环", stop: "停止", queue: "队列",
            media: "媒体信息", secondaryLyrics: "第二行歌词", artworkRotation: "封面旋转"
        }[id] || id;
    }

    function relocatePlayerControlDockGroup(renderer, sourceGroupId, targetGroupId) {
        if (!sourceGroupId || sourceGroupId === targetGroupId) { return; }
        commitPlayerControlDockEdit(renderer, function (profile) {
            var sourceRow;
            profile.rows.forEach(function (row) {
                var sourceIndex = row.groups.indexOf(sourceGroupId);
                if (sourceIndex >= 0) { sourceRow = row; row.groups.splice(sourceIndex, 1); }
            });
            var targetRow = profile.rows.find(function (row) { return row.groups.indexOf(targetGroupId) >= 0; });
            if (!targetRow) {
                if (sourceRow) { sourceRow.groups.push(sourceGroupId); }
                return;
            }
            targetRow.groups.splice(targetRow.groups.indexOf(targetGroupId), 0, sourceGroupId);
            profile.rows = profile.rows.filter(function (row) { return row.groups.length; });
        });
    }

    function relocatePlayerControlDockButton(renderer, groupId, sourceButtonId, targetButtonId) {
        if (!sourceButtonId || sourceButtonId === targetButtonId) { return; }
        commitPlayerControlDockEdit(renderer, function (profile) {
            var order = profile.groups[groupId].order;
            var sourceIndex = order.indexOf(sourceButtonId);
            var targetIndex = order.indexOf(targetButtonId);
            if (sourceIndex < 0 || targetIndex < 0) { return; }
            order.splice(sourceIndex, 1);
            targetIndex = order.indexOf(targetButtonId);
            order.splice(targetIndex, 0, sourceButtonId);
        });
    }

    function createPlayerControlDockSelect(values, selected, onChange) {
        var select = document.createElement("select");
        values.forEach(function (value) {
            var option = document.createElement("option");
            option.value = value;
            option.appendChild(document.createTextNode(value));
            select.appendChild(option);
        });
        select.value = selected;
        select.addEventListener("change", function () { onChange(select.value); });
        return select;
    }

    function renderPlayerControlDockDesigner(renderer) {
        var host = renderer.__elyricControlDockDesigner;
        if (!host || !renderer.__elyricThemeV2) { return; }
        while (host.firstChild) { host.removeChild(host.firstChild); }
        var profileId = renderer.__elyricThemeV2Profile || currentPlayerThemeV2Profile();
        var profile = normalizePlayerControlDockProfile(
            renderer.__elyricThemeV2.controls.profiles[profileId], "portrait" === profileId
        );
        profile.rows.forEach(function (rowDefinition, rowIndex) {
            var rowCard = document.createElement("section");
            rowCard.className = "elyric-control-dock-row-card";
            var heading = document.createElement("div");
            heading.className = "elyric-control-dock-row-heading";
            var title = document.createElement("strong");
            title.appendChild(document.createTextNode("第 " + (rowIndex + 1) + " 行"));
            heading.appendChild(title);
            heading.appendChild(createPlayerControlDockSelect(
                PLAYER_CONTROL_DOCK_JUSTIFY_IDS, rowDefinition.justify,
                function (value) { commitPlayerControlDockEdit(renderer, function (draft) { draft.rows[rowIndex].justify = value; }); }
            ));
            heading.appendChild(createPlayerControlDockSelect(
                PLAYER_CONTROL_DOCK_ALIGN_IDS, rowDefinition.align,
                function (value) { commitPlayerControlDockEdit(renderer, function (draft) { draft.rows[rowIndex].align = value; }); }
            ));
            var rowGap = document.createElement("input");
            rowGap.type = "number"; rowGap.min = "0"; rowGap.max = "80"; rowGap.value = rowDefinition.gap;
            rowGap.setAttribute("aria-label", "行内分组间距");
            rowGap.addEventListener("change", function () {
                commitPlayerControlDockEdit(renderer, function (draft) { draft.rows[rowIndex].gap = Number(rowGap.value); });
            });
            heading.appendChild(rowGap);
            rowCard.appendChild(heading);
            var groupList = document.createElement("div");
            groupList.className = "elyric-control-dock-group-list";
            rowDefinition.groups.forEach(function (groupId) {
                var groupDefinition = profile.groups[groupId];
                var card = document.createElement("article");
                card.className = "elyric-control-dock-group-card";
                card.setAttribute("draggable", "true");
                card.setAttribute("data-control-group-card", groupId);
                card.addEventListener("dragstart", function (event) {
                    renderer.__elyricControlDockDrag = { type: "group", groupId: groupId };
                    if (event.dataTransfer) { event.dataTransfer.setData("text/plain", groupId); }
                });
                card.addEventListener("dragover", function (event) { event.preventDefault(); });
                card.addEventListener("drop", function (event) {
                    event.preventDefault();
                    var drag = renderer.__elyricControlDockDrag;
                    if (drag && "group" === drag.type) { relocatePlayerControlDockGroup(renderer, drag.groupId, groupId); }
                });
                var groupHeader = document.createElement("header");
                var visible = document.createElement("input");
                visible.type = "checkbox"; visible.checked = groupDefinition.visible;
                visible.disabled = "progress" === groupId || "transport" === groupId;
                visible.addEventListener("change", function () {
                    commitPlayerControlDockEdit(renderer, function (draft) { draft.groups[groupId].visible = visible.checked; });
                });
                groupHeader.appendChild(visible);
                var groupTitle = document.createElement("strong");
                groupTitle.appendChild(document.createTextNode(playerControlDockLabel(groupId)));
                groupHeader.appendChild(groupTitle);
                [["↑", -1], ["↓", 1]].forEach(function (entry) {
                    var button = document.createElement("button");
                    button.type = "button"; button.appendChild(document.createTextNode(entry[0]));
                    button.setAttribute("aria-label", entry[1] < 0 ? "换到上一行" : "换到下一行");
                    button.addEventListener("click", function () { movePlayerControlDockEntry(renderer, groupId, 0, entry[1]); });
                    groupHeader.appendChild(button);
                });
                card.appendChild(groupHeader);
                var groupOptions = document.createElement("div");
                groupOptions.className = "elyric-control-dock-group-options";
                groupOptions.appendChild(createPlayerControlDockSelect(
                    PLAYER_CONTROL_DOCK_ALIGN_IDS, groupDefinition.align,
                    function (value) { commitPlayerControlDockEdit(renderer, function (draft) { draft.groups[groupId].align = value; }); }
                ));
                var groupGap = document.createElement("input");
                groupGap.type = "number"; groupGap.min = "0"; groupGap.max = "48"; groupGap.value = groupDefinition.gap;
                groupGap.setAttribute("aria-label", "按钮间距");
                groupGap.addEventListener("change", function () {
                    commitPlayerControlDockEdit(renderer, function (draft) { draft.groups[groupId].gap = Number(groupGap.value); });
                });
                groupOptions.appendChild(groupGap);
                card.appendChild(groupOptions);
                groupDefinition.order.forEach(function (buttonId) {
                    var item = document.createElement("div");
                    item.className = "elyric-control-dock-button-item";
                    item.setAttribute("draggable", "true");
                    item.addEventListener("dragstart", function (event) {
                        renderer.__elyricControlDockDrag = { type: "button", groupId: groupId, buttonId: buttonId };
                        if (event.stopPropagation) { event.stopPropagation(); }
                    });
                    item.addEventListener("dragover", function (event) { event.preventDefault(); });
                    item.addEventListener("drop", function (event) {
                        event.preventDefault(); if (event.stopPropagation) { event.stopPropagation(); }
                        var drag = renderer.__elyricControlDockDrag;
                        if (drag && "button" === drag.type && drag.groupId === groupId) {
                            relocatePlayerControlDockButton(renderer, groupId, drag.buttonId, buttonId);
                        }
                    });
                    var hidden = document.createElement("input");
                    hidden.type = "checkbox";
                    hidden.checked = groupDefinition.hiddenButtons.indexOf(buttonId) < 0;
                    hidden.disabled = "playPause" === buttonId;
                    hidden.addEventListener("change", function () {
                        commitPlayerControlDockEdit(renderer, function (draft) {
                            var list = draft.groups[groupId].hiddenButtons;
                            var index = list.indexOf(buttonId);
                            if (hidden.checked && index >= 0) { list.splice(index, 1); }
                            if (!hidden.checked && index < 0 && "playPause" !== buttonId) { list.push(buttonId); }
                        });
                    });
                    item.appendChild(hidden);
                    var label = document.createElement("span"); label.appendChild(document.createTextNode(playerControlDockLabel(buttonId)));
                    item.appendChild(label);
                    [["←", -1], ["→", 1]].forEach(function (entry) {
                        var button = document.createElement("button"); button.type = "button";
                        button.appendChild(document.createTextNode(entry[0]));
                        button.addEventListener("click", function () { movePlayerControlDockButton(renderer, groupId, buttonId, entry[1]); });
                        item.appendChild(button);
                    });
                    card.appendChild(item);
                });
                groupList.appendChild(card);
            });
            rowCard.appendChild(groupList);
            host.appendChild(rowCard);
        });
    }

    function createPlayerThemeV2TextInput(section, label, value, onChange, type) {
        var row = document.createElement("label");
        row.className = "elyric-v2-text-setting";
        var caption = document.createElement("span");
        caption.appendChild(document.createTextNode(label));
        var input = document.createElement("input");
        input.type = type || "text";
        input.value = value || "";
        input.addEventListener("change", function (event) { stopControlEvent(event); onChange(input.value); });
        input.addEventListener("pointerdown", stopControlEvent);
        row.appendChild(caption);
        row.appendChild(input);
        section.appendChild(row);
        return input;
    }

    function createPlayerThemeV2DesignerSection(renderer, settingsPanel) {
        var section = createSettingsSection(settingsPanel, "自由画布与完整样式", "elyric-v2-designer-settings");
        var toggle = createSettingsActionButton("画布编辑", "edit", function () {
            var open = !renderer.__elyricThemeV2DesignerOpen;
            if (open) { requestPlayerOverlayOpen(renderer, "designer", renderer.__elyricThemeV2DesignerToggle); }
            else { requestPlayerOverlayClose(renderer, "designer"); }
        }, "elyric-v2-designer-toggle");
        toggle.setAttribute("aria-pressed", "false");
        section.appendChild(toggle);

        var profileSelect = document.createElement("select");
        profileSelect.className = "elyric-v2-profile-select";
        [
            ["landscape", "横屏 · 电脑 / 平板"],
            ["portrait", "竖屏 · 手机 / 平板"]
    ].forEach(function (item) {
            var option = document.createElement("option");
            option.value = item[0];
            option.appendChild(document.createTextNode(item[1]));
            profileSelect.appendChild(option);
    });
        profileSelect.addEventListener("change", function () {
            renderer.__elyricThemeV2Profile = profileSelect.value;
            applyPlayerThemeV2State(renderer, renderer.__elyricThemeV2, profileSelect.value);
            buildPlayerThemeV2DesignerBoxes(renderer);
        });
        section.appendChild(profileSelect);
        var inheritanceStatus = document.createElement("span");
        inheritanceStatus.className = "elyric-v2-inheritance-status";
        section.appendChild(inheritanceStatus);
        var inheritanceReset = createSettingsActionButton("重置当前方向", "undo", function () {
            ensurePlayerThemeV2State(renderer);
            var profileId = renderer.__elyricThemeV2Profile;
            pushPlayerThemeV2History(renderer);
            renderer.__elyricThemeV2.layouts[profileId] = clonePlayerThemeV2Value(
                playerThemeV5LayoutsForBase(renderer.__elyricThemeBaseLayout)[profileId]
            );
            renderer.__elyricThemeV2.controls.profiles[profileId] = defaultPlayerControlDock().profiles[profileId];
            applyPlayerThemeV2State(renderer, renderer.__elyricThemeV2, profileId);
            buildPlayerThemeV2DesignerBoxes(renderer);
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }, "elyric-v2-inheritance-reset");
        section.appendChild(inheritanceReset);

        var transformInputs = {};

        var layers = document.createElement("div");
        layers.className = "elyric-v2-layer-list";
        var layerButtons = [];
        PLAYER_THEME_V2_LAYER_IDS.forEach(function (layerId) {
            var button = document.createElement("button");
            button.type = "button";
            button.setAttribute("data-layer", layerId);
            button.setAttribute("aria-pressed", "false");
            button.appendChild(document.createTextNode(PLAYER_THEME_V2_LAYER_LABELS[layerId]));
            button.addEventListener("click", function (event) { stopControlEvent(event); selectPlayerThemeV2Layer(renderer, layerId); });
            layers.appendChild(button);
            layerButtons.push(button);
        });
        section.appendChild(layers);

        var geometry = document.createElement("div");
        geometry.className = "elyric-v2-geometry-grid";
        var geometryInputs = {};
        [
            ["x", "X", -100, 200, .1], ["y", "Y", -100, 200, .1],
            ["width", "宽", 1, 200, .1], ["height", "高", 1, 200, .1],
            ["rotation", "旋转", -360, 360, 1], ["z", "层级", 0, 1000, 1],
            ["opacity", "透明度", 0, 100, 1]
        ].forEach(function (item) {
            var label = document.createElement("label");
            label.appendChild(document.createTextNode(item[1]));
            var input = document.createElement("input");
            input.type = "number";
            input.min = item[2]; input.max = item[3]; input.step = item[4];
            if ("x" === item[0] || "y" === item[0]) { input.min = -1920; input.max = 1920; input.step = 1; }
            if ("width" === item[0] || "height" === item[0]) { input.min = 44; input.max = 3840; input.step = 1; }
            input.addEventListener("change", function () {
                var value = Number(input.value);
                var patch = {};
                patch[item[0]] = "opacity" === item[0] ? value / 100 : value;
                updatePlayerThemeV2Layer(renderer, patch, true);
            });
            label.appendChild(input);
            geometry.appendChild(label);
            geometryInputs[item[0]] = input;
        });
        section.appendChild(geometry);

        var actions = document.createElement("div");
        actions.className = "elyric-v2-layer-actions";
        [
            ["左", function () { playerThemeV2Align(renderer, "left"); }],
            ["中", function () { playerThemeV2Align(renderer, "center"); }],
            ["右", function () { playerThemeV2Align(renderer, "right"); }],
            ["顶", function () { playerThemeV2Align(renderer, "top"); }],
            ["垂中", function () { playerThemeV2Align(renderer, "middle"); }],
            ["底", function () { playerThemeV2Align(renderer, "bottom"); }],
            ["上移层级", function () { updatePlayerThemeV2Layer(renderer, { z: activePlayerThemeV2Layer(renderer).z + 1 }, true); }],
            ["下移层级", function () { updatePlayerThemeV2Layer(renderer, { z: Math.max(0, activePlayerThemeV2Layer(renderer).z - 1) }, true); }]
        ].forEach(function (item) {
            var button = document.createElement("button");
            button.type = "button";
            button.appendChild(document.createTextNode(item[0]));
            button.addEventListener("click", function (event) { stopControlEvent(event); item[1](); });
            actions.appendChild(button);
        });
        var lockButton = document.createElement("button");
        lockButton.type = "button";
        lockButton.addEventListener("click", function () { updatePlayerThemeV2Layer(renderer, { locked: !activePlayerThemeV2Layer(renderer).locked }, true); });
        actions.appendChild(lockButton);
        var hideButton = document.createElement("button");
        hideButton.type = "button";
        hideButton.addEventListener("click", function () { updatePlayerThemeV2Layer(renderer, { hidden: !activePlayerThemeV2Layer(renderer).hidden }, true); });
        actions.appendChild(hideButton);
        section.appendChild(actions);

        var history = document.createElement("div");
        history.className = "elyric-v2-history-actions";
        [
            ["撤销", function () { restorePlayerThemeV2History(renderer, "undo"); }],
            ["重做", function () { restorePlayerThemeV2History(renderer, "redo"); }]
        ].forEach(function (item) {
            var button = document.createElement("button");
            button.type = "button";
            button.appendChild(document.createTextNode(item[0]));
            button.addEventListener("click", item[1]);
            history.appendChild(button);
        });
        section.appendChild(history);

        var controlDockDetails = document.createElement("details");
        controlDockDetails.className = "elyric-control-dock-designer";
        var controlDockSummary = document.createElement("summary");
        controlDockSummary.appendChild(document.createTextNode("控制坞分组、顺序与换行"));
        controlDockDetails.appendChild(controlDockSummary);
        var controlDockDesigner = document.createElement("div");
        controlDockDesigner.className = "elyric-control-dock-designer-body";
        controlDockDetails.appendChild(controlDockDesigner);
        section.appendChild(controlDockDetails);

        var artworkDetails = document.createElement("details");
        var artworkSummary = document.createElement("summary");
        artworkSummary.appendChild(document.createTextNode("封面来源、焦点与裁切"));
        artworkDetails.appendChild(artworkSummary);
        var artworkSource = document.createElement("select");
        [["emby", "当前 Emby 图片"], ["url", "HTTPS URL"], ["asset", "私有上传"]].forEach(function (item) {
            var option = document.createElement("option"); option.value = item[0];
            option.appendChild(document.createTextNode(item[1])); artworkSource.appendChild(option);
        });
        artworkSource.addEventListener("change", function () {
            pushPlayerThemeV2History(renderer); renderer.__elyricThemeV2.artwork.source = artworkSource.value;
            applyPlayerThemeV2Artwork(renderer); storeCurrentPlayerThemeDesign(renderer); scheduleUserPlayerPreferencesSave(renderer);
        });
        artworkDetails.appendChild(artworkSource);
        var artworkUrl = createPlayerThemeV2TextInput(artworkDetails, "HTTPS 图片 URL", "", function (value) {
            if (value && !/^https:\/\//i.test(value)) { return; }
            pushPlayerThemeV2History(renderer); renderer.__elyricThemeV2.artwork.url = value; renderer.__elyricThemeV2.artwork.source = "url";
            applyPlayerThemeV2Artwork(renderer); storeCurrentPlayerThemeDesign(renderer); scheduleUserPlayerPreferencesSave(renderer);
        }, "url");
        var upload = document.createElement("input");
        upload.type = "file"; upload.accept = "image/png,image/jpeg,image/webp,image/avif";
        upload.addEventListener("change", function () {
            if (upload.files && upload.files[0]) { uploadPlayerThemeV2Asset(renderer, upload.files[0], "artwork"); }
        });
        artworkDetails.appendChild(upload);
        var fit = document.createElement("select");
        ["cover", "contain", "fill", "none", "scale-down"].forEach(function (value) {
            var option = document.createElement("option"); option.value = value;
            option.appendChild(document.createTextNode(value)); fit.appendChild(option);
        });
        fit.addEventListener("change", function () { renderer.__elyricThemeV2.artwork.fit = fit.value; applyPlayerThemeV2Artwork(renderer); scheduleUserPlayerPreferencesSave(renderer); });
        artworkDetails.appendChild(fit);
        var focusX = createRangeSetting(artworkDetails, "封面焦点 X", "elyric-v2-artwork-focus-x", 0, 100, 1, "封面焦点 X", function (value) {
            renderer.__elyricThemeV2.artwork.focusX = Number(value); applyPlayerThemeV2Artwork(renderer); scheduleUserPlayerPreferencesSave(renderer);
        });
        var focusY = createRangeSetting(artworkDetails, "封面焦点 Y", "elyric-v2-artwork-focus-y", 0, 100, 1, "封面焦点 Y", function (value) {
            renderer.__elyricThemeV2.artwork.focusY = Number(value); applyPlayerThemeV2Artwork(renderer); scheduleUserPlayerPreferencesSave(renderer);
        });
        var clip = createPlayerThemeV2TextInput(artworkDetails, "多边形裁切 polygon(...) ", "none", function (value) {
            renderer.__elyricThemeV2.artwork.clipPath = value; applyPlayerThemeV2Artwork(renderer); scheduleUserPlayerPreferencesSave(renderer);
        });
        section.appendChild(artworkDetails);

        var typographyInputs = {};
        ["primary", "secondary", "tertiary"].forEach(function (lineId, lineIndex) {
            var details = document.createElement("details");
            var summary = document.createElement("summary");
            summary.appendChild(document.createTextNode(["主歌词", "第二行", "第三行及以后"][lineIndex] + "完整字体样式"));
            details.appendChild(summary);
            var inputs = {};
            inputs.fontFamily = createPlayerThemeV2TextInput(details, "字体名称", "inherit", function (value) {
                renderer.__elyricThemeV2.typography[lineId].fontFamily = value || "inherit"; applyPlayerThemeV2Typography(renderer); scheduleUserPlayerPreferencesSave(renderer);
            });
            inputs.fontUrl = createPlayerThemeV2TextInput(details, "HTTPS WOFF2 URL", "", function (value) {
                if (value && !/^https:\/\//i.test(value)) { return; }
                renderer.__elyricThemeV2.typography[lineId].fontAssetId = "";
                renderer.__elyricThemeV2.typography[lineId].fontUrl = value;
                installPlayerThemeV2Font(renderer, lineId);
                scheduleUserPlayerPreferencesSave(renderer);
            }, "url");
            var fontUpload = document.createElement("input");
            fontUpload.type = "file"; fontUpload.accept = "font/woff2,.woff2";
            fontUpload.addEventListener("change", function () {
                if (fontUpload.files && fontUpload.files[0]) { uploadPlayerThemeV2Asset(renderer, fontUpload.files[0], "font", lineId); }
            });
            details.appendChild(fontUpload);
            [
                ["size", 40, 300, 1], ["weight", 100, 900, 50], ["letterSpacing", -5, 20, .5],
                ["lineHeight", .8, 3, .05], ["opacity", 0, 1, .05], ["strokeWidth", 0, 8, .25],
                ["shadowX", -30, 30, 1], ["shadowY", -30, 30, 1], ["shadowBlur", 0, 60, 1], ["glow", 0, 60, 1]
            ].forEach(function (item) {
                var setting = createRangeSetting(details, item[0], "elyric-v2-type-" + lineId + "-" + item[0], item[1], item[2], item[3], item[0], function (value) {
                    renderer.__elyricThemeV2.typography[lineId][item[0]] = Number(value); applyPlayerThemeV2Typography(renderer); scheduleUserPlayerPreferencesSave(renderer);
                });
                inputs[item[0]] = setting.input;
            });
            ["color", "strokeColor", "shadowColor"].forEach(function (property) {
                inputs[property] = createPlayerThemeV2TextInput(details, property, "#ffffff", function (value) {
                    renderer.__elyricThemeV2.typography[lineId][property] = normalizeHexColor(value, "#ffffff"); applyPlayerThemeV2Typography(renderer); scheduleUserPlayerPreferencesSave(renderer);
                });
            });
            ["past", "current", "future"].forEach(function (stateId) {
                var title = { past: "已播", current: "当前", future: "未播" }[stateId];
                inputs[stateId + "Color"] = createPlayerThemeV2TextInput(details, title + "颜色", "#ffffff", function (value) {
                    renderer.__elyricThemeV2.typography[lineId].states[stateId].color = normalizeHexColor(value, "#ffffff");
                    applyPlayerThemeV2Typography(renderer); scheduleUserPlayerPreferencesSave(renderer);
                });
                var stateOpacity = createRangeSetting(
                    details, title + "透明度", "elyric-v2-type-" + lineId + "-" + stateId + "-opacity",
                    0, 1, .05, title + "透明度", function (value) {
                        renderer.__elyricThemeV2.typography[lineId].states[stateId].opacity = Number(value);
                        applyPlayerThemeV2Typography(renderer); scheduleUserPlayerPreferencesSave(renderer);
                    }
                );
                inputs[stateId + "Opacity"] = stateOpacity.input;
            });
            var italic = document.createElement("label");
            var italicInput = document.createElement("input"); italicInput.type = "checkbox";
            italicInput.addEventListener("change", function () { renderer.__elyricThemeV2.typography[lineId].italic = italicInput.checked; applyPlayerThemeV2Typography(renderer); scheduleUserPlayerPreferencesSave(renderer); });
            italic.appendChild(italicInput); italic.appendChild(document.createTextNode("斜体")); details.appendChild(italic);
            inputs.italic = italicInput;
            typographyInputs[lineId] = inputs;
            section.appendChild(details);
        });

        var popupDetails = document.createElement("details");
        var popupSummary = document.createElement("summary");
        popupSummary.appendChild(document.createTextNode("弹层样式与交互安全区"));
        popupDetails.appendChild(popupSummary);
        var popupOpacity = createRangeSetting(
            popupDetails, "弹层表面不透明度", "elyric-v2-popup-opacity", 35, 100, 1,
            "弹层表面不透明度", function (value) {
                renderer.__elyricThemeV2.popupStyle.surfaceOpacity = Number(value);
                applyPlayerThemeV2SemanticControls(renderer);
                storeCurrentPlayerThemeDesign(renderer);
                scheduleUserPlayerPreferencesSave(renderer);
            }
        );
        var popupRadius = createRangeSetting(
            popupDetails, "弹层圆角", "elyric-v2-popup-radius", 0, 64, 1,
            "弹层圆角", function (value) {
                renderer.__elyricThemeV2.popupStyle.radius = Number(value);
                applyPlayerThemeV2SemanticControls(renderer);
                storeCurrentPlayerThemeDesign(renderer);
                scheduleUserPlayerPreferencesSave(renderer);
            }
        );
        var safeArea = createRangeSetting(
            popupDetails, "设置与退出按钮安全区", "elyric-v2-safe-area", 44, 180, 2,
            "设置与退出按钮安全区", function (value) {
                renderer.__elyricThemeV2.controls.safeArea = Number(value);
                applyPlayerThemeV2SemanticControls(renderer);
                storeCurrentPlayerThemeDesign(renderer);
                scheduleUserPlayerPreferencesSave(renderer);
            }
        );
        section.appendChild(popupDetails);

        var follow = createRangeSetting(section, "歌词自动跟随等待", "elyric-v2-follow-delay", 1, 60, 1, "歌词自动跟随等待秒数", function (value) {
            renderer.__elyricThemeV2.lyrics.followDelayMs = Number(value) * 1000; scheduleUserPlayerPreferencesSave(renderer);
        });
        var thirdLine = document.createElement("label");
        var thirdLineInput = document.createElement("input"); thirdLineInput.type = "checkbox"; thirdLineInput.checked = true;
        thirdLineInput.addEventListener("change", function () { setThirdLineOverride(renderer, thirdLineInput.checked, true); renderer.__elyricThemeV2.lyrics.showThirdAndLaterLines = thirdLineInput.checked; });
        thirdLine.appendChild(thirdLineInput); thirdLine.appendChild(document.createTextNode("显示第三行及以后")); section.appendChild(thirdLine);

        renderer.__elyricThemeV2DesignerToggle = toggle;
        renderer.__elyricThemeV2ProfileSelect = profileSelect;
        renderer.__elyricThemeV2InheritanceStatus = inheritanceStatus;
        renderer.__elyricThemeV2InheritanceReset = inheritanceReset;
        renderer.__elyricThemeV2TransformInputs = transformInputs;
        renderer.__elyricThemeV2LayerButtons = layerButtons;
        renderer.__elyricThemeV2GeometryInputs = geometryInputs;
        renderer.__elyricThemeV2LockButton = lockButton;
        renderer.__elyricThemeV2HideButton = hideButton;
        renderer.__elyricThemeV2ArtworkSource = artworkSource;
        renderer.__elyricThemeV2ArtworkUrl = artworkUrl;
        renderer.__elyricThemeV2ArtworkFit = fit;
        renderer.__elyricThemeV2ArtworkFocusX = focusX.input;
        renderer.__elyricThemeV2ArtworkFocusY = focusY.input;
        renderer.__elyricThemeV2ArtworkClip = clip;
        renderer.__elyricThemeV2TypographyInputs = typographyInputs;
        renderer.__elyricThemeV2PopupOpacity = popupOpacity.input;
        renderer.__elyricThemeV2PopupRadius = popupRadius.input;
        renderer.__elyricThemeV2SafeArea = safeArea.input;
        renderer.__elyricThemeV2FollowInput = follow.input;
        renderer.__elyricThemeV2ThirdLineInput = thirdLineInput;
        renderer.__elyricControlDockDesigner = controlDockDesigner;
        renderPlayerControlDockDesigner(renderer);
        return section;
    }

    function createSettingsActionButton(label, icon, onClick, className) {
        var button = document.createElement("button");
        button.className = "elyric-player-settings-action " + (className || "");
        button.setAttribute("type", "button");
        if (icon) {
            setButtonIcon(button, icon);
        }
        var text = document.createElement("span");
        text.appendChild(document.createTextNode(label));
        button.appendChild(text);
        button.addEventListener("click", function (event) {
            stopControlEvent(event);
            onClick();
        });
        button.addEventListener("pointerdown", stopControlEvent);
        return button;
    }

    function createPlayerThemeColorSetting(renderer, section, colorId) {
        var definition = themeColorDefinition(colorId);
        var row = document.createElement("label");
        row.className = "elyric-player-color-setting elyric-player-theme-color-setting";
        row.setAttribute("data-elyric-theme-color", colorId);
        var labelElement = document.createElement("span");
        labelElement.appendChild(document.createTextNode(definition.label));
        var field = document.createElement("span");
        field.className = "elyric-player-color-field";
        var swatch = document.createElement("span");
        swatch.className = "elyric-player-color-swatch";
        swatch.setAttribute("aria-hidden", "true");
        var input = document.createElement("input");
        input.className = "elyric-player-color-input";
        input.setAttribute("type", "text");
        input.setAttribute("maxlength", "7");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("aria-label", definition.label + "十六进制颜色");
        input.setAttribute("placeholder", definition.fallback);
        input.addEventListener("input", function (event) {
            stopControlEvent(event);
            var value = String(input.value || "").trim();
            if (/^#?[0-9a-f]{6}$/i.test(value)) {
                setPlayerThemeColor(renderer, colorId, value, true);
            } else {
                setAttributeIfChanged(input, "aria-invalid", "true");
            }
        });
        input.addEventListener("pointerdown", stopControlEvent);
        field.appendChild(swatch);
        field.appendChild(input);
        row.appendChild(labelElement);
        row.appendChild(field);
        section.appendChild(row);
        return { input: input, swatch: swatch };
    }

    function createPlayerThemeV6RangeSetting(renderer, section, path, label, minimum, maximum, step) {
        var setting = createRangeSetting(
            section, label, "elyric-v6-" + path.replace(/\./g, "-"), minimum, maximum, step, label,
            function (value) {
                commitPlayerThemeV6Path(renderer, path, Number(value), true);
            }
        );
        renderer.__elyricThemeV6RangeControls = renderer.__elyricThemeV6RangeControls || {};
        renderer.__elyricThemeV6RangeControls[path] = setting;
        return setting;
    }

    function createPlayerThemeV6SegmentedSetting(renderer, section, path, label, items) {
        var control = createSegmentedControl(
            renderer, items, "elyric-v6-" + path.replace(/\./g, "-") + "-segments",
            "elyric-v6-choice", label, function (value) {
                commitPlayerThemeV6Path(renderer, path, value, true);
            }
        );
        section.appendChild(control.element);
        renderer.__elyricThemeV6SegmentControls = renderer.__elyricThemeV6SegmentControls || {};
        renderer.__elyricThemeV6SegmentControls[path] = control.buttons;
        return control;
    }

    function createPlayerThemeV6ColorSetting(renderer, section, path, label) {
        var row = document.createElement("label");
        row.className = "elyric-player-color-setting elyric-v6-color-setting";
        var labelElement = document.createElement("span");
        labelElement.appendChild(document.createTextNode(label));
        var field = document.createElement("span");
        field.className = "elyric-player-color-field";
        var swatch = document.createElement("span");
        swatch.className = "elyric-player-color-swatch";
        var input = document.createElement("input");
        input.className = "elyric-player-color-input";
        input.type = "text";
        input.maxLength = 7;
        input.setAttribute("aria-label", label + "十六进制颜色");
        input.addEventListener("input", function (event) {
            stopControlEvent(event);
            if (!/^#?[0-9a-f]{6}$/i.test(input.value || "")) {
                setAttributeIfChanged(input, "aria-invalid", "true"); return;
            }
            removeAttributeIfPresent(input, "aria-invalid");
            commitPlayerThemeV6Path(renderer, path, normalizeHexColor(input.value, "#ffffff"), true);
        });
        input.addEventListener("pointerdown", stopControlEvent);
        field.appendChild(swatch); field.appendChild(input);
        row.appendChild(labelElement); row.appendChild(field); section.appendChild(row);
        renderer.__elyricThemeV6ColorControls = renderer.__elyricThemeV6ColorControls || {};
        renderer.__elyricThemeV6ColorControls[path] = { input: input, swatch: swatch };
        return renderer.__elyricThemeV6ColorControls[path];
    }

    function createMetadataSummaryFieldControl(renderer, section) {
        var group = document.createElement("div");
        group.className = "elyric-player-segmented elyric-metadata-summary-segments";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "歌曲信息组件展示字段");
        var buttons = [];
        PLAYER_METADATA_SUMMARY_FIELDS.forEach(function (field) {
            var button = document.createElement("button");
            button.className = "elyric-player-segment elyric-metadata-summary-choice";
            button.type = "button";
            button.setAttribute("data-elyric-choice", field.id);
            button.appendChild(document.createTextNode(field.label));
            button.addEventListener("click", function (event) {
                stopControlEvent(event);
                var fields = renderer.__elyricThemeV2.metadata.summaryFields || [];
                setMetadataSummaryField(renderer, field.id, fields.indexOf(field.id) < 0, true);
            });
            group.appendChild(button); buttons.push(button);
        });
        section.appendChild(group);
        return buttons;
    }

    function createMediaFieldControl(renderer, section) {
        var group = document.createElement("div");
        group.className = "elyric-player-segmented elyric-media-field-segments";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "信息弹卡展示范围");
        var buttons = [];
        PLAYER_MEDIA_FIELDS.forEach(function (field) {
            var button = document.createElement("button");
            button.className = "elyric-player-segment elyric-media-field-choice";
            button.setAttribute("type", "button");
            button.setAttribute("data-elyric-choice", field.id);
            button.appendChild(document.createTextNode(field.label));
            button.addEventListener("click", function (event) {
                stopControlEvent(event);
                setPlayerMediaField(renderer, field.id, !renderer.__elyricMediaFields[field.id], true);
            });
            button.addEventListener("pointerdown", stopControlEvent);
            group.appendChild(button);
            buttons.push(button);
        });
        section.appendChild(group);
        return buttons;
    }

    function scrollCurrentLyricIntoView(renderer, smooth) {
        var container = renderer.itemsContainer;
        var current = container && container.querySelector
            ? container.querySelector(".elyric-line-current")
            : null;
        if (!current || !current.scrollIntoView) {
            return false;
        }
        try {
            current.scrollIntoView({
                block: "center",
                inline: "nearest",
                behavior: smooth ? "smooth" : "auto"
            });
        } catch (error) {
            current.scrollIntoView();
        }
        renderer.__elyricLastFollowedLineIndex = current.getAttribute
            ? current.getAttribute("data-index")
            : null;
        return true;
    }

    function resumeLyricFollowing(renderer, smooth) {
        if (renderer.__elyricLyricFollowTimer) {
            clearTimeout(renderer.__elyricLyricFollowTimer);
            renderer.__elyricLyricFollowTimer = 0;
        }
        renderer.__elyricManualScrollUntil = 0;
        renderer.__elyricLastFollowedLineIndex = null;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-manual-scroll", "false");
        if (renderer.__elyricLyricFollowButton) {
            renderer.__elyricLyricFollowButton.setAttribute("hidden", "hidden");
        }
        scrollCurrentLyricIntoView(renderer, smooth);
    }

    function suspendLyricFollowing(renderer) {
        var followDelay = renderer.__elyricThemeV2 && renderer.__elyricThemeV2.lyrics
            ? renderer.__elyricThemeV2.lyrics.followDelayMs
            : LYRIC_FOLLOW_IDLE_MS;
        renderer.__elyricManualScrollUntil = Date.now() + followDelay;
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-manual-scroll", "true");
        if (renderer.__elyricLyricFollowButton) {
            renderer.__elyricLyricFollowButton.removeAttribute("hidden");
        }
        if (renderer.__elyricLyricFollowTimer) {
            clearTimeout(renderer.__elyricLyricFollowTimer);
        }
        renderer.__elyricLyricFollowTimer = setTimeout(function () {
            renderer.__elyricLyricFollowTimer = 0;
            resumeLyricFollowing(renderer, true);
        }, followDelay);
    }

    function installLyricFollowTracking(renderer) {
        var container = renderer.itemsContainer;
        if (!container || !container.addEventListener) {
            return;
        }
        if (renderer.__elyricLyricFollowHost === container
            && renderer.__elyricLyricManualScrollHandler) {
            return;
        }
        var previousHost = renderer.__elyricLyricFollowHost;
        var previousParent = renderer.__elyricLyricFollowParent;
        var previousHandler = renderer.__elyricLyricManualScrollHandler;
        if (previousHost && previousHost.removeEventListener && previousHandler) {
            ["wheel", "touchstart", "pointerdown"].forEach(function (type) {
                previousHost.removeEventListener(type, previousHandler);
            });
        }
        if (previousParent && previousParent.removeEventListener && previousHandler) {
            previousParent.removeEventListener("wheel", previousHandler);
        }
        var handler = function () {
            suspendLyricFollowing(renderer);
        };
        ["wheel", "touchstart", "pointerdown"].forEach(function (type) {
            container.addEventListener(type, handler, { passive: true });
        });
        var parent = container.parentNode;
        if (parent && parent.addEventListener) {
            parent.addEventListener("wheel", handler, { passive: true });
        }
        renderer.__elyricLyricFollowHost = container;
        renderer.__elyricLyricFollowParent = parent;
        renderer.__elyricLyricManualScrollHandler = handler;
    }

    function createThemeControl(renderer) {
        ensurePlayerThemeLibrary(renderer);
        var control = document.createElement("div");
        control.className = "elyric-player-root elyric-player-shell elyric-theme-picker";
        control.setAttribute("data-elyric-control", "player");
        control.setAttribute("data-elyric-build", PLAYER_BUILD_ID);
        control.setAttribute("data-elyric-schema", String(PLAYER_THEME_SCHEMA_VERSION));
        control.setAttribute("data-elyric-layout-model", PLAYER_THEME_LAYOUT_MODEL);
        control.setAttribute("data-elyric-workspace-ready", "false");
        control.setAttribute("data-elyric-workspace-source", "loading");
        control.setAttribute("role", "region");
        control.setAttribute("aria-label", "歌词增强音乐播放器");
        control.setAttribute("data-elyric-settings-open", "false");
        control.setAttribute("data-elyric-playback-active", "false");
        control.setAttribute("data-elyric-queue-open", "false");
        control.setAttribute("data-elyric-manual-scroll", "false");
        renderer.__elyricRoot = control;

        var topbar = document.createElement("div");
        topbar.className = "elyric-player-topbar";
        topbar.appendChild(createPlayerButton(renderer, "back", "返回", "back"));
        var topbarTitle = document.createElement("span");
        topbarTitle.className = "elyric-player-topbar-title";
        topbarTitle.appendChild(document.createTextNode("NOW PLAYING"));
        topbar.appendChild(topbarTitle);
        topbar.appendChild(createPlayerButton(renderer, "cast", "在其他设备上播放", "cast"));
        control.appendChild(topbar);

        var background = document.createElement("img");
        background.className = "elyric-player-background";
        background.setAttribute("hidden", "hidden");
        background.setAttribute("aria-hidden", "true");
        control.appendChild(background);

        var stage = document.createElement("div");
        stage.className = "elyric-player-stage";
        control.appendChild(stage);

        var identity = document.createElement("div");
        identity.className = "elyric-player-identity";

        var artworkStage = document.createElement("div");
        artworkStage.className = "elyric-player-artwork-stage";

        var artwork = document.createElement("img");
        artwork.className = "elyric-player-artwork";
        artwork.setAttribute("hidden", "hidden");
        artworkStage.appendChild(artwork);
        identity.appendChild(artworkStage);
        stage.appendChild(identity);

        var coverflow = document.createElement("div");
        coverflow.className = "elyric-player-coverflow";
        coverflow.setAttribute("aria-hidden", "true");
        var coverflowArtworks = [];
        var coverflowCaptions = [];
        for (var coverflowIndex = 0; coverflowIndex < 5; coverflowIndex++) {
            var coverflowCard = document.createElement("div");
            coverflowCard.className = "elyric-player-coverflow-card";
            coverflowCard.setAttribute("data-elyric-coverflow-index", String(coverflowIndex));
            var coverflowArtwork = document.createElement("img");
            coverflowArtwork.className = "elyric-player-coverflow-artwork";
            coverflowArtwork.setAttribute("alt", "");
            coverflowArtwork.setAttribute("hidden", "hidden");
            var coverflowCaption = document.createElement("span");
            coverflowCaption.className = "elyric-player-coverflow-caption";
            coverflowCard.appendChild(coverflowArtwork);
            coverflowCard.appendChild(coverflowCaption);
            coverflow.appendChild(coverflowCard);
            coverflowArtworks.push(coverflowArtwork);
            coverflowCaptions.push(coverflowCaption);
        }
        stage.appendChild(coverflow);

        var metadata = document.createElement("div");
        metadata.className = "elyric-player-metadata";
        var title = document.createElement("div");
        title.className = "elyric-player-title";
        var artist = document.createElement("div");
        artist.className = "elyric-player-artist";
        var album = document.createElement("div");
        album.className = "elyric-player-album";
        var format = document.createElement("div");
        format.className = "elyric-player-format";
        metadata.appendChild(title);
        metadata.appendChild(artist);
        metadata.appendChild(album);
        metadata.appendChild(format);
        stage.appendChild(metadata);

        var lyricViewport = document.createElement("div");
        lyricViewport.className = "elyric-player-lyric-viewport lyricsScroller";
        lyricViewport.setAttribute("role", "list");
        lyricViewport.setAttribute("aria-label", "同步歌词");
        lyricViewport.setAttribute("tabindex", "0");
        stage.appendChild(lyricViewport);
        renderer.itemsContainer = lyricViewport;
        renderer.__elyricLyricViewport = lyricViewport;

        var lyricsEmpty = document.createElement("div");
        lyricsEmpty.className = "elyric-player-lyrics-empty";
        lyricsEmpty.setAttribute("role", "status");
        lyricsEmpty.setAttribute("aria-live", "polite");
        lyricsEmpty.setAttribute("hidden", "hidden");
        var lyricsEmptyTitle = document.createElement("strong");
        lyricsEmptyTitle.appendChild(document.createTextNode("暂无同步歌词"));
        var lyricsEmptyHint = document.createElement("span");
        lyricsEmptyHint.appendChild(document.createTextNode("当前媒体没有提供歌词，播放控制仍可正常使用。"));
        lyricsEmpty.appendChild(lyricsEmptyTitle);
        lyricsEmpty.appendChild(lyricsEmptyHint);
        lyricViewport.appendChild(lyricsEmpty);
        renderer.__elyricLyricsEmptyTitle = lyricsEmptyTitle;
        renderer.__elyricLyricsEmptyHint = lyricsEmptyHint;

        var controlDock = document.createElement("div");
        controlDock.className = "elyric-player-control-dock";
        controlDock.setAttribute("aria-label", "播放控制坞");

        var transport = document.createElement("div");
        transport.className = "elyric-player-transport elyric-player-control-group";
        transport.appendChild(createPlayerButton(renderer, "previous", "上一首", "previous"));
        transport.appendChild(createPlayerButton(renderer, "playPause", "播放或暂停", "play"));
        transport.appendChild(createPlayerButton(renderer, "next", "下一首", "next"));

        var progress = document.createElement("div");
        progress.className = "elyric-player-progress elyric-player-control-group";
        var positionText = document.createElement("span");
        positionText.className = "elyric-player-position";
        positionText.appendChild(document.createTextNode("0:00"));
        var progressSlider = document.createElement("input");
        progressSlider.className = "elyric-player-progress-slider";
        progressSlider.setAttribute("type", "range");
        progressSlider.setAttribute("min", "0");
        progressSlider.setAttribute("max", "1000");
        progressSlider.setAttribute("step", "1");
        progressSlider.setAttribute("value", "0");
        progressSlider.setAttribute("aria-label", "播放进度");
        progressSlider.min = "0";
        progressSlider.max = "1000";
        progressSlider.value = "0";
        progressSlider.addEventListener("input", function (event) {
            stopControlEvent(event);
            renderer.__elyricScrubbing = true;
            var runtimeTicks = renderer.__elyricLastRuntimeTicks || 0;
            var previewTicks = Number(progressSlider.value) / 1000 * runtimeTicks;
            replaceElementText(positionText, formatPlayerTime(previewTicks));
        });
        progressSlider.addEventListener("change", function (event) {
            stopControlEvent(event);
            seekFromPlayerControl(renderer);
        });
        var durationText = document.createElement("span");
        durationText.className = "elyric-player-duration";
        durationText.appendChild(document.createTextNode("0:00"));
        progress.appendChild(positionText);
        progress.appendChild(progressSlider);
        progress.appendChild(durationText);

        var volume = document.createElement("div");
        volume.className = "elyric-player-volume elyric-player-control-group";
        volume.appendChild(createPlayerButton(renderer, "mute", "静音", "volume"));
        var volumeSlider = document.createElement("input");
        volumeSlider.className = "elyric-player-volume-slider";
        volumeSlider.setAttribute("type", "range");
        volumeSlider.setAttribute("min", "0");
        volumeSlider.setAttribute("max", "100");
        volumeSlider.setAttribute("step", "1");
        volumeSlider.setAttribute("value", "100");
        volumeSlider.setAttribute("aria-label", "音量");
        volumeSlider.min = "0";
        volumeSlider.max = "100";
        volumeSlider.value = "100";
        volumeSlider.addEventListener("input", function (event) {
            stopControlEvent(event);
            renderer.__elyricVolumeScrubbing = true;
            volumeFromPlayerControl(renderer, "input");
        });
        volumeSlider.addEventListener("change", function (event) {
            stopControlEvent(event);
            volumeFromPlayerControl(renderer, "change");
        });
        volume.appendChild(volumeSlider);
        var volumeValue = document.createElement("output");
        volumeValue.className = "elyric-player-volume-value";
        volumeValue.setAttribute("aria-live", "polite");
        volumeValue.appendChild(document.createTextNode("100%"));
        volume.appendChild(volumeValue);

        var tools = document.createElement("div");
        tools.className = "elyric-player-tools elyric-player-control-group";
        tools.appendChild(createPlayerButton(renderer, "shuffle", "随机播放", "shuffle"));
        tools.appendChild(createPlayerButton(renderer, "repeat", "循环模式", "repeat"));
        tools.appendChild(createPlayerButton(renderer, "stop", "停止播放", "stop"));
        tools.appendChild(createPlayerButton(renderer, "queue", "播放队列", "queue"));

        var mediaButton = document.createElement("button");
        mediaButton.className = "elyric-player-button elyric-player-button-info";
        mediaButton.setAttribute("type", "button");
        mediaButton.setAttribute("aria-label", "媒体信息");
        mediaButton.setAttribute("aria-haspopup", "dialog");
        mediaButton.setAttribute("aria-expanded", "false");
        mediaButton.setAttribute("data-elyric-tooltip", "媒体信息");
        setButtonIcon(mediaButton, "info");
        mediaButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            if (renderer.__elyricMediaOpen) { requestPlayerOverlayClose(renderer, "media"); }
            else { requestPlayerOverlayOpen(renderer, "media", mediaButton, "above"); }
        });
        mediaButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(mediaButton);

        var visualizerButton = document.createElement("button");
        visualizerButton.className = "elyric-player-button elyric-player-button-visualizer";
        visualizerButton.setAttribute("type", "button");
        visualizerButton.setAttribute("aria-label", "开启或关闭音频律动");
        visualizerButton.setAttribute("data-elyric-tooltip", "音频律动");
        visualizerButton.setAttribute("aria-pressed", "true");
        setButtonIcon(visualizerButton, "visualizer");
        visualizerButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            renderer.__elyricVisualizerEnabled = false === renderer.__elyricVisualizerEnabled;
            setAttributeIfChanged(visualizerButton, "aria-pressed", renderer.__elyricVisualizerEnabled ? "true" : "false");
            setAttributeIfChanged(visualizerButton, "data-elyric-active", renderer.__elyricVisualizerEnabled ? "true" : "false");
            syncVisualizerAnimation(renderer);
        });
        visualizerButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(visualizerButton);

        var secondLineButton = document.createElement("button");
        secondLineButton.className = "elyric-player-button elyric-player-button-secondline";
        secondLineButton.setAttribute("type", "button");
        secondLineButton.setAttribute("aria-label", "显示或隐藏注音");
        secondLineButton.setAttribute("data-elyric-tooltip", "注音 / 翻译");
        setButtonIcon(secondLineButton, "subtitle");
        secondLineButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            renderer.__elyricSecondLineOverridden = true;
            setSecondLineOverride(renderer, !renderer.__elyricLocalShowSecond, true);
        });
        secondLineButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(secondLineButton);

        var thirdLineButton = document.createElement("button");
        thirdLineButton.className = "elyric-player-button elyric-player-button-thirdline";
        thirdLineButton.setAttribute("type", "button");
        thirdLineButton.setAttribute("aria-label", "显示或隐藏翻译");
        thirdLineButton.setAttribute("data-elyric-tooltip", "翻译 / 第三行");
        setButtonIcon(thirdLineButton, "translation");
        thirdLineButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            setThirdLineOverride(renderer, !renderer.__elyricLocalShowThird, true);
        });
        thirdLineButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(thirdLineButton);

        var artworkRotationButton = document.createElement("button");
        artworkRotationButton.className = "elyric-player-button elyric-player-button-rotation";
        artworkRotationButton.setAttribute("type", "button");
        artworkRotationButton.setAttribute("aria-label", "开启或停止专辑图旋转");
        artworkRotationButton.setAttribute("data-elyric-tooltip", "封面旋转");
        setButtonIcon(artworkRotationButton, "rotation");
        artworkRotationButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            setArtworkRotation(renderer, !renderer.__elyricArtworkRotation, true);
        });
        artworkRotationButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(artworkRotationButton);

        var settingsButton = document.createElement("button");
        settingsButton.className = "elyric-player-button elyric-player-button-settings";
        settingsButton.setAttribute("type", "button");
        settingsButton.setAttribute("aria-label", "播放器设置");
        settingsButton.setAttribute("aria-haspopup", "dialog");
        settingsButton.setAttribute("aria-expanded", "false");
        settingsButton.setAttribute("data-elyric-tooltip", "播放器设置");
        setButtonIcon(settingsButton, "settings");
        settingsButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            if (renderer.__elyricSettingsOpen) { requestPlayerOverlayClose(renderer, "settings"); }
            else { requestPlayerOverlayOpen(renderer, "settings", settingsButton, "above"); }
        });
        settingsButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(settingsButton);
        stage.appendChild(controlDock);

        var visualizer = document.createElement("div");
        visualizer.className = "elyric-player-visualizer";
        visualizer.setAttribute("aria-label", "播放节奏动画");
        visualizer.setAttribute("role", "img");
        var visualizerCanvas = document.createElement("canvas");
        visualizerCanvas.className = "elyric-player-visualizer-canvas";
        visualizerCanvas.setAttribute("aria-hidden", "true");
        visualizer.appendChild(visualizerCanvas);
        stage.appendChild(visualizer);

        var queuePanel = document.createElement("aside");
        queuePanel.className = "elyric-player-queue-panel";
        queuePanel.setAttribute("role", "dialog");
        queuePanel.setAttribute("aria-label", "播放队列");
        queuePanel.setAttribute("aria-modal", "true");
        queuePanel.setAttribute("hidden", "hidden");
        var queueHeader = document.createElement("div");
        queueHeader.className = "elyric-player-queue-header";
        var queueTitle = document.createElement("strong");
        queueTitle.appendChild(document.createTextNode("播放队列"));
        var queueClose = document.createElement("button");
        queueClose.className = "elyric-player-settings-close";
        queueClose.setAttribute("type", "button");
        queueClose.setAttribute("aria-label", "关闭播放队列");
        setButtonIcon(queueClose, "close");
        queueClose.addEventListener("click", function (event) {
            stopControlEvent(event); requestPlayerOverlayClose(renderer, "queue");
        });
        queueHeader.appendChild(queueTitle); queueHeader.appendChild(queueClose);
        var queueBody = document.createElement("div");
        queueBody.className = "elyric-player-queue-body";
        queuePanel.appendChild(queueHeader); queuePanel.appendChild(queueBody);
        control.appendChild(queuePanel);

        var castPanel = document.createElement("aside");
        castPanel.className = "elyric-player-cast-panel";
        castPanel.setAttribute("role", "dialog");
        castPanel.setAttribute("aria-label", "投放到其他设备");
        castPanel.setAttribute("aria-modal", "true");
        castPanel.setAttribute("hidden", "hidden");
        var castHeader = document.createElement("div");
        castHeader.className = "elyric-player-queue-header";
        var castTitle = document.createElement("strong");
        castTitle.appendChild(document.createTextNode("播放设备"));
        var castClose = document.createElement("button");
        castClose.className = "elyric-player-settings-close";
        castClose.setAttribute("type", "button");
        castClose.setAttribute("aria-label", "关闭播放设备");
        setButtonIcon(castClose, "close");
        castClose.addEventListener("click", function (event) {
            stopControlEvent(event); requestPlayerOverlayClose(renderer, "cast");
        });
        castHeader.appendChild(castTitle); castHeader.appendChild(castClose);
        var castBody = document.createElement("div");
        castBody.className = "elyric-player-cast-body";
        castPanel.appendChild(castHeader); castPanel.appendChild(castBody);
        control.appendChild(castPanel);

        var followButton = document.createElement("button");
        followButton.className = "elyric-lyric-follow-button";
        followButton.setAttribute("type", "button");
        followButton.setAttribute("aria-label", "定位到当前歌词");
        followButton.setAttribute("title", "定位到当前歌词");
        followButton.setAttribute("data-elyric-tooltip", "回到当前歌词");
        followButton.setAttribute("hidden", "hidden");
        setButtonIcon(followButton, "locate");
        followButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            resumeLyricFollowing(renderer, true);
        });
        followButton.addEventListener("pointerdown", stopControlEvent);
        control.appendChild(followButton);

        var overlayScrim = document.createElement("div");
        overlayScrim.className = "elyric-player-overlay-scrim";
        overlayScrim.setAttribute("aria-hidden", "true");
        overlayScrim.setAttribute("hidden", "hidden");
        overlayScrim.addEventListener("click", function (event) {
            stopControlEvent(event);
            requestPlayerOverlayClose(renderer, "settings");
            requestPlayerOverlayClose(renderer, "media");
            requestPlayerOverlayClose(renderer, "queue");
            requestPlayerOverlayClose(renderer, "cast");
        });

        var settingsPanel = document.createElement("div");
        settingsPanel.className = "elyric-player-settings-panel";
        settingsPanel.setAttribute("role", "dialog");
        settingsPanel.setAttribute("aria-label", "播放器设置");
        settingsPanel.setAttribute("aria-modal", "true");
        settingsPanel.setAttribute("hidden", "hidden");

        var settingsHeader = document.createElement("div");
        settingsHeader.className = "elyric-player-settings-header";
        var settingsTitle = document.createElement("strong");
        settingsTitle.appendChild(document.createTextNode("播放器设置"));
        settingsHeader.appendChild(settingsTitle);
        var preferenceStatus = document.createElement("span");
        preferenceStatus.className = "elyric-player-preference-status";
        preferenceStatus.setAttribute("role", "status");
        preferenceStatus.setAttribute("aria-live", "polite");
        preferenceStatus.appendChild(document.createTextNode("当前设置保存在本浏览器"));
        settingsHeader.appendChild(preferenceStatus);
        var settingsClose = document.createElement("button");
        settingsClose.className = "elyric-player-settings-close";
        settingsClose.setAttribute("type", "button");
        settingsClose.setAttribute("aria-label", "关闭播放器设置");
        setButtonIcon(settingsClose, "close");
        settingsClose.addEventListener("click", function (event) {
            stopControlEvent(event);
            requestPlayerOverlayClose(renderer, "settings");
        });
        settingsHeader.appendChild(settingsClose);
        settingsPanel.appendChild(settingsHeader);
        var settingsBody = document.createElement("div");
        settingsBody.className = "elyric-player-settings-body";
        settingsPanel.__elyricSettingsBody = settingsBody;
        settingsPanel.appendChild(settingsBody);

        var tuningInputs = {};
        var tuningValues = {};
        var themeChoiceControls = {};
        var themeColorSettings = {};
        renderer.__elyricThemeV6RangeControls = {};
        renderer.__elyricThemeV6SegmentControls = {};
        renderer.__elyricThemeV6ColorControls = {};

        var librarySection = createSettingsSection(
            settingsPanel,
            "0. 主题库与设计版本",
            "elyric-player-theme-library-settings"
        );
        var themeLibrarySelect = document.createElement("select");
        themeLibrarySelect.className = "elyric-player-theme-library-select";
        themeLibrarySelect.setAttribute("aria-label", "播放器主题库");
        themeLibrarySelect.addEventListener("change", function (event) {
            stopControlEvent(event);
            selectPlayerThemeLibraryEntry(renderer, themeLibrarySelect.value);
        });
        themeLibrarySelect.addEventListener("pointerdown", stopControlEvent);
        librarySection.appendChild(themeLibrarySelect);
        var themeNameInput = document.createElement("input");
        themeNameInput.className = "elyric-player-theme-name-input";
        themeNameInput.setAttribute("type", "text");
        themeNameInput.setAttribute("maxlength", "32");
        themeNameInput.setAttribute("placeholder", "输入主题名称");
        themeNameInput.setAttribute("aria-label", "用户主题名称");
        themeNameInput.addEventListener("pointerdown", stopControlEvent);
        librarySection.appendChild(themeNameInput);
        var themeLibraryActions = document.createElement("div");
        themeLibraryActions.className = "elyric-player-theme-library-actions";
        var newThemeButton = createSettingsActionButton(
            "另存为新主题", "add", function () { createUserPlayerTheme(renderer, false); }, "elyric-theme-new"
        );
        var saveThemeButton = createSettingsActionButton(
            "保存当前主题", "save", function () { saveActiveUserPlayerTheme(renderer); }, "elyric-theme-save"
        );
        var duplicateThemeButton = createSettingsActionButton(
            "复制主题", "copy", function () { createUserPlayerTheme(renderer, true); }, "elyric-theme-duplicate"
        );
        var renameThemeButton = createSettingsActionButton(
            "重命名", "edit", function () { renameActiveUserPlayerTheme(renderer); }, "elyric-theme-rename"
        );
        var deleteThemeButton = createSettingsActionButton(
            "删除", "delete", function () { deleteActiveUserPlayerTheme(renderer); }, "elyric-theme-delete"
        );
        var restoreRepairBackupButton = createSettingsActionButton(
            "回退布局修复", "undo", function () { restoreLatestPlayerThemeV5RepairBackup(renderer); },
            "elyric-theme-restore-repair"
        );
        var undoThemeResetButton = createSettingsActionButton(
            "撤销主题重置", "undo", function () { undoPlayerThemeReset(renderer); },
            "elyric-theme-undo-reset"
        );
        var copyJsonButton = createSettingsActionButton(
            "复制主题 JSON", "copy", function () { copyPortablePlayerTheme(renderer); }, "elyric-theme-copy-json"
        );
        var downloadJsonButton = createSettingsActionButton(
            "下载主题 JSON", "download", function () { downloadPortablePlayerTheme(renderer); }, "elyric-theme-download-json"
        );
        var pasteJsonButton = createSettingsActionButton(
            "粘贴 JSON 导入", "paste", function () { promptImportPortablePlayerTheme(renderer); }, "elyric-theme-paste-json"
        );
        var importFileInput = document.createElement("input");
        importFileInput.className = "elyric-theme-import-file";
        importFileInput.type = "file";
        importFileInput.accept = ".json,.elyric-theme.json,application/json";
        importFileInput.setAttribute("hidden", "hidden");
        importFileInput.addEventListener("change", function () {
            if (importFileInput.files && importFileInput.files[0]) {
                importPortablePlayerThemeFile(renderer, importFileInput.files[0]);
            }
            importFileInput.value = "";
        });
        var importFileButton = createSettingsActionButton(
            "选择 JSON 文件", "upload", function () { importFileInput.click(); }, "elyric-theme-import-json"
        );
        [
            newThemeButton, saveThemeButton, duplicateThemeButton, renameThemeButton,
            deleteThemeButton, undoThemeResetButton, restoreRepairBackupButton, copyJsonButton, downloadJsonButton,
            pasteJsonButton, importFileButton
        ]
            .forEach(function (button) { themeLibraryActions.appendChild(button); });
        themeLibraryActions.appendChild(importFileInput);
        librarySection.appendChild(themeLibraryActions);
        var themeLibraryStatus = document.createElement("small");
        themeLibraryStatus.className = "elyric-player-theme-library-status";
        themeLibraryStatus.setAttribute("role", "status");
        themeLibraryStatus.setAttribute("aria-live", "polite");
        themeLibraryStatus.appendChild(document.createTextNode("内置主题不可覆盖；调整后可另存为用户主题。"));
        librarySection.appendChild(themeLibraryStatus);

        createPlayerThemeV2DesignerSection(renderer, settingsPanel);

        var backgroundSection = createSettingsSection(settingsPanel, "1. 背景", "elyric-background-settings");
        var backgroundChoices = createSegmentedControl(
            renderer,
            BACKGROUND_MODES,
            "elyric-background-segments",
            "elyric-background-choice",
            "播放器背景",
            function (modeId) { setBackgroundMode(renderer, modeId, true); }
        );
        backgroundSection.appendChild(backgroundChoices.element);
        createPlayerTuningControls(
            renderer,
            backgroundSection,
            ["backgroundBlur", "backgroundDim", "backgroundSaturation", "backgroundAngle"],
            tuningInputs,
            tuningValues
        );
        ["backgroundA", "backgroundB"].forEach(function (colorId) {
            themeColorSettings[colorId] = createPlayerThemeColorSetting(renderer, backgroundSection, colorId);
        });
        var backgroundHelp = document.createElement("small");
        backgroundHelp.className = "elyric-player-settings-help";
        backgroundHelp.appendChild(document.createTextNode("背景来源、模糊半径和压暗强度独立保存；黑白纯色背景不会应用模糊。"));
        backgroundSection.appendChild(backgroundHelp);

        var layoutSection = createSettingsSection(settingsPanel, "2. 界面布局", "elyric-layout-settings");
        var layoutChoices = createSegmentedControl(
            renderer,
            PLAYER_LAYOUTS,
            "elyric-layout-segments",
            "elyric-layout-choice",
            "播放器界面",
            function (layoutId) { applyPlayerLayout(renderer, layoutId, true); }
        );
        layoutSection.appendChild(layoutChoices.element);
        var layoutHelp = document.createElement("small");
        layoutHelp.className = "elyric-player-settings-help";
        layoutHelp.appendChild(document.createTextNode("九套参考预设都遵循安全区，并会同步建议的背景、歌词锚点与律动配色；自定义布局仍可分别移动唱片、歌曲信息和歌词。"));
        layoutSection.appendChild(layoutHelp);

        var compositionSection = createSettingsSection(
            settingsPanel,
            "3. 唱片、歌曲信息与歌词位置",
            "elyric-composition-settings"
        );
        var artworkModeChoices = createSegmentedControl(
            renderer,
            PLAYER_ARTWORK_MODES,
            "elyric-artwork-mode-segments",
            "elyric-artwork-mode-choice",
            "封面组合模式",
            function (modeId) { setPlayerThemeChoice(renderer, "artworkMode", modeId, true); }
        );
        compositionSection.appendChild(artworkModeChoices.element);
        themeChoiceControls.artworkMode = artworkModeChoices.buttons;

        var artworkMaterialChoices = createSegmentedControl(
            renderer,
            PLAYER_ARTWORK_MATERIALS,
            "elyric-artwork-material-segments",
            "elyric-artwork-material-choice",
            "封面材质",
            function (materialId) { setPlayerThemeChoice(renderer, "artworkMaterial", materialId, true); }
        );
        compositionSection.appendChild(artworkMaterialChoices.element);
        themeChoiceControls.artworkMaterial = artworkMaterialChoices.buttons;

        var controlMaterialChoices = createSegmentedControl(
            renderer,
            PLAYER_CONTROL_MATERIALS,
            "elyric-control-material-segments",
            "elyric-control-material-choice",
            "控制区材质",
            function (materialId) { setPlayerThemeChoice(renderer, "controlMaterial", materialId, true); }
        );
        compositionSection.appendChild(controlMaterialChoices.element);
        themeChoiceControls.controlMaterial = controlMaterialChoices.buttons;
        var artworkOuterShapeChoices = createSegmentedControl(
            renderer,
            [{ id: "0", label: "外方" }, { id: "18", label: "外圆角" }, { id: "50", label: "外圆" }],
            "elyric-artwork-outer-shape-segments",
            "elyric-artwork-outer-shape-choice",
            "封面外层形状",
            function (value) { setPlayerTuning(renderer, "artworkOuterRadius", value, true); }
        );
        compositionSection.appendChild(artworkOuterShapeChoices.element);
        var artworkInnerShapeChoices = createSegmentedControl(
            renderer,
            [{ id: "0", label: "内方" }, { id: "18", label: "内圆角" }, { id: "50", label: "内圆" }],
            "elyric-artwork-inner-shape-segments",
            "elyric-artwork-inner-shape-choice",
            "封面内层形状",
            function (value) { setPlayerTuning(renderer, "artworkInnerRadius", value, true); }
        );
        compositionSection.appendChild(artworkInnerShapeChoices.element);
        createPlayerTuningControls(
            renderer,
            compositionSection,
            [
                "artworkScale", "artworkInnerSize",
                "artworkOuterRadius", "artworkInnerRadius", "artworkPadding", "artworkBorderWidth",
                "artworkShadowDepth", "coverflowWidth", "coverflowHeight",
                "metadataTitleSize",
                "metadataArtistSize", "metadataAlbumSize", "metadataLetterSpacing",
                "metadataPadding", "metadataRadius", "metadataBlur", "metadataOpacity"
            ],
            tuningInputs,
            tuningValues
        );
        var metadataAnchorChoices = createSegmentedControl(
            renderer,
            PLAYER_METADATA_ANCHORS,
            "elyric-metadata-anchor-segments",
            "elyric-metadata-anchor-choice",
            "歌曲信息定位锚点",
            function (anchorId) { setPlayerThemeChoice(renderer, "metadataAnchor", anchorId, true); }
        );
        compositionSection.appendChild(metadataAnchorChoices.element);
        themeChoiceControls.metadataAnchor = metadataAnchorChoices.buttons;
        var metadataAlignChoices = createSegmentedControl(
            renderer,
            LYRIC_ALIGNMENTS,
            "elyric-metadata-align-segments",
            "elyric-metadata-align-choice",
            "歌曲信息文字对齐",
            function (alignmentId) { setPlayerThemeChoice(renderer, "metadataAlign", alignmentId, true); }
        );
        compositionSection.appendChild(metadataAlignChoices.element);
        themeChoiceControls.metadataAlign = metadataAlignChoices.buttons;
        var metadataSurfaceChoices = createSegmentedControl(
            renderer,
            PLAYER_SURFACE_STYLES,
            "elyric-metadata-surface-segments",
            "elyric-metadata-surface-choice",
            "歌曲信息背景样式",
            function (surfaceId) { setPlayerThemeChoice(renderer, "metadataSurface", surfaceId, true); }
        );
        compositionSection.appendChild(metadataSurfaceChoices.element);
        themeChoiceControls.metadataSurface = metadataSurfaceChoices.buttons;
        var metadataSummaryButtons = createMetadataSummaryFieldControl(renderer, compositionSection);
        ["artworkFrame", "metadataText", "metadataSurface"].forEach(function (colorId) {
            themeColorSettings[colorId] = createPlayerThemeColorSetting(renderer, compositionSection, colorId);
        });
        var resetCompositionButton = document.createElement("button");
        resetCompositionButton.className = "elyric-player-settings-action";
        resetCompositionButton.setAttribute("type", "button");
        setButtonIcon(resetCompositionButton, "reset");
        var resetCompositionText = document.createElement("span");
        resetCompositionText.appendChild(document.createTextNode("重置自定义构图"));
        resetCompositionButton.appendChild(resetCompositionText);
        resetCompositionButton.addEventListener("click", function (event) {
            stopControlEvent(event);
            resetCustomPlayerLayout(renderer);
        });
        compositionSection.appendChild(resetCompositionButton);
        var compositionHelp = document.createElement("small");
        compositionHelp.className = "elyric-player-settings-help";
        compositionHelp.appendChild(document.createTextNode("所有封面与歌曲信息参数都会即时生效；外层与内层圆角独立，因此可实现方套圆、圆套方或任意圆角组合。"));
        compositionSection.appendChild(compositionHelp);

        var visualizerSection = createSettingsSection(settingsPanel, "4. 频谱形态与尺寸", "elyric-visualizer-settings");
        var visualizerSourceStatus = document.createElement("div");
        visualizerSourceStatus.className = "elyric-visualizer-source-status";
        visualizerSourceStatus.setAttribute("role", "status");
        visualizerSourceStatus.setAttribute("aria-live", "polite");
        visualizerSourceStatus.setAttribute("data-elyric-state", "waiting");
        visualizerSourceStatus.appendChild(document.createTextNode("正在连接当前播放音频…"));
        visualizerSection.appendChild(visualizerSourceStatus);
        var visualizerStyleChoices = createSegmentedControl(
            renderer,
            VISUALIZER_STYLES,
            "elyric-visualizer-style-segments",
            "elyric-visualizer-style-choice",
            "律动样式",
            function (styleId) { setVisualizerStyle(renderer, styleId, true); }
        );
        visualizerSection.appendChild(visualizerStyleChoices.element);
        var visualizerFrequencyLayoutChoices = createSegmentedControl(
            renderer,
            VISUALIZER_FREQUENCY_LAYOUTS,
            "elyric-visualizer-frequency-layout-segments",
            "elyric-visualizer-frequency-layout-choice",
            "频域展开方式",
            function (layoutId) { setVisualizerFrequencyLayout(renderer, layoutId, true); }
        );
        visualizerSection.appendChild(visualizerFrequencyLayoutChoices.element);
        var visualizerRangeChoices = createSegmentedControl(
            renderer,
            VISUALIZER_RANGES,
            "elyric-visualizer-range-segments",
            "elyric-visualizer-range-choice",
            "律动显示范围",
            function (rangeId) { setVisualizerRange(renderer, rangeId, true); }
        );
        visualizerSection.appendChild(visualizerRangeChoices.element);
        var widthSetting = createRangeSetting(
            visualizerSection, "展示宽度", "elyric-visualizer-width", 10, 100, 1, "频谱展示宽度",
            function (value) { setVisualizerWidth(renderer, value, true); }
        );
        var heightSetting = createRangeSetting(
            visualizerSection, "展示高度", "elyric-visualizer-height", 2, 30, 1, "频谱展示高度",
            function (value) { setVisualizerHeight(renderer, value, true); }
        );
        var amplitudeSetting = createRangeSetting(
            visualizerSection, "波动幅度", "elyric-visualizer-amplitude", 25, 140, 5, "频谱波动幅度",
            function (value) { setVisualizerAmplitude(renderer, value, true); }
        );
        createPlayerTuningControls(
            renderer,
            visualizerSection,
            [],
            tuningInputs,
            tuningValues
        );
        var visualizerAnalysisSettings = {};
        [
            ["sensitivity", "音频灵敏度", "实时音频灵敏度"],
            ["response", "动态响应", "频谱动态响应速度"],
            ["smoothing", "动态平滑", "频谱动态平滑度"],
            ["density", "元素密度", "频谱元素密度"],
            ["bassBoost", "低频增强", "频谱低频增强"],
            ["minFrequency", "最低分析频率", "频谱最低分析频率"],
            ["maxFrequency", "最高分析频率", "频谱最高分析频率"]
        ].forEach(function (setting) {
            var definition = visualizerAnalysisDefinition(setting[0]);
            visualizerAnalysisSettings[setting[0]] = createRangeSetting(
                visualizerSection,
                setting[1],
                "elyric-visualizer-" + setting[0],
                definition.minimum,
                definition.maximum,
                definition.step,
                setting[2],
                function (value) {
                    setVisualizerAnalysisSetting(renderer, setting[0], value, true);
                }
            );
        });
        var visualizerHelp = document.createElement("small");
        visualizerHelp.className = "elyric-player-settings-help";
        visualizerHelp.appendChild(document.createTextNode("优先直接分析当前媒体的音频输出，不接入扬声器链路；浏览器不开放媒体流时自动使用节奏估算。"));
        visualizerSection.appendChild(visualizerHelp);

        var colorSection = createSettingsSection(settingsPanel, "5. 频谱色彩", "elyric-visualizer-color-settings");
        var visualizerColorModeChoices = createSegmentedControl(
            renderer,
            VISUALIZER_COLOR_MODES,
            "elyric-visualizer-color-mode-segments",
            "elyric-visualizer-color-mode-choice",
            "频谱色彩模式",
            function (modeId) { setVisualizerColorMode(renderer, modeId, true); }
        );
        colorSection.appendChild(visualizerColorModeChoices.element);
        var colorSettings = [
            createVisualizerColorSetting(renderer, colorSection, 0, "颜色一"),
            createVisualizerColorSetting(renderer, colorSection, 1, "颜色二"),
            createVisualizerColorSetting(renderer, colorSection, 2, "颜色三")
        ];
        var colorHelp = document.createElement("small");
        colorHelp.className = "elyric-player-settings-help";
        colorHelp.appendChild(document.createTextNode("使用安全的 #RRGGBB 文本输入；彩虹模式使用内置多色渐变。"));
        colorSection.appendChild(colorHelp);

        var lyricSection = createSettingsSection(settingsPanel, "6. 歌词", "elyric-lyric-settings");
        var themeChoices = createSegmentedControl(
            renderer,
            THEMES,
            "elyric-theme-segments",
            "elyric-theme-choice",
            "歌词样式",
            function (themeId) { applyTheme(renderer, themeId, true); }
        );
        lyricSection.appendChild(themeChoices.element);
        var alignmentChoices = createSegmentedControl(
            renderer,
            LYRIC_ALIGNMENTS,
            "elyric-lyric-alignment-segments",
            "elyric-lyric-alignment-choice",
            "歌词对齐方式",
            function (alignmentId) { setLyricAlignment(renderer, alignmentId, true); }
        );
        lyricSection.appendChild(alignmentChoices.element);
        var lyricsSurfaceChoices = createSegmentedControl(
            renderer,
            PLAYER_SURFACE_STYLES,
            "elyric-lyrics-surface-segments",
            "elyric-lyrics-surface-choice",
            "歌词背景样式",
            function (surfaceId) { setPlayerThemeChoice(renderer, "lyricsSurface", surfaceId, true); }
        );
        lyricSection.appendChild(lyricsSurfaceChoices.element);
        themeChoiceControls.lyricsSurface = lyricsSurfaceChoices.buttons;
        var lyricScaleSetting = createRangeSetting(
            lyricSection, "歌词字号", "elyric-lyric-scale", 70, 170, 5, "歌词字号",
            function (value) { setLyricScale(renderer, value, true); }
        );
        createPlayerTuningControls(
            renderer,
            lyricSection,
            [
                "lyricLineGap", "lyricInactiveOpacity", "lyricsPadding", "lyricsRadius",
                "lyricsBlur", "lyricsOpacity", "lyricLetterSpacing", "lyricPastSize",
                "lyricCurrentSize", "lyricFutureSize", "lyricCurrentWeight"
            ],
            tuningInputs,
            tuningValues
        );
        ["lyricsSurface", "lyricPast", "lyricCurrent", "lyricFuture"].forEach(function (colorId) {
            themeColorSettings[colorId] = createPlayerThemeColorSetting(renderer, lyricSection, colorId);
        });
        var themeHelp = document.createElement("small");
        themeHelp.className = "elyric-player-settings-help";
        themeHelp.appendChild(document.createTextNode("已播放、当前行和未播放歌词可分别设置颜色与字号；背景支持无背景、毛玻璃、内嵌、浮雕和悬浮。"));
        lyricSection.appendChild(themeHelp);

        var behaviorSection = createSettingsSection(settingsPanel, "7. 播放细节", "elyric-behavior-settings");
        var secondLineChoices = createSegmentedControl(
            renderer,
            [{ id: "on", label: "显示注音 / 翻译" }, { id: "off", label: "隐藏注音 / 翻译" }],
            "elyric-second-line-segments",
            "elyric-second-line-choice",
            "注音或翻译",
            function (choice) { setSecondLineOverride(renderer, "on" === choice, true); }
        );
        behaviorSection.appendChild(secondLineChoices.element);
        var rotationChoices = createSegmentedControl(
            renderer,
            [{ id: "on", label: "唱片旋转" }, { id: "off", label: "唱片静止" }],
            "elyric-rotation-segments",
            "elyric-rotation-choice",
            "唱片旋转",
            function (choice) { setArtworkRotation(renderer, "on" === choice, true); }
        );
        behaviorSection.appendChild(rotationChoices.element);

        var consoleSection = createSettingsSection(
            settingsPanel,
            "8. 底部控制台、进度与音量",
            "elyric-console-settings"
        );
        createPlayerTuningControls(
            renderer,
            consoleSection,
            [
                "progressTrackHeight", "progressThumbSize",
                "volumeTrackHeight", "volumeThumbSize",
                "consoleBlur", "consoleOpacity"
            ],
            tuningInputs,
            tuningValues
        );
        ["progressActive", "progressTrack", "volumeActive", "volumeTrack"].forEach(function (colorId) {
            themeColorSettings[colorId] = createPlayerThemeColorSetting(renderer, consoleSection, colorId);
        });
        var consoleHelp = document.createElement("small");
        consoleHelp.className = "elyric-player-settings-help";
        consoleHelp.appendChild(document.createTextNode("控制台保持底部安全锚点，背景自动继承当前主题并应用取色毛玻璃；进度条和音量条外观可独立调整。"));
        consoleSection.appendChild(consoleHelp);

        var v6ChromeSection = createSettingsSection(
            settingsPanel, "9. 顶部系统按钮", "elyric-v6-system-chrome-settings"
        );
        createPlayerThemeV6RangeSetting(renderer, v6ChromeSection, "systemChrome.size", "按钮尺寸", 44, 80, 1);
        createPlayerThemeV6RangeSetting(renderer, v6ChromeSection, "systemChrome.radius", "按钮圆角", 0, 50, 1);
        createPlayerThemeV6RangeSetting(renderer, v6ChromeSection, "systemChrome.blur", "按钮背景模糊", 0, 48, 1);
        createPlayerThemeV6SegmentedSetting(renderer, v6ChromeSection, "systemChrome.surface", "按钮材质", [
            { id: "none", label: "透明" }, { id: "glass", label: "玻璃" }, { id: "black", label: "黑" },
            { id: "white", label: "白" }, { id: "gradient", label: "渐变" }
        ]);
        createPlayerThemeV6ColorSetting(renderer, v6ChromeSection, "systemChrome.color", "按钮图标");
        createPlayerThemeV6ColorSetting(renderer, v6ChromeSection, "systemChrome.surfaceColor", "按钮背景");

        var v6OverlaySection = createSettingsSection(
            settingsPanel, "10. 弹层、动效与背景", "elyric-v6-overlay-settings"
        );
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.opacity", "弹层不透明度", 0, 100, 1);
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.blur", "弹层自身模糊", 0, 64, 1);
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.durationMs", "弹出动画时长", 0, 600, 10);
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.gap", "按钮与弹层距离", 4, 32, 1);
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.margin", "视口安全边距", 8, 48, 1);
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.backdrop.dim", "后方压暗", 0, 100, 1);
        createPlayerThemeV6RangeSetting(renderer, v6OverlaySection, "overlays.backdrop.blur", "后方高斯模糊", 0, 48, 1);
        createPlayerThemeV6ColorSetting(renderer, v6OverlaySection, "overlays.surfaceColor", "弹层背景");
        createPlayerThemeV6ColorSetting(renderer, v6OverlaySection, "overlays.textColor", "弹层文字");
        createPlayerThemeV6ColorSetting(renderer, v6OverlaySection, "overlays.accentColor", "弹层强调色");
        var overlayHelp = document.createElement("small");
        overlayHelp.className = "elyric-player-settings-help";
        overlayHelp.appendChild(document.createTextNode("后方压暗与高斯模糊默认均为 0；弹层仍会从实际按钮附近展开并自动翻转。"));
        v6OverlaySection.appendChild(overlayHelp);

        var v6VolumeSection = createSettingsSection(
            settingsPanel, "11. 竖屏音量弹层", "elyric-v6-volume-settings"
        );
        createPlayerThemeV6RangeSetting(renderer, v6VolumeSection, "volume.popoverWidth", "弹层宽度", 64, 120, 1);
        createPlayerThemeV6RangeSetting(renderer, v6VolumeSection, "volume.popoverHeight", "弹层高度", 160, 360, 4);

        var mediaDesignSection = createSettingsSection(
            settingsPanel,
            "12. 歌曲信息弹卡",
            "elyric-media-design-settings"
        );
        var mediaSurfaceChoices = createSegmentedControl(
            renderer,
            PLAYER_SURFACE_STYLES,
            "elyric-media-surface-segments",
            "elyric-media-surface-choice",
            "歌曲信息弹卡背景样式",
            function (surfaceId) { setPlayerThemeChoice(renderer, "mediaSurface", surfaceId, true); }
        );
        mediaDesignSection.appendChild(mediaSurfaceChoices.element);
        themeChoiceControls.mediaSurface = mediaSurfaceChoices.buttons;
        var mediaFieldButtons = createMediaFieldControl(renderer, mediaDesignSection);
        createPlayerTuningControls(
            renderer,
            mediaDesignSection,
            ["mediaWidth", "mediaMaxHeight", "mediaRadius", "mediaBlur", "mediaOpacity"],
            tuningInputs,
            tuningValues
        );
        themeColorSettings.mediaSurface = createPlayerThemeColorSetting(
            renderer,
            mediaDesignSection,
            "mediaSurface"
        );
        var mediaDesignHelp = document.createElement("small");
        mediaDesignHelp.className = "elyric-player-settings-help";
        mediaDesignHelp.appendChild(document.createTextNode("PC 与横屏弹卡会从信息按钮附近展开并自动避开屏幕边缘；手机竖屏使用底部安全抽屉。"));
        mediaDesignSection.appendChild(mediaDesignHelp);

        var toggleHelp = document.createElement("div");
        toggleHelp.className = "elyric-player-settings-note";
        toggleHelp.appendChild(document.createTextNode("底栏字幕图标控制第二行，旋转图标控制专辑封面；悬停或长按可查看按钮含义。系统减少动态效果设置始终优先。"));
        settingsBody.appendChild(toggleHelp);
        var coreHelp = document.createElement("div");
        coreHelp.className = "elyric-player-settings-note elyric-player-settings-note-muted";
        coreHelp.appendChild(document.createTextNode("播放、队列、进度和音量仍由 Emby 原生会话管理；自有控件会即时反馈当前状态。"));
        settingsBody.appendChild(coreHelp);
        settingsPanel.addEventListener("click", stopControlEvent);
        settingsPanel.addEventListener("pointerdown", stopControlEvent);

        var mediaPanel = document.createElement("div");
        mediaPanel.className = "elyric-player-media-panel";
        mediaPanel.setAttribute("role", "dialog");
        mediaPanel.setAttribute("aria-label", "媒体信息");
        mediaPanel.setAttribute("aria-modal", "true");
        mediaPanel.setAttribute("hidden", "hidden");
        var mediaHeader = document.createElement("div");
        mediaHeader.className = "elyric-player-settings-header";
        var mediaTitle = document.createElement("strong");
        mediaTitle.appendChild(document.createTextNode("媒体信息"));
        mediaHeader.appendChild(mediaTitle);
        var mediaClose = document.createElement("button");
        mediaClose.className = "elyric-player-settings-close";
        mediaClose.setAttribute("type", "button");
        mediaClose.setAttribute("aria-label", "关闭媒体信息");
        setButtonIcon(mediaClose, "close");
        mediaClose.addEventListener("click", function (event) {
            stopControlEvent(event);
            requestPlayerOverlayClose(renderer, "media");
        });
        mediaHeader.appendChild(mediaClose);
        mediaPanel.appendChild(mediaHeader);
        var mediaBody = document.createElement("div");
        mediaBody.className = "elyric-player-media-body";
        mediaPanel.appendChild(mediaBody);
        mediaPanel.addEventListener("click", stopControlEvent);
        mediaPanel.addEventListener("pointerdown", stopControlEvent);

        var volumePanel = document.createElement("div");
        volumePanel.className = "elyric-player-volume-panel";
        volumePanel.setAttribute("role", "dialog");
        volumePanel.setAttribute("aria-label", "音量");
        volumePanel.setAttribute("hidden", "hidden");
        var portraitVolumeSlider = document.createElement("input");
        portraitVolumeSlider.className = "elyric-player-volume-slider elyric-player-volume-slider-portrait";
        portraitVolumeSlider.setAttribute("type", "range");
        portraitVolumeSlider.setAttribute("min", "0");
        portraitVolumeSlider.setAttribute("max", "100");
        portraitVolumeSlider.setAttribute("step", "1");
        portraitVolumeSlider.setAttribute("value", "100");
        portraitVolumeSlider.setAttribute("aria-label", "音量");
        portraitVolumeSlider.min = "0";
        portraitVolumeSlider.max = "100";
        portraitVolumeSlider.value = "100";
        portraitVolumeSlider.addEventListener("input", function (event) {
            stopControlEvent(event);
            volumeSlider.value = portraitVolumeSlider.value;
            renderer.__elyricVolumeScrubbing = true;
            volumeFromPlayerControl(renderer, "input");
        });
        portraitVolumeSlider.addEventListener("change", function (event) {
            stopControlEvent(event);
            volumeSlider.value = portraitVolumeSlider.value;
            volumeFromPlayerControl(renderer, "change");
        });
        volumePanel.appendChild(portraitVolumeSlider);
        control.appendChild(volumePanel);

        control.addEventListener("click", stopControlEvent);
        control.addEventListener("pointerdown", stopControlEvent);
        renderer.__elyricThemeSelect = null;
        renderer.__elyricLayoutSelect = null;
        renderer.__elyricThemeButtons = themeChoices.buttons;
        renderer.__elyricLayoutButtons = layoutChoices.buttons;
        renderer.__elyricBackgroundButtons = backgroundChoices.buttons;
        renderer.__elyricVisualizerStyleButtons = visualizerStyleChoices.buttons;
        renderer.__elyricVisualizerFrequencyLayoutButtons = visualizerFrequencyLayoutChoices.buttons;
        renderer.__elyricVisualizerRangeButtons = visualizerRangeChoices.buttons;
        renderer.__elyricVisualizerColorModeButtons = visualizerColorModeChoices.buttons;
        renderer.__elyricAlignmentButtons = alignmentChoices.buttons;
        renderer.__elyricPlayerBackground = background;
        renderer.__elyricPlayerStage = stage;
        renderer.__elyricPlayerIdentity = identity;
        renderer.__elyricPlayerArtworkStage = artworkStage;
        renderer.__elyricPlayerArtwork = artwork;
        renderer.__elyricPlayerMetadata = metadata;
        renderer.__elyricPlayerTransport = transport;
        renderer.__elyricPlayerProgress = progress;
        renderer.__elyricPlayerVolume = volume;
        renderer.__elyricPlayerTools = tools;
        renderer.__elyricPlayerControlDock = controlDock;
        renderer.__elyricControlDockGroups = {
            progress: progress, transport: transport, volume: volume, auxiliary: tools
        };
        renderer.__elyricControlDockItems = {
            progress: {},
            transport: {
                previous: renderer.__elyricPlayerButtons.previous,
                playPause: renderer.__elyricPlayerButtons.playPause,
                next: renderer.__elyricPlayerButtons.next
            },
            volume: {
                mute: renderer.__elyricPlayerButtons.mute,
                slider: volumeSlider,
                value: volumeValue
            },
            auxiliary: {
                shuffle: renderer.__elyricPlayerButtons.shuffle,
                repeat: renderer.__elyricPlayerButtons.repeat,
                stop: renderer.__elyricPlayerButtons.stop,
                queue: renderer.__elyricPlayerButtons.queue,
                media: mediaButton,
                settings: settingsButton,
                visualizerToggle: visualizerButton,
                secondaryLyrics: secondLineButton,
                tertiaryLyrics: thirdLineButton,
                artworkRotation: artworkRotationButton
            }
        };
        renderer.__elyricPlayerSafetyToolbar = null;
        renderer.__elyricPlayerCoverflow = coverflow;
        renderer.__elyricCoverflowArtworks = coverflowArtworks;
        renderer.__elyricCoverflowCaptions = coverflowCaptions;
        renderer.__elyricPlayerTitle = title;
        renderer.__elyricPlayerArtist = artist;
        renderer.__elyricPlayerAlbum = album;
        renderer.__elyricPlayerFormat = format;
        renderer.__elyricLyricsEmpty = lyricsEmpty;
        renderer.__elyricLyricViewport = lyricViewport;
        renderer.__elyricProgressSlider = progressSlider;
        renderer.__elyricPlayerPosition = positionText;
        renderer.__elyricPlayerDuration = durationText;
        renderer.__elyricVolumeSlider = volumeSlider;
        renderer.__elyricVolumeValue = volumeValue;
        renderer.__elyricSecondLineButton = secondLineButton;
        renderer.__elyricThirdLineButton = thirdLineButton;
        renderer.__elyricVisualizerToggleButton = visualizerButton;
        renderer.__elyricVisualizerEnabled = true;
        renderer.__elyricSecondLineSettingsButtons = secondLineChoices.buttons;
        renderer.__elyricArtworkRotationButton = artworkRotationButton;
        renderer.__elyricArtworkRotationSettingsButtons = rotationChoices.buttons;
        renderer.__elyricSettingsButton = settingsButton;
        renderer.__elyricOverlayScrim = overlayScrim;
        renderer.__elyricSettingsPanel = settingsPanel;
        renderer.__elyricSettingsBody = settingsBody;
        renderer.__elyricPreferenceStatus = preferenceStatus;
        renderer.__elyricSettingsOpen = false;
        renderer.__elyricMediaButton = mediaButton;
        renderer.__elyricMediaPanel = mediaPanel;
        renderer.__elyricMediaBody = mediaBody;
        renderer.__elyricMediaOpen = false;
        renderer.__elyricOverlayManager = createPlayerOverlayManager(renderer);
        if (renderer.__elyricPlaybackBridge && renderer.__elyricPlaybackBridge.subscribeCastTargets) {
            renderer.__elyricCastTargetsUnsubscribe = renderer.__elyricPlaybackBridge.subscribeCastTargets(function () {
                if (renderer.__elyricCastOpen) { renderOwnedCastTargets(renderer); }
            });
        }
        renderer.__elyricVisualizer = visualizer;
        renderer.__elyricQueuePanel = queuePanel;
        renderer.__elyricQueueBody = queueBody;
        renderer.__elyricCastPanel = castPanel;
        renderer.__elyricCastBody = castBody;
        renderer.__elyricCastOpen = false;
        renderer.__elyricVolumePanel = volumePanel;
        renderer.__elyricPortraitVolumeSlider = portraitVolumeSlider;
        renderer.__elyricVolumeOpen = false;
        renderer.__elyricVisualizerCanvas = visualizerCanvas;
        renderer.__elyricVisualizerContext = visualizerCanvas.getContext
            ? visualizerCanvas.getContext("2d")
            : null;
        renderer.__elyricVisualizerWidthInput = widthSetting.input;
        renderer.__elyricVisualizerWidthValue = widthSetting.value;
        renderer.__elyricVisualizerHeightInput = heightSetting.input;
        renderer.__elyricVisualizerHeightValue = heightSetting.value;
        renderer.__elyricVisualizerAmplitudeInput = amplitudeSetting.input;
        renderer.__elyricVisualizerAmplitudeValue = amplitudeSetting.value;
        renderer.__elyricVisualizerAnalysisInputs = {};
        renderer.__elyricVisualizerAnalysisValues = {};
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            renderer.__elyricVisualizerAnalysisInputs[definition.id]
                = visualizerAnalysisSettings[definition.id].input;
            renderer.__elyricVisualizerAnalysisValues[definition.id]
                = visualizerAnalysisSettings[definition.id].value;
        });
        renderer.__elyricVisualizerSourceStatus = visualizerSourceStatus;
        renderer.__elyricVisualizerColorInputs = colorSettings.map(function (setting) { return setting.input; });
        renderer.__elyricVisualizerColorSwatches = colorSettings.map(function (setting) { return setting.swatch; });
        renderer.__elyricLyricScaleInput = lyricScaleSetting.input;
        renderer.__elyricLyricScaleValue = lyricScaleSetting.value;
        renderer.__elyricPlayerTuningInputs = tuningInputs;
        renderer.__elyricPlayerTuningValues = tuningValues;
        renderer.__elyricPlayerThemeChoiceButtons = themeChoiceControls;
        renderer.__elyricArtworkOuterShapeButtons = artworkOuterShapeChoices.buttons;
        renderer.__elyricArtworkInnerShapeButtons = artworkInnerShapeChoices.buttons;
        renderer.__elyricPlayerThemeColorInputs = {};
        renderer.__elyricPlayerThemeColorSwatches = {};
        Object.keys(themeColorSettings).forEach(function (colorId) {
            renderer.__elyricPlayerThemeColorInputs[colorId] = themeColorSettings[colorId].input;
            renderer.__elyricPlayerThemeColorSwatches[colorId] = themeColorSettings[colorId].swatch;
        });
        renderer.__elyricMediaFieldButtons = mediaFieldButtons;
        renderer.__elyricMetadataSummaryButtons = metadataSummaryButtons;
        renderer.__elyricPlayerThemeLibrarySelect = themeLibrarySelect;
        renderer.__elyricPlayerThemeNameInput = themeNameInput;
        renderer.__elyricPlayerThemeLibraryStatus = themeLibraryStatus;
        renderer.__elyricPlayerThemeSaveButton = saveThemeButton;
        renderer.__elyricPlayerThemeRenameButton = renameThemeButton;
        renderer.__elyricPlayerThemeDeleteButton = deleteThemeButton;
        renderer.__elyricLyricFollowButton = followButton;
        var parametricViewportHandler = function (event) {
            renderer.__elyricViewportTransitionUntil = Date.now() + 1200;
            if (event && "orientationchange" === event.type) {
                playerThemeV2ActiveProfile = "";
                if (renderer.__elyricOverlayManager) {
                    renderer.__elyricOverlayManager.close("media");
                    renderer.__elyricOverlayManager.close("queue");
                }
            }
            var v2Profile = currentPlayerThemeV2Profile();
            if (renderer.__elyricThemeV2) {
                var profileChanged = v2Profile !== renderer.__elyricThemeV2Profile;
                renderer.__elyricThemeV2Profile = v2Profile;
                applyPlayerThemeV2State(renderer, renderer.__elyricThemeV2);
                if (profileChanged || renderer.__elyricThemeV2DesignerOpen) {
                    buildPlayerThemeV2DesignerBoxes(renderer);
                }
                scrollCurrentLyricIntoView(renderer, false);
            }
            if (renderer.__elyricMediaOpen) {
                positionMediaPanelNearTrigger(renderer);
            }
            repositionPlayerOverlays(renderer);
            setTimeout(function () {
                if (!renderer.__elyricDestroyed) {
                    updateWordStates(renderer, renderer.__elyricLastPositionTicks || 0);
                    scrollCurrentLyricIntoView(renderer, false);
                    repositionPlayerOverlays(renderer);
                }
            }, 0);
        };
        if ("undefined" !== typeof window && window.addEventListener) {
            window.addEventListener("resize", parametricViewportHandler);
            window.addEventListener("orientationchange", parametricViewportHandler);
            if (window.visualViewport && window.visualViewport.addEventListener) {
                window.visualViewport.addEventListener("resize", parametricViewportHandler);
                window.visualViewport.addEventListener("scroll", parametricViewportHandler);
            }
            renderer.__elyricParametricViewportHandler = parametricViewportHandler;
            renderer.__elyricThemeV2OnlineHandler = function () {
                renderer.__elyricUserPreferencesPromise = null;
                requestUserPlayerPreferences(renderer, true);
            };
            window.addEventListener("online", renderer.__elyricThemeV2OnlineHandler);
            renderer.__elyricThemeV2VisibilityHandler = function () {
                if ("visible" === document.visibilityState && renderer.__elyricWorkspaceReady) {
                    renderer.__elyricUserPreferencesPromise = null;
                    requestUserPlayerPreferences(renderer, true);
                }
            };
            document.addEventListener("visibilitychange", renderer.__elyricThemeV2VisibilityHandler);
        }
        var overlayKeyHandler = function (event) {
            if (event && renderer.__elyricThemeV2DesignerOpen
                && (event.ctrlKey || event.metaKey) && !event.altKey
                && ("z" === String(event.key).toLowerCase() || "y" === String(event.key).toLowerCase())) {
                event.preventDefault();
                restorePlayerThemeV2History(
                    renderer,
                    "y" === String(event.key).toLowerCase() || event.shiftKey ? "redo" : "undo"
                );
                return;
            }
            if (event && renderer.__elyricThemeV2DesignerOpen
                && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(event.key) >= 0
                && !(event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) {
                event.preventDefault();
                var step = event.shiftKey ? 2 : .2;
                var layer = activePlayerThemeV2Layer(renderer);
                var patch = {};
                if ("ArrowLeft" === event.key) { patch.x = layer.x - step; }
                if ("ArrowRight" === event.key) { patch.x = layer.x + step; }
                if ("ArrowUp" === event.key) { patch.y = layer.y - step; }
                if ("ArrowDown" === event.key) { patch.y = layer.y + step; }
                updatePlayerThemeV2Layer(renderer, patch, true);
                return;
            }
            if (event && "Escape" === event.key
                && (renderer.__elyricSettingsOpen || renderer.__elyricMediaOpen
                    || renderer.__elyricQueueOpen || renderer.__elyricCastOpen
                    || renderer.__elyricVolumeOpen || renderer.__elyricThemeV2DesignerOpen)) {
                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                requestPlayerOverlayClose(renderer, "settings");
                requestPlayerOverlayClose(renderer, "media");
                requestPlayerOverlayClose(renderer, "queue");
                requestPlayerOverlayClose(renderer, "cast");
                requestPlayerOverlayClose(renderer, "volume");
                if (renderer.__elyricThemeV2DesignerOpen) {
                    requestPlayerOverlayClose(renderer, "designer");
                }
                return;
            }
            if (event && "Tab" === event.key) {
                trapPlayerOverlayFocus(
                    renderer.__elyricSettingsOpen
                        ? renderer.__elyricSettingsPanel
                        : renderer.__elyricMediaOpen
                            ? renderer.__elyricMediaPanel
                            : renderer.__elyricQueueOpen
                                ? renderer.__elyricQueuePanel
                                : renderer.__elyricCastOpen
                                    ? renderer.__elyricCastPanel
                                    : renderer.__elyricVolumeOpen
                                        ? renderer.__elyricVolumePanel : null,
                    event
                );
            }
        };
        if (document.addEventListener) {
            document.addEventListener("keydown", overlayKeyHandler, true);
            renderer.__elyricOverlayKeyHandler = overlayKeyHandler;
        }
        installQueueDismissHandler(renderer);
        installLyricFollowTracking(renderer);
        var settingsHost = getThemeControlHost(renderer);
        if (settingsHost && settingsHost.appendChild) {
            settingsHost.appendChild(overlayScrim);
            settingsHost.appendChild(settingsPanel);
            settingsHost.appendChild(mediaPanel);
        }
        renderer.__elyricLocalShowSecond = renderer.__elyricDisplayConfiguration
            ? renderer.__elyricDisplayConfiguration.showSecondLine
            : DEFAULT_DISPLAY_CONFIGURATION.showSecondLine;
        setSecondLineOverride(renderer, renderer.__elyricLocalShowSecond);
        renderer.__elyricLocalShowThird = renderer.__elyricDisplayConfiguration
            ? renderer.__elyricDisplayConfiguration.showThirdAndLaterLines
            : DEFAULT_DISPLAY_CONFIGURATION.showThirdAndLaterLines;
        setThirdLineOverride(renderer, renderer.__elyricLocalShowThird, false);
        syncSegmentedButtons(
            renderer.__elyricThemeButtons,
            renderer.__elyricTheme,
            !!(renderer.__elyricDisplayConfiguration
                && !renderer.__elyricDisplayConfiguration.allowUserThemeOverride)
        );
        syncPlayerThemeLibraryControls(renderer);
        PLAYER_MEDIA_FIELDS.forEach(function (field) {
            setPlayerMediaField(renderer, field.id, renderer.__elyricMediaFields[field.id], false);
        });
        applyPlayerLayout(renderer, "album", false);
        updatePlayerMetadata(renderer);
        return control;
    }

    function getThemeControlHost(renderer) {
        if (renderer && renderer.__elyricRoot && renderer.__elyricRoot.appendChild) {
            return renderer.__elyricRoot;
        }
        var container = renderer && renderer.itemsContainer;
        if (container && container.appendChild) {
            return container;
        }
        return document.body;
    }

    function removeStaleThemeControls(host, currentControl, currentSettingsPanel, currentMediaPanel) {
        if (!host || !host.querySelectorAll) {
            return;
        }
        var controls = host.querySelectorAll(".elyric-theme-picker");
        for (var i = 0; i < controls.length; i++) {
            if (controls[i] !== currentControl && controls[i].parentNode) {
                controls[i].parentNode.removeChild(controls[i]);
            }
        }
        var panels = host.querySelectorAll(".elyric-player-settings-panel");
        for (var panelIndex = 0; panelIndex < panels.length; panelIndex++) {
            if (panels[panelIndex] !== currentSettingsPanel && panels[panelIndex].parentNode) {
                panels[panelIndex].parentNode.removeChild(panels[panelIndex]);
            }
        }
        var mediaPanels = host.querySelectorAll(".elyric-player-media-panel");
        for (var mediaIndex = 0; mediaIndex < mediaPanels.length; mediaIndex++) {
            if (mediaPanels[mediaIndex] !== currentMediaPanel && mediaPanels[mediaIndex].parentNode) {
                mediaPanels[mediaIndex].parentNode.removeChild(mediaPanels[mediaIndex]);
            }
        }
    }

    function elementOrAncestorHasClass(element, className) {
        while (element) {
            if (element.classList && element.classList.contains(className)) {
                return true;
            }
            element = element.parentNode;
        }
        return false;
    }

    function isPlaybackDialogOverlay(element) {
        return elementOrAncestorHasClass(element, "dialogContainer")
            || elementOrAncestorHasClass(element, "dialogBackdrop");
    }

    function isThemeContextVisible(renderer) {
        var currentPlayerPage = findPlayerPage(renderer);
        if (currentPlayerPage) {
            renderer.__elyricPlayerPage = currentPlayerPage;
        } else if (renderer.__elyricPlayerPage
            && "boolean" === typeof renderer.__elyricPlayerPage.isConnected
            && !renderer.__elyricPlayerPage.isConnected) {
            renderer.__elyricPlayerPage = null;
        }
        var container = renderer.__elyricPlayerPage || renderer.itemsContainer;
        if (!container) {
            return false;
        }
        if (container.classList && container.classList.contains("hide")) {
            return false;
        }
        if (container.getAttribute && "true" === container.getAttribute("aria-hidden")) {
            return false;
        }
        if ("boolean" === typeof container.isConnected && !container.isConnected) {
            return false;
        }
        if (container.getClientRects && !container.getClientRects().length) {
            return false;
        }
        if (container.getBoundingClientRect
            && container.contains
            && document.elementFromPoint) {
            var rect = container.getBoundingClientRect();
            var left = Math.max(0, rect.left);
            var right = Math.min(
                "undefined" !== typeof window && window.innerWidth ? window.innerWidth : rect.right,
                rect.right
            );
            var top = Math.max(0, rect.top);
            var bottom = Math.min(
                "undefined" !== typeof window && window.innerHeight ? window.innerHeight : rect.bottom,
                rect.bottom
            );
            if (!(right > left && bottom > top)) {
                return false;
            }
            var front = document.elementFromPoint(
                left + (right - left) / 2,
                top + (bottom - top) / 2
            );
            if (front
                && front !== container
                && !container.contains(front)
                && !(front.contains && front.contains(container))
                && !(renderer.__elyricThemeControl
                    && renderer.__elyricThemeControl.contains
                    && renderer.__elyricThemeControl.contains(front))
                && !(renderer.__elyricSettingsPanel
                    && renderer.__elyricSettingsPanel.contains
                    && renderer.__elyricSettingsPanel.contains(front))
                && !(renderer.__elyricMediaPanel
                    && renderer.__elyricMediaPanel.contains
                    && renderer.__elyricMediaPanel.contains(front))
                && !(renderer.__elyricOverlayScrim
                    && renderer.__elyricOverlayScrim.contains
                    && renderer.__elyricOverlayScrim.contains(front))
                && !(elementOrAncestorHasClass(front, "elyric-v2-layer-box"))
                && !(elementOrAncestorHasClass(front, "elyric-v2-designer-exit"))
                && !isPlaybackDialogOverlay(front)) {
                return false;
            }
        }
        return true;
    }

    function syncThemeControlVisibility(renderer) {
        var control = renderer.__elyricThemeControl;
        if (!control) {
            return;
        }
        removeAttributeIfPresent(control, "hidden");
        setAttributeIfChanged(control, "aria-hidden", "false");
        syncSettingsPanelVisibility(renderer, true);
        syncMediaPanelVisibility(renderer, true);
        syncPlayerPageState(renderer, true);
        syncPlayerOverlayScrim(renderer, true);
        syncVisualizerAnimation(renderer);
    }

    function ensureThemeControl(renderer) {
        var container = renderer.itemsContainer;
        if (!container || !container.appendChild || "undefined" === typeof document) {
            return;
        }
        ensureThemeState(renderer);
        applyTheme(renderer, renderer.__elyricTheme, false);

        var visible = !!renderer.__elyricPlayerPage;
        if (!renderer.__elyricThemeControl) {
            if (!visible) {
                return;
            }
            renderer.__elyricThemeControl = createThemeControl(renderer);
            renderer.__elyricWorkspaceReady = false;
            renderer.__elyricWorkspaceSource = "loading";
            // Do not hydrate the live player from old unscoped localStorage.
            // Legacy values are read exactly once by readLegacyUserPlayerPreferences
            // only when the authenticated Workspace is genuinely empty.
            applyPlayerLayout(renderer, "album", false);
            applyPlayerThemeDefinition(renderer, resolvedBuiltInPlayerTheme("album"));
            applyPlayerShellConfiguration(renderer, renderer.__elyricDisplayConfiguration);
            syncVisualizerAnimation(renderer);
            requestUserPlayerPreferences(renderer);
        }
        syncLyricAvailability(renderer);
        if (!visible) {
            syncThemeControlVisibility(renderer);
            return;
        }
        var host = renderer.__elyricMountHost || document.body || getThemeControlHost(renderer);
        removeStaleThemeControls(
            host,
            renderer.__elyricThemeControl,
            renderer.__elyricSettingsPanel,
            renderer.__elyricMediaPanel
        );
        if (renderer.__elyricThemeControl.parentNode !== host) {
            host.appendChild(renderer.__elyricThemeControl);
        }
        updatePlayerControl(
            renderer,
            renderer.__elyricLastPositionTicks || 0,
            renderer.__elyricLastRuntimeTicks || 0
        );
        syncThemeControlVisibility(renderer);
    }

    function removeThemeControl(renderer) {
        if (renderer.__elyricVisualizerFrameId) {
            cancelAnimationFrame(renderer.__elyricVisualizerFrameId);
            renderer.__elyricVisualizerFrameId = 0;
        }
        if (renderer.__elyricPreferenceSaveTimer) {
            clearTimeout(renderer.__elyricPreferenceSaveTimer);
            renderer.__elyricPreferenceSaveTimer = 0;
        }
        if (renderer.__elyricParametricViewportHandler
            && "undefined" !== typeof window && window.removeEventListener) {
            window.removeEventListener("resize", renderer.__elyricParametricViewportHandler);
            window.removeEventListener("orientationchange", renderer.__elyricParametricViewportHandler);
            if (window.visualViewport && window.visualViewport.removeEventListener) {
                window.visualViewport.removeEventListener("resize", renderer.__elyricParametricViewportHandler);
                window.visualViewport.removeEventListener("scroll", renderer.__elyricParametricViewportHandler);
            }
            renderer.__elyricParametricViewportHandler = null;
        }
        if (renderer.__elyricThemeV2OnlineHandler
            && "undefined" !== typeof window && window.removeEventListener) {
            window.removeEventListener("online", renderer.__elyricThemeV2OnlineHandler);
            renderer.__elyricThemeV2OnlineHandler = null;
        }
        if (renderer.__elyricThemeV2VisibilityHandler && document.removeEventListener) {
            document.removeEventListener("visibilitychange", renderer.__elyricThemeV2VisibilityHandler);
            renderer.__elyricThemeV2VisibilityHandler = null;
        }
        removePlayerThemeV2DesignerBoxes(renderer);
        if (renderer.__elyricThemeV2FontStyle && renderer.__elyricThemeV2FontStyle.parentNode) {
            renderer.__elyricThemeV2FontStyle.parentNode.removeChild(renderer.__elyricThemeV2FontStyle);
        }
        if (renderer.__elyricThemeV2SafeInsetProbe && renderer.__elyricThemeV2SafeInsetProbe.parentNode) {
            renderer.__elyricThemeV2SafeInsetProbe.parentNode.removeChild(renderer.__elyricThemeV2SafeInsetProbe);
        }
        if (renderer.__elyricLyricFollowTimer) {
            clearTimeout(renderer.__elyricLyricFollowTimer);
            renderer.__elyricLyricFollowTimer = 0;
        }
        if (renderer.__elyricLyricFollowHost
            && renderer.__elyricLyricFollowHost.removeEventListener
            && renderer.__elyricLyricManualScrollHandler) {
            ["wheel", "touchstart", "pointerdown"].forEach(function (type) {
                renderer.__elyricLyricFollowHost.removeEventListener(
                    type,
                    renderer.__elyricLyricManualScrollHandler
                );
            });
        }
        if (renderer.__elyricLyricFollowParent
            && renderer.__elyricLyricFollowParent.removeEventListener
            && renderer.__elyricLyricManualScrollHandler) {
            renderer.__elyricLyricFollowParent.removeEventListener(
                "wheel",
                renderer.__elyricLyricManualScrollHandler
            );
        }
        releaseVisualizerAudio(renderer);
        var control = renderer.__elyricThemeControl;
        if (control && control.parentNode) {
            control.parentNode.removeChild(control);
        }
        if (renderer.__elyricSettingsPanel && renderer.__elyricSettingsPanel.parentNode) {
            renderer.__elyricSettingsPanel.parentNode.removeChild(renderer.__elyricSettingsPanel);
        }
        if (renderer.__elyricMediaPanel && renderer.__elyricMediaPanel.parentNode) {
            renderer.__elyricMediaPanel.parentNode.removeChild(renderer.__elyricMediaPanel);
        }
        if (renderer.__elyricOverlayScrim && renderer.__elyricOverlayScrim.parentNode) {
            renderer.__elyricOverlayScrim.parentNode.removeChild(renderer.__elyricOverlayScrim);
        }
        if (renderer.__elyricOverlayKeyHandler && document.removeEventListener) {
            document.removeEventListener("keydown", renderer.__elyricOverlayKeyHandler, true);
        }
        if (renderer.__elyricQueueDismissHost
            && renderer.__elyricQueueDismissHost.removeEventListener
            && renderer.__elyricQueueDismissHandler) {
            renderer.__elyricQueueDismissHost.removeEventListener(
                "pointerdown",
                renderer.__elyricQueueDismissHandler,
                true
            );
        }
        if (renderer.__elyricThemeContainer && renderer.__elyricThemeContainer.removeAttribute) {
            renderer.__elyricThemeContainer.removeAttribute("data-elyric-theme");
        }
        syncPlayerPageState(renderer, false);
        if (document.body && document.body.style && document.body.style.removeProperty) {
            PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
                document.body.style.removeProperty(definition.cssProperty);
            });
            PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
                document.body.style.removeProperty(definition.cssProperty);
            });
        }
        if (renderer.itemsContainer
            && renderer.itemsContainer.style
            && renderer.itemsContainer.style.removeProperty) {
            PLAYER_THEME_TUNING_DEFINITIONS.forEach(function (definition) {
                renderer.itemsContainer.style.removeProperty(definition.cssProperty);
            });
            PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
                renderer.itemsContainer.style.removeProperty(definition.cssProperty);
            });
        }
        if (renderer.itemsContainer && renderer.itemsContainer.removeAttribute) {
            renderer.itemsContainer.removeAttribute("data-elyric-has-lyrics");
            renderer.itemsContainer.removeAttribute("data-elyric-parametric");
        }
        renderer.__elyricThemeControl = null;
        renderer.__elyricRoot = null;
        renderer.__elyricPlayerStage = null;
        renderer.__elyricLyricViewport = null;
        renderer.__elyricThemeSelect = null;
        renderer.__elyricLayoutSelect = null;
        renderer.__elyricThemeButtons = null;
        renderer.__elyricLayoutButtons = null;
        renderer.__elyricBackgroundButtons = null;
        renderer.__elyricVisualizerStyleButtons = null;
        renderer.__elyricVisualizerRangeButtons = null;
        renderer.__elyricVisualizerColorModeButtons = null;
        renderer.__elyricAlignmentButtons = null;
        renderer.__elyricThemeContainer = null;
        renderer.__elyricTheme = null;
        renderer.__elyricPlayerLayout = null;
        renderer.__elyricPlayerPage = null;
        renderer.__elyricPlayerBackground = null;
        renderer.__elyricPlayerIdentity = null;
        renderer.__elyricPlayerArtworkStage = null;
        renderer.__elyricPlayerArtwork = null;
        renderer.__elyricPlayerEmbyArtworkUrl = null;
        renderer.__elyricPlayerMetadata = null;
        renderer.__elyricPlayerTransport = null;
        renderer.__elyricPlayerProgress = null;
        renderer.__elyricPlayerVolume = null;
        renderer.__elyricPlayerTools = null;
        renderer.__elyricPlayerControlDock = null;
        renderer.__elyricControlDockGroups = null;
        renderer.__elyricControlDockItems = null;
        renderer.__elyricControlDockDesigner = null;
        renderer.__elyricPlayerSafetyToolbar = null;
        renderer.__elyricPlayerCoverflow = null;
        renderer.__elyricCoverflowArtworks = null;
        renderer.__elyricCoverflowCaptions = null;
        renderer.__elyricCoverflowPreviewAt = 0;
        renderer.__elyricPlayerTitle = null;
        renderer.__elyricPlayerArtist = null;
        renderer.__elyricPlayerAlbum = null;
        renderer.__elyricPlayerFormat = null;
        renderer.__elyricLyricsEmpty = null;
        renderer.__elyricLyricsEmptyTitle = null;
        renderer.__elyricLyricsEmptyHint = null;
        renderer.__elyricLyricStatusState = null;
        renderer.__elyricPlayerItemSignature = null;
        renderer.__elyricProgressSlider = null;
        renderer.__elyricPlayerPosition = null;
        renderer.__elyricPlayerDuration = null;
        renderer.__elyricVolumeSlider = null;
        renderer.__elyricVolumeValue = null;
        renderer.__elyricLastAudibleVolume = null;
        renderer.__elyricSecondLineButton = null;
        renderer.__elyricSecondLineSettingsButtons = null;
        renderer.__elyricThirdLineButton = null;
        renderer.__elyricVisualizerToggleButton = null;
        renderer.__elyricArtworkRotationButton = null;
        renderer.__elyricArtworkRotationSettingsButtons = null;
        renderer.__elyricArtworkRotation = null;
        renderer.__elyricSettingsButton = null;
        renderer.__elyricSettingsPanel = null;
        renderer.__elyricSettingsBody = null;
        renderer.__elyricOverlayManager = null;
        renderer.__elyricCastTargetsUnsubscribe = null;
        renderer.__elyricOverlayScrim = null;
        renderer.__elyricOverlayKeyHandler = null;
        renderer.__elyricPreferenceStatus = null;
        renderer.__elyricWorkspaceReady = false;
        renderer.__elyricWorkspaceSource = null;
        renderer.__elyricWorkspaceLastErrorStatus = 0;
        renderer.__elyricWorkspaceLastErrorMessage = "";
        renderer.__elyricThemeLibraryApiError = null;
        renderer.__elyricUserPreferencesPromise = null;
        renderer.__elyricSettingsOpen = false;
        renderer.__elyricQueuePanel = null;
        renderer.__elyricQueueBody = null;
        renderer.__elyricCastPanel = null;
        renderer.__elyricCastBody = null;
        renderer.__elyricCastOpen = false;
        renderer.__elyricVolumePanel = null;
        renderer.__elyricPortraitVolumeSlider = null;
        renderer.__elyricVolumeOpen = false;
        renderer.__elyricMediaButton = null;
        renderer.__elyricMediaPanel = null;
        renderer.__elyricMediaBody = null;
        renderer.__elyricMediaOpen = false;
        renderer.__elyricMediaRequestId = (renderer.__elyricMediaRequestId || 0) + 1;
        renderer.__elyricDetailedMediaItem = null;
        renderer.__elyricVisualizer = null;
        renderer.__elyricVisualizerCanvas = null;
        renderer.__elyricVisualizerContext = null;
        renderer.__elyricVisualizerFrameId = 0;
        renderer.__elyricPlaybackActive = false;
        renderer.__elyricVisualizerStyle = null;
        renderer.__elyricVisualizerFrequencyLayout = null;
        renderer.__elyricVisualizerFrequencyLayoutButtons = null;
        renderer.__elyricVisualizerRange = null;
        renderer.__elyricVisualizerWidth = null;
        renderer.__elyricVisualizerHeight = null;
        renderer.__elyricVisualizerAmplitude = null;
        renderer.__elyricVisualizerWidthInput = null;
        renderer.__elyricVisualizerWidthValue = null;
        renderer.__elyricVisualizerHeightInput = null;
        renderer.__elyricVisualizerHeightValue = null;
        renderer.__elyricVisualizerAmplitudeInput = null;
        renderer.__elyricVisualizerAmplitudeValue = null;
        renderer.__elyricVisualizerAnalysisInputs = null;
        renderer.__elyricVisualizerAnalysisValues = null;
        renderer.__elyricVisualizerSourceStatus = null;
        renderer.__elyricVisualizerSourceState = null;
        renderer.__elyricVisualizerSourceText = null;
        VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
            renderer[definition.property] = null;
        });
        renderer.__elyricVisualizerColorMode = null;
        renderer.__elyricVisualizerColors = null;
        renderer.__elyricVisualizerColorInputs = null;
        renderer.__elyricVisualizerColorSwatches = null;
        renderer.__elyricVisualizerPeaks = null;
        renderer.__elyricBackgroundMode = null;
        renderer.__elyricLyricAlignment = null;
        renderer.__elyricLyricScale = null;
        renderer.__elyricLyricScaleInput = null;
        renderer.__elyricLyricScaleValue = null;
        renderer.__elyricPlayerTuning = null;
        renderer.__elyricPlayerTuningInputs = null;
        renderer.__elyricPlayerTuningValues = null;
        renderer.__elyricDisplayPreferences = null;
        renderer.__elyricPreferenceApiClient = null;
        renderer.__elyricActiveApiClient = null;
        renderer.__elyricPreferenceUserId = null;
        renderer.__elyricUserPreferencesPromise = null;
        renderer.__elyricPreferenceState = null;
        renderer.__elyricApplyingUserPreferences = false;
        renderer.__elyricPreferenceSaveTimer = 0;
        renderer.__elyricThemeV2 = null;
        renderer.__elyricThemeV2Profile = null;
        renderer.__elyricThemeV2SelectedLayer = null;
        renderer.__elyricThemeV2InheritanceStatus = null;
        renderer.__elyricThemeV2InheritanceReset = null;
        renderer.__elyricThemeV2Undo = null;
        renderer.__elyricThemeV2Redo = null;
        renderer.__elyricThemeV2DesignerOpen = false;
        renderer.__elyricThemeV2Boxes = null;
        renderer.__elyricThemeV2FontStyle = null;
        renderer.__elyricThemeV2FontRules = null;
        renderer.__elyricThemeV6RangeControls = null;
        renderer.__elyricThemeV6SegmentControls = null;
        renderer.__elyricThemeV6ColorControls = null;
        renderer.__elyricMetadataSummaryButtons = null;
        renderer.__elyricPlayerButtons = null;
        renderer.__elyricQueueOpen = false;
        renderer.__elyricQueueDismissHost = null;
        renderer.__elyricQueueDismissHandler = null;
        renderer.__elyricLyricFollowButton = null;
        renderer.__elyricLyricFollowHost = null;
        renderer.__elyricLyricFollowParent = null;
        renderer.__elyricLyricManualScrollHandler = null;
        renderer.__elyricManualScrollUntil = 0;
        renderer.__elyricLastFollowedLineIndex = null;
        renderer.__elyricNativeLyricsPendingUntil = 0;
        renderer.__elyricScrubbing = false;
        renderer.__elyricVolumeScrubbing = false;
        renderer.__elyricOptimisticPlaying = null;
        renderer.__elyricOptimisticPlayingUntil = 0;
        renderer.__elyricLastPositionTicks = null;
        renderer.__elyricLastRuntimeTicks = null;
    }

    function isLyricCreditLine(item, index) {
        if (!item || !item.__elyric || !item.__elyric.sublines || !item.__elyric.sublines.length) {
            return false;
        }
        var text = String(item.__elyric.sublines[0].text || "").trim();
        if (/^(?:词|曲|编曲|作词|作曲|填词|谱曲|制作人|原唱|翻唱|lyrics?(?:\s+by)?|music(?:\s+by)?|composer|arranger)\s*[：:]/i.test(text)) {
            return true;
        }
        return index < 2 && /\s[-–—]\s/.test(text);
    }

    function isLyricTitleCreditLine(renderer, item, index) {
        if (index > 1 || !isLyricCreditLine(item, index) || !renderer || !renderer.currentItem) {
            return false;
        }
        var title = String(renderer.currentItem.Name || renderer.currentItem.OriginalTitle || "").trim();
        var text = String(item.__elyric.sublines[0].text || "").trim();
        return !!title && text.indexOf(title) >= 0;
    }

    function renderLyricElement(renderer, element) {
        var index = Number(element.getAttribute("data-index"));
        var item = renderer.__elyricItems && renderer.__elyricItems[index];
        if (!item || !item.__elyric) {
            return;
        }

        var renderKey = renderer.__elyricGeneration + ":" + index;
        if (element.getAttribute("data-elyric-render") === renderKey) {
            return;
        }

        var body = element.querySelector(".listItemBodyText");
        if (!body) {
            return;
        }

        while (body.firstChild) {
            body.removeChild(body.firstChild);
        }

        element.classList.remove("elyric-line-multilingual", "elyric-line-credit", "elyric-line-title-credit");
        if (item.__elyric.sublines.length > 1) {
            element.classList.add("elyric-line-multilingual");
        }
        if (isLyricCreditLine(item, index)) {
            element.classList.add("elyric-line-credit");
        }
        if (isLyricTitleCreditLine(renderer, item, index)) {
            element.classList.add("elyric-line-title-credit");
        }

        item.__elyric.sublines.forEach(function (line, sublineIndex) {
            var lineElement = document.createElement("div");
            lineElement.className = "elyric-subline elyric-subline-" + (sublineIndex + 1);
            lineElement.setAttribute(
                "data-elyric-subline-role",
                0 === sublineIndex ? "primary" : 1 === sublineIndex ? "secondary" : "tertiary"
            );

            if (line.words) {
                line.words.forEach(function (word) {
                    var wordElement = document.createElement("span");
                    wordElement.className = "elyric-word elyric-word-pending";
                    wordElement.setAttribute("data-elyric-start", String(word.startTicks));
                    wordElement.setAttribute("data-elyric-end", String(word.endTicks));
                    wordElement.setAttribute("data-elyric-state", "pending");
                    appendTextWithBreaks(wordElement, word.text);
                    lineElement.appendChild(wordElement);
                });
            } else {
                appendTextWithBreaks(lineElement, line.text);
            }

            body.appendChild(lineElement);
        });

        element.setAttribute("data-elyric-render", renderKey);
    }

    function findOwnedLyricIndex(renderer, positionTicks, requireActiveRange) {
        var items = renderer && renderer.__elyricItems || [];
        if (!items.length) { return -1; }
        var position = Math.max(0, Number(positionTicks) || 0);
        var low = 0;
        var high = items.length - 1;
        var candidate = -1;
        while (low <= high) {
            var middle = (low + high) >> 1;
            var start = Number(items[middle] && items[middle].__elyric
                && items[middle].__elyric.startTicks) || 0;
            if (start <= position) {
                candidate = middle;
                low = middle + 1;
            } else {
                high = middle - 1;
            }
        }
        if (candidate < 0) { return requireActiveRange ? -1 : 0; }
        if (requireActiveRange) {
            var lyric = items[candidate] && items[candidate].__elyric;
            if (!lyric || position >= Number(lyric.endTicks)) { return -1; }
        }
        return candidate;
    }

    function undoPlayerThemeReset(renderer) {
        var snapshot = renderer.__elyricThemeResetUndo;
        if (!snapshot) {
            updatePlayerThemeLibraryStatus(renderer, "当前没有可撤销的主题重置", "error");
            return;
        }
        renderer.__elyricThemeResetUndo = null;
        renderer.__elyricActiveUserPlayerThemeId = null;
        renderer.__elyricPlayerLayout = "custom";
        renderer.__elyricThemeBaseLayout = renderer.__elyricThemeBaseLayout || "album";
        applyPlayerThemeV2State(renderer, snapshot);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已撤销上一次内置主题重置", "ready");
        syncPlayerThemeLibraryControls(renderer);
    }

    function renderOwnedCastTargets(renderer) {
        var body = renderer.__elyricCastBody;
        var bridge = renderer.__elyricPlaybackBridge;
        if (!body || !bridge) { return; }
        while (body.firstChild) { body.removeChild(body.firstChild); }
        var status = document.createElement("div");
        status.className = "elyric-player-cast-status";
        status.appendChild(document.createTextNode("正在查找播放设备…"));
        body.appendChild(status);
        Promise.resolve(bridge.getCastTargets()).then(function (targets) {
            if (!renderer.__elyricCastOpen || !renderer.__elyricCastBody) { return; }
            while (body.firstChild) { body.removeChild(body.firstChild); }
            var active = bridge.getActiveCastTarget();
            function appendTarget(target, local) {
                var button = document.createElement("button");
                button.className = "elyric-player-cast-target";
                button.setAttribute("type", "button");
                button.setAttribute("data-elyric-active", active && (local ? active.local : active.id === target.id) ? "true" : "false");
                var label = document.createElement("strong");
                label.appendChild(document.createTextNode(local ? "此设备" : target.name));
                var detail = document.createElement("span");
                detail.appendChild(document.createTextNode(local ? "使用当前浏览器播放" : target.playerName || "Emby 设备"));
                button.appendChild(label); button.appendChild(detail);
                button.addEventListener("click", function (event) {
                    stopControlEvent(event);
                    var activeTarget = bridge.getActiveCastTarget();
                    var switchingAwayFromRemote = activeTarget && !activeTarget.local
                        && (local || activeTarget.id !== target.id) && bridge.canEndCurrentSession();
                    if (switchingAwayFromRemote && "undefined" !== typeof window && window.confirm
                        && !window.confirm("当前正在其他设备播放。结束旧会话并切换设备？")) {
                        return;
                    }
                    button.disabled = true;
                    var switchTarget = function () {
                        return local ? bridge.selectLocalTarget() : bridge.selectCastTarget(target.id);
                    };
                    var operation = switchingAwayFromRemote
                        ? Promise.resolve(bridge.endCurrentSession()).then(switchTarget)
                        : Promise.resolve(switchTarget());
                    operation.then(function () {
                        renderOwnedCastTargets(renderer);
                    }, function (error) {
                        button.disabled = false;
                        renderer.__elyricCastStatus = error && error.message || "无法切换播放设备";
                        renderOwnedCastTargets(renderer);
                    });
                });
                body.appendChild(button);
            }
            appendTarget({ id: "local", name: "此设备" }, true);
            (targets || []).filter(function (target) { return !target.local; }).forEach(function (target) {
                appendTarget(target, false);
            });
            if (bridge.canEndCurrentSession()) {
                var endButton = document.createElement("button");
                endButton.className = "elyric-player-cast-target elyric-player-cast-end";
                endButton.setAttribute("type", "button");
                var endLabel = document.createElement("strong");
                endLabel.appendChild(document.createTextNode("结束当前远端会话"));
                var endDetail = document.createElement("span");
                endDetail.appendChild(document.createTextNode("停止远端播放器并保留此页面"));
                endButton.appendChild(endLabel); endButton.appendChild(endDetail);
                endButton.addEventListener("click", function (event) {
                    stopControlEvent(event);
                    if ("undefined" !== typeof window && window.confirm
                        && !window.confirm("确定结束当前远端播放会话？")) { return; }
                    endButton.disabled = true;
                    Promise.resolve(bridge.endCurrentSession()).then(function () {
                        renderOwnedCastTargets(renderer);
                    }, function (error) {
                        renderer.__elyricCastStatus = error && error.message || "无法结束当前会话";
                        renderOwnedCastTargets(renderer);
                    });
                });
                body.appendChild(endButton);
            }
            if (renderer.__elyricCastStatus) {
                var error = document.createElement("div");
                error.className = "elyric-player-cast-status elyric-player-cast-error";
                error.appendChild(document.createTextNode(renderer.__elyricCastStatus));
                body.appendChild(error); renderer.__elyricCastStatus = "";
            }
        }, function () {
            replaceElementText(status, "未能读取播放设备。");
            var retry = document.createElement("button");
            retry.className = "elyric-player-cast-retry";
            retry.setAttribute("type", "button");
            retry.appendChild(document.createTextNode("重试"));
            retry.addEventListener("click", function (event) {
                stopControlEvent(event); renderOwnedCastTargets(renderer);
            });
            body.appendChild(retry);
        });
    }

    function createOwnedLyricRows(renderer, centerIndex) {
        var container = renderer && renderer.itemsContainer;
        if (!container || !container.appendChild) {
            return;
        }
        var emptyState = renderer.__elyricLyricsEmpty;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        var items = renderer.__elyricItems || [];
        var windowRadius = 18;
        if (!isFinite(Number(centerIndex))) {
            centerIndex = findOwnedLyricIndex(renderer, renderer.__elyricLastPositionTicks, false);
        }
        centerIndex = Math.max(0, Math.min(items.length - 1, Number(centerIndex) || 0));
        var windowStart = items.length > windowRadius * 2 + 1
            ? Math.max(0, Math.min(items.length - windowRadius * 2 - 1, centerIndex - windowRadius))
            : 0;
        var windowEnd = Math.min(items.length, windowStart + windowRadius * 2 + 1);
        renderer.__elyricWindowStart = windowStart;
        renderer.__elyricWindowEnd = windowEnd;
        items.slice(windowStart, windowEnd).forEach(function (item, localIndex) {
            var index = windowStart + localIndex;
            var row = document.createElement("button");
            row.className = "lyricsItem secondaryText";
            row.setAttribute("type", "button");
            row.setAttribute("role", "listitem");
            row.setAttribute("data-index", String(index));
            row.setAttribute("aria-label", String(item && item.Text || "歌词"));
            var body = document.createElement("span");
            body.className = "listItemBodyText";
            row.appendChild(body);
            row.addEventListener("click", function (event) {
                stopControlEvent(event);
                var lyric = item && item.__elyric;
                var bridge = renderer.__elyricPlaybackBridge;
                if (lyric && bridge && bridge.seek) {
                    Promise.resolve(bridge.seek(lyric.startTicks)).catch(function () {});
                    resumeLyricFollowing(renderer, true);
                }
            });
            container.appendChild(row);
            renderLyricElement(renderer, row);
        });
        if (emptyState && !emptyState.parentNode) {
            renderer.__elyricLyricsEmpty = emptyState;
            container.appendChild(emptyState);
        }
        syncLyricAvailability(renderer);
    }

    function renderVisibleLyrics(renderer) {
        var container = renderer.itemsContainer;
        if (!container || !container.querySelectorAll) {
            return;
        }
        var elements = container.querySelectorAll(".lyricsItem[data-index]");
        for (var i = 0; i < elements.length; i++) {
            renderLyricElement(renderer, elements[i]);
        }
    }

    function ensureObserver(renderer) {
        if ("undefined" === typeof MutationObserver) {
            return;
        }
        var container = renderer.itemsContainer;
        if (!container) {
            return;
        }
        var parent = container.parentNode;
        if (renderer.__elyricObserver && renderer.__elyricObservedParent === parent) {
            return;
        }
        if (renderer.__elyricObserver) {
            renderer.__elyricObserver.disconnect();
        }
        renderer.__elyricObserver = new MutationObserver(function () {
            renderVisibleLyrics(renderer);
            ensureThemeControl(renderer);
        });
        renderer.__elyricObserver.observe(container, { childList: true, subtree: true });
        var ancestor = parent;
        while (ancestor) {
            var options = {
                attributes: true,
                attributeFilter: ["aria-hidden", "class", "hidden", "style"]
            };
            if (ancestor === document.body) {
                options.childList = true;
            }
            renderer.__elyricObserver.observe(ancestor, options);
            if (ancestor === document.body) {
                break;
            }
            ancestor = ancestor.parentNode;
        }
        renderer.__elyricObservedParent = parent;
    }

    function setWordState(element, state) {
        if (element.getAttribute("data-elyric-state") === state) {
            return;
        }
        element.classList.remove("elyric-word-pending", "elyric-word-active", "elyric-word-played");
        element.classList.add("elyric-word-" + state);
        element.setAttribute("data-elyric-state", state);
    }

    function setLineState(element, state) {
        if (element.getAttribute("data-elyric-line-state") === state) {
            return;
        }
        element.classList.remove("elyric-line-future", "elyric-line-current", "elyric-line-past");
        element.classList.add("elyric-line-" + state);
        element.setAttribute("data-elyric-line-state", state);
    }

    function updateLineStates(renderer, positionTicks) {
        var container = renderer.itemsContainer;
        if (!container || !container.querySelectorAll) {
            return;
        }
        var activeIndex = findOwnedLyricIndex(renderer, positionTicks, true);
        var windowCenter = activeIndex >= 0
            ? activeIndex : findOwnedLyricIndex(renderer, positionTicks, false);
        if (windowCenter >= 0 && (windowCenter < Number(renderer.__elyricWindowStart || 0)
            || windowCenter >= Number(renderer.__elyricWindowEnd || 0))) {
            createOwnedLyricRows(renderer, windowCenter);
        }
        var elements = container.querySelectorAll(".lyricsItem[data-index]");
        var currentElement = null;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var index = Number(element.getAttribute("data-index"));
            var item = renderer.__elyricItems && renderer.__elyricItems[index];
            if (!item || !item.__elyric) {
                continue;
            }
            var state = index === activeIndex
                ? "current"
                : index < windowCenter ? "past" : "future";
            setLineState(element, state);
            if ("current" === state) {
                currentElement = element;
            }
        }
        if (!currentElement) {
            return;
        }
        var currentIndex = currentElement.getAttribute("data-index");
        var manualScrollActive = renderer.__elyricManualScrollUntil
            && Date.now() < renderer.__elyricManualScrollUntil;
        if (!manualScrollActive && renderer.__elyricManualScrollUntil) {
            resumeLyricFollowing(renderer, true);
            return;
        }
        if (!manualScrollActive && renderer.__elyricLastFollowedLineIndex !== currentIndex) {
            scrollCurrentLyricIntoView(renderer, true);
        }
    }

    function updateWordStates(renderer, positionTicks) {
        var container = renderer.itemsContainer;
        if (!container || !container.querySelectorAll) {
            return;
        }
        updateLineStates(renderer, positionTicks);
        var words = container.querySelectorAll("[data-elyric-start][data-elyric-end]");
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            var startTicks = Number(word.getAttribute("data-elyric-start"));
            var endTicks = Number(word.getAttribute("data-elyric-end"));
            var state = positionTicks < startTicks
                ? "pending"
                : positionTicks >= endTicks
                    ? "played"
                    : "active";
            setWordState(word, state);
        }
    }

    function nowMilliseconds() {
        if ("undefined" !== typeof performance && performance && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    function cancelSmoothFrame(renderer) {
        if (null != renderer.__elyricFrameId && "undefined" !== typeof cancelAnimationFrame) {
            cancelAnimationFrame(renderer.__elyricFrameId);
        }
        renderer.__elyricFrameId = null;
        if (renderer.__elyricClock) {
            renderer.__elyricClock.running = false;
        }
    }

    function scheduleSmoothFrame(renderer) {
        if (null != renderer.__elyricFrameId || "undefined" === typeof requestAnimationFrame) {
            return;
        }

        renderer.__elyricFrameId = requestAnimationFrame(function (frameNow) {
            renderer.__elyricFrameId = null;
            var clock = renderer.__elyricClock;
            if (!clock || !clock.running || ("undefined" !== typeof document && document.hidden)) {
                cancelSmoothFrame(renderer);
                return;
            }

            var elapsedMs = Math.max(0, frameNow - clock.anchorNow);
            var interpolatedMs = Math.min(elapsedMs, MAX_INTERPOLATION_MS);
            var positionTicks = clock.anchorPositionTicks
                + interpolatedMs * TICKS_PER_SECOND / 1000;
            if (clock.runtimeTicks > 0) {
                positionTicks = Math.min(positionTicks, clock.runtimeTicks);
            }
            updateWordStates(renderer, positionTicks);

            if (elapsedMs < MAX_INTERPOLATION_MS
                && (!clock.runtimeTicks || positionTicks < clock.runtimeTicks)) {
                scheduleSmoothFrame(renderer);
            } else {
                clock.running = false;
            }
        });
    }

    function syncSmoothClock(renderer, positionTicks, runtimeTicks) {
        positionTicks = Number(positionTicks);
        runtimeTicks = Number(runtimeTicks);
        if (!isFinite(positionTicks)) {
            cancelSmoothFrame(renderer);
            return;
        }

        var now = nowMilliseconds();
        var clock = renderer.__elyricClock;
        if (!clock) {
            clock = renderer.__elyricClock = {
                anchorNow: now,
                anchorPositionTicks: positionTicks,
                lastNativeNow: null,
                lastNativePositionTicks: null,
                runtimeTicks: 0,
                running: false
            };
        }

        var running = false;
        if (null != clock.lastNativeNow && null != clock.lastNativePositionTicks) {
            var wallDeltaMs = now - clock.lastNativeNow;
            var positionDeltaMs = (positionTicks - clock.lastNativePositionTicks)
                / TICKS_PER_SECOND * 1000;
            running = wallDeltaMs > 0
                && positionDeltaMs >= Math.max(1, wallDeltaMs * .1)
                && positionDeltaMs <= wallDeltaMs * 2.5 + 250;
        }

        clock.anchorNow = now;
        clock.anchorPositionTicks = positionTicks;
        clock.lastNativeNow = now;
        clock.lastNativePositionTicks = positionTicks;
        clock.runtimeTicks = isFinite(runtimeTicks) && runtimeTicks > 0 ? runtimeTicks : 0;
        clock.running = running && !("undefined" !== typeof document && document.hidden);

        if (clock.running) {
            scheduleSmoothFrame(renderer);
        } else {
            cancelSmoothFrame(renderer);
        }
    }

    function ownedTrack(item) {
        var sources = item && item.MediaSources || [];
        var requestedSourceId = item && item.MediaSourceId;
        var source = requestedSourceId
            ? sources.filter(function (candidate) { return String(candidate.Id) === String(requestedSourceId); })[0]
            : null;
        source = source || sources[0];
        var streams = source && source.MediaStreams || [];
        var subtitleStreams = streams.filter(function (stream) {
            var type = String(stream && stream.Type || "").toLowerCase();
            return "subtitle" === type || "text" === type;
        });
        var defaultIndex = source && source.DefaultSubtitleStreamIndex;
        var defaultTrack = subtitleStreams.filter(function (stream) {
            return null != defaultIndex && String(stream.Index) === String(defaultIndex);
        })[0];
        if (defaultTrack) { return { source: source, track: defaultTrack }; }

        var namedLyricTrack = subtitleStreams.filter(function (stream) {
            var label = [stream.Title, stream.DisplayTitle, stream.Language]
                .filter(Boolean).join(" ").toLowerCase();
            return /(?:^|\s)(?:lyrics?|lrc)(?:\s|$)/i.test(label) || label.indexOf("歌词") >= 0;
        })[0];
        if (namedLyricTrack) { return { source: source, track: namedLyricTrack }; }

        var textTrack = subtitleStreams.filter(function (stream) {
            var codec = String(stream && stream.Codec || "").toLowerCase();
            var type = String(stream && stream.Type || "").toLowerCase();
            return "text" === type || "text" === codec || "lrc" === codec;
        })[0];
        return textTrack ? { source: source, track: textTrack } : null;
    }

    function ownedItemNeedsHydration(item) {
        var sources = item && item.MediaSources;
        return !Array.isArray(sources) || !sources.length || sources.some(function (source) {
            return !Array.isArray(source && source.MediaStreams) || !source.MediaStreams.length;
        });
    }

    function requestOwnedLyricTrack(renderer, item, selected, apiClient, requestId) {
        if (!selected || !apiClient || !apiClient.getJSON) {
            if (requestId === renderer.__elyricLyricRequestId) {
                setOwnedLyricStatus(renderer, "empty");
                syncLyricAvailability(renderer);
            }
            return Promise.resolve([]);
        }
        var cacheKey = [item.Id, selected.source.Id, selected.track.Index].join(":");
        renderer.__elyricLyricCache = renderer.__elyricLyricCache || {};
        if (renderer.__elyricLyricCache[cacheKey]) {
            renderer.__elyricItems = renderer.__elyricLyricCache[cacheKey];
            setOwnedLyricStatus(renderer, hasMeaningfulLyricItems(renderer.__elyricItems)
                ? "ready"
                : renderer.__elyricItems.length ? "instrumental" : "empty");
            createOwnedLyricRows(renderer);
            updateWordStates(renderer, renderer.__elyricLastPositionTicks || 0);
            return Promise.resolve(renderer.__elyricItems);
        }
        var url = apiClient.getUrl("Items/" + item.Id + "/" + selected.source.Id
            + "/Subtitles/" + selected.track.Index + "/Stream.js", {});
        return Promise.resolve(apiClient.getJSON(url)).then(function (result) {
            if (renderer.__elyricDestroyed || requestId !== renderer.__elyricLyricRequestId) { return []; }
            var items = prepareEnhancedLyrics(result && result.TrackEvents || []);
            renderer.__elyricLyricCache[cacheKey] = items;
            renderer.__elyricItems = items;
            setOwnedLyricStatus(renderer, hasMeaningfulLyricItems(items)
                ? "ready"
                : items && items.length ? "instrumental" : "empty");
            createOwnedLyricRows(renderer);
            updateWordStates(renderer, renderer.__elyricLastPositionTicks || 0);
            return items;
        }, function () {
            if (requestId === renderer.__elyricLyricRequestId) {
                renderer.__elyricItems = [];
                setOwnedLyricStatus(renderer, "error");
                createOwnedLyricRows(renderer);
            }
            return [];
        });
    }

    function loadOwnedLyrics(renderer, item) {
        var apiClient = activeApiClient(renderer);
        var requestId = (renderer.__elyricLyricRequestId || 0) + 1;
        renderer.__elyricLyricRequestId = requestId;
        renderer.__elyricGeneration = (renderer.__elyricGeneration || 0) + 1;
        renderer.__elyricItems = [];
        setOwnedLyricStatus(renderer, "loading");
        createOwnedLyricRows(renderer);
        if (!item || !item.Id || !apiClient || !apiClient.getJSON) {
            setOwnedLyricStatus(renderer, "empty");
            syncLyricAvailability(renderer); return Promise.resolve([]);
        }
        var selected = ownedTrack(item);
        if (selected || !ownedItemNeedsHydration(item)) {
            return requestOwnedLyricTrack(renderer, item, selected, apiClient, requestId);
        }
        var hydration = requestDetailedMediaItem(renderer, item);
        if (!hydration) {
            return requestOwnedLyricTrack(renderer, item, null, apiClient, requestId);
        }
        return Promise.resolve(hydration).then(function (detailedItem) {
            if (renderer.__elyricDestroyed || requestId !== renderer.__elyricLyricRequestId) { return []; }
            var hydratedItem = Object.assign({}, item, detailedItem || {});
            if (!hydratedItem.MediaSourceId && item.MediaSourceId) {
                hydratedItem.MediaSourceId = item.MediaSourceId;
            }
            renderer.__elyricDetailedMediaItem = hydratedItem;
            return requestOwnedLyricTrack(renderer, hydratedItem, ownedTrack(hydratedItem), apiClient, requestId);
        }, function () {
            if (requestId === renderer.__elyricLyricRequestId) {
                renderer.__elyricItems = [];
                setOwnedLyricStatus(renderer, "error");
                createOwnedLyricRows(renderer);
            }
            return [];
        });
    }

    function restoreNativeOsd(renderer) {
        (renderer.__elyricNativeNodes || []).forEach(function (entry) {
            var node = entry.node;
            if (!node) { return; }
            if (null === entry.ariaHidden) { node.removeAttribute("aria-hidden"); }
            else { node.setAttribute("aria-hidden", entry.ariaHidden); }
            if (entry.inert) { node.setAttribute("inert", ""); } else { node.removeAttribute("inert"); }
            node.style.visibility = entry.visibility;
            node.style.pointerEvents = entry.pointerEvents;
        });
        renderer.__elyricNativeNodes = [];
    }

    function hideNativeOsd(renderer) {
        var page = renderer.__elyricPlayerPage;
        if (!page) { return; }
        renderer.__elyricNativeNodes = [];
        var candidates = Array.prototype.slice.call(page.children || []);
        var nativeHeader = document.querySelector ? document.querySelector(".skinHeader") : null;
        if (nativeHeader && candidates.indexOf(nativeHeader) < 0) { candidates.push(nativeHeader); }
        Array.prototype.forEach.call(candidates, function (node) {
            if (node === renderer.__elyricThemeControl
                || (renderer.__elyricThemeControl && renderer.__elyricThemeControl.contains(node))) { return; }
            renderer.__elyricNativeNodes.push({
                node: node, ariaHidden: node.getAttribute("aria-hidden"),
                inert: node.hasAttribute ? node.hasAttribute("inert") : null !== node.getAttribute("inert"),
                visibility: node.style.visibility, pointerEvents: node.style.pointerEvents
            });
            node.setAttribute("aria-hidden", "true"); node.setAttribute("inert", "");
            node.style.visibility = "hidden"; node.style.pointerEvents = "none";
        });
    }

    function updateOwnedPlayer(renderer, snapshot) {
        if (!snapshot) { return; }
        var itemChanged = snapshot.item && (!renderer.currentItem || renderer.currentItem.Id !== snapshot.item.Id);
        renderer.currentItem = snapshot.item || renderer.currentItem || null;
        renderer.__elyricPlaybackActive = !snapshot.paused;
        updatePlayerControl(renderer, snapshot.positionTicks, snapshot.runtimeTicks);
        updateWordStates(renderer, snapshot.positionTicks);
        syncSmoothClock(renderer, snapshot.positionTicks, snapshot.runtimeTicks);
        if (itemChanged) { renderer.__elyricActiveApiClient = null; loadOwnedLyrics(renderer, renderer.currentItem); }
    }

    function mountOwnedPlayer(videoOsd) {
        if (videoOsd.__elyricRenderer) { return; }
        var page = videoOsd.view || videoOsd.element || document.querySelector(".view-videoosd-videoosd");
        var manager = _playbackmanager && _playbackmanager.default;
        var currentPlayer = manager && manager.getCurrentPlayer ? manager.getCurrentPlayer() : null;
        if (!page || !currentPlayer) { return; }
        var currentItem = manager.currentItem ? manager.currentItem(currentPlayer) : null;
        if (!currentItem || "Audio" !== currentItem.MediaType) { return; }
        var renderer = {
            __elyricDestroyed: false, __elyricPlayerPage: page, __elyricMountHost: page,
            currentItem: null, itemsContainer: document.createElement("div")
        };
        try {
            renderer.__elyricPlaybackBridge = createPlaybackBridge(videoOsd);
            renderer.currentItem = renderer.__elyricPlaybackBridge.getSnapshot().item;
            ensureDisplayConfiguration(renderer);
            ensureThemeControl(renderer);
            if (!renderer.__elyricThemeControl || !renderer.__elyricThemeControl.parentNode) {
                throw new Error("Custom player root failed to mount");
            }
            hideNativeOsd(renderer);
            renderer.__elyricBridgeUnsubscribe = renderer.__elyricPlaybackBridge.subscribe(function (snapshot) {
                updateOwnedPlayer(renderer, snapshot);
            });
            loadOwnedLyrics(renderer, renderer.currentItem);
            updateOwnedPlayer(renderer, renderer.__elyricPlaybackBridge.getSnapshot());
            videoOsd.__elyricRenderer = renderer;
        } catch (error) {
            renderer.__elyricDestroyed = true;
            renderer.__elyricLyricRequestId = (renderer.__elyricLyricRequestId || 0) + 1;
            if (renderer.__elyricBridgeUnsubscribe) { renderer.__elyricBridgeUnsubscribe(); }
            if (renderer.__elyricCastTargetsUnsubscribe) { renderer.__elyricCastTargetsUnsubscribe(); }
            if (renderer.__elyricPlaybackBridge) { renderer.__elyricPlaybackBridge.destroy(); }
            restoreNativeOsd(renderer);
            removeDisplayConfiguration(renderer);
            if (renderer.__elyricThemeControl) { removeThemeControl(renderer); }
            console.error("Emby Lyric Enhance failed safely; native OSD restored", error);
        }
    }

    function setOwnedLyricStatus(renderer, state) {
        state = state || "empty";
        renderer.__elyricLyricStatusState = state;
        var messages = {
            loading: ["正在加载歌词", "正在读取当前媒体的可用歌词流…"],
            empty: ["暂无同步歌词", "当前媒体没有提供歌词，播放控制仍可正常使用。"],
            instrumental: ["纯音乐", "歌词流标记为纯音乐，律动和播放控制仍会继续工作。"],
            error: ["歌词加载失败", "无法读取当前歌词流；切歌或重新进入播放器后会再次尝试。"]
        };
        var status = renderer.__elyricLyricsEmpty;
        if (!status) { return; }
        setAttributeIfChanged(status, "data-elyric-state", state);
        if ("ready" === state) {
            setAttributeIfChanged(status, "hidden", "hidden");
            return;
        }
        var message = messages[state] || messages.empty;
        replaceElementText(renderer.__elyricLyricsEmptyTitle, message[0]);
        replaceElementText(renderer.__elyricLyricsEmptyHint, message[1]);
        removeAttributeIfPresent(status, "hidden");
    }

    function unmountOwnedPlayer(videoOsd) {
        var renderer = videoOsd && videoOsd.__elyricRenderer;
        if (!renderer) { return; }
        renderer.__elyricDestroyed = true;
        renderer.__elyricLyricRequestId = (renderer.__elyricLyricRequestId || 0) + 1;
        cancelSmoothFrame(renderer);
        if (renderer.__elyricBridgeUnsubscribe) { renderer.__elyricBridgeUnsubscribe(); }
        if (renderer.__elyricCastTargetsUnsubscribe) { renderer.__elyricCastTargetsUnsubscribe(); }
        if (renderer.__elyricPlaybackBridge) { renderer.__elyricPlaybackBridge.destroy(); }
        restoreNativeOsd(renderer);
        removeDisplayConfiguration(renderer);
        removeThemeControl(renderer);
        videoOsd.__elyricRenderer = null;
    }

    function isOwnedPlayerRouteActive(renderer) {
        var page = renderer && renderer.__elyricPlayerPage;
        if (!page || false === page.isConnected) { return false; }
        if ("undefined" !== typeof location) {
            var route = String(location.hash || "");
            if (route) {
                return /(?:^|[!#/])videoosd\/videoosd\.html(?:[/?#]|$)/i.test(route);
            }
            var path = String(location.pathname || "");
            if (/\/videoosd\/videoosd\.html(?:[/?#]|$)/i.test(path)) { return true; }
        }
        if (page.hidden
            || "true" === (page.getAttribute && page.getAttribute("aria-hidden"))
            || (page.classList && (page.classList.contains("hide") || page.classList.contains("hidden")))) {
            return false;
        }
        return true;
    }

    VideoOsd.prototype.onResume = function () {
        var result = originalVideoOsdOnResume.apply(this, arguments);
        var instance = this;
        var generation = (instance.__elyricMountGeneration || 0) + 1;
        instance.__elyricMountGeneration = generation;
        Promise.resolve().then(function () {
            if (instance.__elyricMountGeneration === generation) { mountOwnedPlayer(instance); }
        });
        return result;
    };
    VideoOsd.prototype.onPause = function () {
        var renderer = this.__elyricRenderer;
        if (renderer
            && Number(renderer.__elyricViewportTransitionUntil || 0) > Date.now()
            && isOwnedPlayerRouteActive(renderer)) {
            repositionPlayerOverlays(renderer);
            return;
        }
        this.__elyricMountGeneration = (this.__elyricMountGeneration || 0) + 1;
        unmountOwnedPlayer(this);
        return originalVideoOsdOnPause.apply(this, arguments);
    };
    VideoOsd.prototype.destroy = function () {
        this.__elyricMountGeneration = (this.__elyricMountGeneration || 0) + 1;
        unmountOwnedPlayer(this);
        return originalVideoOsdDestroy.apply(this, arguments);
    };
})();
/* ELYRIC_ENHANCE_END:4.9.5.0 */
