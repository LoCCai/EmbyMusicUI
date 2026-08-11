using EmbyLyricEnhance.Core;
using MediaBrowser.Model.Plugins;

namespace EmbyLyricEnhance.Plugin;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public LyricDisplayOptions Display { get; set; } = new();

    public int MaxThemeJsonKilobytes { get; set; } = 512;

    public int MaxAssetMegabytes { get; set; } = 8;

    public int UserStorageQuotaMegabytes { get; set; } = 512;
}
