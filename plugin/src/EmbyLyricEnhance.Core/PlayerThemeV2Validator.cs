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
            "format", "schemaVersion", "name", "baseTheme", "layouts", "background",
            "artwork", "metadata", "lyrics", "visualizer", "console", "mediaCard", "mediaFields");
        if (!TryGetPropertyIgnoreCase(root, "format", out _)
            || !TryGetPropertyIgnoreCase(root, "schemaVersion", out _))
        {
            throw new ArgumentException("Theme V3 must declare its format and schema version.");
        }
        ValidateOptionalEnum(root, "format", PlayerThemeV2Schema.DocumentFormat);
        ValidateOptionalNumber(root, "schemaVersion", PlayerThemeV2Schema.Version, PlayerThemeV2Schema.Version);
        ValidateOptionalString(root, "name", 80);
        ValidateOptionalEnum(root, "baseTheme",
            "album", "center", "mobile", "mint", "deck", "stack", "coverflow", "lyrics", "rose");
        if (!TryGetPropertyIgnoreCase(root, "layouts", out var layouts))
        {
            throw new ArgumentException("Theme V3 must contain responsive layouts.");
        }
        ValidateLayoutsValue(layouts, Profiles, requireAllProfiles: true);

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
            RejectUnknownProperties(artwork, "artwork",
                "source", "url", "assetId", "fit", "focusX", "focusY", "clipPath",
                "mode", "rotation", "scale", "size", "x", "y", "innerSize", "outerRadius",
                "innerRadius", "padding", "borderWidth", "shadowDepth", "coverflowWidth",
                "coverflowHeight", "frameColor");
            ValidateOptionalEnum(artwork, "source", "emby", "url", "asset");
            ValidateOptionalEnum(artwork, "fit", "cover", "contain", "fill", "none", "scale-down");
            ValidateOptionalEnum(artwork, "mode", "single", "coverflow");
            ValidateOptionalBoolean(artwork, "rotation");
            ValidateOptionalNumber(artwork, "focusX", 0, 100);
            ValidateOptionalNumber(artwork, "focusY", 0, 100);
            ValidateOptionalSafeId(artwork, "assetId");
            RejectPortablePrivateAsset(artwork, "assetId");
            ValidateOptionalHttpsUrl(artwork, "url");
            ValidateOptionalClipPath(artwork, "clipPath");
            ValidateOptionalColor(artwork, "frameColor");
            ValidateMappedNumbers(artwork, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["scale"] = "artworkScale", ["size"] = "artworkSize", ["x"] = "artworkX",
                ["y"] = "artworkY", ["innerSize"] = "artworkInnerSize",
                ["outerRadius"] = "artworkOuterRadius", ["innerRadius"] = "artworkInnerRadius",
                ["padding"] = "artworkPadding", ["borderWidth"] = "artworkBorderWidth",
                ["shadowDepth"] = "artworkShadowDepth", ["coverflowWidth"] = "coverflowWidth",
                ["coverflowHeight"] = "coverflowHeight"
            });
        }

        if (TryGetPropertyIgnoreCase(root, "metadata", out var metadata))
        {
            RequireObject(metadata, "metadata");
            RejectUnknownProperties(metadata, "metadata",
                "anchor", "align", "surface", "width", "x", "y", "titleSize", "artistSize",
                "albumSize", "letterSpacing", "padding", "radius", "blur", "opacity",
                "textColor", "surfaceColor");
            ValidateOptionalEnum(metadata, "anchor", "start", "center", "end");
            ValidateOptionalEnum(metadata, "align", "left", "center", "right");
            ValidateOptionalEnum(metadata, "surface", "none", "glass", "inset", "embossed", "floating");
            ValidateOptionalColor(metadata, "textColor");
            ValidateOptionalColor(metadata, "surfaceColor");
            ValidateMappedNumbers(metadata, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["width"] = "metadataWidth", ["x"] = "metadataX", ["y"] = "metadataY",
                ["titleSize"] = "metadataTitleSize", ["artistSize"] = "metadataArtistSize",
                ["albumSize"] = "metadataAlbumSize", ["letterSpacing"] = "metadataLetterSpacing",
                ["padding"] = "metadataPadding", ["radius"] = "metadataRadius",
                ["blur"] = "metadataBlur", ["opacity"] = "metadataOpacity"
            });
        }

        if (TryGetPropertyIgnoreCase(root, "lyrics", out var lyrics))
        {
            RequireObject(lyrics, "lyrics");
            RejectUnknownProperties(lyrics, "lyrics",
                "style", "alignment", "scale", "surface", "width", "height", "x", "y",
                "lineHeight", "inactiveOpacity", "padding", "radius", "blur", "opacity",
                "letterSpacing", "pastSize", "currentSize", "futureSize", "currentWeight",
                "pastColor", "currentColor", "futureColor", "surfaceColor", "showSecondLine",
                "showThirdAndLaterLines", "followDelayMs", "typography");
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
                ["width"] = "lyricsWidth", ["height"] = "lyricsHeight", ["x"] = "lyricsX",
                ["y"] = "lyricsY", ["lineHeight"] = "lyricLineGap",
                ["inactiveOpacity"] = "lyricInactiveOpacity", ["padding"] = "lyricsPadding",
                ["radius"] = "lyricsRadius", ["blur"] = "lyricsBlur", ["opacity"] = "lyricsOpacity",
                ["letterSpacing"] = "lyricLetterSpacing", ["pastSize"] = "lyricPastSize",
                ["currentSize"] = "lyricCurrentSize", ["futureSize"] = "lyricFutureSize",
                ["currentWeight"] = "lyricCurrentWeight"
            });
            if (TryGetPropertyIgnoreCase(lyrics, "typography", out var typography))
            {
                ValidateTypographyCollection(typography);
                foreach (var line in typography.EnumerateObject())
                {
                    RejectPortablePrivateAsset(line.Value, "fontAssetId");
                }
            }
        }

        if (TryGetPropertyIgnoreCase(root, "visualizer", out var visualizer))
        {
            RequireObject(visualizer, "visualizer");
            RejectUnknownProperties(visualizer, "visualizer",
                "style", "frequencyLayout", "width", "height", "amplitude", "colorMode",
                "colors", "x", "y", "rotation", "opacity", "analysis");
            ValidateOptionalEnum(visualizer, "style",
                "spectrum", "mirror", "waveform", "fall", "curve", "line", "chroma", "balls", "pulse");
            ValidateOptionalEnum(visualizer, "frequencyLayout", "centerOut", "lowToHigh", "radial");
            ValidateOptionalEnum(visualizer, "colorMode", "solid", "dual", "multi", "rainbow");
            ValidateOptionalNumber(visualizer, "width", 10, 100);
            ValidateOptionalNumber(visualizer, "height", 2, 30);
            ValidateOptionalNumber(visualizer, "amplitude", 25, 140);
            ValidateMappedNumbers(visualizer, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["x"] = "visualizerX", ["y"] = "visualizerY",
                ["rotation"] = "visualizerRotation", ["opacity"] = "visualizerOpacity"
            });
            ValidateOptionalColorArray(visualizer, "colors");
            if (TryGetPropertyIgnoreCase(visualizer, "analysis", out var analysis))
            {
                ValidateRangedObjectValue(analysis, "visualizer.analysis", AnalysisRanges);
            }
        }

        if (TryGetPropertyIgnoreCase(root, "console", out var consoleStyle))
        {
            RequireObject(consoleStyle, "console");
            RejectUnknownProperties(consoleStyle, "console",
                "progressWidth", "progressHeight", "progressThumbSize", "volumeWidth", "volumeHeight",
                "volumeThumbSize", "blur", "opacity", "progressActive", "progressTrack",
                "volumeActive", "volumeTrack", "safeArea");
            ValidateMappedNumbers(consoleStyle, new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["progressWidth"] = "progressWidth", ["progressHeight"] = "progressTrackHeight",
                ["progressThumbSize"] = "progressThumbSize", ["volumeWidth"] = "volumeWidth",
                ["volumeHeight"] = "volumeTrackHeight", ["volumeThumbSize"] = "volumeThumbSize",
                ["blur"] = "consoleBlur", ["opacity"] = "consoleOpacity"
            });
            ValidateOptionalNumber(consoleStyle, "safeArea", 44, 180);
            foreach (var colorName in new[] { "progressActive", "progressTrack", "volumeActive", "volumeTrack" })
            {
                ValidateOptionalColor(consoleStyle, colorName);
            }
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

    private static void ValidateLayouts(JsonElement root)
    {
        if (!TryGetPropertyIgnoreCase(root, "v2", out var v2))
        {
            return;
        }
        RequireObject(v2, "v2");

        if (!TryGetPropertyIgnoreCase(v2, "layouts", out var layouts))
        {
            return;
        }
        RequireObject(layouts, "layouts");

        var version = GetOptionalInteger(v2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion);
        if (version is not (PlayerThemeV2Schema.LegacyVersion or PlayerThemeV2Schema.Version))
        {
            throw new ArgumentException("Theme schema version is unsupported.");
        }
        ValidateLayoutsValue(
            layouts,
            version == PlayerThemeV2Schema.Version ? Profiles : LegacyProfiles,
            requireAllProfiles: false);
    }

    private static void ValidateLayoutsValue(
        JsonElement layouts,
        HashSet<string> allowedProfiles,
        bool requireAllProfiles)
    {
        RequireObject(layouts, "layouts");
        var seenProfiles = new HashSet<string>(StringComparer.Ordinal);
        foreach (var profile in layouts.EnumerateObject())
        {
            if (!allowedProfiles.Contains(profile.Name) || profile.Value.ValueKind != JsonValueKind.Object)
            {
                throw new ArgumentException("Theme contains an unknown responsive profile.");
            }
            seenProfiles.Add(profile.Name);

            foreach (var layer in profile.Value.EnumerateObject())
            {
                if (!Layers.Contains(layer.Name) || layer.Value.ValueKind != JsonValueKind.Object)
                {
                    throw new ArgumentException("Theme contains an unknown editable layer.");
                }

                ValidateLayer(layer.Value);
            }
        }
        if (requireAllProfiles && !allowedProfiles.SetEquals(seenProfiles))
        {
            throw new ArgumentException("Theme V3 must define both landscape and portrait layouts.");
        }
    }

    private static void ValidateLayer(JsonElement layer)
    {
        foreach (var property in layer.EnumerateObject())
        {
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
                "x" or "y" => value is >= -100 and <= 200,
                "width" or "height" => value is >= 1 and <= 200,
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
    }

    private static void ValidateThemeParameterFamilies(JsonElement root)
    {
        ValidateRangedObject(root, "tuning", TuningRanges);
        ValidateHexColorObject(root, "colors", ThemeColorIds);
        ValidateBooleanObject(root, "mediaFields", MediaFieldIds);

        if (TryGetPropertyIgnoreCase(root, "choices", out var choices))
        {
            RequireObject(choices, "choices");
            RejectUnknownProperties(choices, "choices",
                "artworkMode", "metadataAnchor", "metadataAlign",
                "metadataSurface", "lyricsSurface", "mediaSurface");
            ValidateOptionalEnum(choices, "artworkMode", "single", "coverflow");
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
            "schemaVersion", "layouts", "layoutOverrides", "lyrics", "artwork",
            "visualizer", "popupStyle", "controls", "typography");
        ValidateOptionalNumber(v2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion, PlayerThemeV2Schema.Version);
        var v2Version = GetOptionalInteger(v2, "schemaVersion", PlayerThemeV2Schema.LegacyVersion);
        var responsiveProfiles = v2Version == PlayerThemeV2Schema.Version
            ? PlayerThemeV2Schema.ResponsiveProfiles
            : PlayerThemeV2Schema.LegacyResponsiveProfiles;

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
            RequireObject(controls, "controls");
            RejectUnknownProperties(controls, "controls", "safeArea");
            ValidateOptionalNumber(controls, "safeArea", 44, 180);
        }
        if (TryGetPropertyIgnoreCase(v2, "typography", out var typography))
        {
            ValidateTypographyCollection(typography);
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
