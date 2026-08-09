using System;
using System.Collections.Generic;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace EmbyLyricEnhance.Plugin;

public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public static readonly Guid PluginId = Guid.Parse("efbd3f14-8799-4a7d-a5ad-7ef93c5b0e5d");

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    public static Plugin? Instance { get; private set; }

    public override Guid Id => PluginId;

    public override string Name => "Emby Lyric Enhance";

    public override string Description => "Provides server defaults for enhanced Emby Web lyric themes.";

    public IEnumerable<PluginPageInfo> GetPages()
    {
        yield return new PluginPageInfo
        {
            Name = "EmbyLyricEnhance",
            DisplayName = "歌词增强",
            EnableInMainMenu = true,
            MenuSection = "server",
            MenuIcon = "music_note",
            IsMainConfigPage = true,
            EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.configPage.html"
        };

        yield return new PluginPageInfo
        {
            Name = "embylyricenhanceconfigjs",
            EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.configPage.js"
        };
    }
}
