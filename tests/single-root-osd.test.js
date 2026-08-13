"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const js = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.js"), "utf8");
const css = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.css"), "utf8");
const manager = fs.readFileSync(path.join(root, "scripts", "container-manager.sh"), "utf8");
const pluginInstaller = fs.readFileSync(path.join(root, "docker-plugin-install.sh"), "utf8");

assert(js.includes("VideoOsd.prototype.onResume"));
assert(js.includes("VideoOsd.prototype.onPause"));
assert(js.includes("VideoOsd.prototype.destroy"));
assert(!js.includes("LyricsRenderer.prototype"), "the visible player must not hook the native lyric renderer");
assert(js.includes('control.className = "elyric-player-root elyric-player-shell elyric-theme-picker"'));
assert(js.includes('renderer.itemsContainer = lyricViewport'));
assert(js.includes("createPlaybackBridge"));
assert(js.includes("findOwnedLyricIndex") && js.includes("windowRadius = 18"),
    "long lyrics must use a binary-seeked current-line render window");
assert(js.includes("requestPlayerOverlayOpen") && js.includes("requestPlayerOverlayClose")
    && js.includes("anchorElement") && js.includes("preferredPlacement"),
    "all overlay entry points must use the shared manager with their real trigger anchor");
[
    'call("seek"', 'call("playPause"', 'call("getPlaylist"', 'call("setCurrentPlaylistItem"',
    'call("removeFromPlaylist"', 'call("movePlaylistItem"'
].forEach((contract) => assert(js.includes(contract), `missing bridge contract: ${contract}`));
[
    "osdContentSection", "osdPlayQueue", "NATIVE_PLAYER_SELECTORS", "btnPlayQueue",
    "videoOsdPositionSlider", "videoOsdVolumeSlider"
].forEach((legacy) => assert(!js.includes(legacy) && !css.includes(legacy), `legacy DOM dependency remains: ${legacy}`));
assert(js.includes("elyric=off"), "the native OSD escape hatch must remain available");
assert(js.includes("hideNativeOsd") && js.includes("restoreNativeOsd"));
assert(css.includes(".elyric-player-root") && css.includes(".elyric-player-lyric-viewport"));
assert(css.includes("--elyric-layer-overlay") && css.includes("--elyric-layer-scrim"),
    "the owned queue must render through the shared root overlay layer tokens");
assert(manager.includes('ANCHOR="_exports.default=VideoOsd"'));
["videoosd.js", "videoosd.css", "lyrics.js", "lyrics.css"].forEach((name) => {
    assert(manager.includes(name), `four-file manager is missing ${name}`);
});
assert(pluginInstaller.includes("/system/dashboard-ui/videoosd/videoosd.js"));
assert(!pluginInstaller.includes("/system/dashboard-ui/videoosd/lyrics.js"),
    "the DLL installer must inspect the active VideoOsd injection point");

console.log("single-root VideoOsd, bridge, lyrics, queue and rollback contracts: ok");
