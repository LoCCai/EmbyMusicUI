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
    private static readonly object FallbackThemeStoreLock = new();
    private static UserThemeStore? _fallbackThemeStore;
    private readonly IApplicationPaths _applicationPaths;
    private readonly object _runtimeInitializationLock = new();
    private bool _runtimeInitialized;

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        // Emby assigns BasePlugin.DataFolderPath in SetStartupInfo(), after the
        // plugin constructor has returned. Reading DataFolderPath here leaves a
        // half-constructed plugin and throws Path.Combine(..., path2) when the
        // server first resolves one of this assembly's HTTP services.
        _applicationPaths = applicationPaths;
        ThemeStore = CreateThemeStore(applicationPaths);
        lock (FallbackThemeStoreLock)
        {
            _fallbackThemeStore = ThemeStore;
        }
        Instance = this;
    }

    public static Plugin? Instance { get; private set; }

    public static UserThemeStore CreateThemeStore(
        IApplicationPaths applicationPaths,
        PluginConfiguration? configuration = null)
    {
        ArgumentNullException.ThrowIfNull(applicationPaths);
        return new UserThemeStore(
            ThemeStoreRoot(applicationPaths),
            CreateThemeStoreOptions(configuration ?? new PluginConfiguration()));
    }

    public static UserThemeStore ResolveThemeStore(IApplicationPaths applicationPaths)
    {
        if (Instance is not null)
        {
            Instance.EnsureRuntimeInitialized();
            return Instance.ThemeStore;
        }
        lock (FallbackThemeStoreLock)
        {
            return _fallbackThemeStore ??= CreateThemeStore(applicationPaths);
        }
    }

    public static PublicDisplayOptions GetPublicDisplayOptions()
    {
        var instance = Instance;
        if (instance is null)
        {
            return DisplayOptionsSanitizer.Sanitize(null);
        }

        instance.EnsureRuntimeInitialized();
        return instance._runtimeInitialized
            ? DisplayOptionsSanitizer.Sanitize(instance.Configuration.Display)
            : DisplayOptionsSanitizer.Sanitize(null);
    }

    public UserThemeStore ThemeStore { get; private set; }

    public override Guid Id => PluginId;

    public override string Name => "Emby Lyric Enhance";

    public override string Description => "Provides server defaults for enhanced Emby Web lyric themes.";

    private static string ThemeStoreRoot(IApplicationPaths applicationPaths)
    {
        return Path.Combine(applicationPaths.DataPath, "EmbyLyricEnhance", "player-theme-v2");
    }

    private void EnsureRuntimeInitialized()
    {
        if (_runtimeInitialized)
        {
            return;
        }

        lock (_runtimeInitializationLock)
        {
            if (_runtimeInitialized)
            {
                return;
            }

            string dataFolderPath;
            try
            {
                dataFolderPath = DataFolderPath;
            }
            catch (ArgumentNullException)
            {
                // A very early service resolution can still race Emby's
                // SetStartupInfo callback. Callers use safe defaults and retry.
                return;
            }
            if (string.IsNullOrWhiteSpace(dataFolderPath))
            {
                return;
            }

            ImportLegacyThemeStore(
                Path.Combine(dataFolderPath, "player-theme-v2"),
                ThemeStoreRoot(_applicationPaths));
            ThemeStore = CreateThemeStore(_applicationPaths, Configuration);
            lock (FallbackThemeStoreLock)
            {
                _fallbackThemeStore = ThemeStore;
            }
            _runtimeInitialized = true;
        }
    }

    private static void ImportLegacyThemeStore(string legacyRoot, string currentRoot)
    {
        if (!Directory.Exists(legacyRoot)
            || string.Equals(
                Path.GetFullPath(legacyRoot),
                Path.GetFullPath(currentRoot),
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }
        try
        {
            foreach (var source in Directory.EnumerateFiles(legacyRoot, "*", SearchOption.AllDirectories))
            {
                var relative = Path.GetRelativePath(legacyRoot, source);
                var target = Path.Combine(currentRoot, relative);
                if (File.Exists(target))
                {
                    continue;
                }
                Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                File.Copy(source, target, false);
            }
        }
        catch (IOException)
        {
            // Existing data remains in place and can be imported on the next restart.
        }
        catch (UnauthorizedAccessException)
        {
            // The new store can still initialize independently of a legacy path.
        }
    }

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
            Name = "EmbyLyricEnhanceV040",
            DisplayName = "歌词增强",
            EnableInMainMenu = true,
            MenuSection = "server",
            MenuIcon = "music_note",
            IsMainConfigPage = true,
            EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.configPage.html"
        };

        yield return new PluginPageInfo
        {
            Name = "embylyricenhanceconfigjsv040",
            EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.configPage.js"
        };
    }
}
