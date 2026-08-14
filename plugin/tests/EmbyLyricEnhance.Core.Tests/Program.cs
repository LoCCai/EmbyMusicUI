using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using EmbyLyricEnhance.Core;

var failures = new List<string>();

void Check(bool condition, string message)
{
    if (!condition)
    {
        failures.Add(message);
    }
}

var defaults = DisplayOptionsSanitizer.Sanitize(new LyricDisplayOptions());
Check(defaults.ConfigurationVersion == 1, "configuration version should be one");
Check(defaults.ThemeSchemaVersion == PlayerThemeV2Schema.Version,
    "public configuration should advertise the supported Theme schema version");
Check(defaults.DefaultTheme == ThemeIds.Classic, "classic should be the default theme");
Check(defaults.AllowUserThemeOverride, "browser theme override should default to enabled");
Check(defaults.FontSizePercent == 100, "default font size should be 100%");
Check(defaults.UseThemeColor && defaults.HighlightColor == "", "theme color should suppress a custom color");

var normalized = DisplayOptionsSanitizer.Sanitize(new LyricDisplayOptions
{
    DefaultTheme = " APPLE ",
    AllowUserThemeOverride = false,
    FontSizePercent = 999,
    LineHeight = double.NaN,
    FontWeight = 551,
    UseThemeColor = false,
    HighlightColor = " #AbC ",
    PendingOpacity = -2,
    GlowStrength = 4,
    CurrentLineScale = 3,
    OtherLinesOpacity = 0,
    OtherLinesBlurPixels = 40,
    ShowSecondLine = false,
    ShowThirdAndLaterLines = false
});

Check(normalized.DefaultTheme == ThemeIds.Apple, "theme names should be normalized case-insensitively");
Check(!normalized.AllowUserThemeOverride, "override policy should be preserved");
Check(normalized.FontSizePercent == 180, "font size should be capped");
Check(Math.Abs(normalized.LineHeight - 1.25) < 0.0001, "non-finite line height should use the fallback");
Check(normalized.FontWeight == 600, "font weight should be rounded to a supported hundred");
Check(normalized.HighlightColor == "#aabbcc", "three-digit colors should be expanded and normalized");
Check(Math.Abs(normalized.PendingOpacity - 0.1) < 0.0001, "pending opacity should be clamped");
Check(Math.Abs(normalized.GlowStrength - 1) < 0.0001, "glow strength should be clamped");
Check(Math.Abs(normalized.CurrentLineScale - 1.25) < 0.0001, "line scale should be clamped");
Check(Math.Abs(normalized.OtherLinesOpacity - 0.1) < 0.0001, "other line opacity should be clamped");
Check(Math.Abs(normalized.OtherLinesBlurPixels - 4) < 0.0001, "blur should be clamped");
Check(!normalized.ShowSecondLine && !normalized.ShowThirdAndLaterLines, "subline visibility should be preserved");

var invalid = DisplayOptionsSanitizer.Sanitize(new LyricDisplayOptions
{
    DefaultTheme = "unknown",
    UseThemeColor = false,
    HighlightColor = "url(javascript:bad)"
});

Check(invalid.DefaultTheme == ThemeIds.Classic, "unknown themes should fall back to classic");
Check(invalid.HighlightColor == "#ffffff", "unsafe colors should fall back to white");
Check(ThemeIds.All.Count == 5, "the C# theme catalog should match the five frontend themes");

var nullOptions = DisplayOptionsSanitizer.Sanitize(null);
Check(nullOptions.DefaultTheme == ThemeIds.Classic, "null configuration should use defaults");

var validThemeJson = """
{
  "format": "emby-lyric-theme",
  "schemaVersion": 3,
  "name": "V3 test",
  "baseTheme": "album",
  "layouts": {
    "landscape": {
      "lyrics": { "x": 5, "y": 12, "width": 55, "height": 60, "rotation": 0, "z": 12, "opacity": 1, "hidden": false, "locked": false }
    },
    "portrait": {
      "lyrics": { "x": 6, "y": 52, "width": 88, "height": 29, "rotation": 0, "z": 12, "opacity": 1, "hidden": false, "locked": false }
    }
  },
  "artwork": { "source": "url", "url": "https://example.invalid/cover.webp", "mode": "single", "size": 46, "x": 18, "y": 52 },
  "lyrics": { "style": "classic", "currentColor": "#ffffff" },
  "visualizer": {
    "style": "spectrum",
    "frequencyLayout": "centerOut",
    "colors": ["#ffffff"],
    "analysis": { "minFrequency": 30, "maxFrequency": 16000 }
  },
  "mediaFields": { "overview": true, "file": true, "audio": true, "image": false, "lyrics": false }
}
""";
Check(PlayerThemeV2Validator.ValidateThemeJson(validThemeJson, 64 * 1024) == validThemeJson,
    "valid ThemeDocumentV3 JSON should be accepted");
var completeV4Layer = """
{ "anchorX": "start", "anchorY": "start", "x": 72, "y": 36, "width": 360, "height": 180, "rotation": 0, "z": 12, "opacity": 1, "hidden": false, "locked": false }
""";
var completeV4Layout = $$"""
{
  "artwork": {{completeV4Layer}},
  "metadata": {{completeV4Layer}},
  "lyrics": {{completeV4Layer}},
  "visualizer": {{completeV4Layer}},
  "progress": {{completeV4Layer}},
  "transport": {{completeV4Layer}},
  "volume": {{completeV4Layer}},
  "auxiliary": {{completeV4Layer}}
}
""";
var validThemeV4Json = $$"""
{
  "format": "emby-lyric-theme",
  "schemaVersion": 4,
  "layoutModel": "anchored-canvas-v1",
  "name": "V4 test",
  "baseTheme": "album",
  "viewportTransforms": {
    "landscape": { "scale": 1, "offsetX": 0, "offsetY": 0 },
    "portrait": { "scale": 1, "offsetX": 0, "offsetY": 0 }
  },
  "layouts": {
    "landscape": {{completeV4Layout}},
    "portrait": {{completeV4Layout}}
  },
  "artwork": { "source": "emby", "mode": "single", "material": "vinyl" },
  "console": { "material": "minimal", "safeArea": 64 }
}
""";
Check(PlayerThemeV2Validator.ValidateThemeJson(validThemeV4Json, 64 * 1024) == validThemeV4Json,
    "complete anchored ThemeDocumentV4 JSON should be accepted");

var completeV5Layout = $$"""
{
  "artwork": {{completeV4Layer}},
  "metadata": {{completeV4Layer}},
  "lyrics": {{completeV4Layer}},
  "visualizer": {{completeV4Layer}},
  "controlDock": {{completeV4Layer}}
}
""";
var dockGroups = """
{
  "progress": { "visible": true, "order": [], "hiddenButtons": [], "align": "center", "gap": 0 },
  "transport": { "visible": true, "order": ["previous","playPause","next"], "hiddenButtons": [], "align": "center", "gap": 12 },
  "volume": { "visible": true, "order": ["mute","slider","value"], "hiddenButtons": [], "align": "end", "gap": 8 },
  "auxiliary": { "visible": true, "order": ["shuffle","repeat","stop","queue","media","secondaryLyrics","artworkRotation"], "hiddenButtons": [], "align": "start", "gap": 8 }
}
""";
var dockProfile = $$"""
{
  "rows": [
    { "groups": ["progress"], "justify": "center", "align": "center", "gap": 0 },
    { "groups": ["auxiliary","transport","volume"], "justify": "space-between", "align": "center", "gap": 20 }
  ],
  "groups": {{dockGroups}}
}
""";
var validThemeV5Json = $$"""
{
  "format": "emby-lyric-theme",
  "schemaVersion": 5,
  "layoutModel": "fixed-canvas-v1",
  "name": "V5 dock test",
  "baseTheme": "album",
  "viewportTransforms": {
    "landscape": { "scale": 1, "offsetX": 0, "offsetY": 0 },
    "portrait": { "scale": 1, "offsetX": 0, "offsetY": 0 }
  },
  "layouts": { "landscape": {{completeV5Layout}}, "portrait": {{completeV5Layout}} },
  "controls": { "safeArea": 64, "profiles": { "landscape": {{dockProfile}}, "portrait": {{dockProfile}} } },
  "artwork": { "source": "emby", "mode": "single", "material": "vinyl" },
  "console": { "material": "minimal", "safeArea": 64 }
}
""";
Check(PlayerThemeV2Validator.ValidateThemeJson(validThemeV5Json, 128 * 1024) == validThemeV5Json,
    "complete Theme V5 document and dock should be accepted");
var legacyThemeV5Json = validThemeV5Json.Replace("fixed-canvas-v1", "anchored-canvas-v2");
Check(PlayerThemeV2Validator.ValidateThemeJson(legacyThemeV5Json, 128 * 1024) == legacyThemeV5Json,
    "the earlier anchored-canvas-v2 Theme V5 model should remain readable for one-time migration");
var extendedFixedCanvasTheme = validThemeV5Json
    .Replace("\"x\": 72", "\"x\": 1800")
    .Replace("\"width\": 360", "\"width\": 3600");
Check(PlayerThemeV2Validator.ValidateThemeJson(extendedFixedCanvasTheme, 128 * 1024) == extendedFixedCanvasTheme,
    "fixed 1920x1080 and 1080x1920 canvases should accept their expanded design-unit geometry range");

var completeV6Layer = """
{ "x": 96, "y": 120, "width": 480, "height": 240, "rotation": 0, "z": 20, "opacity": 1, "hidden": false, "locked": false }
""";
var completeV6Landscape = $$"""
{
  "canvas": { "width": 1920, "height": 1080 },
  "artwork": {{completeV6Layer}}, "metadata": {{completeV6Layer}}, "lyrics": {{completeV6Layer}},
  "visualizer": {{completeV6Layer}}, "controlDock": {{completeV6Layer}}
}
""";
var completeV6Portrait = completeV6Landscape.Replace(
    "\"width\": 1920, \"height\": 1080", "\"width\": 1080, \"height\": 1920");
var dockGroupsV6 = dockGroups.Replace(
    "\"media\",\"secondaryLyrics\",\"artworkRotation\"",
    "\"media\",\"settings\",\"visualizerToggle\",\"secondaryLyrics\",\"tertiaryLyrics\",\"artworkRotation\"");
var dockProfileV6 = dockProfile.Replace(dockGroups, dockGroupsV6);
var validThemeV6Json = $$"""
{
  "format": "emby-lyric-theme", "schemaVersion": 6, "layoutModel": "fixed-canvas-v1",
  "name": "V6 test", "baseTheme": "album",
  "viewport": { "fit": "contain", "alignX": "center", "alignY": "end" },
  "layouts": { "landscape": {{completeV6Landscape}}, "portrait": {{completeV6Portrait}} },
  "metadata": { "summaryFields": ["title","artist","album","codec","sampleRate"] },
  "systemChrome": { "size": 52, "surface": "glass", "color": "#ffffff", "surfaceColor": "#111827", "radius": 50, "blur": 18, "shadow": 24, "showLabels": false },
  "overlays": {
    "surface": "glass", "surfaceColor": "#111827", "textColor": "#ffffff", "accentColor": "#ffffff",
    "radius": 24, "blur": 24, "opacity": 92, "backdrop": { "dim": 0, "blur": 0 },
    "gap": 12, "margin": 16, "arrowSize": 10, "durationMs": 200,
    "sizes": {
      "media": { "minWidth": 360, "maxWidth": 480, "maxHeight": 56 },
      "queue": { "minWidth": 380, "maxWidth": 460, "maxHeight": 66 },
      "settings": { "minWidth": 420, "maxWidth": 560, "maxHeight": 78 },
      "cast": { "minWidth": 320, "maxWidth": 420, "maxHeight": 56 },
      "volume": { "minWidth": 64, "maxWidth": 96, "maxHeight": 32 }
    }
  },
  "console": { "material": "rainbow", "surfaceColor": "#111827", "textColor": "#ffffff", "accentColor": "#ff4081", "gradientA": "#ff4081", "gradientB": "#3366ff", "gradientAngle": 135, "radius": 28, "blur": 26, "opacity": 72, "borderWidth": 1, "shadow": 28 },
  "volume": { "landscapeMode": "expanded", "portraitMode": "iconPopover", "iconFill": true, "popoverWidth": 72, "popoverHeight": 240 },
  "controls": { "safeArea": 64, "profiles": { "landscape": {{dockProfileV6}}, "portrait": {{dockProfileV6}} } }
}
""";
Check(PlayerThemeV2Validator.ValidateThemeJson(validThemeV6Json, 256 * 1024) == validThemeV6Json,
    "complete ThemeDocumentV6 JSON should be accepted");
var frontendThemeV6Json = File.ReadAllText(Path.Combine(
    AppContext.BaseDirectory, "Fixtures", "theme-v6-frontend.json"));
Check(PlayerThemeV2Validator.ValidateThemeJson(frontendThemeV6Json, 512 * 1024) == frontendThemeV6Json,
    "the real frontend-generated Theme V6 portable fixture should pass the server validator");
var frontendGlobalStateJson = """
{
  "version": 5,
  "layoutRepairRevision": 1,
  "theme": "classic",
  "layout": "album",
  "artworkRotation": true,
  "showSecondLine": true,
  "backgroundMode": "blur",
  "visualizerStyle": "spectrum",
  "visualizerWidth": 62,
  "visualizerHeight": 8,
  "visualizerAmplitude": 70,
  "visualizerColorMode": "dual",
  "visualizerColors": ["#a8e063", "#56d6c9", "#8b9dff"],
  "lyricAlignment": "left",
  "lyricScale": 100,
  "tuning": { "backgroundBlur": 44, "backgroundDim": 64 },
  "activePlayerThemeId": null
}
""";
Check(PlayerThemeV2Validator.ValidateStateJson(frontendGlobalStateJson, 512 * 1024) == frontendGlobalStateJson,
    "the frontend-generated V6 Workspace GlobalStateJson should pass the server validator");
foreach (var invalidV6 in new[]
{
    validThemeV6Json.Replace("\"width\": 1920, \"height\": 1080", "\"width\": 1919, \"height\": 1080"),
    validThemeV6Json.Replace("\"x\": 96", "\"anchorX\": \"start\", \"x\": 96", StringComparison.Ordinal),
    validThemeV6Json.Replace("\"surfaceColor\": \"#111827\"", "\"surfaceColor\": \"url(javascript:bad)\"", StringComparison.Ordinal),
    validThemeV6Json.Replace("\"minWidth\": 360, \"maxWidth\": 480", "\"minWidth\": 600, \"maxWidth\": 480"),
    validThemeV6Json.Replace("\"portraitMode\": \"iconPopover\"", "\"portraitMode\": \"expanded\""),
    validThemeV6Json.Replace(",\"tertiaryLyrics\"", "", StringComparison.Ordinal)
})
{
    try
    {
        PlayerThemeV2Validator.ValidateThemeJson(invalidV6, 256 * 1024);
        Check(false, "invalid V6 canvas, layer, visual token, overlay, volume, or dock must be rejected");
    }
    catch (ArgumentException)
    {
        Check(true, "strict Theme V6 rejection");
    }
}
foreach (var invalidV5 in new[]
{
    validThemeV5Json.Replace("\"controlDock\":", "\"transport\":"),
    validThemeV5Json.Replace("\"playPause\"", "\"previous\""),
    validThemeV5Json.Replace("\"hiddenButtons\": []", "\"hiddenButtons\": [\"playPause\"]", StringComparison.Ordinal)
})
{
    try
    {
        PlayerThemeV2Validator.ValidateThemeJson(invalidV5, 128 * 1024);
        Check(false, "invalid Theme V5 layers or dock controls should be rejected");
    }
    catch (ArgumentException)
    {
        Check(true, "strict Theme V5 dock rejection");
    }
}

foreach (var invalidV4 in new[]
{
    validThemeV4Json.Replace("\"layoutModel\": \"anchored-canvas-v1\",", ""),
    validThemeV4Json.Replace("\"offsetY\": 0", "\"missingOffsetY\": 0"),
    validThemeV4Json.Replace("\"anchorX\": \"start\",", "", StringComparison.Ordinal),
    validThemeV4Json.Replace("\"artwork\": { \"source\": \"emby\"", "\"artwork\": { \"size\": 46, \"source\": \"emby\"")
})
{
    try
    {
        PlayerThemeV2Validator.ValidateThemeJson(invalidV4, 64 * 1024);
        Check(false, "incomplete or duplicate-geometry V4 documents should be rejected");
    }
    catch (ArgumentException)
    {
        Check(true, "strict V4 document rejection");
    }
}
foreach (var invalidInternalV4 in new[]
{
    "{\"v2\":{\"schemaVersion\":4,\"viewportTransforms\":{\"landscape\":{\"scale\":1,\"offsetX\":0,\"offsetY\":0},\"portrait\":{\"scale\":1,\"offsetX\":0,\"offsetY\":0}},\"layouts\":{\"landscape\":{},\"portrait\":{}}}}",
    "{\"v2\":{\"schemaVersion\":4,\"layoutModel\":\"anchored-canvas-v1\",\"viewportTransforms\":{\"landscape\":{\"scale\":1,\"offsetX\":0,\"offsetY\":0},\"portrait\":{\"scale\":1,\"offsetX\":0,\"offsetY\":0}},\"layouts\":{\"landscape\":{},\"portrait\":{}}}}",
    "{\"tuning\":{\"artworkX\":20},\"v2\":{\"schemaVersion\":4,\"layoutModel\":\"anchored-canvas-v1\",\"viewportTransforms\":{\"landscape\":{\"scale\":1,\"offsetX\":0,\"offsetY\":0},\"portrait\":{\"scale\":1,\"offsetX\":0,\"offsetY\":0}},\"layouts\":{\"landscape\":{},\"portrait\":{}}}}"
})
{
    try
    {
        PlayerThemeV2Validator.ValidateThemeJson(invalidInternalV4, 64 * 1024);
        Check(false, "internal V4 documents must require the layout model, all layers, and no duplicate tuning geometry");
    }
    catch (ArgumentException)
    {
        Check(true, "strict internal V4 rejection");
    }
}
var legacyThemeJson = """
{
  "schemaVersion": 2,
  "v2": {
    "schemaVersion": 2,
    "layoutOverrides": { "desktop": true },
    "layouts": {
      "desktop": {
        "lyrics": { "x": 5, "y": 12, "width": 55, "height": 60, "rotation": 0, "z": 12, "opacity": 1, "hidden": false, "locked": false }
      }
    }
  }
}
""";
Check(PlayerThemeV2Validator.ValidateThemeJson(legacyThemeJson, 64 * 1024) == legacyThemeJson,
    "legacy PlayerThemeV2 JSON should remain import-compatible");
Check(PlayerThemeV2Schema.ParameterFamilies.Length >= 12,
    "the server schema should cover all frontend parameter families");

try
{
    PlayerThemeV2Validator.ValidateThemeJson(validThemeJson, 16);
    Check(false, "oversized theme JSON should be rejected");
}
catch (ArgumentException)
{
    Check(true, "oversized theme JSON rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"v2\":{\"controls\":{\"safeArea\":999}}}", 1024);
    Check(false, "registered theme parameters outside their editor range should be rejected by the server");
}
catch (ArgumentException)
{
    Check(true, "registered theme parameter range rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"tuning\":{\"unknownKnob\":1}}", 1024);
    Check(false, "unknown tuning parameters should be rejected instead of silently persisting");
}
catch (ArgumentException)
{
    Check(true, "unknown tuning parameter rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"tuning\":{\"backgroundBlur\":999}}", 1024);
    Check(false, "every tuning value should use the same range as its editor");
}
catch (ArgumentException)
{
    Check(true, "tuning editor range parity");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"v2\":{\"artwork\":{\"clipPath\":\"url(javascript:bad)\"}}}", 2048);
    Check(false, "artwork clipping should only accept a safe polygon");
}
catch (ArgumentException)
{
    Check(true, "safe artwork polygon rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"v2\":{\"typography\":{\"secondary\":{\"fontUrl\":\"http://example.invalid/font.woff2\"}}}}", 2048);
    Check(false, "remote fonts should require HTTPS at every lyric layer");
}
catch (ArgumentException)
{
    Check(true, "unsafe font URL rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"v2\":{\"schemaVersion\":2,\"layoutOverrides\":{\"tablet\":\"yes\"}}}", 2048);
    Check(false, "responsive inheritance markers should be boolean");
}
catch (ArgumentException)
{
    Check(true, "responsive inheritance marker rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"format\":\"emby-lyric-theme\",\"schemaVersion\":3,\"layouts\":{\"landscape\":{},\"portrait\":{}},\"visualizer\":{\"analysis\":{\"minFrequency\":5}}}", 4096);
    Check(false, "V3 visualizer frequencies outside their editor range should be rejected");
}
catch (ArgumentException)
{
    Check(true, "V3 visualizer analysis range rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"format\":\"emby-lyric-theme\",\"schemaVersion\":3,\"layouts\":{\"landscape\":{},\"portrait\":{}},\"artwork\":{\"assetId\":\"private-cover\"}}", 4096);
    Check(false, "portable V3 documents must not retain private artwork asset ids");
}
catch (ArgumentException)
{
    Check(true, "portable V3 private artwork rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"format\":\"emby-lyric-theme\",\"schemaVersion\":3,\"layouts\":{\"landscape\":{},\"portrait\":{}},\"lyrics\":{\"typography\":{\"primary\":{\"fontAssetId\":\"private-font\"}}}}", 4096);
    Check(false, "portable V3 documents must not retain private font asset ids");
}
catch (ArgumentException)
{
    Check(true, "portable V3 private font rejection");
}

try
{
    PlayerThemeV2Validator.NormalizeId("../another-user");
    Check(false, "path traversal ids should be rejected");
}
catch (ArgumentException)
{
    Check(true, "path traversal id rejection");
}

try
{
    PlayerThemeV2Validator.ValidateThemeJson("{\"filePath\":\"C:/secret\"}", 1024);
    Check(false, "filesystem fields should be rejected");
}
catch (ArgumentException)
{
    Check(true, "filesystem field rejection");
}

try
{
    PlayerThemeV2Validator.NormalizeContentType("image/svg+xml", Encoding.UTF8.GetBytes("<svg>"));
    Check(false, "active SVG content should be rejected");
}
catch (ArgumentException)
{
    Check(true, "dangerous MIME rejection");
}

var storeRoot = Path.Combine(Path.GetTempPath(), "emby-lyric-enhance-tests-" + Guid.NewGuid().ToString("N"));
try
{
    var store = new UserThemeStore(storeRoot, new ThemeStoreOptions
    {
        MaxThemeJsonBytes = 64 * 1024,
        MaxAssetBytes = 1024,
        UserQuotaBytes = 16 * 1024 * 1024
    });
    var created = new List<StoredThemeRecord>();
    for (var index = 0; index < 30; index++)
    {
        created.Add(store.CreateTheme(11, new ThemeCreateRequest
        {
            Name = "Theme " + index,
            ThemeJson = validThemeJson
        }));
    }
    Check(store.GetThemes(11).Count == 30, "theme storage should not impose an artificial count limit");
    Check(store.GetThemes(22).Count == 0, "themes should be isolated by authenticated user id");
    Check(store.GetTheme(22, created[0].Id) is null, "another user must not read a theme by guessing its id");
    try
    {
        store.GetWorkspace(0);
        Check(false, "an unauthenticated user id should be rejected");
    }
    catch (UnauthorizedAccessException)
    {
        Check(true, "unauthenticated access rejection");
    }

    var updated = store.UpdateTheme(11, created[0].Id, new ThemeUpdateRequest
    {
        ExpectedRevision = created[0].Revision,
        Name = "Updated",
        ThemeJson = validThemeJson
    });
    Check(!updated.Conflict && updated.Value.Revision == 2, "matching revisions should update atomically");
    var conflict = store.UpdateTheme(11, created[0].Id, new ThemeUpdateRequest
    {
        ExpectedRevision = 1,
        Name = "Concurrent edit",
        ThemeJson = validThemeJson
    });
    Check(conflict.Conflict && conflict.ConflictCopy is not null,
        "stale revisions should preserve both edits by creating a conflict copy");
    Check(store.GetTheme(11, created[0].Id)?.Name == "Updated",
        "revision conflicts must not silently overwrite the current theme");
    try
    {
        store.DeleteTheme(11, created[0].Id, 1);
        Check(false, "a stale revision must not delete the current theme");
    }
    catch (InvalidOperationException)
    {
        Check(store.GetTheme(11, created[0].Id) is not null,
            "delete conflicts should preserve the current theme");
    }

    var workspace = store.PutWorkspace(11, new WorkspaceWriteRequest
    {
        ExpectedRevision = 0,
        ActiveThemeId = created[0].Id,
        DraftJson = validThemeJson,
        GlobalStateJson = "{}",
        LegacyImported = true
    });
    Check(workspace.Value.Revision == 1 && workspace.Value.LegacyImported,
        "workspace drafts should be revisioned and record migration state");
    var workspaceConflict = store.PutWorkspace(11, new WorkspaceWriteRequest
    {
        ExpectedRevision = 0,
        DraftJson = validThemeJson,
        GlobalStateJson = "{}"
    });
    Check(workspaceConflict.Conflict && workspaceConflict.ConflictCopy is not null,
        "concurrent workspace drafts should be preserved as conflict themes");

    var png = new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a };
    using (var stream = new MemoryStream(png))
    {
        var asset = store.PutAsset(11, "cover-test", "cover.png", "image/png", stream, png.Length);
        Check(asset.ContentType == "image/png" && store.GetAsset(11, asset.Id) is not null,
            "private assets should validate signatures and remain readable by their owner");
    }
    Check(store.GetAsset(22, "cover-test") is null, "private assets should be isolated by user");
    try
    {
        using var oversizedAsset = new MemoryStream(new byte[1025]);
        store.PutAsset(11, "too-large", "large.png", "image/png", oversizedAsset, oversizedAsset.Length);
        Check(false, "assets over the configured per-file limit should be rejected");
    }
    catch (ArgumentException)
    {
        Check(true, "oversized asset rejection");
    }
    try
    {
        using var disguisedSvg = new MemoryStream(Encoding.UTF8.GetBytes("<svg></svg>"));
        store.PutAsset(11, "fake-png", "fake.png", "image/png", disguisedSvg, disguisedSvg.Length);
        Check(false, "an allowed MIME with a dangerous file signature should be rejected");
    }
    catch (ArgumentException)
    {
        Check(true, "asset signature mismatch rejection");
    }

    var quotaStore = new UserThemeStore(Path.Combine(storeRoot, "quota-check"), new ThemeStoreOptions
    {
        MaxThemeJsonBytes = 64 * 1024,
        MaxAssetBytes = 1024,
        UserQuotaBytes = 256
    });
    using (var first = new MemoryStream(png))
    {
        quotaStore.PutAsset(33, "tight-cover", "cover.png", "image/png", first, png.Length);
    }
    try
    {
        using var replacement = new MemoryStream(png);
        quotaStore.PutAsset(33, "tight-cover", "cover.png", "image/png", replacement, png.Length);
        Check(false, "asset replacement should include its metadata backup in quota projection");
    }
    catch (InvalidOperationException)
    {
        Check(quotaStore.GetAsset(33, "tight-cover") is not null,
            "a quota failure must preserve the previously stored private asset");
    }

    var themeDirectory = Path.Combine(storeRoot, "users", "u-" + 11L.ToString("x16"), "themes");
    var recoverable = store.CreateTheme(11, new ThemeCreateRequest { Id = "recovery", Name = "Recovery 1", ThemeJson = validThemeJson });
    store.UpdateTheme(11, recoverable.Id, new ThemeUpdateRequest
    {
        ExpectedRevision = recoverable.Revision,
        Name = "Recovery 2",
        ThemeJson = validThemeJson
    });
    File.WriteAllText(Path.Combine(themeDirectory, "recovery.json"), "{broken", Encoding.UTF8);
    Check(store.GetTheme(11, "recovery") is not null,
        "a damaged primary file should recover from the previous atomic backup");
}
finally
{
    if (Directory.Exists(storeRoot))
    {
        Directory.Delete(storeRoot, true);
    }
}

if (failures.Count > 0)
{
    foreach (var failure in failures)
    {
        Console.Error.WriteLine($"FAIL: {failure}");
    }

    Environment.ExitCode = 1;
    return;
}

Console.WriteLine("plugin configuration defaults and sanitization: ok");
