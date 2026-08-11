using System;
using System.Collections.Generic;
using System.IO;
using EmbyLyricEnhance.Core;
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
        ThemeStore = new UserThemeStore(
            Path.Combine(DataFolderPath, "player-theme-v2"),
            CreateThemeStoreOptions(Configuration));
    }

    public static Plugin? Instance { get; private set; }

    public UserThemeStore ThemeStore { get; }

    public override Guid Id => PluginId;

    public override string Name => "Emby Lyric Enhance";

    public override string Description => "Provides server defaults for enhanced Emby Web lyric themes.";

    private static ThemeStoreOptions CreateThemeStoreOptions(PluginConfiguration configuration)
    {
        return new ThemeStoreOptions
        {
            MaxThemeJsonBytes = Math.Clamp(configuration.MaxThemeJsonKilobytes, 64, 4096) * 1024,
            MaxAssetBytes = Math.Clamp(configuration.MaxAssetMegabytes, 1, 64) * 1024 * 1024,
            UserQuotaBytes = (long)Math.Clamp(configuration.UserStorageQuotaMegabytes, 32, 16384) * 1024 * 1024
        };
    }

    public IEnumerable<PluginPageInfo> GetPages()
    {
        yield return new PluginPageInfo
        {
            Name = "EmbyLyricEnhanceV030",
            DisplayName = "歌词增强",
            EnableInMainMenu = true,
            MenuSection = "server",
            MenuIcon = "music_note",
            IsMainConfigPage = true,
            EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.configPage.html"
        };

        yield return new PluginPageInfo
        {
            Name = "embylyricenhanceconfigjsv030",
            EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.configPage.js"
        };
    }
}
