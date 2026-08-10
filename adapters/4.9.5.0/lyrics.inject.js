/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */
;(function () {
    "use strict";

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
    var PLAYER_PREFERENCES_VERSION = 3;
    var PLAYER_THEME_SCHEMA_VERSION = 1;
    var MAX_USER_PLAYER_THEMES = 24;
    var PLAYER_PREFERENCES_SAVE_DELAY = 320;
    var PUBLIC_CONFIGURATION_PATH = "EmbyLyricEnhance/PublicConfiguration";
    var NATIVE_PLAYER_SELECTORS = {
        back: [".headerBackButton"],
        cast: [".headerCastButton"],
        previous: [".btnPreviousTrack"],
        playPause: [".videoOsd-btnPause"],
        stop: [".btnVideoOsd-stop"],
        next: [".btnNextTrack", ".btnNextTrackTopRight"],
        lyrics: [".btnLyrics"],
        shuffle: [".btnOsdShuffle-bottom", ".btnOsdShuffle-topright", ".btnOsdShuffle"],
        repeat: [".btnOsdRepeatMode-bottom", ".btnOsdRepeatMode-topright", ".btnOsdRepeatMode"],
        queue: [".btnPlayQueue"],
        mute: [".buttonMute"],
        volume: [".videoOsdVolumeSlider"],
        seek: [".videoOsdPositionSlider"]
    };
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
    var PLAYER_PARAMETRIC_PRESETS = {
        album: {
            choices: {
                artworkMode: "single", metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkSize: 46, artworkX: 18, artworkY: 52, artworkInnerSize: 42,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 0,
                metadataWidth: 42, metadataX: 52, metadataY: 12, metadataTitleSize: 190,
                lyricsWidth: 42, lyricsHeight: 48, lyricsX: 52, lyricsY: 30,
                visualizerX: 50, visualizerY: 79, progressWidth: 82
            },
            colors: {
                backgroundA: "#f4f0e9", backgroundB: "#d7c7b4", metadataText: "#17191d",
                lyricPast: "#765f57", lyricCurrent: "#d74642", lyricFuture: "#9e8f88",
                progressActive: "#d74642", artworkFrame: "#17191d"
            }
        },
        center: {
            choices: {
                artworkMode: "single", metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkSize: 31, artworkX: 22, artworkY: 49, artworkInnerSize: 100,
                artworkOuterRadius: 2, artworkInnerRadius: 2, artworkPadding: 0,
                metadataWidth: 27, metadataX: 40, metadataY: 35, metadataTitleSize: 210,
                lyricsWidth: 26, lyricsHeight: 58, lyricsX: 69, lyricsY: 20,
                visualizerX: 50, visualizerY: 79, progressWidth: 82
            },
            colors: {
                backgroundA: "#0a0c0b", backgroundB: "#15231b", metadataText: "#ffffff",
                lyricPast: "#afbab3", lyricCurrent: "#1ed760", lyricFuture: "#78857d",
                progressActive: "#1ed760", artworkFrame: "#1ed760"
            }
        },
        mobile: {
            choices: {
                artworkMode: "single", metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "glass", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkSize: 42, artworkX: 24, artworkY: 49, artworkInnerSize: 72,
                artworkOuterRadius: 18, artworkInnerRadius: 50, artworkPadding: 7,
                metadataWidth: 40, metadataX: 53, metadataY: 19, metadataTitleSize: 185,
                lyricsWidth: 40, lyricsHeight: 42, lyricsX: 53, lyricsY: 34,
                visualizerX: 50, visualizerY: 79, progressWidth: 78
            },
            colors: {
                backgroundA: "#0e1724", backgroundB: "#22435e", metadataText: "#ffffff",
                metadataSurface: "#1b2f43", lyricPast: "#b7d3e5", lyricCurrent: "#ffffff",
                lyricFuture: "#7797ac", progressActive: "#b9f782"
            }
        },
        mint: {
            choices: {
                artworkMode: "single", metadataAnchor: "center", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "inset", mediaSurface: "embossed"
            },
            tuning: {
                artworkSize: 27, artworkX: 50, artworkY: 24, artworkInnerSize: 88,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 6,
                metadataWidth: 54, metadataX: 50, metadataY: 46, metadataTitleSize: 155,
                lyricsWidth: 90, lyricsHeight: 18, lyricsX: 5, lyricsY: 58,
                lyricsOpacity: 82, visualizerX: 50, visualizerY: 79, progressWidth: 76
            },
            colors: {
                backgroundA: "#e4f0eb", backgroundB: "#c7ddd4", metadataText: "#263a34",
                lyricsSurface: "#d9ebe4", lyricPast: "#70867f", lyricCurrent: "#405f56",
                lyricFuture: "#93a8a1", progressActive: "#617d76", artworkFrame: "#edf8f4"
            }
        },
        deck: {
            choices: {
                artworkMode: "single", metadataAnchor: "start", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "embossed"
            },
            tuning: {
                artworkSize: 46, artworkX: 27, artworkY: 50, artworkInnerSize: 42,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 0,
                metadataWidth: 36, metadataX: 57, metadataY: 16, metadataTitleSize: 170,
                lyricsWidth: 38, lyricsHeight: 43, lyricsX: 57, lyricsY: 31,
                visualizerX: 50, visualizerY: 79, progressWidth: 80
            },
            colors: {
                backgroundA: "#d7d8d8", backgroundB: "#afb1b3", metadataText: "#27292c",
                lyricPast: "#656970", lyricCurrent: "#555bd8", lyricFuture: "#8f9298",
                progressActive: "#7b80e8", artworkFrame: "#aeb0af"
            }
        },
        stack: {
            choices: {
                artworkMode: "single", metadataAnchor: "start", metadataAlign: "left",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkSize: 40, artworkX: 24, artworkY: 50, artworkInnerSize: 100,
                artworkOuterRadius: 1, artworkInnerRadius: 1, artworkPadding: 0,
                metadataWidth: 44, metadataX: 49, metadataY: 10, metadataTitleSize: 185,
                lyricsWidth: 44, lyricsHeight: 58, lyricsX: 51, lyricsY: 21,
                visualizerX: 50, visualizerY: 79, progressWidth: 82
            },
            colors: {
                backgroundA: "#151211", backgroundB: "#4a1d21", metadataText: "#ffffff",
                lyricPast: "#c8b3b5", lyricCurrent: "#ff525d", lyricFuture: "#866f72",
                progressActive: "#ff525d", artworkFrame: "#ffffff"
            }
        },
        coverflow: {
            choices: {
                artworkMode: "coverflow", metadataAnchor: "center", metadataAlign: "center",
                metadataSurface: "glass", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkX: 50, artworkY: 36, coverflowWidth: 82, coverflowHeight: 48,
                artworkOuterRadius: 8, artworkInnerRadius: 6, metadataWidth: 60,
                metadataX: 50, metadataY: 63, metadataTitleSize: 180,
                lyricsWidth: 68, lyricsHeight: 20, lyricsX: 16, lyricsY: 58,
                visualizerX: 50, visualizerY: 79, progressWidth: 82
            },
            colors: {
                backgroundA: "#1b1512", backgroundB: "#663c20", metadataText: "#fff7e8",
                metadataSurface: "#302015", lyricPast: "#d8c2a7", lyricCurrent: "#ffb13b",
                lyricFuture: "#9e8569", progressActive: "#ffb13b", artworkFrame: "#f6e28f"
            },
            mobile: {
                tuning: {
                    artworkX: 50, artworkY: 22, coverflowWidth: 92, coverflowHeight: 27,
                    metadataX: 50, metadataY: 42, metadataWidth: 88,
                    lyricsX: 4, lyricsY: 50, lyricsWidth: 92, lyricsHeight: 18
                }
            }
        },
        lyrics: {
            choices: {
                artworkMode: "single", metadataAnchor: "start", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "none", mediaSurface: "glass"
            },
            tuning: {
                artworkSize: 44, artworkX: 22, artworkY: 50, artworkInnerSize: 56,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 0,
                metadataWidth: 38, metadataX: 55, metadataY: 10, metadataTitleSize: 170,
                lyricsWidth: 39, lyricsHeight: 52, lyricsX: 55, lyricsY: 24,
                visualizerX: 50, visualizerY: 79, progressWidth: 80
            },
            colors: {
                backgroundA: "#101412", backgroundB: "#344139", metadataText: "#ffffff",
                lyricPast: "#ced7d1", lyricCurrent: "#ffffff", lyricFuture: "#839087",
                progressActive: "#dbe4dd", artworkFrame: "#dbe4dd"
            }
        },
        rose: {
            choices: {
                artworkMode: "single", metadataAnchor: "center", metadataAlign: "center",
                metadataSurface: "none", lyricsSurface: "embossed", mediaSurface: "embossed"
            },
            tuning: {
                artworkSize: 30, artworkX: 24, artworkY: 43, artworkInnerSize: 88,
                artworkOuterRadius: 50, artworkInnerRadius: 50, artworkPadding: 6,
                artworkShadowDepth: 34, metadataWidth: 42, metadataX: 24, metadataY: 62,
                metadataTitleSize: 170, metadataArtistSize: 120, lyricsWidth: 47,
                lyricsHeight: 76, lyricsX: 49, lyricsY: 9, lyricsOpacity: 84,
                visualizerX: 50, visualizerY: 79, progressWidth: 78
            },
            colors: {
                backgroundA: "#fff0f4", backgroundB: "#f5d9e1", metadataText: "#27252a",
                lyricsSurface: "#fff0f4", mediaSurface: "#fff0f4", lyricPast: "#9b858e",
                lyricCurrent: "#ff2f72", lyricFuture: "#c4afb7", progressActive: "#ff2f72",
                artworkFrame: "#fff0f4"
            }
        }
    };
    var PLAYER_PARAMETRIC_MOBILE_DEFAULTS = {
        choices: {
            artworkMode: "single", metadataAnchor: "center", metadataAlign: "center"
        },
        tuning: {
            artworkSize: 52, artworkX: 50, artworkY: 17, artworkInnerSize: 88,
            metadataWidth: 86, metadataX: 50, metadataY: 31, metadataTitleSize: 145,
            lyricsWidth: 92, lyricsHeight: 31, lyricsX: 4, lyricsY: 40,
            lyricsPadding: 14, visualizerX: 50, visualizerY: 69,
            progressWidth: 68, volumeWidth: 18
        }
    };
    var DEFAULT_DISPLAY_CONFIGURATION = {
        defaultTheme: "classic",
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
    var originalGetItemsInternal = LyricsRenderer.prototype.getItemsInternal;
    var originalOnTimeUpdate = LyricsRenderer.prototype.onTimeUpdate;
    var originalDestroy = LyricsRenderer.prototype.destroy;

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

    function isCompactPlayerViewport() {
        var width = "undefined" !== typeof window && isFinite(Number(window.innerWidth))
            ? Number(window.innerWidth)
            : 1280;
        return width <= 760;
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
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
        var id = String(source.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 48);
        if (!id) {
            id = "user-theme-" + String(index || 0);
        }
        var theme = {
            schemaVersion: PLAYER_THEME_SCHEMA_VERSION,
            id: id,
            name: normalizePlayerThemeName(source.name, "我的主题 " + (Number(index || 0) + 1)),
            baseLayout: isKnownPlayerLayout(source.baseLayout) && "custom" !== source.baseLayout
                ? source.baseLayout
                : "album",
            tuning: normalizePlayerThemeTuning(source.tuning),
            choices: normalizePlayerThemeChoices(source.choices),
            colors: normalizePlayerThemeColors(source.colors),
            mediaFields: normalizePlayerMediaFields(source.mediaFields),
            player: source.player && "object" === typeof source.player ? shallowCopy(source.player) : {},
            updatedAt: isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now()
        };
        return theme;
    }

    function loadStoredPlayerThemes() {
        try {
            if ("undefined" !== typeof localStorage) {
                var serialized = localStorage.getItem(PLAYER_THEME_LIBRARY_STORAGE_KEY);
                var parsed = serialized ? JSON.parse(serialized) : [];
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, MAX_USER_PLAYER_THEMES).map(normalizeSavedPlayerTheme).filter(Boolean);
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
                    PLAYER_THEME_LIBRARY_STORAGE_KEY,
                    JSON.stringify((renderer.__elyricUserPlayerThemes || []).slice(0, MAX_USER_PLAYER_THEMES))
                );
            }
        } catch (error) {
            // The in-memory theme remains usable when storage is unavailable.
        }
    }

    function ensurePlayerThemeLibrary(renderer) {
        if (!renderer.__elyricUserPlayerThemes) {
            renderer.__elyricUserPlayerThemes = loadStoredPlayerThemes();
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
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
                    PLAYER_THEME_DESIGN_STORAGE_KEY,
                    JSON.stringify(collectCurrentPlayerTheme(renderer, "当前设计", "draft"))
                );
            }
        } catch (error) {
            // Live editing remains available for the current session.
        }
    }

    function loadCurrentPlayerThemeDesign() {
        try {
            if ("undefined" !== typeof localStorage) {
                var serialized = localStorage.getItem(PLAYER_THEME_DESIGN_STORAGE_KEY);
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
        var buttons = renderer.__elyricPlayerThemeChoiceButtons
            && renderer.__elyricPlayerThemeChoiceButtons[choiceId];
        syncSegmentedButtons(buttons, value);
        if (persist) {
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
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
        renderer.__elyricThemeBaseLayout = theme.baseLayout;
        syncPlayerThemeLibraryControls(renderer);
    }

    function resolvedBuiltInPlayerTheme(layoutId) {
        var preset = PLAYER_PARAMETRIC_PRESETS[layoutId];
        if (!preset) {
            return null;
        }
        var tuning = {};
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
            tuning[definition.id] = definition.fallback;
        });
        mergeThemeValues(tuning, preset.tuning);
        var choices = mergeThemeValues(defaultPlayerThemeChoices(), preset.choices);
        if (isCompactPlayerViewport()) {
            mergeThemeValues(tuning, PLAYER_PARAMETRIC_MOBILE_DEFAULTS.tuning);
            mergeThemeValues(choices, PLAYER_PARAMETRIC_MOBILE_DEFAULTS.choices);
            if (preset.mobile && preset.mobile.tuning) {
                mergeThemeValues(tuning, preset.mobile.tuning);
            }
            if (preset.mobile && preset.mobile.choices) {
                mergeThemeValues(choices, preset.mobile.choices);
            }
            choices.artworkMode = preset.choices && preset.choices.artworkMode || choices.artworkMode;
        }
        return {
            id: "builtin-" + layoutId,
            name: PLAYER_LAYOUTS.filter(function (layout) { return layout.id === layoutId; })[0].label,
            baseLayout: layoutId,
            tuning: tuning,
            choices: choices,
            colors: mergeThemeValues(defaultPlayerThemeColors(), preset.colors),
            mediaFields: defaultPlayerMediaFields(),
            player: shallowCopy(PLAYER_LAYOUT_PRESET_DEFAULTS[layoutId] || {})
        };
    }

    function applyStoredOrBuiltInPlayerTheme(renderer) {
        ensurePlayerThemeLibrary(renderer);
        if ("custom" === renderer.__elyricPlayerLayout) {
            var activeTheme = activeUserPlayerTheme(renderer) || loadCurrentPlayerThemeDesign();
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
            if (Object.prototype.hasOwnProperty.call(tuningSource, definition.id)) {
                preferences.tuning[definition.id] = normalizePlayerTuningValue(
                    definition,
                    tuningSource[definition.id]
                );
            }
        });
        if (Array.isArray(source.playerThemes)) {
            preferences.playerThemes = source.playerThemes
                .slice(0, MAX_USER_PLAYER_THEMES)
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
            tuning[definition.id] = renderer.__elyricPlayerTuning
                && isFinite(Number(renderer.__elyricPlayerTuning[definition.id]))
                ? Number(renderer.__elyricPlayerTuning[definition.id])
                : loadStoredPlayerTuning(definition.id);
        });
        var preferences = {
            version: PLAYER_PREFERENCES_VERSION,
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
            playerThemes: (renderer.__elyricUserPlayerThemes || []).slice(0, MAX_USER_PLAYER_THEMES),
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

    function requestUserPlayerPreferences(renderer) {
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
        renderer.__elyricUserPreferencesPromise = Promise.resolve(
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
        return renderer.__elyricUserPreferencesPromise;
    }

    function persistUserPlayerPreferences(renderer) {
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
                updatePreferenceStatus(renderer, "synced", "已同步到 Emby 账户");
                return true;
            }, function () {
                updatePreferenceStatus(renderer, "local", "同步失败；当前设置仍保存在本浏览器");
                return false;
            });
        });
    }

    function scheduleUserPlayerPreferencesSave(renderer) {
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

    function applyUserPlayerPreferences(renderer, preferences) {
        if (!preferences) {
            return;
        }
        renderer.__elyricApplyingUserPreferences = true;
        if (Array.isArray(preferences.playerThemes)) {
            renderer.__elyricUserPlayerThemes = preferences.playerThemes.slice(0, MAX_USER_PLAYER_THEMES);
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
        PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
            if (preferences.tuning
                && Object.prototype.hasOwnProperty.call(preferences.tuning, definition.id)) {
                setPlayerTuning(renderer, definition.id, preferences.tuning[definition.id], false);
            }
        });
        if (preferences.playerThemeDesign) {
            if ("custom" === renderer.__elyricPlayerLayout) {
                applyPlayerThemeDefinition(
                    renderer,
                    activeUserPlayerTheme(renderer) || preferences.playerThemeDesign
                );
            }
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
        renderer.__elyricStoredTheme = loadStoredTheme();
        renderer.__elyricTheme = renderer.__elyricStoredTheme || "classic";
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
            storeVisualizerValue(definition.storageKey, value);
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
            storeVisualizerValue(VISUALIZER_STYLE_STORAGE_KEY, styleId);
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
    }

    function setVisualizerRange(renderer, rangeId, persist) {
        rangeId = knownChoice(VISUALIZER_RANGES, rangeId, "wide");
        setVisualizerWidth(renderer, visualizerWidthForRange(rangeId), persist);
        if (persist) {
            storeVisualizerValue(VISUALIZER_RANGE_STORAGE_KEY, rangeId);
        }
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
            storeVisualizerValue(VISUALIZER_WIDTH_STORAGE_KEY, width);
            storeVisualizerValue(VISUALIZER_RANGE_STORAGE_KEY, renderer.__elyricVisualizerRange);
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
            storeVisualizerValue(VISUALIZER_HEIGHT_STORAGE_KEY, height);
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
            storeVisualizerValue(VISUALIZER_AMPLITUDE_STORAGE_KEY, amplitude);
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
            storeVisualizerValue(BACKGROUND_MODE_STORAGE_KEY, modeId);
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
            storeVisualizerValue(VISUALIZER_COLOR_MODE_STORAGE_KEY, modeId);
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
            storeVisualizerValue(VISUALIZER_COLOR_STORAGE_KEYS[colorIndex], color);
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
            storeVisualizerValue(LYRIC_ALIGNMENT_STORAGE_KEY, alignmentId);
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
            storeVisualizerValue(LYRIC_SCALE_STORAGE_KEY, scale);
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
            storePlayerTuning(settingId, value);
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
        var circular = isKnownPlayerLayout(renderer.__elyricPlayerLayout);
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
            storeArtworkRotation(enabled);
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

    function setSettingsPanelOpen(renderer, open) {
        open = !!open;
        var wasOpen = !!renderer.__elyricSettingsOpen;
        if (open) {
            setMediaPanelOpen(renderer, false);
            if (renderer.__elyricQueueOpen) {
                setQueueOpen(renderer, false, true);
            }
        }
        renderer.__elyricSettingsOpen = open;
        setAttributeIfChanged(
            renderer.__elyricThemeControl,
            "data-elyric-settings-open",
            open ? "true" : "false"
        );
        if (renderer.__elyricSettingsPanel) {
            if (open) {
                removeAttributeIfPresent(renderer.__elyricSettingsPanel, "hidden");
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
            resumeLyricFollowing(renderer, false);
            restorePlayerOverlayFocus(renderer.__elyricSettingsPanel, renderer.__elyricSettingsButton);
        }
    }

    function clearMediaPanelAnchor(renderer, mode) {
        var panel = renderer && renderer.__elyricMediaPanel;
        if (!panel) {
            return;
        }
        ["top", "right", "bottom", "left", "max-height", "--elyric-media-anchor-tip-x"]
            .forEach(function (propertyName) {
                if (panel.style && panel.style.removeProperty) {
                    panel.style.removeProperty(propertyName);
                }
            });
        setAttributeIfChanged(panel, "data-elyric-anchor-mode", mode || "drawer");
        removeAttributeIfPresent(panel, "data-elyric-anchor-placement");
    }

    function positionMediaPanelNearTrigger(renderer) {
        var panel = renderer && renderer.__elyricMediaPanel;
        var button = renderer && renderer.__elyricMediaButton;
        if (!panel || !button || !panel.getBoundingClientRect || !button.getBoundingClientRect) {
            return;
        }
        var viewportWidth = "undefined" !== typeof window && isFinite(Number(window.innerWidth))
            ? Number(window.innerWidth)
            : 1280;
        var viewportHeight = "undefined" !== typeof window && isFinite(Number(window.innerHeight))
            ? Number(window.innerHeight)
            : 720;
        var anchored = viewportWidth >= 761 || viewportWidth > viewportHeight;
        if (!anchored) {
            clearMediaPanelAnchor(renderer, "drawer");
            return;
        }
        var margin = 16;
        var gap = 12;
        var buttonRect = button.getBoundingClientRect();
        var panelRect = panel.getBoundingClientRect();
        var desiredWidth = Math.min(
            viewportWidth - margin * 2,
            viewportWidth * Math.min(54, Math.max(18,
                Number(renderer.__elyricPlayerTuning && renderer.__elyricPlayerTuning.mediaWidth) || 34)) / 100
        );
        var desiredHeight = Math.min(
            viewportHeight - margin * 2,
            viewportHeight * Math.min(88, Math.max(28,
                Number(renderer.__elyricPlayerTuning && renderer.__elyricPlayerTuning.mediaMaxHeight) || 72)) / 100,
            Number(panel.scrollHeight)
                || Number(panelRect.height)
                || Number(panelRect.bottom) - Number(panelRect.top)
                || viewportHeight * .72
        );
        var buttonLeft = Number(buttonRect.left) || 0;
        var buttonRight = Number(buttonRect.right) || buttonLeft + 44;
        var buttonTop = Number(buttonRect.top) || 0;
        var buttonBottom = Number(buttonRect.bottom) || buttonTop + 44;
        var left = Math.min(
            viewportWidth - desiredWidth - margin,
            Math.max(margin, buttonLeft)
        );
        var availableAbove = Math.max(0, buttonTop - gap - margin);
        var availableBelow = Math.max(0, viewportHeight - buttonBottom - gap - margin);
        var placeAbove = availableAbove >= Math.min(desiredHeight, 260) || availableAbove >= availableBelow;
        var available = placeAbove ? availableAbove : availableBelow;
        var top = placeAbove
            ? Math.max(margin, buttonTop - gap - Math.min(desiredHeight, availableAbove))
            : Math.min(viewportHeight - margin - Math.min(desiredHeight, availableBelow), buttonBottom + gap);
        var anchorX = Math.min(
            desiredWidth - 18,
            Math.max(18, (buttonLeft + buttonRight) / 2 - left)
        );
        panel.style.setProperty("left", Math.round(left) + "px");
        panel.style.setProperty("top", Math.round(top) + "px");
        panel.style.setProperty("right", "auto");
        panel.style.setProperty("bottom", "auto");
        panel.style.setProperty("max-height", Math.max(0, Math.round(available)) + "px");
        panel.style.setProperty("--elyric-media-anchor-tip-x", Math.round(anchorX) + "px");
        setAttributeIfChanged(panel, "data-elyric-anchor-mode", "button");
        setAttributeIfChanged(panel, "data-elyric-anchor-placement", placeAbove ? "above" : "below");
    }

    function setMediaPanelOpen(renderer, open) {
        open = !!open;
        var wasOpen = !!renderer.__elyricMediaOpen;
        if (open) {
            setSettingsPanelOpen(renderer, false);
            if (renderer.__elyricQueueOpen) {
                setQueueOpen(renderer, false, true);
            }
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
            && (renderer.__elyricSettingsOpen || renderer.__elyricMediaOpen)) {
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
        if (renderer.__elyricLyricsEmpty) {
            if (hasLyrics) {
                setAttributeIfChanged(renderer.__elyricLyricsEmpty, "hidden", "hidden");
            } else {
                removeAttributeIfPresent(renderer.__elyricLyricsEmpty, "hidden");
            }
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
            setAttributeIfChanged(body, "data-elyric-player-layout", renderer.__elyricPlayerLayout || "album");
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
            removeAttributeIfPresent(body, "data-elyric-player-layout");
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
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-player-layout", layoutId);
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-player-layout", layoutId);
        setAttributeIfChanged(renderer.__elyricSettingsPanel, "data-elyric-player-layout", layoutId);
        setAttributeIfChanged(renderer.__elyricMediaPanel, "data-elyric-player-layout", layoutId);
        setAttributeIfChanged(renderer.itemsContainer, "data-elyric-parametric", "true");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-parametric", "true");
        if (renderer.__elyricLayoutSelect) {
            renderer.__elyricLayoutSelect.value = layoutId;
        }
        syncSegmentedButtons(renderer.__elyricLayoutButtons, layoutId);
        if (persist) {
            if ("custom" === layoutId) {
                var savedTheme = activeUserPlayerTheme(renderer) || loadCurrentPlayerThemeDesign();
                if (savedTheme) {
                    applyPlayerThemeDefinition(renderer, savedTheme);
                }
            } else {
                renderer.__elyricActiveUserPlayerThemeId = null;
                applyPlayerLayoutPresetDefaults(renderer, layoutId);
            }
            storePlayerLayout(layoutId);
            storeCurrentPlayerThemeDesign(renderer);
            scheduleUserPlayerPreferencesSave(renderer);
        }
        if ("coverflow" === layoutId) {
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
            storeTheme(themeId);
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
        if (configuration.allowUserThemeOverride && renderer.__elyricStoredTheme) {
            effectiveTheme = renderer.__elyricStoredTheme;
        }
        applyTheme(renderer, effectiveTheme, false);

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
        if (renderer.__elyricThemeControl) {
            setLyricScale(renderer, loadLyricScale(renderer), false);
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
            container.removeAttribute("data-elyric-player-layout");
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

    function isNativeControlCandidate(element) {
        if (!(element
            && element !== document.body
            && !(element.classList && element.classList.contains("hide"))
            && !element.disabled)) {
            return false;
        }
        var ancestor = element.parentNode;
        while (ancestor && ancestor !== document.body) {
            if ((ancestor.classList && ancestor.classList.contains("hide"))
                || (ancestor.getAttribute && "true" === ancestor.getAttribute("aria-hidden"))) {
                return false;
            }
            ancestor = ancestor.parentNode;
        }
        return true;
    }

    function findNativeControl(renderer, selectors) {
        var playerPage = renderer.__elyricPlayerPage || findPlayerPage(renderer);
        var roots = [playerPage, document.body || renderer.itemsContainer];
        var fallback = null;
        for (var rootIndex = 0; rootIndex < roots.length; rootIndex++) {
            var root = roots[rootIndex];
            if (!root || !root.querySelectorAll || (rootIndex && root === roots[0])) {
                continue;
            }
            for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
                var elements = root.querySelectorAll(selectors[selectorIndex]);
                for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                    var element = elements[elementIndex];
                    if ((!renderer.__elyricThemeControl
                        || !renderer.__elyricThemeControl.contains
                        || !renderer.__elyricThemeControl.contains(element))
                        && isNativeControlCandidate(element)) {
                        fallback = fallback || element;
                        if (!element.getBoundingClientRect) {
                            return element;
                        }
                        var bounds = element.getBoundingClientRect();
                        if (!bounds || (bounds.width > 0 && bounds.height > 0)) {
                            return element;
                        }
                    }
                }
            }
        }
        return fallback;
    }

    function triggerNativeClick(renderer, action) {
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS[action] || []);
        if (!target) {
            return false;
        }
        if (target.click) {
            target.click();
        } else if (target.dispatchEvent) {
            target.dispatchEvent({ type: "click", target: target, currentTarget: target });
        }
        return true;
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
            analyser.fftSize = 2048;
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

    function visualizerSamples(renderer, count, time, amplitude, waveform) {
        count = Math.max(2, Math.round(count));
        var analyser = ensureVisualizerAnalyser(renderer) ? renderer.__elyricVisualizerAnalyser : null;
        var samples = new Array(count);
        var i;
        if (analyser && waveform && analyser.getByteTimeDomainData) {
            if (!renderer.__elyricVisualizerWaveformData
                || renderer.__elyricVisualizerWaveformData.length !== analyser.fftSize) {
                renderer.__elyricVisualizerWaveformData = new Uint8Array(analyser.fftSize);
            }
            analyser.getByteTimeDomainData(renderer.__elyricVisualizerWaveformData);
            var waveformEnergy = 0;
            for (i = 0; i < renderer.__elyricVisualizerWaveformData.length; i++) {
                var waveformValue = (renderer.__elyricVisualizerWaveformData[i] - 128) / 128;
                waveformEnergy += waveformValue * waveformValue;
            }
            var waveformRms = Math.sqrt(
                waveformEnergy / Math.max(1, renderer.__elyricVisualizerWaveformData.length)
            );
            var waveformGain = waveformRms > .006
                ? Math.min(4.2, Math.max(1, .22 / waveformRms))
                : 0;
            for (i = 0; i < count; i++) {
                var waveformIndex = Math.min(
                    renderer.__elyricVisualizerWaveformData.length - 1,
                    Math.round(i / (count - 1) * (renderer.__elyricVisualizerWaveformData.length - 1))
                );
                samples[i] = (renderer.__elyricVisualizerWaveformData[waveformIndex] - 128)
                    / 128 * waveformGain * amplitude;
            }
            return samples;
        }
        if (analyser && analyser.getByteFrequencyData) {
            if (!renderer.__elyricVisualizerFrequencyData
                || renderer.__elyricVisualizerFrequencyData.length !== analyser.frequencyBinCount) {
                renderer.__elyricVisualizerFrequencyData = new Uint8Array(analyser.frequencyBinCount);
            }
            analyser.getByteFrequencyData(renderer.__elyricVisualizerFrequencyData);
            if (!renderer.__elyricVisualizerEnergy
                || renderer.__elyricVisualizerEnergy.length !== count) {
                renderer.__elyricVisualizerEnergy = new Array(count).fill(0);
            }
            var sensitivity = (renderer.__elyricVisualizerSensitivity || 125) / 100;
            var response = (renderer.__elyricVisualizerResponse || 80) / 100;
            var bassBoost = (null != renderer.__elyricVisualizerBassBoost
                ? renderer.__elyricVisualizerBassBoost
                : 100) / 100;
            var maximumBin = Math.max(
                1,
                Math.min(
                    renderer.__elyricVisualizerFrequencyData.length - 1,
                    Math.round(renderer.__elyricVisualizerFrequencyData.length * .72)
                )
            );
            for (i = 0; i < count; i++) {
                var normalizedX = i / (count - 1);
                var bandStart = Math.max(
                    1,
                    Math.min(maximumBin, Math.floor(Math.pow(i / count, 1.12) * maximumBin))
                );
                var bandEnd = Math.max(
                    bandStart + 1,
                    Math.min(maximumBin + 1, Math.ceil(Math.pow((i + 1) / count, 1.12) * maximumBin))
                );
                var bandTotal = 0;
                var bandPeak = 0;
                for (var bandIndex = bandStart; bandIndex < bandEnd; bandIndex++) {
                    var bandValue = renderer.__elyricVisualizerFrequencyData[bandIndex] || 0;
                    bandTotal += bandValue;
                    bandPeak = Math.max(bandPeak, bandValue);
                }
                var bandAverage = bandTotal / Math.max(1, bandEnd - bandStart);
                var raw = (bandAverage * .76 + bandPeak * .24) / 255;
                var displayEnergy = Math.pow(Math.max(0, (raw - .015) / .985), .68);
                var lowFrequencyGain = 1 + (bassBoost - 1) * Math.pow(1 - normalizedX, 1.85);
                // Music masters naturally carry much more energy in the first few bins.
                // Apply a gentle display-only tilt so "bass boost" remains an explicit
                // choice instead of making the left edge dominate every spectrum.
                var spectralBalance = .58 + Math.pow(normalizedX, .58) * .62;
                var target = Math.min(
                    1.18,
                    displayEnergy * sensitivity * lowFrequencyGain * spectralBalance * amplitude
                );
                var previous = renderer.__elyricVisualizerEnergy[i] || 0;
                var rate = target > previous
                    ? .35 + response * .6
                    : .08 + response * .32;
                samples[i] = previous + (target - previous) * rate;
                renderer.__elyricVisualizerEnergy[i] = samples[i];
            }
            return samples;
        }
        for (i = 0; i < count; i++) {
            var x = i / (count - 1);
            if (waveform) {
                samples[i] = Math.sin(time * 4.8 + x * 18)
                    * visualizerEnvelope(x, time, .6, amplitude) * .62;
            } else {
                samples[i] = visualizerEnvelope(x, time, i % 7 * .17, amplitude);
            }
        }
        return samples;
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
            for (i = 0; i < count; i++) {
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
            var pulseSamples = visualizerSamples(renderer, count, time, amplitude, false);
            var pulseEnergy = 0;
            for (i = 0; i < Math.max(4, Math.round(count * .32)); i++) {
                pulseEnergy += pulseSamples[i];
            }
            pulseEnergy /= Math.max(4, Math.round(count * .32));
            pulseEnergy = Math.pow(Math.max(0, pulseEnergy), .58);
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
        if (!canvas || !canvas.getContext) {
            return;
        }
        var reducedMotion = "undefined" !== typeof window
            && window.matchMedia
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        drawVisualizerFrame(renderer, performance.now ? performance.now() : Date.now());
        if (!renderer.__elyricPlaybackActive
            || reducedMotion
            || (renderer.__elyricThemeControl
                && null !== renderer.__elyricThemeControl.getAttribute("hidden"))) {
            return;
        }
        var step = function (timestamp) {
            renderer.__elyricVisualizerFrameId = 0;
            if (!renderer.__elyricPlaybackActive || !renderer.__elyricVisualizerCanvas) {
                return;
            }
            drawVisualizerFrame(renderer, timestamp);
            renderer.__elyricVisualizerFrameId = requestAnimationFrame(step);
        };
        renderer.__elyricVisualizerFrameId = requestAnimationFrame(step);
    }

    function ensureNativeLyricsView(renderer, force) {
        if (renderer.__elyricQueueOpen) {
            return;
        }
        var lyricsControl = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.lyrics || []);
        if (!lyricsControl) {
            return;
        }
        var active = !!(lyricsControl.classList
            && lyricsControl.classList.contains("toggleButton-active"));
        if (active) {
            renderer.__elyricNativeLyricsPendingUntil = 0;
            return;
        }
        var now = Date.now();
        if (force || now >= (renderer.__elyricNativeLyricsPendingUntil || 0)) {
            renderer.__elyricNativeLyricsPendingUntil = now + 900;
            triggerNativeClick(renderer, "lyrics");
        }
    }

    function setQueueOpen(renderer, open, activateNative) {
        open = !!open;
        renderer.__elyricQueueOpen = open;
        var queueButton = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.queue;
        setAttributeIfChanged(queueButton, "aria-pressed", open ? "true" : "false");
        setAttributeIfChanged(queueButton, "data-elyric-active", open ? "true" : "false");
        setAttributeIfChanged(renderer.__elyricThemeControl, "data-elyric-queue-open", open ? "true" : "false");
        syncPlayerPageState(renderer, isThemeContextVisible(renderer));
        if (open && activateNative) {
            triggerNativeClick(renderer, "queue");
        } else if (!open && activateNative) {
            ensureNativeLyricsView(renderer, true);
        }
    }

    function isQueueInteractionTarget(renderer, target) {
        var queueButton = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.queue;
        if (queueButton && queueButton.contains && queueButton.contains(target)) {
            return true;
        }
        while (target) {
            if ((target.getAttribute && "playqueue" === target.getAttribute("data-contentsection"))
                || (target.classList && target.classList.contains("osdPlayQueue"))) {
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
                setQueueOpen(renderer, false, true);
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
            setQueueOpen(renderer, !renderer.__elyricQueueOpen, true);
            return;
        }
        if ("mute" === action) {
            togglePlayerMute(renderer);
            return;
        }
        if ("playPause" === action) {
            var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.playPause;
            var playing = !!(button && "true" === button.getAttribute("data-elyric-playing"));
            renderer.__elyricOptimisticPlaying = !playing;
            renderer.__elyricOptimisticPlayingUntil = Date.now() + 1200;
            setPlayPausePresentation(renderer, !playing);
        }
        triggerNativeClick(renderer, action);
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

    function dispatchNativeSeekEvent(target, type) {
        if (!target || !target.dispatchEvent) {
            return;
        }
        if ("undefined" !== typeof Event) {
            target.dispatchEvent(new Event(type, { bubbles: true }));
        } else {
            target.dispatchEvent({ type: type, target: target, currentTarget: target });
        }
    }

    function seekFromPlayerControl(renderer) {
        var control = renderer.__elyricProgressSlider;
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.seek);
        if (!control || !target) {
            renderer.__elyricScrubbing = false;
            return;
        }
        var controlMaximum = Number(control.max) || 1000;
        var targetMaximum = Number(target.max) || 100;
        var percentage = Math.min(1, Math.max(0, Number(control.value) / controlMaximum));
        target.value = String(percentage * targetMaximum);
        dispatchNativeSeekEvent(target, "input");
        dispatchNativeSeekEvent(target, "change");
        renderer.__elyricScrubbing = false;
    }

    function volumeFromPlayerControl(renderer, eventType) {
        var control = renderer.__elyricVolumeSlider;
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.volume);
        if (!control || !target) {
            renderer.__elyricVolumeScrubbing = false;
            return;
        }
        var percentage = Math.min(100, Math.max(0, Number(control.value) || 0));
        setDisplayStyle(control, "--elyric-player-volume", percentage + "%");
        syncVolumePresentation(renderer, percentage);
        if (percentage > 0) {
            renderer.__elyricLastAudibleVolume = percentage;
        }
        target.value = String(percentage);
        dispatchNativeSeekEvent(target, eventType);
        if ("change" === eventType) {
            renderer.__elyricVolumeScrubbing = false;
        }
    }

    function syncVolumePresentation(renderer, value) {
        value = Math.min(100, Math.max(0, Number(value) || 0));
        replaceElementText(renderer.__elyricVolumeValue, Math.round(value) + "%");
        var button = renderer.__elyricPlayerButtons && renderer.__elyricPlayerButtons.mute;
        if (!button) {
            return;
        }
        var muted = value <= 0;
        setButtonIcon(button, muted ? "volumeMute" : "volume");
        setAttributeIfChanged(button, "aria-label", muted ? "取消静音" : "静音");
        setAttributeIfChanged(button, "title", muted ? "取消静音" : "静音");
        setAttributeIfChanged(button, "data-elyric-tooltip", muted ? "取消静音" : "静音");
        setAttributeIfChanged(button, "aria-pressed", muted ? "true" : "false");
        setAttributeIfChanged(button, "data-elyric-active", muted ? "true" : "false");
    }

    function togglePlayerMute(renderer) {
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.volume);
        var control = renderer.__elyricVolumeSlider;
        if (!target || !control) {
            return false;
        }
        var current = Math.min(100, Math.max(0, Number(target.value) || 0));
        var next;
        if (current > 0) {
            renderer.__elyricLastAudibleVolume = current;
            next = 0;
        } else {
            next = Math.min(100, Math.max(1, Number(renderer.__elyricLastAudibleVolume) || 50));
        }
        target.value = String(next);
        control.value = String(next);
        control.setAttribute("value", String(next));
        setDisplayStyle(control, "--elyric-player-volume", next + "%");
        syncVolumePresentation(renderer, next);
        dispatchNativeSeekEvent(target, "input");
        dispatchNativeSeekEvent(target, "change");
        return true;
    }

    function updateVolumeControl(renderer) {
        var control = renderer.__elyricVolumeSlider;
        if (!control || renderer.__elyricVolumeScrubbing) {
            return;
        }
        var target = findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.volume);
        var value = target ? Math.min(100, Math.max(0, Number(target.value) || 0)) : 0;
        control.disabled = !target;
        control.setAttribute("aria-disabled", target ? "false" : "true");
        control.value = String(value);
        control.setAttribute("value", control.value);
        setDisplayStyle(control, "--elyric-player-volume", value + "%");
        if (value > 0) {
            renderer.__elyricLastAudibleVolume = value;
        }
        syncVolumePresentation(renderer, value);
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

    function compactMediaSummary(item) {
        var source = item && item.MediaSources && item.MediaSources[0] || item || {};
        var streams = source.MediaStreams || item && item.MediaStreams || [];
        var audio = null;
        for (var i = 0; i < streams.length; i++) {
            if ("audio" === String(streams[i] && streams[i].Type || "").toLowerCase()) {
                audio = streams[i];
                break;
            }
        }
        var parts = [];
        if (source.Container) {
            parts.push(String(source.Container).toUpperCase());
        }
        if (audio && audio.Codec) {
            parts.push(String(audio.Codec).toUpperCase());
        }
        if (audio && audio.SampleRate) {
            parts.push((Number(audio.SampleRate) / 1000).toFixed(1).replace(/\.0$/, "") + " kHz");
        }
        if (audio && audio.BitDepth) {
            parts.push(audio.BitDepth + " bit");
        }
        if (audio && (audio.ChannelLayout || audio.Channels)) {
            parts.push(audio.ChannelLayout || audio.Channels + " ch");
        }
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
        replaceElementText(renderer.__elyricPlayerFormat, compactMediaSummary(item));
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

        var artworkUrl = playerArtworkUrl(renderer, item);
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
        (renderer.__elyricCoverflowCaptions || []).forEach(function (caption, index) {
            replaceElementText(
                caption,
                2 === index
                    ? item && (item.Name || item.OriginalTitle) || "正在播放"
                    : playerArtistText(item)
            );
        });
        renderer.__elyricCoverflowPreviewAt = 0;
        syncPlayerCoverflowPreview(renderer, true);
        renderMediaInformation(renderer, item);
        if (renderer.__elyricMediaOpen) {
            refreshMediaInformation(renderer);
        }
    }

    function syncPlayerCoverflowPreview(renderer, force) {
        if (!renderer.__elyricCoverflowArtworks
            || "coverflow" !== renderer.__elyricPlayerLayout) {
            return;
        }
        var now = Date.now();
        if (!force && renderer.__elyricCoverflowPreviewAt
            && now < renderer.__elyricCoverflowPreviewAt) {
            return;
        }
        renderer.__elyricCoverflowPreviewAt = now + 2000;
        var root = renderer.__elyricPlayerPage || findPlayerPage(renderer)
            || ("undefined" !== typeof document ? document.body : null);
        if (!root || !root.querySelector) {
            return;
        }
        var queue = root.querySelector('.osdContentSection[data-contentsection="playqueue"]')
            || root.querySelector(".osdPlayQueue");
        if (!queue || !queue.querySelectorAll) {
            return;
        }
        var rows = queue.querySelectorAll(".listItem");
        var sideIndexes = [0, 1, -1, 2, 3];
        sideIndexes.forEach(function (rowIndex, cardIndex) {
            if (rowIndex < 0 || !rows[rowIndex]) {
                return;
            }
            var row = rows[rowIndex];
            var sourceImage = row.querySelector && row.querySelector("img");
            var sourceText = row.querySelector && row.querySelector(".listItemBodyText");
            var sourceUrl = sourceImage && (sourceImage.getAttribute("src")
                || sourceImage.getAttribute("data-src"));
            if (sourceUrl) {
                renderer.__elyricCoverflowArtworks[cardIndex].setAttribute("src", sourceUrl);
                renderer.__elyricCoverflowArtworks[cardIndex].removeAttribute("hidden");
            }
            if (sourceText && sourceText.textContent) {
                replaceElementText(renderer.__elyricCoverflowCaptions[cardIndex], sourceText.textContent);
            }
        });
    }

    function updatePlayerTransportState(renderer) {
        var buttons = renderer.__elyricPlayerButtons;
        if (!buttons) {
            return;
        }
        ["back", "cast", "previous", "playPause", "stop", "next", "shuffle", "repeat", "queue", "mute"].forEach(function (action) {
            var button = buttons[action];
            var nativeControl = "mute" === action
                ? findNativeControl(renderer, NATIVE_PLAYER_SELECTORS.volume)
                : findNativeControl(renderer, NATIVE_PLAYER_SELECTORS[action] || []);
            if (!button) {
                return;
            }
            button.disabled = !nativeControl;
            button.setAttribute("aria-disabled", nativeControl ? "false" : "true");
            if ("playPause" === action && nativeControl) {
                var playbackLabel = nativeControl.getAttribute
                    && (nativeControl.getAttribute("aria-label") || nativeControl.getAttribute("title")) || "";
                var playing = /暂停|pause/i.test(playbackLabel);
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
                ? Number(nativeControl && nativeControl.value) <= 0
                : ("queue" === action
                ? !!renderer.__elyricQueueOpen
                : !!(nativeControl
                && nativeControl.classList
                && nativeControl.classList.contains("toggleButton-active")));
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
            storeVisualizerValue("emby-lyric-enhance.show-second-line", show ? "true" : "false");
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
        panel.appendChild(section);
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
        storePlayerLayout("custom");
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        syncPlayerThemeLibraryControls(renderer);
    }

    function playerThemeLibrarySelection(renderer) {
        return "custom" === renderer.__elyricPlayerLayout && renderer.__elyricActiveUserPlayerThemeId
            ? "user:" + renderer.__elyricActiveUserPlayerThemeId
            : "builtin:" + ("custom" === renderer.__elyricPlayerLayout
                ? renderer.__elyricThemeBaseLayout || "album"
                : renderer.__elyricPlayerLayout || "album");
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
            renderer.__elyricUserPlayerThemes.forEach(function (theme) {
                var option = document.createElement("option");
                option.setAttribute("value", "user:" + theme.id);
                option.value = "user:" + theme.id;
                option.appendChild(document.createTextNode("我的 · " + theme.name));
                select.appendChild(option);
            });
            select.value = playerThemeLibrarySelection(renderer);
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
        if (0 === value.indexOf("builtin:")) {
            var layoutId = value.slice(8);
            renderer.__elyricActiveUserPlayerThemeId = null;
            applyPlayerLayout(renderer, layoutId, true);
            updatePlayerThemeLibraryStatus(renderer, "已应用内置主题；修改后可另存为我的主题", "ready");
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
        renderer.__elyricThemeBaseLayout = theme.baseLayout;
        renderer.__elyricPlayerLayout = "custom";
        applyPlayerLayout(renderer, "custom", false);
        applyPlayerThemeDefinition(renderer, theme);
        storePlayerLayout("custom");
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
        if (renderer.__elyricUserPlayerThemes.length >= MAX_USER_PLAYER_THEMES) {
            updatePlayerThemeLibraryStatus(renderer, "最多保存 " + MAX_USER_PLAYER_THEMES + " 套用户主题", "error");
            return;
        }
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
        storePlayerLayout("custom");
        storePlayerThemeLibrary(renderer);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已新建“" + theme.name + "”", "synced");
        syncPlayerThemeLibraryControls(renderer);
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
        var index = renderer.__elyricUserPlayerThemes.indexOf(active);
        renderer.__elyricUserPlayerThemes[index] = saved;
        renderer.__elyricActiveUserPlayerThemeId = saved.id;
        storePlayerThemeLibrary(renderer);
        storeCurrentPlayerThemeDesign(renderer);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已保存“" + saved.name + "”", "synced");
        syncPlayerThemeLibraryControls(renderer);
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
        updatePlayerThemeLibraryStatus(renderer, "已重命名为“" + active.name + "”", "synced");
        syncPlayerThemeLibraryControls(renderer);
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
        renderer.__elyricUserPlayerThemes = renderer.__elyricUserPlayerThemes.filter(function (theme) {
            return theme.id !== active.id;
        });
        renderer.__elyricActiveUserPlayerThemeId = null;
        storePlayerThemeLibrary(renderer);
        applyPlayerLayout(renderer, active.baseLayout || "album", true);
        scheduleUserPlayerPreferencesSave(renderer);
        updatePlayerThemeLibraryStatus(renderer, "已删除“" + active.name + "”并恢复内置主题", "ready");
        syncPlayerThemeLibraryControls(renderer);
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
        renderer.__elyricManualScrollUntil = Date.now() + LYRIC_FOLLOW_IDLE_MS;
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
        }, LYRIC_FOLLOW_IDLE_MS);
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
        control.className = "elyric-player-shell elyric-theme-picker";
        control.setAttribute("data-elyric-control", "player");
        control.setAttribute("role", "region");
        control.setAttribute("aria-label", "歌词增强音乐播放器");
        control.setAttribute("data-elyric-settings-open", "false");
        control.setAttribute("data-elyric-playback-active", "false");
        control.setAttribute("data-elyric-queue-open", "false");
        control.setAttribute("data-elyric-manual-scroll", "false");

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

        var identity = document.createElement("div");
        identity.className = "elyric-player-identity";

        var artworkStage = document.createElement("div");
        artworkStage.className = "elyric-player-artwork-stage";

        var artwork = document.createElement("img");
        artwork.className = "elyric-player-artwork";
        artwork.setAttribute("hidden", "hidden");
        artworkStage.appendChild(artwork);
        identity.appendChild(artworkStage);
        control.appendChild(identity);

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
        control.appendChild(coverflow);

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
        control.appendChild(metadata);

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
        control.appendChild(lyricsEmpty);

        var transport = document.createElement("div");
        transport.className = "elyric-player-transport";
        transport.appendChild(createPlayerButton(renderer, "previous", "上一首", "previous"));
        transport.appendChild(createPlayerButton(renderer, "playPause", "播放或暂停", "play"));
        transport.appendChild(createPlayerButton(renderer, "next", "下一首", "next"));
        control.appendChild(transport);

        var progress = document.createElement("div");
        progress.className = "elyric-player-progress";
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
        control.appendChild(progress);

        var volume = document.createElement("div");
        volume.className = "elyric-player-volume";
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
        control.appendChild(volume);

        var tools = document.createElement("div");
        tools.className = "elyric-player-tools";
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
            setMediaPanelOpen(renderer, !renderer.__elyricMediaOpen);
        });
        mediaButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(mediaButton);

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
            setSettingsPanelOpen(renderer, !renderer.__elyricSettingsOpen);
        });
        settingsButton.addEventListener("pointerdown", stopControlEvent);
        tools.appendChild(settingsButton);
        control.appendChild(tools);

        var visualizer = document.createElement("div");
        visualizer.className = "elyric-player-visualizer";
        visualizer.setAttribute("aria-label", "播放节奏动画");
        visualizer.setAttribute("role", "img");
        var visualizerCanvas = document.createElement("canvas");
        visualizerCanvas.className = "elyric-player-visualizer-canvas";
        visualizerCanvas.setAttribute("aria-hidden", "true");
        visualizer.appendChild(visualizerCanvas);
        control.appendChild(visualizer);

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
            setSettingsPanelOpen(renderer, false);
            setMediaPanelOpen(renderer, false);
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
            setSettingsPanelOpen(renderer, false);
        });
        settingsHeader.appendChild(settingsClose);
        settingsPanel.appendChild(settingsHeader);

        var tuningInputs = {};
        var tuningValues = {};
        var themeChoiceControls = {};
        var themeColorSettings = {};

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
        [newThemeButton, saveThemeButton, duplicateThemeButton, renameThemeButton, deleteThemeButton]
            .forEach(function (button) { themeLibraryActions.appendChild(button); });
        librarySection.appendChild(themeLibraryActions);
        var themeLibraryStatus = document.createElement("small");
        themeLibraryStatus.className = "elyric-player-theme-library-status";
        themeLibraryStatus.setAttribute("role", "status");
        themeLibraryStatus.setAttribute("aria-live", "polite");
        themeLibraryStatus.appendChild(document.createTextNode("内置主题不可覆盖；调整后可另存为用户主题。"));
        librarySection.appendChild(themeLibraryStatus);

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
                "artworkScale", "artworkSize", "artworkX", "artworkY", "artworkInnerSize",
                "artworkOuterRadius", "artworkInnerRadius", "artworkPadding", "artworkBorderWidth",
                "artworkShadowDepth", "coverflowWidth", "coverflowHeight",
                "metadataWidth", "metadataX", "metadataY", "metadataTitleSize",
                "metadataArtistSize", "metadataAlbumSize", "metadataLetterSpacing",
                "metadataPadding", "metadataRadius", "metadataBlur", "metadataOpacity",
                "lyricsWidth", "lyricsHeight", "lyricsX", "lyricsY"
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
            ["visualizerX", "visualizerY", "visualizerRotation", "visualizerOpacity"],
            tuningInputs,
            tuningValues
        );
        var visualizerAnalysisSettings = {};
        [
            ["sensitivity", "音频灵敏度", "实时音频灵敏度"],
            ["response", "动态响应", "频谱动态响应速度"],
            ["smoothing", "动态平滑", "频谱动态平滑度"],
            ["density", "元素密度", "频谱元素密度"],
            ["bassBoost", "低频增强", "频谱低频增强"]
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
                "progressWidth", "progressTrackHeight", "progressThumbSize",
                "volumeWidth", "volumeTrackHeight", "volumeThumbSize",
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

        var mediaDesignSection = createSettingsSection(
            settingsPanel,
            "9. 歌曲信息弹卡",
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
        settingsPanel.appendChild(toggleHelp);
        var coreHelp = document.createElement("div");
        coreHelp.className = "elyric-player-settings-note elyric-player-settings-note-muted";
        coreHelp.appendChild(document.createTextNode("播放、队列、进度和音量仍由 Emby 原生会话管理；自有控件会即时反馈当前状态。"));
        settingsPanel.appendChild(coreHelp);
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
            setMediaPanelOpen(renderer, false);
        });
        mediaHeader.appendChild(mediaClose);
        mediaPanel.appendChild(mediaHeader);
        var mediaBody = document.createElement("div");
        mediaBody.className = "elyric-player-media-body";
        mediaPanel.appendChild(mediaBody);
        mediaPanel.addEventListener("click", stopControlEvent);
        mediaPanel.addEventListener("pointerdown", stopControlEvent);

        control.addEventListener("click", stopControlEvent);
        control.addEventListener("pointerdown", stopControlEvent);
        renderer.__elyricThemeSelect = null;
        renderer.__elyricLayoutSelect = null;
        renderer.__elyricThemeButtons = themeChoices.buttons;
        renderer.__elyricLayoutButtons = layoutChoices.buttons;
        renderer.__elyricBackgroundButtons = backgroundChoices.buttons;
        renderer.__elyricVisualizerStyleButtons = visualizerStyleChoices.buttons;
        renderer.__elyricVisualizerRangeButtons = visualizerRangeChoices.buttons;
        renderer.__elyricVisualizerColorModeButtons = visualizerColorModeChoices.buttons;
        renderer.__elyricAlignmentButtons = alignmentChoices.buttons;
        renderer.__elyricPlayerBackground = background;
        renderer.__elyricPlayerArtworkStage = artworkStage;
        renderer.__elyricPlayerArtwork = artwork;
        renderer.__elyricPlayerCoverflow = coverflow;
        renderer.__elyricCoverflowArtworks = coverflowArtworks;
        renderer.__elyricCoverflowCaptions = coverflowCaptions;
        renderer.__elyricPlayerTitle = title;
        renderer.__elyricPlayerArtist = artist;
        renderer.__elyricPlayerAlbum = album;
        renderer.__elyricPlayerFormat = format;
        renderer.__elyricLyricsEmpty = lyricsEmpty;
        renderer.__elyricProgressSlider = progressSlider;
        renderer.__elyricPlayerPosition = positionText;
        renderer.__elyricPlayerDuration = durationText;
        renderer.__elyricVolumeSlider = volumeSlider;
        renderer.__elyricVolumeValue = volumeValue;
        renderer.__elyricSecondLineButton = secondLineButton;
        renderer.__elyricSecondLineSettingsButtons = secondLineChoices.buttons;
        renderer.__elyricArtworkRotationButton = artworkRotationButton;
        renderer.__elyricArtworkRotationSettingsButtons = rotationChoices.buttons;
        renderer.__elyricSettingsButton = settingsButton;
        renderer.__elyricOverlayScrim = overlayScrim;
        renderer.__elyricSettingsPanel = settingsPanel;
        renderer.__elyricPreferenceStatus = preferenceStatus;
        renderer.__elyricSettingsOpen = false;
        renderer.__elyricMediaButton = mediaButton;
        renderer.__elyricMediaPanel = mediaPanel;
        renderer.__elyricMediaBody = mediaBody;
        renderer.__elyricMediaOpen = false;
        renderer.__elyricVisualizer = visualizer;
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
        renderer.__elyricPlayerThemeLibrarySelect = themeLibrarySelect;
        renderer.__elyricPlayerThemeNameInput = themeNameInput;
        renderer.__elyricPlayerThemeLibraryStatus = themeLibraryStatus;
        renderer.__elyricPlayerThemeSaveButton = saveThemeButton;
        renderer.__elyricPlayerThemeRenameButton = renameThemeButton;
        renderer.__elyricPlayerThemeDeleteButton = deleteThemeButton;
        renderer.__elyricLyricFollowButton = followButton;
        renderer.__elyricParametricViewportProfile = isCompactPlayerViewport() ? "compact" : "desktop";
        var parametricViewportHandler = function () {
            var profile = isCompactPlayerViewport() ? "compact" : "desktop";
            if (profile !== renderer.__elyricParametricViewportProfile) {
                renderer.__elyricParametricViewportProfile = profile;
                if ("custom" !== renderer.__elyricPlayerLayout) {
                    applyPlayerLayoutPresetDefaults(renderer, renderer.__elyricPlayerLayout || "album");
                }
            }
            if (renderer.__elyricMediaOpen) {
                positionMediaPanelNearTrigger(renderer);
            }
        };
        if ("undefined" !== typeof window && window.addEventListener) {
            window.addEventListener("resize", parametricViewportHandler);
            window.addEventListener("orientationchange", parametricViewportHandler);
            renderer.__elyricParametricViewportHandler = parametricViewportHandler;
        }
        var overlayKeyHandler = function (event) {
            if (event && "Escape" === event.key
                && (renderer.__elyricSettingsOpen || renderer.__elyricMediaOpen)) {
                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                setSettingsPanelOpen(renderer, false);
                setMediaPanelOpen(renderer, false);
                return;
            }
            if (event && "Tab" === event.key) {
                trapPlayerOverlayFocus(
                    renderer.__elyricSettingsOpen
                        ? renderer.__elyricSettingsPanel
                        : renderer.__elyricMediaOpen
                            ? renderer.__elyricMediaPanel
                            : null,
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
        renderer.__elyricLocalShowSecond = loadStoredBoolean(
            "emby-lyric-enhance.show-second-line",
            renderer.__elyricDisplayConfiguration
                ? renderer.__elyricDisplayConfiguration.showSecondLine
                : DEFAULT_DISPLAY_CONFIGURATION.showSecondLine
        );
        setSecondLineOverride(renderer, renderer.__elyricLocalShowSecond);
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
        applyPlayerLayout(renderer, loadStoredPlayerLayout(), false);
        updatePlayerMetadata(renderer);
        return control;
    }

    function getThemeControlHost(renderer) {
        var container = renderer.itemsContainer;
        if (document.body && document.body.appendChild) {
            return document.body;
        }
        return container;
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
        var pageVisible = isThemeContextVisible(renderer);
        if (pageVisible) {
            removeAttributeIfPresent(control, "hidden");
            setAttributeIfChanged(control, "aria-hidden", "false");
            syncSettingsPanelVisibility(renderer, true);
            syncMediaPanelVisibility(renderer, true);
            syncPlayerPageState(renderer, true);
        } else {
            syncSettingsPanelVisibility(renderer, false);
            syncMediaPanelVisibility(renderer, false);
            setAttributeIfChanged(control, "hidden", "hidden");
            setAttributeIfChanged(control, "aria-hidden", "true");
            syncPlayerPageState(renderer, false);
        }
        syncPlayerOverlayScrim(renderer, pageVisible);
        syncVisualizerAnimation(renderer);
    }

    function ensureThemeControl(renderer) {
        var container = renderer.itemsContainer;
        if (!container || !container.appendChild || "undefined" === typeof document) {
            return;
        }
        ensureThemeState(renderer);
        applyTheme(renderer, renderer.__elyricTheme, false);

        var visible = isThemeContextVisible(renderer);
        if (!renderer.__elyricThemeControl) {
            if (!visible) {
                return;
            }
            renderer.__elyricThemeControl = createThemeControl(renderer);
            applyPlayerLayout(renderer, renderer.__elyricPlayerLayout, false);
            setArtworkRotation(renderer, loadStoredArtworkRotation(), false);
            setBackgroundMode(
                renderer,
                loadVisualizerChoice(BACKGROUND_MODE_STORAGE_KEY, BACKGROUND_MODES, "blur"),
                false
            );
            setVisualizerStyle(
                renderer,
                loadVisualizerChoice(VISUALIZER_STYLE_STORAGE_KEY, VISUALIZER_STYLES, "spectrum"),
                false
            );
            var storedVisualizerRange = loadVisualizerChoice(
                VISUALIZER_RANGE_STORAGE_KEY,
                VISUALIZER_RANGES,
                "wide"
            );
            setVisualizerRange(
                renderer,
                storedVisualizerRange,
                false
            );
            setVisualizerWidth(
                renderer,
                loadStoredNumber(
                    VISUALIZER_WIDTH_STORAGE_KEY,
                    10,
                    100,
                    visualizerWidthForRange(storedVisualizerRange)
                ),
                false
            );
            setVisualizerHeight(
                renderer,
                loadStoredNumber(VISUALIZER_HEIGHT_STORAGE_KEY, 2, 30, 8),
                false
            );
            setVisualizerAmplitude(renderer, loadVisualizerAmplitude(), false);
            VISUALIZER_ANALYSIS_DEFINITIONS.forEach(function (definition) {
                setVisualizerAnalysisSetting(
                    renderer,
                    definition.id,
                    loadStoredNumber(
                        definition.storageKey,
                        definition.minimum,
                        definition.maximum,
                        definition.fallback
                    ),
                    false
                );
            });
            setVisualizerColorMode(
                renderer,
                loadVisualizerChoice(
                    VISUALIZER_COLOR_MODE_STORAGE_KEY,
                    VISUALIZER_COLOR_MODES,
                    "dual"
                ),
                false
            );
            ["#a8e063", "#56d6c9", "#8b9dff"].forEach(function (fallback, colorIndex) {
                setVisualizerColor(
                    renderer,
                    colorIndex,
                    loadStoredHexColor(VISUALIZER_COLOR_STORAGE_KEYS[colorIndex], fallback),
                    false
                );
            });
            setLyricAlignment(
                renderer,
                loadVisualizerChoice(LYRIC_ALIGNMENT_STORAGE_KEY, LYRIC_ALIGNMENTS, "left"),
                false
            );
            setLyricScale(renderer, loadLyricScale(renderer), false);
            PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
                setPlayerTuning(
                    renderer,
                    definition.id,
                    loadStoredPlayerTuning(definition.id),
                    false
                );
            });
            applyStoredOrBuiltInPlayerTheme(renderer);
            applyPlayerShellConfiguration(renderer, renderer.__elyricDisplayConfiguration);
            syncVisualizerAnimation(renderer);
            requestUserPlayerPreferences(renderer).then(function (preferences) {
                if (renderer.__elyricThemeControl && preferences) {
                    applyUserPlayerPreferences(renderer, preferences);
                }
            });
        }
        syncLyricAvailability(renderer);
        if (!visible) {
            syncThemeControlVisibility(renderer);
            return;
        }
        var host = getThemeControlHost(renderer);
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
        ensureNativeLyricsView(renderer, false);
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
            renderer.__elyricParametricViewportHandler = null;
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
            PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
                document.body.style.removeProperty(definition.cssProperty);
            });
            PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
                document.body.style.removeProperty(definition.cssProperty);
            });
        }
        if (renderer.itemsContainer
            && renderer.itemsContainer.style
            && renderer.itemsContainer.style.removeProperty) {
            PLAYER_TUNING_DEFINITIONS.forEach(function (definition) {
                renderer.itemsContainer.style.removeProperty(definition.cssProperty);
            });
            PLAYER_THEME_COLOR_DEFINITIONS.forEach(function (definition) {
                renderer.itemsContainer.style.removeProperty(definition.cssProperty);
            });
        }
        if (renderer.itemsContainer && renderer.itemsContainer.removeAttribute) {
            renderer.itemsContainer.removeAttribute("data-elyric-player-layout");
            renderer.itemsContainer.removeAttribute("data-elyric-has-lyrics");
            renderer.itemsContainer.removeAttribute("data-elyric-parametric");
        }
        renderer.__elyricThemeControl = null;
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
        renderer.__elyricPlayerArtworkStage = null;
        renderer.__elyricPlayerArtwork = null;
        renderer.__elyricPlayerCoverflow = null;
        renderer.__elyricCoverflowArtworks = null;
        renderer.__elyricCoverflowCaptions = null;
        renderer.__elyricCoverflowPreviewAt = 0;
        renderer.__elyricPlayerTitle = null;
        renderer.__elyricPlayerArtist = null;
        renderer.__elyricPlayerAlbum = null;
        renderer.__elyricPlayerFormat = null;
        renderer.__elyricLyricsEmpty = null;
        renderer.__elyricPlayerItemSignature = null;
        renderer.__elyricProgressSlider = null;
        renderer.__elyricPlayerPosition = null;
        renderer.__elyricPlayerDuration = null;
        renderer.__elyricVolumeSlider = null;
        renderer.__elyricVolumeValue = null;
        renderer.__elyricLastAudibleVolume = null;
        renderer.__elyricSecondLineButton = null;
        renderer.__elyricSecondLineSettingsButtons = null;
        renderer.__elyricArtworkRotationButton = null;
        renderer.__elyricArtworkRotationSettingsButtons = null;
        renderer.__elyricArtworkRotation = null;
        renderer.__elyricSettingsButton = null;
        renderer.__elyricSettingsPanel = null;
        renderer.__elyricOverlayScrim = null;
        renderer.__elyricOverlayKeyHandler = null;
        renderer.__elyricPreferenceStatus = null;
        renderer.__elyricSettingsOpen = false;
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

        element.classList.remove("elyric-line-multilingual", "elyric-line-credit");
        if (item.__elyric.sublines.length > 1) {
            element.classList.add("elyric-line-multilingual");
        }
        if (isLyricCreditLine(item, index)) {
            element.classList.add("elyric-line-credit");
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
        var elements = container.querySelectorAll(".lyricsItem[data-index]");
        var currentElement = null;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var index = Number(element.getAttribute("data-index"));
            var item = renderer.__elyricItems && renderer.__elyricItems[index];
            if (!item || !item.__elyric) {
                continue;
            }
            var state = positionTicks < item.__elyric.startTicks
                ? "future"
                : positionTicks >= item.__elyric.endTicks
                    ? "past"
                    : "current";
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

    LyricsRenderer.prototype.getItemsInternal = function () {
        var renderer = this;
        return originalGetItemsInternal.apply(this, arguments).then(function (events) {
            renderer.__elyricDestroyed = false;
            renderer.__elyricGeneration = (renderer.__elyricGeneration || 0) + 1;
            renderer.__elyricItems = prepareEnhancedLyrics(events);
            ensureObserver(renderer);
            ensureDisplayConfiguration(renderer);
            ensureThemeControl(renderer);
            syncLyricAvailability(renderer);
            return renderer.__elyricItems;
        });
    };

    LyricsRenderer.prototype.onTimeUpdate = function (positionTicks, runtimeTicks) {
        originalOnTimeUpdate.apply(this, arguments);
        ensureObserver(this);
        ensureDisplayConfiguration(this);
        ensureThemeControl(this);
        updatePlayerControl(this, positionTicks, runtimeTicks);
        renderVisibleLyrics(this);
        updateWordStates(this, positionTicks);
        syncSmoothClock(this, positionTicks, runtimeTicks);
    };

    LyricsRenderer.prototype.destroy = function () {
        this.__elyricDestroyed = true;
        cancelSmoothFrame(this);
        removeDisplayConfiguration(this);
        removeThemeControl(this);
        if (this.__elyricObserver) {
            this.__elyricObserver.disconnect();
        }
        this.__elyricObserver = null;
        this.__elyricObservedParent = null;
        this.__elyricItems = null;
        this.__elyricClock = null;
        return originalDestroy.apply(this, arguments);
    };
})();
/* ELYRIC_ENHANCE_END:4.9.5.0 */
