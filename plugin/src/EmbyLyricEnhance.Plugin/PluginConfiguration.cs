using EmbyLyricEnhance.Core;
using MediaBrowser.Model.Plugins;

namespace EmbyLyricEnhance.Plugin;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public LyricDisplayOptions Display { get; set; } = new();
}
