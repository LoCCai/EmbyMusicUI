using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace EmbyLyricEnhance.Core;

public sealed class UserThemeStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    private readonly string _root;
    private readonly ThemeStoreOptions _options;
    private readonly ConcurrentDictionary<long, object> _locks = new();

    public UserThemeStore(string root, ThemeStoreOptions? options = null)
    {
        _root = Path.GetFullPath(root ?? throw new ArgumentNullException(nameof(root)));
        _options = options ?? new ThemeStoreOptions();
        Directory.CreateDirectory(_root);
    }

    public UserWorkspaceRecord GetWorkspace(long userId)
    {
        lock (UserLock(userId))
        {
            var workspace = ReadRecoverable<UserWorkspaceRecord>(WorkspacePath(userId)) ?? NewWorkspace();
            workspace.Themes = GetThemesUnsafe(userId);
            return workspace;
        }
    }

    public RevisionWriteResult<UserWorkspaceRecord> PutWorkspace(long userId, WorkspaceWriteRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        lock (UserLock(userId))
        {
            var current = ReadRecoverable<UserWorkspaceRecord>(WorkspacePath(userId)) ?? NewWorkspace();
            var draftJson = PlayerThemeV2Validator.ValidateThemeJson(request.DraftJson, _options.MaxThemeJsonBytes);
            var globalStateJson = PlayerThemeV2Validator.ValidateStateJson(request.GlobalStateJson, _options.MaxThemeJsonBytes);
            if (request.ExpectedRevision != current.Revision)
            {
                StoredThemeRecord? conflictCopy = null;
                if (draftJson != "{}")
                {
                    conflictCopy = CreateThemeUnsafe(userId, new ThemeCreateRequest
                    {
                        Name = $"自动保存冲突 {DateTime.Now:yyyy-MM-dd HH:mm}",
                        ThemeJson = draftJson
                    });
                }

                current.Themes = GetThemesUnsafe(userId);
                return new RevisionWriteResult<UserWorkspaceRecord>
                {
                    Value = current,
                    Conflict = true,
                    ConflictCopy = conflictCopy
                };
            }

            var next = new UserWorkspaceRecord
            {
                SchemaVersion = PlayerThemeV2Schema.Version,
                Revision = current.Revision + 1,
                ActiveThemeId = NormalizeOptionalThemeId(request.ActiveThemeId),
                DraftJson = draftJson,
                GlobalStateJson = globalStateJson,
                LegacyImported = request.LegacyImported || current.LegacyImported,
                UpdatedAtUtc = DateTime.UtcNow,
                Themes = GetThemesUnsafe(userId)
            };
            var workspacePath = WorkspacePath(userId);
            EnsureAtomicJsonQuota(userId, workspacePath, JsonSerializer.SerializeToUtf8Bytes(next, JsonOptions).Length);
            AtomicWriteJson(workspacePath, next);
            return new RevisionWriteResult<UserWorkspaceRecord> { Value = next };
        }
    }

    public IReadOnlyList<ThemeSummary> GetThemes(long userId)
    {
        lock (UserLock(userId))
        {
            return GetThemesUnsafe(userId);
        }
    }

    public StoredThemeRecord? GetTheme(long userId, string id)
    {
        id = PlayerThemeV2Validator.NormalizeId(id);
        lock (UserLock(userId))
        {
            return ReadRecoverable<StoredThemeRecord>(ThemePath(userId, id));
        }
    }

    public StoredThemeRecord CreateTheme(long userId, ThemeCreateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        lock (UserLock(userId))
        {
            return CreateThemeUnsafe(userId, request);
        }
    }

    public RevisionWriteResult<StoredThemeRecord> UpdateTheme(long userId, string id, ThemeUpdateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        id = PlayerThemeV2Validator.NormalizeId(id);
        lock (UserLock(userId))
        {
            var path = ThemePath(userId, id);
            var current = ReadRecoverable<StoredThemeRecord>(path)
                ?? throw new FileNotFoundException("Theme does not exist.", id);
            var themeJson = PlayerThemeV2Validator.ValidateThemeJson(request.ThemeJson, _options.MaxThemeJsonBytes);
            if (request.ExpectedRevision != current.Revision)
            {
                var copy = CreateThemeUnsafe(userId, new ThemeCreateRequest
                {
                    Name = PlayerThemeV2Validator.NormalizeName(request.Name) + "（冲突副本）",
                    ThemeJson = themeJson
                });
                return new RevisionWriteResult<StoredThemeRecord>
                {
                    Value = current,
                    Conflict = true,
                    ConflictCopy = copy
                };
            }

            current.Name = PlayerThemeV2Validator.NormalizeName(request.Name);
            current.ThemeJson = themeJson;
            current.Revision++;
            current.UpdatedAtUtc = DateTime.UtcNow;
            EnsureAtomicJsonQuota(userId, path, JsonSerializer.SerializeToUtf8Bytes(current, JsonOptions).Length);
            AtomicWriteJson(path, current);
            return new RevisionWriteResult<StoredThemeRecord> { Value = current };
        }
    }

    public bool DeleteTheme(long userId, string id, int expectedRevision)
    {
        id = PlayerThemeV2Validator.NormalizeId(id);
        lock (UserLock(userId))
        {
            var path = ThemePath(userId, id);
            var current = ReadRecoverable<StoredThemeRecord>(path);
            if (current is null)
            {
                return false;
            }
            if (current.Revision != expectedRevision)
            {
                throw new InvalidOperationException("Theme revision conflict.");
            }

            File.Delete(path);
            File.Delete(path + ".bak");
            return true;
        }
    }

    public AssetMetadata PutAsset(
        long userId,
        string id,
        string? fileName,
        string? contentType,
        Stream input,
        long contentLength)
    {
        id = PlayerThemeV2Validator.NormalizeId(id);
        ArgumentNullException.ThrowIfNull(input);
        if (contentLength < 1 || contentLength > _options.MaxAssetBytes)
        {
            throw new ArgumentException("Uploaded asset exceeds the configured size limit.", nameof(contentLength));
        }

        lock (UserLock(userId))
        {
            var directory = AssetDirectory(userId);
            Directory.CreateDirectory(directory);
            var temp = Path.Combine(directory, "." + id + "." + Guid.NewGuid().ToString("N") + ".tmp");
            var dataPath = AssetDataPath(userId, id);
            var header = new byte[Math.Min(16, (int)contentLength)];
            try
            {
                using (var output = new FileStream(temp, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.WriteThrough))
                {
                    var total = 0L;
                    while (total < contentLength)
                    {
                        var buffer = new byte[Math.Min(81920, (int)Math.Min(int.MaxValue, contentLength - total))];
                        var read = input.Read(buffer, 0, buffer.Length);
                        if (read <= 0)
                        {
                            break;
                        }
                        if (total < header.Length)
                        {
                            Buffer.BlockCopy(buffer, 0, header, (int)total, Math.Min(read, header.Length - (int)total));
                        }
                        output.Write(buffer, 0, read);
                        total += read;
                        if (total > _options.MaxAssetBytes)
                        {
                            throw new ArgumentException("Uploaded asset exceeds the configured size limit.");
                        }
                    }
                    output.Flush(true);
                    if (total != contentLength)
                    {
                        throw new EndOfStreamException("Uploaded asset ended before its declared content length.");
                    }
                }

                var safeContentType = PlayerThemeV2Validator.NormalizeContentType(contentType, header);
                var metadata = new AssetMetadata
                {
                    Id = id,
                    FileName = Path.GetFileName(fileName ?? id),
                    ContentType = safeContentType,
                    Length = contentLength,
                    CreatedAtUtc = DateTime.UtcNow
                };
                var metadataPath = AssetMetadataPath(userId, id);
                var metadataBytes = JsonSerializer.SerializeToUtf8Bytes(metadata, JsonOptions).Length;
                EnsureQuotaForReplacement(
                    userId,
                    contentLength + metadataBytes + FileLength(metadataPath),
                    dataPath,
                    metadataPath,
                    metadataPath + ".bak",
                    temp);
                File.Move(temp, dataPath, true);
                AtomicWriteJson(metadataPath, metadata);
                return metadata;
            }
            finally
            {
                if (File.Exists(temp))
                {
                    File.Delete(temp);
                }
            }
        }
    }

    public StoredAsset? GetAsset(long userId, string id)
    {
        id = PlayerThemeV2Validator.NormalizeId(id);
        lock (UserLock(userId))
        {
            var metadata = ReadRecoverable<AssetMetadata>(AssetMetadataPath(userId, id));
            var path = AssetDataPath(userId, id);
            return metadata is null || !File.Exists(path)
                ? null
                : new StoredAsset { Metadata = metadata, FilePath = path };
        }
    }

    public bool DeleteAsset(long userId, string id)
    {
        id = PlayerThemeV2Validator.NormalizeId(id);
        lock (UserLock(userId))
        {
            var existed = File.Exists(AssetDataPath(userId, id)) || File.Exists(AssetMetadataPath(userId, id));
            File.Delete(AssetDataPath(userId, id));
            File.Delete(AssetMetadataPath(userId, id));
            File.Delete(AssetMetadataPath(userId, id) + ".bak");
            return existed;
        }
    }

    private StoredThemeRecord CreateThemeUnsafe(long userId, ThemeCreateRequest request)
    {
        var id = string.IsNullOrWhiteSpace(request.Id)
            ? "theme-" + Guid.NewGuid().ToString("N")
            : PlayerThemeV2Validator.NormalizeId(request.Id);
        var path = ThemePath(userId, id);
        if (File.Exists(path))
        {
            throw new InvalidOperationException("A theme with this id already exists.");
        }

        var now = DateTime.UtcNow;
        var record = new StoredThemeRecord
        {
            Id = id,
            Name = PlayerThemeV2Validator.NormalizeName(request.Name),
            Revision = 1,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            ThemeJson = PlayerThemeV2Validator.ValidateThemeJson(request.ThemeJson, _options.MaxThemeJsonBytes)
        };
        EnsureAtomicJsonQuota(userId, path, JsonSerializer.SerializeToUtf8Bytes(record, JsonOptions).Length);
        AtomicWriteJson(path, record);
        return record;
    }

    private List<ThemeSummary> GetThemesUnsafe(long userId)
    {
        var directory = ThemeDirectory(userId);
        if (!Directory.Exists(directory))
        {
            return new List<ThemeSummary>();
        }

        return Directory.EnumerateFiles(directory, "*.json", SearchOption.TopDirectoryOnly)
            .Where(path => !path.EndsWith(".bak", StringComparison.OrdinalIgnoreCase))
            .Select(ReadRecoverable<StoredThemeRecord>)
            .Where(record => record is not null)
            .Select(record => record!.Summary)
            .OrderByDescending(summary => summary.UpdatedAtUtc)
            .ToList();
    }

    private T? ReadRecoverable<T>(string path)
        where T : class
    {
        foreach (var candidate in new[] { path, path + ".bak" })
        {
            if (!File.Exists(candidate))
            {
                continue;
            }
            try
            {
                var value = JsonSerializer.Deserialize<T>(File.ReadAllText(candidate, Encoding.UTF8), JsonOptions);
                if (value is not null)
                {
                    return value;
                }
            }
            catch (JsonException)
            {
                // A previous atomic backup remains the recovery source.
            }
            catch (IOException)
            {
                // Treat a transient or damaged primary file like a failed read.
            }
        }
        return null;
    }

    private void AtomicWriteJson<T>(string path, T value)
    {
        var directory = Path.GetDirectoryName(path)!;
        Directory.CreateDirectory(directory);
        var temp = Path.Combine(directory, "." + Path.GetFileName(path) + "." + Guid.NewGuid().ToString("N") + ".tmp");
        try
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions);
            using (var stream = new FileStream(temp, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.WriteThrough))
            {
                stream.Write(bytes, 0, bytes.Length);
                stream.Flush(true);
            }
            if (File.Exists(path))
            {
                File.Copy(path, path + ".bak", true);
            }
            File.Move(temp, path, true);
        }
        finally
        {
            if (File.Exists(temp))
            {
                File.Delete(temp);
            }
        }
    }

    private void EnsureAtomicJsonQuota(long userId, string path, long serializedBytes)
    {
        EnsureQuotaForReplacement(
            userId,
            serializedBytes + FileLength(path),
            path,
            path + ".bak");
    }

    private void EnsureQuotaForReplacement(long userId, long incomingBytes, params string[] replacedPaths)
    {
        if (_options.UserQuotaBytes <= 0)
        {
            return;
        }
        var directory = UserDirectory(userId);
        var current = Directory.Exists(directory)
            ? Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories).Sum(path => new FileInfo(path).Length)
            : 0;
        var replacedBytes = replacedPaths.Distinct(StringComparer.OrdinalIgnoreCase).Sum(FileLength);
        if (current - replacedBytes + incomingBytes > _options.UserQuotaBytes)
        {
            throw new InvalidOperationException("The user theme storage quota has been exceeded.");
        }
    }

    private static long FileLength(string path)
    {
        return File.Exists(path) ? new FileInfo(path).Length : 0;
    }

    private static UserWorkspaceRecord NewWorkspace()
    {
        return new UserWorkspaceRecord { UpdatedAtUtc = DateTime.UtcNow };
    }

    private static string? NormalizeOptionalThemeId(string? id)
    {
        return string.IsNullOrWhiteSpace(id) ? null : PlayerThemeV2Validator.NormalizeId(id);
    }

    private object UserLock(long userId)
    {
        if (userId <= 0)
        {
            throw new UnauthorizedAccessException("An authenticated Emby user is required.");
        }
        return _locks.GetOrAdd(userId, static _ => new object());
    }

    private string UserDirectory(long userId) => Path.Combine(_root, "users", "u-" + userId.ToString("x16"));

    private string WorkspacePath(long userId) => Path.Combine(UserDirectory(userId), "workspace.json");

    private string ThemeDirectory(long userId) => Path.Combine(UserDirectory(userId), "themes");

    private string ThemePath(long userId, string id) => Path.Combine(ThemeDirectory(userId), id + ".json");

    private string AssetDirectory(long userId) => Path.Combine(UserDirectory(userId), "assets");

    private string AssetDataPath(long userId, string id) => Path.Combine(AssetDirectory(userId), id + ".data");

    private string AssetMetadataPath(long userId, string id) => Path.Combine(AssetDirectory(userId), id + ".json");
}
