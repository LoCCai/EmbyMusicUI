using System;
using System.Collections.Generic;

namespace EmbyLyricEnhance.Core;

public static class ThemeIds
{
    public const string Classic = "classic";
    public const string Focus = "focus";
    public const string Gradient = "gradient";
    public const string Apple = "apple";
    public const string Minimal = "minimal";

    private static readonly Dictionary<string, string> KnownThemes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [Classic] = Classic,
            [Focus] = Focus,
            [Gradient] = Gradient,
            [Apple] = Apple,
            [Minimal] = Minimal
        };

    public static IReadOnlyCollection<string> All => KnownThemes.Values;

    public static string Normalize(string? value)
    {
        return value is not null && KnownThemes.TryGetValue(value.Trim(), out var normalized)
            ? normalized
            : Classic;
    }
}
