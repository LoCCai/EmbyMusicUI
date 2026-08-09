using EmbyLyricEnhance.Core;
using MediaBrowser.Model.Services;

namespace EmbyLyricEnhance.Plugin;

[Route("/EmbyLyricEnhance/PublicConfiguration", "GET", Summary = "Gets public lyric display defaults")]
public sealed class GetPublicConfiguration : IReturn<PublicDisplayOptions>
{
}

public sealed class PublicConfigurationService : IService
{
    public object Get(GetPublicConfiguration request)
    {
        return DisplayOptionsSanitizer.Sanitize(Plugin.Instance?.Configuration.Display);
    }
}
