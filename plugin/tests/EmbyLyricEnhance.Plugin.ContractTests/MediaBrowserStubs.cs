using System;
using System.Collections.Generic;

namespace MediaBrowser.Common.Configuration
{
    public interface IApplicationPaths
    {
    }
}

namespace MediaBrowser.Model.Serialization
{
    public interface IXmlSerializer
    {
    }
}

namespace MediaBrowser.Model.Plugins
{
    public class BasePluginConfiguration
    {
    }

    public sealed class PluginPageInfo
    {
        public string Name { get; set; } = "";

        public string DisplayName { get; set; } = "";

        public string EmbeddedResourcePath { get; set; } = "";

        public bool EnableInMainMenu { get; set; }

        public bool EnableInUserMenu { get; set; }

        public string MenuSection { get; set; } = "";

        public string FeatureId { get; set; } = "";

        public string MenuIcon { get; set; } = "";

        public bool IsMainConfigPage { get; set; }
    }
}

namespace MediaBrowser.Common.Plugins
{
    using MediaBrowser.Common.Configuration;
    using MediaBrowser.Model.Plugins;
    using MediaBrowser.Model.Serialization;

    public abstract class BasePlugin<TConfiguration>
        where TConfiguration : BasePluginConfiguration, new()
    {
        protected BasePlugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        {
            Configuration = new TConfiguration();
        }

        public TConfiguration Configuration { get; }

        public string DataFolderPath => System.IO.Path.GetTempPath();

        public abstract Guid Id { get; }

        public abstract string Name { get; }

        public virtual string Description => "";
    }
}

namespace MediaBrowser.Model.Plugins
{
    public interface IHasWebPages
    {
        IEnumerable<PluginPageInfo> GetPages();
    }
}

namespace MediaBrowser.Model.Services
{
    [AttributeUsage(AttributeTargets.Class)]
    public sealed class RouteAttribute : Attribute
    {
        public RouteAttribute(string path, string verbs)
        {
        }

        public string Summary { get; set; } = "";
    }

    public interface IReturn<T>
    {
    }

    public interface IService
    {
    }

    public interface IRequiresRequest
    {
        IRequest Request { get; set; }
    }

    public interface IRequest
    {
        IResponse Response { get; }

        IHttpFile[] Files { get; }
    }

    public interface IResponse
    {
        int StatusCode { get; set; }

        string ContentType { get; set; }

        void AddHeader(string name, string value);
    }

    public interface IHttpFile
    {
        string FileName { get; }

        long ContentLength { get; }

        string ContentType { get; }

        System.IO.Stream InputStream { get; }
    }
}

namespace MediaBrowser.Controller.Net
{
    using System;
    using MediaBrowser.Model.Services;

    [AttributeUsage(AttributeTargets.Class)]
    public sealed class AuthenticatedAttribute : Attribute
    {
    }

    public sealed class AuthorizationInfo
    {
        public long UserId { get; set; }
    }

    public interface IAuthorizationContext
    {
        AuthorizationInfo GetAuthorizationInfo(IRequest request);
    }
}
