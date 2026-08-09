using System;
using System.Globalization;
using System.Text.RegularExpressions;

namespace EmbyLyricEnhance.Core;

public static class DisplayOptionsSanitizer
{
    private static readonly Regex HexColorPattern = new(
        "^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$",
        RegexOptions.CultureInvariant);

    public static PublicDisplayOptions Sanitize(LyricDisplayOptions? source)
    {
        source ??= new LyricDisplayOptions();

        return new PublicDisplayOptions
        {
            DefaultTheme = ThemeIds.Normalize(source.DefaultTheme),
            AllowUserThemeOverride = source.AllowUserThemeOverride,
            FontSizePercent = Math.Clamp(source.FontSizePercent, 70, 180),
            LineHeight = ClampFinite(source.LineHeight, 1, 2, 1.25),
            FontWeight = NormalizeFontWeight(source.FontWeight),
            UseThemeColor = source.UseThemeColor,
            HighlightColor = source.UseThemeColor ? "" : NormalizeColor(source.HighlightColor),
            PendingOpacity = ClampFinite(source.PendingOpacity, 0.1, 0.9, 0.46),
            GlowStrength = ClampFinite(source.GlowStrength, 0, 1, 0.45),
            CurrentLineScale = ClampFinite(source.CurrentLineScale, 1, 1.25, 1.08),
            OtherLinesOpacity = ClampFinite(source.OtherLinesOpacity, 0.1, 1, 0.34),
            OtherLinesBlurPixels = ClampFinite(source.OtherLinesBlurPixels, 0, 4, 0.4),
            ShowSecondLine = source.ShowSecondLine,
            ShowThirdAndLaterLines = source.ShowThirdAndLaterLines
        };
    }

    private static double ClampFinite(double value, double minimum, double maximum, double fallback)
    {
        return double.IsFinite(value) ? Math.Clamp(value, minimum, maximum) : fallback;
    }

    private static int NormalizeFontWeight(int value)
    {
        var clamped = Math.Clamp(value, 300, 900);
        return (int)Math.Round(clamped / 100d, MidpointRounding.AwayFromZero) * 100;
    }

    private static string NormalizeColor(string? value)
    {
        var candidate = value?.Trim() ?? "";
        if (!HexColorPattern.IsMatch(candidate))
        {
            return "#ffffff";
        }

        if (candidate.Length == 4)
        {
            return string.Create(
                CultureInfo.InvariantCulture,
                $"#{candidate[1]}{candidate[1]}{candidate[2]}{candidate[2]}{candidate[3]}{candidate[3]}")
                .ToLowerInvariant();
        }

        return candidate.ToLowerInvariant();
    }
}
