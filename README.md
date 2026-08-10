# ![preview](image/README/preview.png)

[中文说明](./README_CN.md)

EmbyLyricEnhance improves lyric rendering in Emby Web.

Current adapter: **Emby Server 4.9.5.0**

## Features

- Groups original lyrics, romanization, and translations that share a start time
- Parses enhanced LRC `<mm:ss.xx>` word timing and recomputes state after playback, seek forward, or seek backward
- Smooths word timing between Emby's native callbacks with `requestAnimationFrame` instead of visibly stepping at roughly 400 ms intervals
- Provides five built-in lyric themes that can be switched instantly on the playback page and remembered by the browser
- Replaces the lyric playback page's visual layer with nine parametric full-page compositions and saveable user themes
- Lets users position and style artwork, metadata, lyrics, visualizer, progress, volume, and media-information surfaces independently
- Integrates metadata, artwork, seeking, volume/mute, stop, previous/play/next, shuffle, repeat, queue, annotation, and artwork-rotation controls
- Offers an optional C# settings layer for administrator-controlled defaults and theme override policy
- Preserves Emby's native line selection, seek action, and scrolling
- Injects only into the lyric-specific module; it does not patch the shared `listview.js` or `emby-itemscontainer.js`
- Safely renders lyric text with DOM text nodes; only `<br>` is treated as markup
- Keeps persistent original/enhanced backups and supports switching between them
- Refuses unknown files through exact Emby 4.9.5.0 SHA-256 checks

## Docker installation

Download or clone this repository on the **Docker host**, then run:

```bash
cd EmbyLyricEnhance
sh docker-install.sh
```

Without a container argument, the script searches the name, image, and status of running containers for `emby` (case-insensitive) and presents matching containers as a numbered list. The list always includes a manual-input option. If no match exists, it lists every running container and accepts an explicit **container name or container ID**, not an image name. Its next menu can install, switch to the original files, re-enable the enhanced files, or show status.

Non-interactive commands are also available:

```bash
sh docker-install.sh <container-name-or-id> install
sh docker-install.sh <container-name-or-id> original
sh docker-install.sh <container-name-or-id> enhanced
sh docker-install.sh <container-name-or-id> status
```

`undo` is accepted as an alias for `original`.

No Emby restart is required after switching. Force-refresh Emby Web and clear the site cache only if the old frontend remains cached.

## Optional C# settings plugin

The `codex/plugin-settings` branch adds a hybrid mode. The existing JS/CSS remains the lyric parser and renderer, while the C# plugin contributes an Emby administration page and a read-only public display-configuration endpoint. That endpoint intentionally exposes only sanitized, non-sensitive visual fields and has no mutation route; administrator writes continue through Emby's protected plugin-configuration API. Lyrics keep using built-in defaults if the DLL is absent, disabled, or temporarily unreachable.

Administrators can configure the default theme, browser override policy, typography, highlight color, opacity, glow, scale, blur, and subline visibility. Re-entering the lyric view refreshes server settings; a saved browser theme still wins when overrides are allowed.

See [`plugin/README_CN.md`](plugin/README_CN.md) for build, Docker installation, restart, and real-environment validation instructions. Installing or updating the DLL requires an Emby restart. Saving display settings or switching a frontend theme does not.

## Custom music-player shell and lyric themes

Opening the lyric view replaces the page's visual layer instead of stacking another dock over Emby's controls. It provides metadata, artwork ambience, seeking, volume/mute, stop, previous/play-pause/next, shuffle, repeat, play queue, annotation visibility, artwork rotation, and theme selection.

The **Interface** selector provides nine built-in compositions backed by the same parameter model. Artwork supports independent inner/outer size and radius, including square-in-circle and circle-in-square treatments; artwork, metadata, lyrics, and the visualizer each have independent stage coordinates. Lyrics, progress, volume, surfaces, typography, spacing, blur, opacity, and theme colors can be adjusted without editing CSS.

The theme library can save the current design as a user theme, then save, duplicate, rename, delete, and restore it through the current Emby account. Media-information groups and card styling are stored with the theme. On desktop and landscape screens the media card is anchored to the information button and automatically flips or clamps at viewport edges; portrait phones use a bottom safe-area drawer.

The shell owns presentation and interaction while playback, seeking, queue state, and casting remain delegated to Emby's native playback session. It does not start a second audio engine. A custom button is disabled when its corresponding native action is unavailable.

Use the shell's **Style** selector to switch themes immediately:

| Theme | Effect |
| --- | --- |
| Classic cumulative | Keeps every sung word highlighted through the active word |
| Word focus | Emphasizes only the active word and dims sung words |
| Gradient sweep | Uses cumulative highlighting with a bright gradient edge on the active word |
| Apple style | Enlarges the current line while shrinking, fading, and softly blurring other lines |
| Minimal line | Removes per-word contrast and highlights the whole current line |

Switching does not require a refresh, reinjection, or Emby restart. The choice is stored in the current browser's `localStorage` under `emby-lyric-enhance.theme` and is restored on the next lyric view. Each browser and device keeps its own choice.

The shell is mounted at the document level while visibility remains owned by the active lyric playback page. Leaving playback, opening a native queue view, covering the page, or detaching the lyric container removes all page-level layout state and restores Emby's native UI. Reopening lyrics restores the saved layout and removes stale duplicates.

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
```

The payload is stored in:

```text
adapters/4.9.5.0/lyrics.inject.js
adapters/4.9.5.0/lyrics.inject.css
```

It does not modify shared list rendering, `videoosd.js`, or `videoosd.html`.

## Smooth timing

The word layer uses `requestAnimationFrame` to interpolate playback position between native callbacks, normally updating at the display refresh rate. Interpolation starts only after two consecutive native samples confirm forward playback. It stops for pause, buffering, seeking, or a hidden page, and never extrapolates one sample for more than 800 ms. Emby's native line selection and scrolling retain their original cadence.

Played and active words share the highlight style, so the highlighted portion grows cumulatively from the beginning of the line through the current word instead of lighting only one word at a time.

The final enhanced lyric group may omit its closing timestamp. If its last word extends beyond the event's fallback end, the adapter gives only that final word a one-second safety boundary. Intermediate groups still have to close before the next line starts, preventing highlight spillover.

## Safety and validation

The installer recognizes these unmodified Emby 4.9.5.0 files:

```text
lyrics.js   32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb
lyrics.css  82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7
```

Installation stops if a file was modified by another patch, the version is unknown, a backup is incomplete, or the injection anchor is not unique.

Run `plugin\scripts\verify.ps1` on Windows to check the C# configuration core and API contract together with frontend integration, grouping, safe text rendering, custom transport/volume delegation and seeking, annotation/artwork-rotation controls, three-layout switching, all five themes, layout/rotation/theme persistence, page restoration, lyric line state, cumulative highlighting, pause detection, animation-frame interpolation, and the 800 ms extrapolation limit. Real `MediaBrowser.*` compilation and Emby container loading still require an online environment.

The legacy `replacement/` files and `main.template.sh` belong to the previous Emby 4.8.11.0 global-hook adapter. Do not inject both adapters into one container.
