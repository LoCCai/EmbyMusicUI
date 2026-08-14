using System;
using System.Collections.Generic;
using System.IO;
using EmbyLyricEnhance.Core;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;

namespace EmbyLyricEnhance.Plugin;

[Authenticated]
[Route("/EmbyLyricEnhance/UserWorkspace", "GET", Summary = "Gets the authenticated user's lyric player workspace")]
public sealed class GetUserWorkspace : IReturn<UserWorkspaceRecord>
{
}

[Authenticated]
[Route("/EmbyLyricEnhance/UserWorkspace", "PUT", Summary = "Updates the authenticated user's lyric player workspace")]
public sealed class PutUserWorkspace : IReturn<RevisionWriteResult<UserWorkspaceRecord>>
{
    public int ExpectedRevision { get; set; }

    public string? ActiveThemeId { get; set; }

    public string DraftJson { get; set; } = "{}";

    public string GlobalStateJson { get; set; } = "{}";

    public bool LegacyImported { get; set; }
}

[Authenticated]
[Route("/EmbyLyricEnhance/Themes", "GET", Summary = "Lists the authenticated user's lyric player themes")]
public sealed class GetUserThemes : IReturn<IReadOnlyList<ThemeSummary>>
{
}

[Authenticated]
[Route("/EmbyLyricEnhance/Themes", "POST", Summary = "Creates a lyric player theme for the authenticated user")]
public sealed class PostUserTheme : IReturn<StoredThemeRecord>
{
    public string? Id { get; set; }

    public string Name { get; set; } = "";

    public string ThemeJson { get; set; } = "{}";
}

[Authenticated]
[Route("/EmbyLyricEnhance/Themes/{Id}", "GET", Summary = "Gets one lyric player theme owned by the authenticated user")]
public sealed class GetUserTheme : IReturn<StoredThemeRecord>
{
    public string Id { get; set; } = "";
}

[Authenticated]
[Route("/EmbyLyricEnhance/Themes/{Id}", "PUT", Summary = "Updates one lyric player theme owned by the authenticated user")]
public sealed class PutUserTheme : IReturn<RevisionWriteResult<StoredThemeRecord>>
{
    public string Id { get; set; } = "";

    public int ExpectedRevision { get; set; }

    public string Name { get; set; } = "";

    public string ThemeJson { get; set; } = "{}";
}

[Authenticated]
[Route("/EmbyLyricEnhance/ThemeCommit", "PUT", Summary = "Atomically saves a theme and its active workspace draft")]
public sealed class PutThemeCommit : IReturn<ThemeCommitResult>
{
    public int ExpectedWorkspaceRevision { get; set; }

    public string ThemeId { get; set; } = "";

    public int ExpectedThemeRevision { get; set; }

    public string Name { get; set; } = "";

    public string ThemeJson { get; set; } = "{}";

    public string GlobalStateJson { get; set; } = "{}";

    public bool LegacyImported { get; set; }
}

[Authenticated]
[Route("/EmbyLyricEnhance/Themes/{Id}", "DELETE", Summary = "Deletes one lyric player theme owned by the authenticated user")]
public sealed class DeleteUserTheme : IReturn<MutationResult>
{
    public string Id { get; set; } = "";

    public int ExpectedRevision { get; set; }
}

[Authenticated]
[Route("/EmbyLyricEnhance/Assets/{Id}", "POST", Summary = "Uploads a private image or WOFF2 font for the authenticated user")]
public sealed class PostUserAsset : IReturn<AssetMetadata>
{
    public string Id { get; set; } = "";
}

[Authenticated]
[Route("/EmbyLyricEnhance/Assets/{Id}", "GET", Summary = "Gets a private theme asset owned by the authenticated user")]
public sealed class GetUserAsset : IReturn<object>
{
    public string Id { get; set; } = "";
}

[Authenticated]
[Route("/EmbyLyricEnhance/Assets/{Id}", "DELETE", Summary = "Deletes a private theme asset owned by the authenticated user")]
public sealed class DeleteUserAsset : IReturn<MutationResult>
{
    public string Id { get; set; } = "";
}

public sealed class MutationResult
{
    public bool Deleted { get; set; }

    public bool Conflict { get; set; }
}

public sealed class UserThemeService : IService, IRequiresRequest
{
    private readonly IAuthorizationContext _authorizationContext;
    private readonly UserThemeStore _store;

    public UserThemeService(
        IAuthorizationContext authorizationContext,
        MediaBrowser.Common.Configuration.IApplicationPaths applicationPaths)
    {
        _authorizationContext = authorizationContext;
        _store = Plugin.ResolveThemeStore(applicationPaths);
    }

    public IRequest Request { get; set; } = null!;

    public object Get(GetUserWorkspace request)
    {
        return Store.GetWorkspace(CurrentUserId());
    }

    public object Put(PutUserWorkspace request)
    {
        var result = Store.PutWorkspace(CurrentUserId(), new WorkspaceWriteRequest
        {
            ExpectedRevision = request.ExpectedRevision,
            ActiveThemeId = request.ActiveThemeId,
            DraftJson = request.DraftJson,
            GlobalStateJson = request.GlobalStateJson,
            LegacyImported = request.LegacyImported
        });
        MarkConflict(result.Conflict);
        return result;
    }

    public object Get(GetUserThemes request)
    {
        return Store.GetThemes(CurrentUserId());
    }

    public object Post(PostUserTheme request)
    {
        return Store.CreateTheme(CurrentUserId(), new ThemeCreateRequest
        {
            Id = request.Id,
            Name = request.Name,
            ThemeJson = request.ThemeJson
        });
    }

    public object Get(GetUserTheme request)
    {
        return Store.GetTheme(CurrentUserId(), request.Id)
            ?? throw new FileNotFoundException("Theme does not exist.", request.Id);
    }

    public object Put(PutUserTheme request)
    {
        var result = Store.UpdateTheme(CurrentUserId(), request.Id, new ThemeUpdateRequest
        {
            ExpectedRevision = request.ExpectedRevision,
            Name = request.Name,
            ThemeJson = request.ThemeJson
        });
        MarkConflict(result.Conflict);
        return result;
    }

    public object Put(PutThemeCommit request)
    {
        var result = Store.CommitTheme(CurrentUserId(), new ThemeCommitRequest
        {
            ExpectedWorkspaceRevision = request.ExpectedWorkspaceRevision,
            ThemeId = request.ThemeId,
            ExpectedThemeRevision = request.ExpectedThemeRevision,
            Name = request.Name,
            ThemeJson = request.ThemeJson,
            GlobalStateJson = request.GlobalStateJson,
            LegacyImported = request.LegacyImported
        });
        MarkConflict(result.Conflict);
        return result;
    }

    public object Delete(DeleteUserTheme request)
    {
        try
        {
            return new MutationResult
            {
                Deleted = Store.DeleteTheme(CurrentUserId(), request.Id, request.ExpectedRevision)
            };
        }
        catch (InvalidOperationException)
        {
            MarkConflict(true);
            return new MutationResult { Conflict = true };
        }
    }

    public object Post(PostUserAsset request)
    {
        var file = Request.Files is { Length: > 0 }
            ? Request.Files[0]
            : throw new ArgumentException("A multipart asset file is required.");
        return Store.PutAsset(
            CurrentUserId(),
            request.Id,
            file.FileName,
            file.ContentType,
            file.InputStream,
            file.ContentLength);
    }

    public object Get(GetUserAsset request)
    {
        var asset = Store.GetAsset(CurrentUserId(), request.Id)
            ?? throw new FileNotFoundException("Theme asset does not exist.", request.Id);
        Request.Response.ContentType = asset.Metadata.ContentType;
        Request.Response.AddHeader("Content-Length", asset.Metadata.Length.ToString());
        Request.Response.AddHeader("Cache-Control", "private, max-age=31536000, immutable");
        return File.Open(asset.FilePath, FileMode.Open, FileAccess.Read, FileShare.Read);
    }

    public object Delete(DeleteUserAsset request)
    {
        return new MutationResult { Deleted = Store.DeleteAsset(CurrentUserId(), request.Id) };
    }

    private UserThemeStore Store => _store;

    private long CurrentUserId()
    {
        var authorization = _authorizationContext.GetAuthorizationInfo(Request);
        if (authorization.UserId <= 0)
        {
            throw new UnauthorizedAccessException("An authenticated Emby user is required.");
        }
        return authorization.UserId;
    }

    private void MarkConflict(bool conflict)
    {
        if (conflict)
        {
            Request.Response.StatusCode = 409;
        }
    }
}
