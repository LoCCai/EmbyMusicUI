# ![preview](image/README/preview.png)

[中文说明](./README_CN.md)

EmbyLyricEnhance improves lyric rendering in Emby Web.

Current adapter: **Emby Server 4.9.5.0**

## Features

- Groups original lyrics, romanization, and translations that share a start time
- Parses enhanced LRC `<mm:ss.xx>` word timing and recomputes state after playback, seek forward, or seek backward
- Smooths word timing between Emby's native callbacks with `requestAnimationFrame` instead of visibly stepping at roughly 400 ms intervals
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

The script lists running containers and asks for the Emby **container name or container ID**, not the image name. Its menu can install, switch to the original files, re-enable the enhanced files, or show status.

Non-interactive commands are also available:

```bash
sh docker-install.sh <container-name-or-id> install
sh docker-install.sh <container-name-or-id> original
sh docker-install.sh <container-name-or-id> enhanced
sh docker-install.sh <container-name-or-id> status
```

`undo` is accepted as an alias for `original`.

No Emby restart is required after switching. Force-refresh Emby Web and clear the site cache only if the old frontend remains cached.

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

## Safety and validation

The installer recognizes these unmodified Emby 4.9.5.0 files:

```text
lyrics.js   32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb
lyrics.css  82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7
```

Installation stops if a file was modified by another patch, the version is unknown, a backup is incomplete, or the injection anchor is not unique.

Run `node tests/adapter.test.js` to validate grouping, safe text rendering, cumulative highlighting, seeking, pause detection, animation-frame interpolation, and the 800 ms extrapolation limit.

The legacy `replacement/` files and `main.template.sh` belong to the previous Emby 4.8.11.0 global-hook adapter. Do not inject both adapters into one container.
