using System;
using EmbyLyricEnhance.Plugin;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Serialization;

var plugin = new Plugin(new ContractApplicationPaths(), new ContractXmlSerializer());
var result = (EmbyLyricEnhance.Core.PublicDisplayOptions)new PublicConfigurationService()
    .Get(new GetPublicConfiguration());

if (plugin is null || result.ConfigurationVersion != 1)
{
    Console.Error.WriteLine("Plugin startup did not return safe public defaults before SetStartupInfo.");
    return 1;
}

Console.WriteLine("plugin API startup contract before SetStartupInfo: ok");
return 0;
