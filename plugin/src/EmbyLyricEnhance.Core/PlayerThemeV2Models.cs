using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace EmbyLyricEnhance.Core;

public static class PlayerThemeV2Schema
{
    public const int Version = 4;

    public const int PreviousVersion = 3;

    public const int LegacyVersion = 2;

    public const string DocumentFormat = "emby-lyric-theme";

    public const string LayoutModel = "anchored-canvas-v1";

    public static readonly string[] ResponsiveProfiles =
    {
        "landscape",
        "portrait"
    };

    public static readonly string[] LegacyResponsiveProfiles =
    {
        "desktop", "tablet", "phonePortrait", "phoneLandscape"
    };

    public static readonly string[] LayerIds =
    {
        "artwork",
        "metadata",
        "lyrics",
        "visualizer",
        "progress",
        "transport",
        "volume",
        "auxiliary"
    };

    // The server validates every scalar family that the web editor can serialize.
    // Keeping this list explicit makes contract drift visible in tests and reviews.
    public static readonly string[] ParameterFamilies =
    {
        "tuning",
        "colors",
        "choices",
        "player",
        "layouts",
        "viewportTransforms",
        "artwork",
        "typography.primary",
        "typography.secondary",
        "typography.tertiary",
        "lyrics.visibility",
        "lyrics.followDelayMs",
        "visualizer.analysis",
        "mediaFields",
        "popupStyle",
        "controls"
    };

    // Each frontend registry entry names one of these server-enforced rules.
    // The JavaScript contract test compares the live registry against this catalog.
    public static readonly string[] ValidationRuleIds =
    {
        "tuning-range",
        "hex-color",
        "choice-enum",
        "boolean",
        "player-enum",
        "player-range",
        "color-list",
        "safe-string",
        "safe-id",
        "https-url",
        "clip-path",
        "typography-range",
        "layer-range",
        "anchor-enum",
        "viewport-transform-range",
        "visualizer-analysis-range"
    };
}

public sealed class ThemeSummary
{
    public string Id { get; set; } = "";

    public string Name { get; set; } = "";

    public int Revision { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}

public sealed class StoredThemeRecord
{
    public int SchemaVersion { get; set; } = PlayerThemeV2Schema.Version;

    public string Id { get; set; } = "";

    public string Name { get; set; } = "";

    public int Revision { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public string ThemeJson { get; set; } = "{}";

    [JsonIgnore]
    public ThemeSummary Summary => new()
    {
        Id = Id,
        Name = Name,
        Revision = Revision,
        UpdatedAtUtc = UpdatedAtUtc
    };
}

public sealed class UserWorkspaceRecord
{
    public int SchemaVersion { get; set; } = PlayerThemeV2Schema.Version;

    public int Revision { get; set; }

    public string? ActiveThemeId { get; set; }

    public string DraftJson { get; set; } = "{}";

    public string GlobalStateJson { get; set; } = "{}";

    public bool LegacyImported { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public List<ThemeSummary> Themes { get; set; } = new();
}

public sealed class WorkspaceWriteRequest
{
    public int ExpectedRevision { get; set; }

    public string? ActiveThemeId { get; set; }

    public string DraftJson { get; set; } = "{}";

    public string GlobalStateJson { get; set; } = "{}";

    public bool LegacyImported { get; set; }
}

public sealed class ThemeCreateRequest
{
    public string? Id { get; set; }

    public string Name { get; set; } = "";

    public string ThemeJson { get; set; } = "{}";
}

public sealed class ThemeUpdateRequest
{
    public int ExpectedRevision { get; set; }

    public string Name { get; set; } = "";

    public string ThemeJson { get; set; } = "{}";
}

public sealed class RevisionWriteResult<T>
{
    public T Value { get; set; } = default!;

    public bool Conflict { get; set; }

    public StoredThemeRecord? ConflictCopy { get; set; }
}

public sealed class AssetMetadata
{
    public string Id { get; set; } = "";

    public string FileName { get; set; } = "";

    public string ContentType { get; set; } = "application/octet-stream";

    public long Length { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}

public sealed class StoredAsset
{
    public AssetMetadata Metadata { get; set; } = new();

    [JsonIgnore]
    public string FilePath { get; set; } = "";
}

public sealed class ThemeStoreOptions
{
    public int MaxThemeJsonBytes { get; set; } = 512 * 1024;

    public int MaxAssetBytes { get; set; } = 8 * 1024 * 1024;

    public long UserQuotaBytes { get; set; } = 512L * 1024 * 1024;
}
