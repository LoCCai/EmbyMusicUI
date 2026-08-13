# ![preview](image/README/preview.png)

[中文说明](./README_CN.md)

EmbyLyricEnhance improves lyric rendering in Emby Web.

Current adapter: **Emby Server 4.9.5.0**

## Features

- Groups original lyrics, romanization, and translations that share a start time
- Parses enhanced LRC `<mm:ss.xx>` word timing and recomputes state after playback, seek forward, or seek backward
- Smooths word timing between Emby's native callbacks with `requestAnimationFrame` instead of visibly stepping at roughly 400 ms intervals
- Provides five built-in lyric rendering styles that can be switched instantly and synchronized through the authenticated workspace
- Replaces the lyric playback page's visual layer with nine read-only built-in compositions plus an unlimited per-user theme library
- Uses a single `PlayerThemeV2` registry for editor controls, validation, CSS/Canvas bindings, serialization, migration, and server rules
- Lets users drag, resize, rotate, layer, hide, lock, align, snap, nudge, undo, and redo artwork, metadata, lyrics, visualizer, and one constrained control dock
- Lets each orientation arrange control-dock rows and groups, reorder or hide eligible buttons, choose alignment and gaps, and move groups between rows while keeping progress and play/pause available
- Stores exactly two anchored design canvases—landscape (`1200×900`) and portrait (`900×1200`)—with independent scale/offset transforms and a persistent out-of-stage settings safety entry
- Supports Emby artwork, private image uploads, HTTPS artwork, private WOFF2 fonts, HTTPS WOFF2 fonts, polygon clipping, and independent three-tier lyric typography
- Integrates metadata, artwork, seeking, volume/mute, stop, previous/play/next, shuffle, repeat, queue, annotation, and artwork-rotation controls
- Offers an optional C# settings layer for administrator-controlled defaults and theme override policy
- Owns lyric line selection, click-to-seek, following, and manual-scroll pause inside the single root
- Injects only into `videoosd.js/css`; it does not patch the shared `listview.js` or `emby-itemscontainer.js`
- Safely renders lyric text with DOM text nodes; only `<br>` is treated as markup
- Keeps persistent original/enhanced backups and supports switching between them
- Refuses unknown files through exact Emby 4.9.5.0 SHA-256 checks

## Docker installation

Download or clone this repository on the **Docker host**, then run:

```bash
cd EmbyLyricEnhance
sh docker-install.sh
```

Without a container argument, the script searches the name, image, and status of running containers for `emby` (case-insensitive) and presents matching containers as a numbered list. The list always includes a manual-input option. If no match exists, it lists every running container and accepts an explicit **container name or container ID**, not an image name.

The container is selected once. The menu offers frontend injection, server plugin DLL installation, the guarded EDE 1.47 lifecycle/AMD repair, and a confirmed full restoration. Enter one install number, or a space-separated set such as `1 2 3`. Option `4` is exclusive and restores the original frontend and EDE files, safely removes this project's DLLs, preserves configuration/themes/backups, and restarts once.

Common non-interactive bundles:

```bash
sh docker-install.sh <container-name-or-id> all
sh docker-install.sh <container-name-or-id> plugin
sh docker-install.sh <container-name-or-id> ede
sh docker-install.sh <container-name-or-id> uninstall
```

The original frontend-only management commands remain available:

```bash
sh docker-install.sh <container-name-or-id> install
sh docker-install.sh <container-name-or-id> original
sh docker-install.sh <container-name-or-id> enhanced
sh docker-install.sh <container-name-or-id> status
```

`undo` is accepted as an alias for `original`.

The EDE repair keeps an original backup under `/config/emby-lyric-enhance/ede-1.47/`, safely skips containers without EDE, and rejects unrecognized versions. It also disables the embedded Danmaku UMD bundle's anonymous AMD registration so it cannot pollute Emby's Alameda queue and produce random `/web/modules/common/...` 404 paths. Inspect or restore it with `ede-status` and `ede-restore`.

No Emby restart is required after switching. Force-refresh Emby Web and clear the site cache only if the old frontend remains cached.

## C# settings and per-user theme service

The 0.5.0 C# plugin keeps the sanitized public display-default endpoint and adds an authenticated Theme V5 workspace, named-theme library, private asset service, and strict constrained-control-dock validation. User identity is derived only from the active Emby request; clients cannot select another user ID. Each workspace and theme is atomically persisted under the plugin data directory with integer revisions. Concurrent writes keep the server version and create a conflict copy instead of silently overwriting either edit.

Named themes have no artificial count limit. Administrators can configure the maximum theme JSON size, maximum asset size, and per-user storage quota. Uploaded resources are restricted to signature-checked PNG, JPEG, WebP, AVIF, and WOFF2 files. The frontend auto-saves a draft after about 500 ms, keeps a local offline queue, imports up to 24 legacy themes once, and retains the local cache after the server confirms migration.

See [`plugin/README_CN.md`](plugin/README_CN.md) for build, Docker installation, restart, and real-environment validation instructions. Installing or updating the DLL requires an Emby restart. Saving display settings or switching a frontend theme does not.

## Custom music-player shell and lyric themes

Opening the lyric view replaces the page's visual layer instead of stacking another dock over Emby's controls. It provides metadata, artwork ambience, seeking, volume/mute, stop, previous/play-pause/next, shuffle, repeat, play queue, annotation visibility, artwork rotation, and theme selection.

The **Interface** selector provides nine immutable built-in compositions backed by the same parameter model. Entering canvas edit mode captures the active composition, closes the modal settings drawer, and exposes five editable layer boxes: artwork, metadata, lyrics, visualizer, and control dock. Settings remains the highest interactive layer and never uses backdrop blur; oversized lyrics and the queue cannot cover it. Editing an immutable preset is saved as a new user theme.

Only orientation selects layout: landscape covers desktop, landscape tablet, and landscape phone; portrait covers portrait tablet and phone. Window size, ultrawide screens, short landscape screens, and soft keyboards do not create a third implicit layout. Every built-in theme is a complete public V5 `anchored-canvas-v2` document; V3/V4 remain import-compatible. Theme IDs are used only for catalog names, previews, and migration mapping, never for hidden geometry or visual CSS branches.

The theme library can save, duplicate, rename, delete, and restore designs through the current Emby account. UserWorkspace is the account authority; confirmed caches, drafts, and offline queues are isolated by Emby server plus user identity, and legacy browser state is read only for a first-time migration. Theme snapshots include both orientation layouts, both control-dock profiles, all frequency-analysis values, artwork source, three lyric tiers, follow delay, media-information fields, popup styling, and control safety settings. Artwork can use the current Emby image, a private upload, or an HTTPS URL. Lyrics can be positioned and sized freely; primary, secondary, and later lines have independent font source, size, weight, italic, spacing, line height, color, opacity, stroke, shadow, glow, and played/current/future colors.

The shell owns presentation and interaction while playback, seeking, queue state, and casting remain delegated to Emby's active `playbackmanager` session. It does not start a second audio engine. A custom button is disabled when its corresponding capability is unavailable.

Use the shell's **Style** selector to switch themes immediately:

| Theme | Effect |
| --- | --- |
| Classic cumulative | Keeps every sung word highlighted through the active word |
| Word focus | Emphasizes only the active word and dims sung words |
| Gradient sweep | Uses cumulative highlighting with a bright gradient edge on the active word |
| Apple style | Enlarges the current line while shrinking, fading, and softly blurring other lines |
| Minimal line | Removes per-word contrast and highlights the whole current line |

Switching does not require a refresh, reinjection, or Emby restart. Current settings are synchronized to the authenticated Emby user's workspace and retained in `localStorage` for migration and offline recovery.

`VideoOsd.onResume/onPause/destroy` owns a single `.elyric-player-root`. Artwork, metadata, the owned lyric viewport, visualizer, transport, queue, media card, settings, and designer all live under that root. The adapter no longer positions or clicks native lyric, queue, or transport DOM. Native OSD nodes are hidden only after a successful mount and are restored exactly on failure or teardown. Add `?elyric=off` to the URL to keep the native OSD for the current session without deleting theme data.

Lyric rendering remains an Emby Web frontend adapter. It covers Emby Web and clients that reuse that frontend, but cannot force native Android, iOS, or TV lyric views to use these themes. The optional C# plugin supplies server settings only and does not change this client boundary.

## Backup and container recreation warning

Backups are stored under:

```text
/config/emby-lyric-enhance/4.9.5.0/
├── original/
└── enhanced/
```

> **Do not delete/recreate the container or rebuild the image merely to switch between original and enhanced files.** The active patch lives under `/system`, so an image update or container recreation removes the injected copy.

When `/config` is mounted persistently, the backups remain available. If a recreated container still runs Emby 4.9.5.0, run the installer again. Do not apply this adapter after upgrading to a different Emby version; fingerprint validation will stop instead of overwriting a newer frontend with a 4.9.5.0 backup.

The host script warns and asks for confirmation if it cannot detect a persistent `/config` mount.

## Modified files

The 4.9.5.0 adapter changes only:

```text
/system/dashboard-ui/videoosd/lyrics.js
/system/dashboard-ui/videoosd/lyrics.css
/system/dashboard-ui/videoosd/videoosd.js
/system/dashboard-ui/videoosd/videoosd.css
```

The payload is stored in:

```text
adapters/4.9.5.0/lyrics.inject.js
adapters/4.9.5.0/lyrics.inject.css
```

It does not modify shared list rendering or `videoosd.html`. The original `lyrics.js/css` pair is restored while the payload is injected into `videoosd.js/css`.

## Smooth timing

The word layer uses `requestAnimationFrame` to interpolate playback position between PlaybackBridge callbacks. It stops for pause, seeking, teardown, or a hidden page and never extrapolates one sample for more than 800 ms. Clicking an owned lyric row seeks through the bridge.

Played and active words share the highlight style, so the highlighted portion grows cumulatively from the beginning of the line through the current word instead of lighting only one word at a time.

The final enhanced lyric group may omit its closing timestamp. If its last word extends beyond the event's fallback end, the adapter gives only that final word a one-second safety boundary. Intermediate groups still have to close before the next line starts, preventing highlight spillover.

## Safety and validation

The installer recognizes these unmodified Emby 4.9.5.0 files:

```text
lyrics.js   32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb
lyrics.css  82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7
videoosd.js 8c254d3a3844ee80f9d03205c94b04e60bc5440f44cf776e697c3ce96fd69687
videoosd.css 491e78881253de76cad25f76af3132cb13daf207bd865de92ccc8a68ac2bf3a7
```

Installation stops if a file was modified by another patch, the version is unknown, a backup is incomplete, or the injection anchor is not unique.

Run `plugin\scripts\verify.ps1` on Windows to check the parameter registry, server validation, user themes, the single-root DOM, VideoOsd lifecycle, PlaybackBridge, owned lyrics/queue, and four-file atomic rollback. A real Emby deployment still requires updating the DLL and four frontend files, restarting Emby for the DLL, clearing the site cache, and validating actual tracks.

The legacy `replacement/` files and `main.template.sh` belong to the previous Emby 4.8.11.0 global-hook adapter. Do not inject both adapters into one container.
