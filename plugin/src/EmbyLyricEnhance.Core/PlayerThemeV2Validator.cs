using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace EmbyLyricEnhance.Core;

public static class PlayerThemeV2Validator
{
    private static readonly Regex SafeId = new("^[A-Za-z0-9_-]{1,64}$", RegexOptions.CultureInvariant);
    private static readonly Regex HexColor = new("^#[0-9A-Fa-f]{6}$", RegexOptions.CultureInvariant);
    private static readonly Regex ClipPath = new("^(?:none|polygon\\([0-9\\s.,%+\\-]+\\))$", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
    private static readonly HashSet<string> Profiles = new(PlayerThemeV2Schema.ResponsiveProfiles, StringComparer.Ordinal);
    private static readonly HashSet<string> LegacyProfiles = new(PlayerThemeV2Schema.LegacyResponsiveProfiles, StringComparer.Ordinal);
    private static readonly HashSet<string> Layers = new(PlayerThemeV2Schema.LayerIds, StringComparer.Ordinal);
    private static readonly HashSet<string> V4Layers = new(PlayerThemeV2Schema.V4LayerIds, StringComparer.Ordinal);
    private static readonly HashSet<string> DockGroups = new(new[] { "progress", "transport", "volume", "auxiliary" }, StringComparer.Ordinal);
    private static readonly IReadOnlyDictionary<string, HashSet<string>> DockButtons =
        new Dictionary<string, HashSet<string>>(StringComparer.Ordinal)
        {
            ["progress"] = new(StringComparer.Ordinal),
            ["transport"] = new(new[] { "previous", "playPause", "next" }, StringComparer.Ordinal),
            ["volume"] = new(new[] { "mute", "slider", "value" }, StringComparer.Ordinal),
            ["auxiliary"] = new(new[] { "shuffle", "repeat", "stop", "queue", "media", "settings", "visualizerToggle",
                "secondaryLyrics", "tertiaryLyrics", "artworkRotation" }, StringComparer.Ordinal)
        };
    private static readonly IReadOnlyDictionary<string, (double Minimum, double Maximum)> TuningRanges =
        new Dictionary<string, (double, double)>(StringComparer.Ordinal)
        {
            ["backgroundBlur"] = (0, 72), ["backgroundDim"] = (20, 88),
            ["artworkScale"] = (35, 140), ["artworkSize"] = (12, 82),
            ["artworkX"] = (0, 100), ["artworkY"] = (4, 88),
            ["metadataWidth"] = (10, 94), ["metadataX"] = (0, 100), ["metadataY"] = (3, 88),
            ["lyricsWidth"] = (10, 96), ["lyricsHeight"] = (12, 80),
            ["lyricsX"] = (0, 100), ["lyricsY"] = (4, 84),
            ["lyricLineGap"] = (90, 180), ["lyricInactiveOpacity"] = (10, 65),
            ["backgroundSaturation"] = (0, 220), ["backgroundAngle"] = (0, 360),
            ["artworkInnerSize"] = (18, 100), ["artworkOuterRadius"] = (0, 50),
            ["artworkInnerRadius"] = (0, 50), ["artworkPadding"] = (0, 18),
            ["artworkBorderWidth"] = (0, 12), ["artworkShadowDepth"] = (0, 64),
            ["coverflowWidth"] = (36, 96), ["coverflowHeight"] = (18, 68),
            ["metadataTitleSize"] = (70, 260), ["metadataArtistSize"] = (70, 220),
            ["metadataAlbumSize"] = (65, 200), ["metadataLetterSpacing"] = (-2, 12),
            ["metadataPadding"] = (0, 48), ["metadataRadius"] = (0, 48),
            ["metadataBlur"] = (0, 48), ["metadataOpacity"] = (0, 100),
            ["lyricsPadding"] = (0, 64), ["lyricsRadius"] = (0, 64),
            ["lyricsBlur"] = (0, 64), ["lyricsOpacity"] = (0, 100),
            ["lyricLetterSpacing"] = (-2, 16), ["lyricPastSize"] = (65, 180),
            ["lyricCurrentSize"] = (70, 220), ["lyricFutureSize"] = (65, 180),
            ["lyricCurrentWeight"] = (300, 900), ["visualizerX"] = (0, 100),
            ["visualizerY"] = (5, 88), ["visualizerRotation"] = (-180, 180),
            ["visualizerOpacity"] = (10, 100), ["progressWidth"] = (28, 92),
            ["progressTrackHeight"] = (2, 12), ["progressThumbSize"] = (8, 26),
            ["volumeWidth"] = (8, 32), ["volumeTrackHeight"] = (2, 12),
            ["volumeThumbSize"] = (8, 24), ["consoleBlur"] = (8, 48),
            ["consoleOpacity"] = (28, 96), ["mediaWidth"] = (18, 54),
            ["mediaMaxHeight"] = (28, 88), ["mediaRadius"] = (0, 48),
            ["mediaBlur"] = (0, 48), ["mediaOpacity"] = (20, 100)
        };
    private static readonly IReadOnlyDictionary<string, (double Minimum, double Maximum)> AnalysisRanges =
        new Dictionary<string, (double, double)>(StringComparer.Ordinal)
        {
            ["sensitivity"] = (50, 220), ["response"] = (10, 100),
            ["smoothing"] = (0, 85), ["minFrequency"] = (20, 400),
            ["maxFrequency"] = (6000, 22000), ["density"] = (24, 96),
            ["bassBoost"] = (0, 200)
        };
    private static readonly HashSet<string> ThemeColorIds = new(new[]
    {
        "backgroundA", "backgroundB", "artworkFrame", "metadataText", "metadataSurface",
        "lyricsSurface", "lyricPast", "lyricCurrent", "lyricFuture", "progressActive",
        "progressTrack", "volumeActive", "volumeTrack", "mediaSurface"
    }, StringComparer.Ordinal);
    private static readonly HashSet<string> MediaFieldIds = new(new[]
    {
        "overview", "file", "audio", "image", "lyrics"
    }, StringComparer.Ordinal);
    private static readonly HashSet<string> MetadataSummaryFieldIds = new(new[]
    {
        "title", "artist", "album", "container", "codec", "sampleRate", "bitDepth", "channels", "bitrate"
    }, StringComparer.Ordinal);
    private static readonly string[] OverlayKinds = { "media", "queue", "settings", "cast", "volume" };
    private static readonly HashSet<string> LegacyGeometryTuningIds = new(new[]
    {
        "artworkSize", "artworkX", "artworkY", "metadataWidth", "metadataX", "metadataY",
        "lyricsWidth", "lyricsHeight", "lyricsX", "lyricsY", "visualizerX", "visualizerY",
        "visualizerRotation", "visualizerOpacity", "progressWidth", "volumeWidth"
    }, StringComparer.Ordinal);

    public static string NormalizeId(string? value, string parameterName = "id")
    {
        var candidate = value?.Trim() ?? "";
        if (!SafeId.IsMatch(candidate) || candidate.Contains("..", StringComparison.Ordinal))
        {
            throw new ArgumentException($"{parameterName} contains unsafe characters.", parameterName);
        }

        return candidate;
    }

    public static string NormalizeName(string? value)
    {
        var candidate = (value ?? "").Trim();
        if (candidate.Length == 0)
        {
            candidate = "未命名主题";
        }

        if (candidate.Length > 80)
        {
            candidate = candidate[..80];
        }

        return candidate;
    }

    public static string ValidateThemeJson(string? json, int maximumBytes)
    {
        var candidate = string.IsNullOrWhiteSpace(json) ? "{}" : json;
        if (Encoding.UTF8.GetByteCount(candidate) > maximumBytes)
        {
            throw new ArgumentException("Theme JSON exceeds the configured size limit.", nameof(json));
        }

        using var document = JsonDocument.Parse(candidate, new JsonDocumentOptions
        {
            AllowTrailingCommas = false,
            CommentHandling = JsonCommentHandling.Disallow,
            MaxDepth = 32
        });
        if (document.RootElement.ValueKind != JsonValueKind.Object)
        {
            throw new ArgumentException("Theme JSON root must be an object.", nameof(json));
        }

        ValidateElement(document.RootElement, 0);
        if (IsPortableV3Document(document.RootElement))
        {
            ValidatePortableV3Document(document.RootElement);
        }
        else
        {
            ValidateLayouts(document.RootElement);
            ValidateThemeParameterFamilies(document.RootElement);
            ValidateExternalUrl(document.RootElement, "artwork", "url");
            ValidateExternalUrl(document.RootElement, "font", "url");
        }
        return candidate;
    }

    public static string ValidateStateJson(string? json, int maximumBytes)
    {
        return ValidateThemeJson(json, maximumBytes);
    }

    public static string NormalizeContentType(string? value, ReadOnlySpan<byte> header)
    {
        var contentType = (value ?? "").Split(';')[0].Trim().ToLowerInvariant();
        return contentType switch
        {
            "image/png" when StartsWith(header, 0x89, 0x50, 0x4e, 0x47) => contentType,
            "image/jpeg" when StartsWith(header, 0xff, 0xd8, 0xff) => contentType,
            "image/webp" when header.Length >= 12
                && Encoding.ASCII.GetString(header[..4]) == "RIFF"
                && Encoding.ASCII.GetString(header.Slice(8, 4)) == "WEBP" => contentType,
            "image/avif" when header.Length >= 12
                && Encoding.ASCII.GetString(header.Slice(4, 4)) == "ftyp"
                && Encoding.ASCII.GetString(header.Slice(8, 4)).Contains("avif", StringComparison.OrdinalIgnoreCase) => contentType,
            "font/woff2" when header.Length >= 4 && Encoding.ASCII.GetString(header[..4]) == "wOF2" => contentType,
            _ => throw new ArgumentException("The uploaded MIME type or file signature is not allowed.", nameof(value))
        };
    }

    private static bool IsPortableV3Document(JsonElement root)
    {
        return TryGetPropertyIgnoreCase(root, "format", out _)
            || TryGetPropertyIgnoreCase(root, "layouts", out _);
    }

    private static void ValidatePortableV3Document(JsonElement root)
    {
        RejectUnknownProperties(root, "document",
            "format", "schemaVersion", "layoutModel", "name", "baseTheme", "layouts", "viewport", "viewportTransforms", "background",
            "artwork", "metadata", "lyrics", "visualizer", "systemChrome", "console", "controls", "volume", "overlays",
            "mediaCard", "mediaFields");
        if (!TryGetPropertyIgnoreCase(root, "format", out _)
            || !TryGetPropertyIgnoreCase(root, "schemaVersion", out _))
        {
            throw new ArgumentException("Theme V3/V4 must declare its format and schema version.");
        }
        ValidateOptionalEnum(root, "format", PlayerThemeV2Schema.DocumentFormat);
        ValidateOptionalNumber(root, "schemaVersion", PlayerThemeV2Schema.V3Version, PlayerThemeV2Schema.Version);
        var version = GetOptionalInteger(root, "schemaVersion", PlayerThemeV2Schema.V3Version);
        if (version >= PlayerThemeV2Schema.PreviousVersion)
        {
            if (!TryGetPropertyIgnoreCase(root, "layoutModel", out _))
            {
                throw new ArgumentException("Theme V4 must declare its anchored canvas layout model.");
            }
            ValidateOptionalEnum(root, "layoutModel", version >= PlayerThemeV2Schema.V5Version
                ? new[] { PlayerThemeV2Schema.LayoutModel, PlayerThemeV2Schema.LegacyV5LayoutModel }
                : new[] { PlayerThemeV2Schema.PreviousLayoutModel });
            if (version < PlayerThemeV2Schema.Version)
            {
                if (!TryGetPropertyIgnoreCase(root, "viewportTransforms", out var viewportTransforms))
                {
                    throw new ArgumentException("Theme V4 must contain both viewport transforms.");
                }
                ValidateViewportTransforms(viewportTransforms);
            }
        }
        ValidateOptionalString(root, "name", 80);
        ValidateOptionalEnum(root, "baseTheme",
            "album", "center", "mobile", "mint", "deck", "stack", "coverflow", "lyrics", "rose");
        if (!TryGetPropertyIgnoreCase(root, "layouts", out var layouts))
        {
            throw new ArgumentException("Theme V3 must contain responsive layouts.");
        }
        ValidateLayoutsValue(layouts, Profiles, requireAllProfiles: true, anchored: version >= PlayerThemeV2Schema.PreviousVersion,
            fixedCanvas: version == PlayerThemeV2Schema.Version,
            allowedLayers: version >= PlayerThemeV2Schema.V5Version ? Layers : (version == PlayerThemeV2Schema.PreviousVersion ? V4Layers : Layers));
        if (version == PlayerThemeV2Schema.Version) { ValidatePortableV6Sections(root); }
        if (version >= PlayerThemeV2Schema.V5Version)
        {
            if (!TryGetPropertyIgnoreCase(root, "controls", out var controls))
            {
                throw new ArgumentException("Theme V5 must contain control dock profiles.");
            }
            ValidateControlDock(controls, requireProfiles: true, strictV6: version == PlayerThemeV2Schema.Version);
        }

        if (TryGetPropertyIgnoreCase(root, "background", out var background))
        {
            RequireObject(background, "background");
            RejectUnknownProperties(background, "background",
                "mode", "blur", "dim", "saturation", "angle", "colorA", "colorB");
            ValidateOptionalEnum(background, "mode", "black", "white", "blur", "gradient");
            ValidateMappedNumbers(background, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["blur"] = "backgroundBlur", ["dim"] = "backgroundDim",
                ["saturation"] = "backgroundSaturation", ["angle"] = "backgroundAngle"
            });
            ValidateOptionalColor(background, "colorA");
            ValidateOptionalColor(background, "colorB");
        }

        if (TryGetPropertyIgnoreCase(root, "artwork", out var artwork))
        {
            RequireObject(artwork, "artwork");
            var artworkKeys = new List<string>
            {
                "source", "url", "assetId", "fit", "focusX", "focusY", "clipPath",
                "mode", "material", "rotation", "scale", "innerSize", "outerRadius",
                "innerRadius", "padding", "borderWidth", "shadowDepth", "coverflowWidth",
                "coverflowHeight", "frameColor"
            };
            if (version == PlayerThemeV2Schema.V3Version)
            {
                artworkKeys.AddRange(new[] { "size", "x", "y" });
            }
            RejectUnknownProperties(artwork, "artwork", artworkKeys.ToArray());
            ValidateOptionalEnum(artwork, "source", "emby", "url", "asset");
            ValidateOptionalEnum(artwork, "fit", "cover", "contain", "fill", "none", "scale-down");
            ValidateOptionalEnum(artwork, "mode", "single", "coverflow");
            ValidateOptionalEnum(artwork, "material", "plain", "vinyl", "poster", "turntable", "neumorphic", "deck", "stack", "coverflow");
            ValidateOptionalBoolean(artwork, "rotation");
            ValidateOptionalNumber(artwork, "focusX", 0, 100);
            ValidateOptionalNumber(artwork, "focusY", 0, 100);
            ValidateOptionalSafeId(artwork, "assetId");
            if (version < PlayerThemeV2Schema.Version) { RejectPortablePrivateAsset(artwork, "assetId"); }
            ValidateOptionalHttpsUrl(artwork, "url");
            ValidateOptionalClipPath(artwork, "clipPath");
            ValidateOptionalColor(artwork, "frameColor");
            ValidateMappedNumbers(artwork, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["scale"] = "artworkScale", ["innerSize"] = "artworkInnerSize",
                ["outerRadius"] = "artworkOuterRadius", ["innerRadius"] = "artworkInnerRadius",
                ["padding"] = "artworkPadding", ["borderWidth"] = "artworkBorderWidth",
                ["shadowDepth"] = "artworkShadowDepth", ["coverflowWidth"] = "coverflowWidth",
                ["coverflowHeight"] = "coverflowHeight"
            });
            if (version == PlayerThemeV2Schema.V3Version)
            {
                ValidateMappedNumbers(artwork, new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["size"] = "artworkSize", ["x"] = "artworkX", ["y"] = "artworkY"
                });
            }
        }

        if (TryGetPropertyIgnoreCase(root, "metadata", out var metadata))
        {
            RequireObject(metadata, "metadata");
            var metadataKeys = new List<string>
            {
                "anchor", "align", "surface", "titleSize", "artistSize", "albumSize",
                "letterSpacing", "padding", "radius", "blur", "opacity", "textColor", "surfaceColor", "summaryFields"
            };
            if (version == PlayerThemeV2Schema.V3Version) { metadataKeys.AddRange(new[] { "width", "x", "y" }); }
            RejectUnknownProperties(metadata, "metadata", metadataKeys.ToArray());
            ValidateOptionalEnum(metadata, "anchor", "start", "center", "end");
            ValidateOptionalEnum(metadata, "align", "left", "center", "right");
            ValidateOptionalEnum(metadata, "surface", "none", "glass", "inset", "embossed", "floating");
            ValidateOptionalColor(metadata, "textColor");
            ValidateOptionalColor(metadata, "surfaceColor");
            ValidateMappedNumbers(metadata, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["titleSize"] = "metadataTitleSize", ["artistSize"] = "metadataArtistSize",
                ["albumSize"] = "metadataAlbumSize", ["letterSpacing"] = "metadataLetterSpacing",
                ["padding"] = "metadataPadding", ["radius"] = "metadataRadius",
                ["blur"] = "metadataBlur", ["opacity"] = "metadataOpacity"
            });
            if (version == PlayerThemeV2Schema.V3Version)
            {
                ValidateMappedNumbers(metadata, new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["width"] = "metadataWidth", ["x"] = "metadataX", ["y"] = "metadataY"
                });
            }
        }

        if (TryGetPropertyIgnoreCase(root, "lyrics", out var lyrics))
        {
            RequireObject(lyrics, "lyrics");
            var lyricKeys = new List<string>
            {
                "style", "alignment", "scale", "surface",
                "lineHeight", "inactiveOpacity", "padding", "radius", "blur", "opacity",
                "letterSpacing", "pastSize", "currentSize", "futureSize", "currentWeight",
                "pastColor", "currentColor", "futureColor", "surfaceColor", "showSecondLine",
                "showThirdAndLaterLines", "followDelayMs", "typography"
            };
            if (version == PlayerThemeV2Schema.V3Version) { lyricKeys.AddRange(new[] { "width", "height", "x", "y" }); }
            RejectUnknownProperties(lyrics, "lyrics", lyricKeys.ToArray());
            ValidateOptionalEnum(lyrics, "style", "classic", "focus", "gradient", "apple", "minimal");
            ValidateOptionalEnum(lyrics, "alignment", "left", "center", "right");
            ValidateOptionalEnum(lyrics, "surface", "none", "glass", "inset", "embossed", "floating");
            ValidateOptionalNumber(lyrics, "scale", 70, 170);
            ValidateOptionalBoolean(lyrics, "showSecondLine");
            ValidateOptionalBoolean(lyrics, "showThirdAndLaterLines");
            ValidateOptionalNumber(lyrics, "followDelayMs", 1000, 60000);
            foreach (var colorName in new[] { "pastColor", "currentColor", "futureColor", "surfaceColor" })
            {
                ValidateOptionalColor(lyrics, colorName);
            }
            ValidateMappedNumbers(lyrics, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["lineHeight"] = "lyricLineGap",
                ["inactiveOpacity"] = "lyricInactiveOpacity", ["padding"] = "lyricsPadding",
                ["radius"] = "lyricsRadius", ["blur"] = "lyricsBlur", ["opacity"] = "lyricsOpacity",
                ["letterSpacing"] = "lyricLetterSpacing", ["pastSize"] = "lyricPastSize",
                ["currentSize"] = "lyricCurrentSize", ["futureSize"] = "lyricFutureSize",
                ["currentWeight"] = "lyricCurrentWeight"
            });
            if (version == PlayerThemeV2Schema.V3Version)
            {
                ValidateMappedNumbers(lyrics, new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["width"] = "lyricsWidth", ["height"] = "lyricsHeight", ["x"] = "lyricsX", ["y"] = "lyricsY"
                });
            }
            if (TryGetPropertyIgnoreCase(lyrics, "typography", out var typography))
            {
                ValidateTypographyCollection(typography);
                foreach (var line in typography.EnumerateObject())
                {
                    if (version < PlayerThemeV2Schema.Version) { RejectPortablePrivateAsset(line.Value, "fontAssetId"); }
                }
            }
        }

        if (TryGetPropertyIgnoreCase(root, "visualizer", out var visualizer))
        {
            RequireObject(visualizer, "visualizer");
            var visualizerKeys = new List<string>
            {
                "style", "frequencyLayout", "width", "height", "amplitude", "colorMode", "colors", "analysis"
            };
            if (version == PlayerThemeV2Schema.V3Version) { visualizerKeys.AddRange(new[] { "x", "y", "rotation", "opacity" }); }
            RejectUnknownProperties(visualizer, "visualizer", visualizerKeys.ToArray());
            ValidateOptionalEnum(visualizer, "style",
                "spectrum", "mirror", "waveform", "fall", "curve", "line", "chroma", "balls", "pulse");
            ValidateOptionalEnum(visualizer, "frequencyLayout", "centerOut", "lowToHigh", "radial");
            ValidateOptionalEnum(visualizer, "colorMode", "solid", "dual", "multi", "rainbow");
            ValidateOptionalNumber(visualizer, "width", 10, 100);
            ValidateOptionalNumber(visualizer, "height", 2, 30);
            ValidateOptionalNumber(visualizer, "amplitude", 25, 140);
            if (version == PlayerThemeV2Schema.V3Version)
            {
                ValidateMappedNumbers(visualizer, new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["x"] = "visualizerX", ["y"] = "visualizerY",
                    ["rotation"] = "visualizerRotation", ["opacity"] = "visualizerOpacity"
                });
            }
            ValidateOptionalColorArray(visualizer, "colors");
            if (TryGetPropertyIgnoreCase(visualizer, "analysis", out var analysis))
            {
                ValidateRangedObjectValue(analysis, "visualizer.analysis", AnalysisRanges);
            }
        }

        if (TryGetPropertyIgnoreCase(root, "console", out var consoleStyle))
        {
            RequireObject(consoleStyle, "console");
            var consoleKeys = new List<string>
            {
                "material", "progressHeight", "progressThumbSize", "volumeHeight",
                "volumeThumbSize", "blur", "opacity", "progressActive", "progressTrack",
                "volumeActive", "volumeTrack", "safeArea", "surfaceColor", "textColor", "accentColor",
                "gradientA", "gradientB", "gradientAngle", "radius", "borderWidth", "shadow"
            };
            if (version == PlayerThemeV2Schema.V3Version) { consoleKeys.AddRange(new[] { "progressWidth", "volumeWidth" }); }
            RejectUnknownProperties(consoleStyle, "console", consoleKeys.ToArray());
            ValidateOptionalEnum(consoleStyle, "material", "glass", "minimal", "black", "white", "gradient", "rainbow",
                "neumorphic", "deck", "poster");
            ValidateMappedNumbers(consoleStyle, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["progressHeight"] = "progressTrackHeight", ["progressThumbSize"] = "progressThumbSize",
                ["volumeHeight"] = "volumeTrackHeight", ["volumeThumbSize"] = "volumeThumbSize",
                ["blur"] = "consoleBlur", ["opacity"] = "consoleOpacity"
            });
            if (version == PlayerThemeV2Schema.V3Version)
            {
                ValidateMappedNumbers(consoleStyle, new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["progressWidth"] = "progressWidth", ["volumeWidth"] = "volumeWidth"
                });
            }
            ValidateOptionalNumber(consoleStyle, "safeArea", 44, 180);
            foreach (var colorName in new[] { "progressActive", "progressTrack", "volumeActive", "volumeTrack" })
            {
                ValidateOptionalColor(consoleStyle, colorName);
            }
        }
        if (TryGetPropertyIgnoreCase(root, "controls", out var portableControls))
        {
            ValidateControlDock(portableControls, requireProfiles: version >= PlayerThemeV2Schema.V5Version,
                strictV6: version == PlayerThemeV2Schema.Version);
        }

        if (TryGetPropertyIgnoreCase(root, "mediaCard", out var mediaCard))
        {
            RequireObject(mediaCard, "mediaCard");
            RejectUnknownProperties(mediaCard, "mediaCard",
                "surface", "width", "maxHeight", "radius", "blur", "opacity", "surfaceColor",
                "popupOpacity", "popupRadius");
            ValidateOptionalEnum(mediaCard, "surface", "none", "glass", "inset", "embossed", "floating");
            ValidateMappedNumbers(mediaCard, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["width"] = "mediaWidth", ["maxHeight"] = "mediaMaxHeight",
                ["radius"] = "mediaRadius", ["blur"] = "mediaBlur", ["opacity"] = "mediaOpacity"
            });
            ValidateOptionalColor(mediaCard, "surfaceColor");
            ValidateOptionalNumber(mediaCard, "popupOpacity", 35, 100);
            ValidateOptionalNumber(mediaCard, "popupRadius", 0, 64);
        }

        ValidateBooleanObject(root, "mediaFields", MediaFieldIds);
    }

    private static void ValidateThemeV6Sections(JsonElement root, int version)
    {
        if (version < PlayerThemeV2Schema.Version) { return; }
        ValidateV6Viewport(RequireProperty(root, "viewport", "Theme V6 must define viewport fitting."));
        var metadata = RequireProperty(root, "metadata", "Theme V6 must define metadata fields.");
        RequireObject(metadata, "metadata");
        RejectUnknownProperties(metadata, "metadata", "summaryFields");
        ValidateMetadataSummaryFields(metadata, required: true);
        ValidateSystemChrome(RequireProperty(root, "systemChrome", "Theme V6 must define systemChrome."));
        ValidateOverlays(RequireProperty(root, "overlays", "Theme V6 must define overlays."));
        ValidateV6Console(RequireProperty(root, "console", "Theme V6 must define console."), portable: false);
        ValidateVolume(RequireProperty(root, "volume", "Theme V6 must define volume."));
    }

    private static void ValidateLayouts(JsonElement root)
    {
        if (!TryGetPropertyIgnoreCase(root, "v2", out var v2))
        {
            return;
        }
        RequireObject(v2, "v2");

        var version = GetOptionalInteger(v2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion);
        if (version is not (PlayerThemeV2Schema.LegacyVersion or PlayerThemeV2Schema.V3Version
            or PlayerThemeV2Schema.PreviousVersion or PlayerThemeV2Schema.V5Version or PlayerThemeV2Schema.Version))
        {
            throw new ArgumentException("Theme schema version is unsupported.");
        }
        if (!TryGetPropertyIgnoreCase(v2, "layouts", out var layouts))
        {
            if (version >= PlayerThemeV2Schema.PreviousVersion)
            {
                throw new ArgumentException("Theme V4 must contain both anchored layouts.");
            }
            return;
        }
        RequireObject(layouts, "layouts");
        ValidateLayoutsValue(
            layouts,
            version >= PlayerThemeV2Schema.V3Version ? Profiles : LegacyProfiles,
            requireAllProfiles: version >= PlayerThemeV2Schema.PreviousVersion,
            anchored: version >= PlayerThemeV2Schema.PreviousVersion,
            fixedCanvas: version == PlayerThemeV2Schema.Version,
            allowedLayers: version >= PlayerThemeV2Schema.V5Version ? Layers
                : (version == PlayerThemeV2Schema.PreviousVersion ? V4Layers : Layers));
    }

    private static void ValidateLayoutsValue(
        JsonElement layouts,
        HashSet<string> allowedProfiles,
        bool requireAllProfiles,
        bool anchored = false,
        bool fixedCanvas = false,
        HashSet<string>? allowedLayers = null)
    {
        allowedLayers ??= Layers;
        RequireObject(layouts, "layouts");
        var seenProfiles = new HashSet<string>(StringComparer.Ordinal);
        foreach (var profile in layouts.EnumerateObject())
        {
            if (!allowedProfiles.Contains(profile.Name) || profile.Value.ValueKind != JsonValueKind.Object)
            {
                throw new ArgumentException("Theme contains an unknown responsive profile.");
            }
            seenProfiles.Add(profile.Name);
            var seenLayers = new HashSet<string>(StringComparer.Ordinal);
            var sawCanvas = false;

            foreach (var layer in profile.Value.EnumerateObject())
            {
                if (layer.Name == "canvas")
                {
                    if (!fixedCanvas)
                    {
                        throw new ArgumentException("Only Theme V6 can define a fixed canvas.");
                    }
                    RequireObject(layer.Value, $"layouts.{profile.Name}.canvas");
                    RejectUnknownProperties(layer.Value, $"layouts.{profile.Name}.canvas", "width", "height");
                    var expectedWidth = profile.Name == "landscape" ? 1920 : 1080;
                    var expectedHeight = profile.Name == "landscape" ? 1080 : 1920;
                    if (!TryGetPropertyIgnoreCase(layer.Value, "width", out var canvasWidth)
                        || !TryGetPropertyIgnoreCase(layer.Value, "height", out var canvasHeight)
                        || canvasWidth.ValueKind != JsonValueKind.Number || canvasHeight.ValueKind != JsonValueKind.Number
                        || !canvasWidth.TryGetDouble(out var actualWidth) || !canvasHeight.TryGetDouble(out var actualHeight)
                        || actualWidth != expectedWidth || actualHeight != expectedHeight)
                    {
                        throw new ArgumentException("Theme V6 canvas dimensions are fixed.");
                    }
                    sawCanvas = true;
                    continue;
                }
                if (!allowedLayers.Contains(layer.Name) || layer.Value.ValueKind != JsonValueKind.Object)
                {
                    throw new ArgumentException("Theme contains an unknown editable layer.");
                }
                seenLayers.Add(layer.Name);

                ValidateLayer(layer.Value, anchored, fixedCanvas);
            }
            if (fixedCanvas && !sawCanvas)
            {
                throw new ArgumentException("Theme V6 layouts must declare their fixed canvas.");
            }
            if (anchored && !allowedLayers.SetEquals(seenLayers))
            {
                throw new ArgumentException("Theme V4 layouts must contain all editable layers.");
            }
        }
        if (requireAllProfiles && !allowedProfiles.SetEquals(seenProfiles))
        {
            throw new ArgumentException("Theme V3 must define both landscape and portrait layouts.");
        }
    }

    private static void ValidateLayer(JsonElement layer, bool anchored, bool fixedCanvas)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var property in layer.EnumerateObject())
        {
            seen.Add(property.Name);
            if (property.Name is "anchorX" or "anchorY")
            {
                if (fixedCanvas || !anchored || property.Value.ValueKind != JsonValueKind.String
                    || property.Value.GetString() is not ("start" or "center" or "end"))
                {
                    throw new ArgumentException("Layer anchor is unsupported.");
                }
                continue;
            }
            if (property.Name is "hidden" or "locked")
            {
                if (property.Value.ValueKind is not JsonValueKind.True and not JsonValueKind.False)
                {
                    throw new ArgumentException("Layer visibility and lock values must be boolean.");
                }
                continue;
            }

            if (property.Name is not ("x" or "y" or "width" or "height" or "rotation" or "z" or "opacity"))
            {
                throw new ArgumentException("Theme contains an unknown layer parameter.");
            }

            if (property.Value.ValueKind != JsonValueKind.Number || !property.Value.TryGetDouble(out var value)
                || double.IsNaN(value) || double.IsInfinity(value))
            {
                throw new ArgumentException("Layer geometry must contain finite numbers.");
            }

            var valid = property.Name switch
            {
                "x" or "y" => anchored ? value is >= -1920 and <= 1920 : value is >= -100 and <= 200,
                "width" or "height" => anchored ? value is >= 44 and <= 3840 : value is >= 1 and <= 200,
                "rotation" => value is >= -360 and <= 360,
                "z" => value is >= 0 and <= 1000,
                "opacity" => value is >= 0 and <= 1,
                _ => false
            };
            if (!valid)
            {
                throw new ArgumentException("Layer geometry is outside its supported range.");
            }
        }
        if (anchored)
        {
            var required = fixedCanvas
                ? new[] { "x", "y", "width", "height", "rotation", "z", "opacity", "hidden", "locked" }
                : new[] { "anchorX", "anchorY", "x", "y", "width", "height", "rotation", "z", "opacity", "hidden", "locked" };
            if (required.Any(name => !seen.Contains(name)))
            {
                throw new ArgumentException("Theme V4 layers must contain complete anchored geometry.");
            }
        }
    }

    private static void ValidateViewportTransforms(JsonElement transforms)
    {
        RequireObject(transforms, "viewportTransforms");
        RejectUnknownProperties(transforms, "viewportTransforms", PlayerThemeV2Schema.ResponsiveProfiles);
        foreach (var profile in PlayerThemeV2Schema.ResponsiveProfiles)
        {
            if (!TryGetPropertyIgnoreCase(transforms, profile, out var transform))
            {
                throw new ArgumentException("Theme V4 must define both viewport transforms.");
            }
            RequireObject(transform, $"viewportTransforms.{profile}");
            RejectUnknownProperties(transform, $"viewportTransforms.{profile}", "scale", "offsetX", "offsetY");
            foreach (var property in new[] { "scale", "offsetX", "offsetY" })
            {
                if (!TryGetPropertyIgnoreCase(transform, property, out _))
                {
                    throw new ArgumentException("Theme V4 viewport transforms must be complete.");
                }
            }
            ValidateOptionalNumber(transform, "scale", .5, 1.6);
            ValidateOptionalNumber(transform, "offsetX", -600, 600);
            ValidateOptionalNumber(transform, "offsetY", -600, 600);
        }
    }

    private static void ValidateThemeParameterFamilies(JsonElement root)
    {
        var internalVersion = PlayerThemeV2Schema.LegacyVersion;
        if (TryGetPropertyIgnoreCase(root, "v2", out var versionedV2)
            && versionedV2.ValueKind == JsonValueKind.Object)
        {
            internalVersion = GetOptionalInteger(versionedV2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion);
        }
        ValidateRangedObject(root, "tuning", TuningRanges);
        if (internalVersion >= PlayerThemeV2Schema.PreviousVersion
            && TryGetPropertyIgnoreCase(root, "tuning", out var v4Tuning)
            && v4Tuning.ValueKind == JsonValueKind.Object
            && v4Tuning.EnumerateObject().Any(property => LegacyGeometryTuningIds.Contains(property.Name)))
        {
            throw new ArgumentException("Theme V4 tuning cannot contain duplicate geometry fields.");
        }
        ValidateHexColorObject(root, "colors", ThemeColorIds);
        ValidateBooleanObject(root, "mediaFields", MediaFieldIds);

        if (TryGetPropertyIgnoreCase(root, "choices", out var choices))
        {
            RequireObject(choices, "choices");
            RejectUnknownProperties(choices, "choices",
                "artworkMode", "artworkMaterial", "controlMaterial", "metadataAnchor", "metadataAlign",
                "metadataSurface", "lyricsSurface", "mediaSurface");
            ValidateOptionalEnum(choices, "artworkMode", "single", "coverflow");
            ValidateOptionalEnum(choices, "artworkMaterial", "plain", "vinyl", "poster", "turntable", "neumorphic", "deck", "stack", "coverflow");
            ValidateOptionalEnum(choices, "controlMaterial", "glass", "minimal", "black", "white", "gradient", "rainbow",
                "neumorphic", "deck", "poster");
            ValidateOptionalEnum(choices, "metadataAnchor", "start", "center", "end");
            ValidateOptionalEnum(choices, "metadataAlign", "left", "center", "right");
            foreach (var name in new[] { "metadataSurface", "lyricsSurface", "mediaSurface" })
            {
                ValidateOptionalEnum(choices, name, "none", "glass", "inset", "embossed", "floating");
            }
        }

        if (TryGetPropertyIgnoreCase(root, "player", out var player))
        {
            RequireObject(player, "player");
            RejectUnknownProperties(player, "player",
                "theme", "backgroundMode", "visualizerStyle", "visualizerWidth", "visualizerHeight",
                "visualizerAmplitude", "visualizerColorMode", "visualizerColors", "lyricAlignment",
                "lyricScale", "artworkRotation");
            ValidateOptionalEnum(player, "theme", "classic", "focus", "gradient", "apple", "minimal");
            ValidateOptionalEnum(player, "backgroundMode", "black", "white", "blur", "gradient");
            ValidateOptionalEnum(player, "visualizerStyle",
                "spectrum", "mirror", "waveform", "fall", "curve", "line", "chroma", "balls", "pulse");
            ValidateOptionalEnum(player, "visualizerColorMode", "solid", "dual", "multi", "rainbow");
            ValidateOptionalEnum(player, "lyricAlignment", "left", "center", "right");
            ValidateOptionalNumber(player, "visualizerWidth", 10, 100);
            ValidateOptionalNumber(player, "visualizerHeight", 2, 30);
            ValidateOptionalNumber(player, "visualizerAmplitude", 25, 140);
            ValidateOptionalNumber(player, "lyricScale", 70, 170);
            ValidateOptionalBoolean(player, "artworkRotation");
            if (TryGetPropertyIgnoreCase(player, "visualizerColors", out var colors))
            {
                if (colors.ValueKind != JsonValueKind.Array || colors.GetArrayLength() > 8
                    || colors.EnumerateArray().Any(value => value.ValueKind != JsonValueKind.String
                        || !HexColor.IsMatch(value.GetString() ?? "")))
                {
                    throw new ArgumentException("Player visualizer colors are invalid.");
                }
            }
        }

        if (!TryGetPropertyIgnoreCase(root, "v2", out var v2))
        {
            return;
        }
        RequireObject(v2, "v2");
        RejectUnknownProperties(v2, "v2",
            "schemaVersion", "layoutModel", "layouts", "layoutOverrides", "viewport", "viewportTransforms", "lyrics", "artwork",
            "metadata", "visualizer", "systemChrome", "overlays", "console", "volume", "popupStyle", "controls", "typography");
        ValidateOptionalNumber(v2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion, PlayerThemeV2Schema.Version);
        var v2Version = GetOptionalInteger(v2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion);
        if (v2Version == PlayerThemeV2Schema.Version) { ValidateThemeV6Sections(v2, v2Version); }
        var responsiveProfiles = v2Version >= PlayerThemeV2Schema.V3Version
            ? PlayerThemeV2Schema.ResponsiveProfiles
            : PlayerThemeV2Schema.LegacyResponsiveProfiles;

        if (v2Version >= PlayerThemeV2Schema.PreviousVersion)
        {
            if (!TryGetPropertyIgnoreCase(v2, "layoutModel", out _))
            {
                throw new ArgumentException("Theme V4 must declare its anchored canvas layout model.");
            }
            ValidateOptionalEnum(v2, "layoutModel", v2Version >= PlayerThemeV2Schema.V5Version
                ? new[] { PlayerThemeV2Schema.LayoutModel, PlayerThemeV2Schema.LegacyV5LayoutModel }
                : new[] { PlayerThemeV2Schema.PreviousLayoutModel });
            if (v2Version < PlayerThemeV2Schema.Version)
            {
                if (!TryGetPropertyIgnoreCase(v2, "viewportTransforms", out var transforms))
                {
                    throw new ArgumentException("Theme V4 must contain both viewport transforms.");
                }
                ValidateViewportTransforms(transforms);
            }
            if (TryGetPropertyIgnoreCase(v2, "layoutOverrides", out _))
            {
                throw new ArgumentException("Theme V4 does not support layout inheritance overrides.");
            }
        }

        if (TryGetPropertyIgnoreCase(v2, "layoutOverrides", out var layoutOverrides))
        {
            RequireObject(layoutOverrides, "layoutOverrides");
            RejectUnknownProperties(layoutOverrides, "layoutOverrides", responsiveProfiles);
            foreach (var profile in responsiveProfiles)
            {
                ValidateOptionalBoolean(layoutOverrides, profile);
            }
        }

        if (TryGetPropertyIgnoreCase(v2, "lyrics", out var lyrics))
        {
            RequireObject(lyrics, "lyrics");
            RejectUnknownProperties(lyrics, "lyrics", "showSecondLine", "showThirdAndLaterLines", "followDelayMs");
            ValidateOptionalBoolean(lyrics, "showSecondLine");
            ValidateOptionalBoolean(lyrics, "showThirdAndLaterLines");
            ValidateOptionalNumber(lyrics, "followDelayMs", 1000, 60000);
        }
        if (TryGetPropertyIgnoreCase(v2, "artwork", out var artwork))
        {
            RequireObject(artwork, "artwork");
            RejectUnknownProperties(artwork, "artwork",
                "source", "url", "assetId", "fit", "focusX", "focusY", "clipPath");
            ValidateOptionalEnum(artwork, "source", "emby", "url", "asset");
            ValidateOptionalEnum(artwork, "fit", "cover", "contain", "fill", "none", "scale-down");
            ValidateOptionalNumber(artwork, "focusX", 0, 100);
            ValidateOptionalNumber(artwork, "focusY", 0, 100);
            ValidateOptionalSafeId(artwork, "assetId");
            ValidateOptionalHttpsUrl(artwork, "url");
            if (TryGetPropertyIgnoreCase(artwork, "clipPath", out var clipPath)
                && (clipPath.ValueKind != JsonValueKind.String
                    || !ClipPath.IsMatch(clipPath.GetString() ?? "")
                    || (clipPath.GetString()?.Length ?? 0) > 2048))
            {
                throw new ArgumentException("Theme artwork clipPath must be none or a polygon().");
            }
        }
        if (TryGetPropertyIgnoreCase(v2, "visualizer", out var visualizer))
        {
            RequireObject(visualizer, "visualizer");
            RejectUnknownProperties(visualizer, "visualizer", "frequencyLayout", "analysis");
            ValidateOptionalEnum(visualizer, "frequencyLayout", "centerOut", "lowToHigh", "radial");
            if (TryGetPropertyIgnoreCase(visualizer, "analysis", out var analysis))
            {
                ValidateRangedObjectValue(analysis, "visualizer.analysis", AnalysisRanges);
            }
        }
        if (TryGetPropertyIgnoreCase(v2, "popupStyle", out var popupStyle))
        {
            RequireObject(popupStyle, "popupStyle");
            RejectUnknownProperties(popupStyle, "popupStyle", "surfaceOpacity", "radius");
            ValidateOptionalNumber(popupStyle, "surfaceOpacity", 35, 100);
            ValidateOptionalNumber(popupStyle, "radius", 0, 64);
        }
        if (TryGetPropertyIgnoreCase(v2, "controls", out var controls))
        {
            ValidateControlDock(controls, requireProfiles: v2Version >= PlayerThemeV2Schema.V5Version,
                strictV6: v2Version == PlayerThemeV2Schema.Version);
        }
        else if (v2Version >= PlayerThemeV2Schema.V5Version)
        {
            throw new ArgumentException("Theme V5 must contain control dock profiles.");
        }
        if (TryGetPropertyIgnoreCase(v2, "typography", out var typography))
        {
            ValidateTypographyCollection(typography);
        }
    }

    private static void ValidatePortableV6Sections(JsonElement root)
    {
        ValidateV6Viewport(RequireProperty(root, "viewport", "Theme V6 must define viewport fitting."));
        var metadata = RequireProperty(root, "metadata", "Theme V6 must define metadata fields.");
        RequireObject(metadata, "metadata");
        ValidateMetadataSummaryFields(metadata, required: true);
        ValidateSystemChrome(RequireProperty(root, "systemChrome", "Theme V6 must define systemChrome."));
        ValidateOverlays(RequireProperty(root, "overlays", "Theme V6 must define overlays."));
        ValidateV6Console(RequireProperty(root, "console", "Theme V6 must define console."), portable: true);
        ValidateVolume(RequireProperty(root, "volume", "Theme V6 must define volume."));
    }

    private static void ValidateV6Viewport(JsonElement viewport)
    {
        RequireObject(viewport, "viewport");
        RejectUnknownProperties(viewport, "viewport", "fit", "alignX", "alignY");
        RequireEnum(viewport, "fit", "contain");
        RequireEnum(viewport, "alignX", "center");
        RequireEnum(viewport, "alignY", "end");
    }

    private static void ValidateMetadataSummaryFields(JsonElement metadata, bool required)
    {
        if (!TryGetPropertyIgnoreCase(metadata, "summaryFields", out var fields))
        {
            if (required) { throw new ArgumentException("Theme V6 metadata must define summaryFields."); }
            return;
        }
        var seen = new HashSet<string>(StringComparer.Ordinal);
        if (fields.ValueKind != JsonValueKind.Array || fields.GetArrayLength() > MetadataSummaryFieldIds.Count
            || fields.EnumerateArray().Any(field => field.ValueKind != JsonValueKind.String
                || !MetadataSummaryFieldIds.Contains(field.GetString() ?? "")
                || !seen.Add(field.GetString() ?? "")))
        {
            throw new ArgumentException("Theme V6 metadata summary fields are invalid.");
        }
    }

    private static void ValidateSystemChrome(JsonElement chrome)
    {
        RequireObject(chrome, "systemChrome");
        RejectUnknownProperties(chrome, "systemChrome",
            "size", "surface", "color", "surfaceColor", "radius", "blur", "shadow", "showLabels");
        ValidateOptionalNumber(chrome, "size", 44, 80);
        ValidateOptionalEnum(chrome, "surface", "none", "glass", "black", "white", "gradient");
        ValidateOptionalColor(chrome, "color");
        ValidateOptionalColor(chrome, "surfaceColor");
        ValidateOptionalNumber(chrome, "radius", 0, 50);
        ValidateOptionalNumber(chrome, "blur", 0, 48);
        ValidateOptionalNumber(chrome, "shadow", 0, 64);
        ValidateOptionalBoolean(chrome, "showLabels");
    }

    private static void ValidateOverlays(JsonElement overlays)
    {
        RequireObject(overlays, "overlays");
        RejectUnknownProperties(overlays, "overlays", "surface", "surfaceColor", "textColor", "accentColor",
            "radius", "blur", "opacity", "backdrop", "gap", "margin", "arrowSize", "durationMs", "sizes");
        ValidateOptionalEnum(overlays, "surface", "none", "glass", "black", "white", "gradient");
        foreach (var name in new[] { "surfaceColor", "textColor", "accentColor" }) { ValidateOptionalColor(overlays, name); }
        ValidateOptionalNumber(overlays, "radius", 0, 64);
        ValidateOptionalNumber(overlays, "blur", 0, 64);
        ValidateOptionalNumber(overlays, "opacity", 0, 100);
        ValidateOptionalNumber(overlays, "gap", 4, 32);
        ValidateOptionalNumber(overlays, "margin", 8, 48);
        ValidateOptionalNumber(overlays, "arrowSize", 4, 24);
        ValidateOptionalNumber(overlays, "durationMs", 0, 600);
        if (TryGetPropertyIgnoreCase(overlays, "backdrop", out var backdrop))
        {
            RequireObject(backdrop, "overlays.backdrop");
            RejectUnknownProperties(backdrop, "overlays.backdrop", "dim", "blur");
            ValidateOptionalNumber(backdrop, "dim", 0, 100);
            ValidateOptionalNumber(backdrop, "blur", 0, 48);
        }
        if (TryGetPropertyIgnoreCase(overlays, "sizes", out var sizes))
        {
            RequireObject(sizes, "overlays.sizes");
            RejectUnknownProperties(sizes, "overlays.sizes", OverlayKinds);
            foreach (var kind in OverlayKinds)
            {
                if (!TryGetPropertyIgnoreCase(sizes, kind, out var size)) { continue; }
                RequireObject(size, $"overlays.sizes.{kind}");
                RejectUnknownProperties(size, $"overlays.sizes.{kind}", "minWidth", "maxWidth", "maxHeight");
                ValidateOptionalNumber(size, "minWidth", 48, 720);
                ValidateOptionalNumber(size, "maxWidth", 48, 720);
                ValidateOptionalNumber(size, "maxHeight", 10, 100);
                if (TryGetPropertyIgnoreCase(size, "minWidth", out var minWidth)
                    && TryGetPropertyIgnoreCase(size, "maxWidth", out var maxWidth)
                    && minWidth.GetDouble() > maxWidth.GetDouble())
                {
                    throw new ArgumentException($"Theme overlays.sizes.{kind} has an invalid width range.");
                }
            }
        }
    }

    private static void ValidateV6Console(JsonElement console, bool portable)
    {
        RequireObject(console, "console");
        var keys = new List<string>
        {
            "material", "surfaceColor", "textColor", "accentColor", "gradientA", "gradientB", "gradientAngle",
            "radius", "blur", "opacity", "borderWidth", "shadow"
        };
        if (portable)
        {
            keys.AddRange(new[] { "progressHeight", "progressThumbSize", "volumeHeight", "volumeThumbSize",
                "progressActive", "progressTrack", "volumeActive", "volumeTrack", "safeArea" });
        }
        RejectUnknownProperties(console, "console", keys.ToArray());
        ValidateOptionalEnum(console, "material", "glass", "minimal", "black", "white", "gradient", "rainbow",
            "neumorphic", "deck", "poster");
        foreach (var name in new[] { "surfaceColor", "textColor", "accentColor", "gradientA", "gradientB",
                     "progressActive", "progressTrack", "volumeActive", "volumeTrack" })
        {
            ValidateOptionalColor(console, name);
        }
        ValidateOptionalNumber(console, "gradientAngle", 0, 360);
        ValidateOptionalNumber(console, "radius", 0, 64);
        ValidateOptionalNumber(console, "blur", 0, 64);
        ValidateOptionalNumber(console, "opacity", 0, 100);
        ValidateOptionalNumber(console, "borderWidth", 0, 12);
        ValidateOptionalNumber(console, "shadow", 0, 64);
        if (portable)
        {
            ValidateOptionalNumber(console, "progressHeight", 2, 12);
            ValidateOptionalNumber(console, "progressThumbSize", 8, 26);
            ValidateOptionalNumber(console, "volumeHeight", 2, 12);
            ValidateOptionalNumber(console, "volumeThumbSize", 8, 24);
            ValidateOptionalNumber(console, "safeArea", 44, 180);
        }
    }

    private static void ValidateVolume(JsonElement volume)
    {
        RequireObject(volume, "volume");
        RejectUnknownProperties(volume, "volume", "landscapeMode", "portraitMode", "iconFill", "popoverWidth", "popoverHeight");
        ValidateOptionalEnum(volume, "landscapeMode", "expanded", "iconPopover");
        ValidateOptionalEnum(volume, "portraitMode", "iconPopover");
        ValidateOptionalBoolean(volume, "iconFill");
        ValidateOptionalNumber(volume, "popoverWidth", 64, 120);
        ValidateOptionalNumber(volume, "popoverHeight", 160, 360);
    }

    private static void ValidateControlDock(JsonElement controls, bool requireProfiles, bool strictV6 = false)
    {
        RequireObject(controls, "controls");
        RejectUnknownProperties(controls, "controls", "safeArea", "profiles");
        ValidateOptionalNumber(controls, "safeArea", 44, 180);
        if (!TryGetPropertyIgnoreCase(controls, "profiles", out var profiles))
        {
            if (requireProfiles) { throw new ArgumentException("Control dock must define both profiles."); }
            return;
        }
        RequireObject(profiles, "controls.profiles");
        RejectUnknownProperties(profiles, "controls.profiles", PlayerThemeV2Schema.ResponsiveProfiles);
        foreach (var profileId in PlayerThemeV2Schema.ResponsiveProfiles)
        {
            if (!TryGetPropertyIgnoreCase(profiles, profileId, out var profile))
            {
                throw new ArgumentException("Control dock must define landscape and portrait profiles.");
            }
            ValidateControlDockProfile(profile, profileId, strictV6);
        }
    }

    private static void ValidateControlDockProfile(JsonElement profile, string profileId, bool strictV6)
    {
        RequireObject(profile, $"controls.profiles.{profileId}");
        RejectUnknownProperties(profile, $"controls.profiles.{profileId}", "rows", "groups");
        if (!TryGetPropertyIgnoreCase(profile, "rows", out var rows) || rows.ValueKind != JsonValueKind.Array
            || rows.GetArrayLength() is < 1 or > 4)
        {
            throw new ArgumentException("Control dock must contain one to four rows.");
        }
        var seenGroups = new HashSet<string>(StringComparer.Ordinal);
        foreach (var row in rows.EnumerateArray())
        {
            RequireObject(row, "control dock row");
            RejectUnknownProperties(row, "control dock row", "groups", "justify", "align", "gap");
            ValidateOptionalEnum(row, "justify", "start", "center", "end", "space-between");
            ValidateOptionalEnum(row, "align", "start", "center", "end");
            ValidateOptionalNumber(row, "gap", 0, 80);
            if (!TryGetPropertyIgnoreCase(row, "groups", out var rowGroups)
                || rowGroups.ValueKind != JsonValueKind.Array || rowGroups.GetArrayLength() < 1)
            {
                throw new ArgumentException("Every control dock row must contain a group.");
            }
            foreach (var group in rowGroups.EnumerateArray())
            {
                var id = group.ValueKind == JsonValueKind.String ? group.GetString() ?? "" : "";
                if (!DockGroups.Contains(id) || !seenGroups.Add(id))
                {
                    throw new ArgumentException("Control dock groups must be unique and supported.");
                }
            }
        }
        if (!DockGroups.SetEquals(seenGroups))
        {
            throw new ArgumentException("Control dock must place every group exactly once.");
        }
        if (!TryGetPropertyIgnoreCase(profile, "groups", out var groups))
        {
            throw new ArgumentException("Control dock group settings are required.");
        }
        RequireObject(groups, "control dock groups");
        RejectUnknownProperties(groups, "control dock groups", DockGroups.ToArray());
        foreach (var groupId in DockGroups)
        {
            if (!TryGetPropertyIgnoreCase(groups, groupId, out var group))
            {
                throw new ArgumentException("Control dock group settings are incomplete.");
            }
            RequireObject(group, $"control group {groupId}");
            RejectUnknownProperties(group, $"control group {groupId}", "visible", "order", "hiddenButtons", "align", "gap");
            ValidateOptionalBoolean(group, "visible");
            ValidateOptionalEnum(group, "align", "start", "center", "end");
            ValidateOptionalNumber(group, "gap", 0, 48);
            if ((groupId is "progress" or "transport") && TryGetPropertyIgnoreCase(group, "visible", out var visible)
                && visible.ValueKind == JsonValueKind.False)
            {
                throw new ArgumentException("Progress and transport groups cannot be hidden.");
            }
            ValidateControlDockButtons(group, groupId, "order", requireAll: true, strictV6);
            ValidateControlDockButtons(group, groupId, "hiddenButtons", requireAll: false);
            if (groupId == "transport" && TryGetPropertyIgnoreCase(group, "hiddenButtons", out var hidden)
                && hidden.EnumerateArray().Any(item => item.GetString() == "playPause"))
            {
                throw new ArgumentException("The play/pause control cannot be hidden.");
            }
        }
    }

    private static void ValidateControlDockButtons(
        JsonElement group, string groupId, string propertyName, bool requireAll, bool strictV6 = false)
    {
        if (!TryGetPropertyIgnoreCase(group, propertyName, out var values) || values.ValueKind != JsonValueKind.Array)
        {
            throw new ArgumentException($"Control group {groupId} must define {propertyName}.");
        }
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var value in values.EnumerateArray())
        {
            var id = value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : "";
            if (!DockButtons[groupId].Contains(id) || !seen.Add(id))
            {
                throw new ArgumentException("Control dock buttons must be unique and supported.");
            }
        }
        var requiredButtons = groupId == "auxiliary" && !strictV6
            ? new HashSet<string>(new[] { "shuffle", "repeat", "stop", "queue", "media", "secondaryLyrics", "artworkRotation" }, StringComparer.Ordinal)
            : DockButtons[groupId];
        if (requireAll && (strictV6 ? !requiredButtons.SetEquals(seen) : !requiredButtons.IsSubsetOf(seen)))
        {
            throw new ArgumentException("Control dock button order must contain every supported button exactly once.");
        }
    }

    private static void ValidateTypographyCollection(JsonElement typography)
    {
        RequireObject(typography, "typography");
        foreach (var line in typography.EnumerateObject())
        {
            if (line.Name is not ("primary" or "secondary" or "tertiary"))
            {
                throw new ArgumentException("Theme contains an unknown lyric typography layer.");
            }
            ValidateTypography(line.Value);
        }
    }

    private static void ValidateTypography(JsonElement style)
    {
        RequireObject(style, "typography style");
        RejectUnknownProperties(style, "typography style",
            "fontFamily", "fontAssetId", "fontUrl", "size", "weight", "italic", "letterSpacing",
            "lineHeight", "color", "opacity", "strokeWidth", "strokeColor", "shadowX", "shadowY",
            "shadowBlur", "shadowColor", "glow", "states");
        ValidateOptionalString(style, "fontFamily", 160);
        ValidateOptionalSafeId(style, "fontAssetId");
        ValidateOptionalHttpsUrl(style, "fontUrl");
        ValidateOptionalNumber(style, "size", 40, 300);
        ValidateOptionalNumber(style, "weight", 100, 900);
        ValidateOptionalNumber(style, "letterSpacing", -5, 20);
        ValidateOptionalNumber(style, "lineHeight", 0.8, 3);
        ValidateOptionalNumber(style, "opacity", 0, 1);
        ValidateOptionalNumber(style, "strokeWidth", 0, 8);
        ValidateOptionalNumber(style, "shadowX", -30, 30);
        ValidateOptionalNumber(style, "shadowY", -30, 30);
        ValidateOptionalNumber(style, "shadowBlur", 0, 60);
        ValidateOptionalNumber(style, "glow", 0, 60);
        ValidateOptionalBoolean(style, "italic");
        foreach (var colorName in new[] { "color", "strokeColor", "shadowColor" })
        {
            ValidateOptionalColor(style, colorName);
        }
        if (TryGetPropertyIgnoreCase(style, "states", out var states))
        {
            RequireObject(states, "typography states");
            foreach (var state in states.EnumerateObject())
            {
                if (state.Name is not ("past" or "current" or "future"))
                {
                    throw new ArgumentException("Theme contains an unknown lyric playback state.");
                }
                RequireObject(state.Value, "typography state");
                RejectUnknownProperties(state.Value, "typography state", "color", "opacity");
                ValidateOptionalColor(state.Value, "color");
                ValidateOptionalNumber(state.Value, "opacity", 0, 1);
            }
        }
    }

    private static void ValidateMappedNumbers(
        JsonElement section,
        IReadOnlyDictionary<string, string> propertyToTuningId)
    {
        foreach (var pair in propertyToTuningId)
        {
            var range = TuningRanges[pair.Value];
            ValidateOptionalNumber(section, pair.Key, range.Minimum, range.Maximum);
        }
    }

    private static void ValidateOptionalColorArray(JsonElement parent, string name)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out var colors))
        {
            return;
        }
        if (colors.ValueKind != JsonValueKind.Array || colors.GetArrayLength() is < 1 or > 8
            || colors.EnumerateArray().Any(value => value.ValueKind != JsonValueKind.String
                || !HexColor.IsMatch(value.GetString() ?? "")))
        {
            throw new ArgumentException($"Theme parameter {name} must contain one to eight RGB hex colors.");
        }
    }

    private static void ValidateOptionalClipPath(JsonElement parent, string name)
    {
        if (TryGetPropertyIgnoreCase(parent, name, out var clipPath)
            && (clipPath.ValueKind != JsonValueKind.String
                || !ClipPath.IsMatch(clipPath.GetString() ?? "")
                || (clipPath.GetString()?.Length ?? 0) > 2048))
        {
            throw new ArgumentException($"Theme parameter {name} must be none or a polygon().");
        }
    }

    private static int GetOptionalInteger(JsonElement parent, string name, int fallback)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out var value))
        {
            return fallback;
        }
        if (value.ValueKind != JsonValueKind.Number || !value.TryGetInt32(out var number))
        {
            throw new ArgumentException($"Theme parameter {name} must be an integer.");
        }
        return number;
    }

    private static void ValidateRangedObject(
        JsonElement root,
        string propertyName,
        IReadOnlyDictionary<string, (double Minimum, double Maximum)> ranges)
    {
        if (TryGetPropertyIgnoreCase(root, propertyName, out var value))
        {
            ValidateRangedObjectValue(value, propertyName, ranges);
        }
    }

    private static void ValidateRangedObjectValue(
        JsonElement value,
        string propertyName,
        IReadOnlyDictionary<string, (double Minimum, double Maximum)> ranges)
    {
        RequireObject(value, propertyName);
        RejectUnknownProperties(value, propertyName, ranges.Keys.ToArray());
        foreach (var property in value.EnumerateObject())
        {
            var range = ranges[property.Name];
            if (property.Value.ValueKind != JsonValueKind.Number
                || !property.Value.TryGetDouble(out var number)
                || !double.IsFinite(number)
                || number < range.Minimum || number > range.Maximum)
            {
                throw new ArgumentException($"Theme parameter {propertyName}.{property.Name} is outside its supported range.");
            }
        }
    }

    private static void ValidateHexColorObject(JsonElement root, string propertyName, HashSet<string> allowedNames)
    {
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var value))
        {
            return;
        }
        RequireObject(value, propertyName);
        RejectUnknownProperties(value, propertyName, allowedNames.ToArray());
        if (value.EnumerateObject().Any(property => property.Value.ValueKind != JsonValueKind.String
            || !HexColor.IsMatch(property.Value.GetString() ?? "")))
        {
            throw new ArgumentException($"Theme {propertyName} colors are invalid.");
        }
    }

    private static void ValidateBooleanObject(JsonElement root, string propertyName, HashSet<string> allowedNames)
    {
        if (!TryGetPropertyIgnoreCase(root, propertyName, out var value))
        {
            return;
        }
        RequireObject(value, propertyName);
        RejectUnknownProperties(value, propertyName, allowedNames.ToArray());
        if (value.EnumerateObject().Any(property =>
            property.Value.ValueKind is not JsonValueKind.True and not JsonValueKind.False))
        {
            throw new ArgumentException($"Theme {propertyName} flags are invalid.");
        }
    }

    private static void RejectUnknownProperties(JsonElement value, string sectionName, params string[] allowedNames)
    {
        var allowed = new HashSet<string>(allowedNames, StringComparer.Ordinal);
        foreach (var property in value.EnumerateObject())
        {
            if (!allowed.Contains(property.Name))
            {
                throw new ArgumentException($"Theme {sectionName} contains unknown parameter {property.Name}.");
            }
        }
    }

    private static JsonElement RequireProperty(JsonElement parent, string name, string message)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out var value))
        {
            throw new ArgumentException(message);
        }
        return value;
    }

    private static void RequireEnum(JsonElement parent, string name, params string[] allowedValues)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out _))
        {
            throw new ArgumentException($"Theme parameter {name} is required.");
        }
        ValidateOptionalEnum(parent, name, allowedValues);
    }

    private static void RequireObject(JsonElement value, string name)
    {
        if (value.ValueKind != JsonValueKind.Object)
        {
            throw new ArgumentException($"Theme {name} must be an object.");
        }
    }

    private static void ValidateOptionalNumber(JsonElement parent, string name, double minimum, double maximum)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out var value))
        {
            return;
        }
        if (value.ValueKind != JsonValueKind.Number || !value.TryGetDouble(out var number)
            || !double.IsFinite(number) || number < minimum || number > maximum)
        {
            throw new ArgumentException($"Theme parameter {name} is outside its supported range.");
        }
    }

    private static void ValidateOptionalBoolean(JsonElement parent, string name)
    {
        if (TryGetPropertyIgnoreCase(parent, name, out var value)
            && value.ValueKind is not JsonValueKind.True and not JsonValueKind.False)
        {
            throw new ArgumentException($"Theme parameter {name} must be boolean.");
        }
    }

    private static void ValidateOptionalColor(JsonElement parent, string name)
    {
        if (TryGetPropertyIgnoreCase(parent, name, out var value)
            && (value.ValueKind != JsonValueKind.String || !HexColor.IsMatch(value.GetString() ?? "")))
        {
            throw new ArgumentException($"Theme parameter {name} must be an RGB hex color.");
        }
    }

    private static void ValidateOptionalString(JsonElement parent, string name, int maximumLength)
    {
        if (TryGetPropertyIgnoreCase(parent, name, out var value)
            && (value.ValueKind != JsonValueKind.String
                || (value.GetString()?.Length ?? 0) > maximumLength
                || (value.GetString() ?? "").Any(char.IsControl)))
        {
            throw new ArgumentException($"Theme parameter {name} contains an invalid string.");
        }
    }

    private static void ValidateOptionalSafeId(JsonElement parent, string name)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out var value))
        {
            return;
        }
        if (value.ValueKind != JsonValueKind.String)
        {
            throw new ArgumentException($"Theme parameter {name} must be a safe asset id.");
        }
        var candidate = value.GetString() ?? "";
        if (candidate.Length > 0 && !SafeId.IsMatch(candidate))
        {
            throw new ArgumentException($"Theme parameter {name} must be a safe asset id.");
        }
    }

    private static void RejectPortablePrivateAsset(JsonElement parent, string name)
    {
        if (TryGetPropertyIgnoreCase(parent, name, out var value)
            && value.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw new ArgumentException($"Portable themes cannot reference private asset {name}.");
        }
    }

    private static void ValidateOptionalHttpsUrl(JsonElement parent, string name)
    {
        if (!TryGetPropertyIgnoreCase(parent, name, out var value))
        {
            return;
        }
        if (value.ValueKind != JsonValueKind.String)
        {
            throw new ArgumentException($"Theme parameter {name} must be an HTTPS URL.");
        }
        var candidate = value.GetString();
        if (!string.IsNullOrWhiteSpace(candidate)
            && ((candidate?.Length ?? 0) > 2048
                || !Uri.TryCreate(candidate, UriKind.Absolute, out var parsed)
                || parsed.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException($"Theme parameter {name} must be an HTTPS URL.");
        }
    }

    private static void ValidateOptionalEnum(JsonElement parent, string name, params string[] allowed)
    {
        if (TryGetPropertyIgnoreCase(parent, name, out var value)
            && (value.ValueKind != JsonValueKind.String
                || !allowed.Contains(value.GetString() ?? "", StringComparer.Ordinal)))
        {
            throw new ArgumentException($"Theme parameter {name} contains an unsupported value.");
        }
    }

    private static void ValidateExternalUrl(JsonElement root, string sectionName, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(root, "v2", out var v2) || v2.ValueKind != JsonValueKind.Object
            || !TryGetPropertyIgnoreCase(v2, sectionName, out var section) || section.ValueKind != JsonValueKind.Object
            || !TryGetPropertyIgnoreCase(section, propertyName, out var urlElement)
            || urlElement.ValueKind != JsonValueKind.String)
        {
            return;
        }

        var url = urlElement.GetString();
        if (!string.IsNullOrWhiteSpace(url)
            && (!Uri.TryCreate(url, UriKind.Absolute, out var parsed) || parsed.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("External theme assets must use HTTPS URLs.");
        }
    }

    private static void ValidateElement(JsonElement element, int depth)
    {
        if (depth > 32)
        {
            throw new ArgumentException("Theme JSON is nested too deeply.");
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                var normalizedName = property.Name.ToLowerInvariant();
                if (normalizedName is "userid" or "user_id" or "path" or "filepath" or "filesystempath")
                {
                    throw new ArgumentException("Theme JSON contains a forbidden identity or filesystem field.");
                }
                if ((normalizedName == "url" || normalizedName.EndsWith("url", StringComparison.Ordinal))
                    && property.Value.ValueKind == JsonValueKind.String)
                {
                    var candidate = property.Value.GetString();
                    if (!string.IsNullOrWhiteSpace(candidate)
                        && (!Uri.TryCreate(candidate, UriKind.Absolute, out var parsed)
                            || parsed.Scheme != Uri.UriSchemeHttps))
                    {
                        throw new ArgumentException("External theme assets must use HTTPS URLs.");
                    }
                }
                ValidateElement(property.Value, depth + 1);
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                ValidateElement(item, depth + 1);
            }
        }
        else if (element.ValueKind == JsonValueKind.String && (element.GetString()?.Length ?? 0) > 32768)
        {
            throw new ArgumentException("Theme JSON contains an oversized string value.");
        }
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string name, out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static bool StartsWith(ReadOnlySpan<byte> value, params byte[] prefix)
    {
        return value.Length >= prefix.Length && value[..prefix.Length].SequenceEqual(prefix);
    }
}
