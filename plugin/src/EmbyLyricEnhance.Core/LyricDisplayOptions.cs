namespace EmbyLyricEnhance.Core;

public sealed class LyricDisplayOptions
{
    public string DefaultTheme { get; set; } = ThemeIds.Classic;

    public bool AllowUserThemeOverride { get; set; } = true;

    public int FontSizePercent { get; set; } = 100;

    public double LineHeight { get; set; } = 1.25;

    public int FontWeight { get; set; } = 600;

    public bool UseThemeColor { get; set; } = true;

    public string HighlightColor { get; set; } = "#ffffff";

    public double PendingOpacity { get; set; } = 0.46;

    public double GlowStrength { get; set; } = 0.45;

    public double CurrentLineScale { get; set; } = 1.08;

    public double OtherLinesOpacity { get; set; } = 0.34;

    public double OtherLinesBlurPixels { get; set; } = 0.4;

    public bool ShowSecondLine { get; set; } = true;

    public bool ShowThirdAndLaterLines { get; set; } = true;
}
