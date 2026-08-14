using System.Runtime.Serialization;

namespace EmbyLyricEnhance.Core;

[DataContract]
public sealed class PublicDisplayOptions
{
    [DataMember(Name = "configurationVersion", Order = 1)]
    public int ConfigurationVersion { get; init; } = 1;

    [DataMember(Name = "defaultTheme", Order = 2)]
    public string DefaultTheme { get; init; } = ThemeIds.Classic;

    [DataMember(Name = "allowUserThemeOverride", Order = 3)]
    public bool AllowUserThemeOverride { get; init; }

    [DataMember(Name = "themeSchemaVersion", Order = 16)]
    public int ThemeSchemaVersion { get; init; } = PlayerThemeV2Schema.Version;

    [DataMember(Name = "themeCommitVersion", Order = 17)]
    public string ThemeCommitVersion { get; init; } = "v1";

    [DataMember(Name = "fontSizePercent", Order = 4)]
    public int FontSizePercent { get; init; }

    [DataMember(Name = "lineHeight", Order = 5)]
    public double LineHeight { get; init; }

    [DataMember(Name = "fontWeight", Order = 6)]
    public int FontWeight { get; init; }

    [DataMember(Name = "useThemeColor", Order = 7)]
    public bool UseThemeColor { get; init; }

    [DataMember(Name = "highlightColor", Order = 8)]
    public string HighlightColor { get; init; } = "";

    [DataMember(Name = "pendingOpacity", Order = 9)]
    public double PendingOpacity { get; init; }

    [DataMember(Name = "glowStrength", Order = 10)]
    public double GlowStrength { get; init; }

    [DataMember(Name = "currentLineScale", Order = 11)]
    public double CurrentLineScale { get; init; }

    [DataMember(Name = "otherLinesOpacity", Order = 12)]
    public double OtherLinesOpacity { get; init; }

    [DataMember(Name = "otherLinesBlurPixels", Order = 13)]
    public double OtherLinesBlurPixels { get; init; }

    [DataMember(Name = "showSecondLine", Order = 14)]
    public bool ShowSecondLine { get; init; }

    [DataMember(Name = "showThirdAndLaterLines", Order = 15)]
    public bool ShowThirdAndLaterLines { get; init; }
}
