using System;
using System.Collections.Generic;
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
