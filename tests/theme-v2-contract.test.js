"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const adapter = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.js"), "utf8");
const css = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.css"), "utf8");
const models = fs.readFileSync(path.join(root, "plugin", "src", "EmbyLyricEnhance.Core", "PlayerThemeV2Models.cs"), "utf8");
const validator = fs.readFileSync(path.join(root, "plugin", "src", "EmbyLyricEnhance.Core", "PlayerThemeV2Validator.cs"), "utf8");
const store = fs.readFileSync(path.join(root, "plugin", "src", "EmbyLyricEnhance.Core", "UserThemeStore.cs"), "utf8");
const service = fs.readFileSync(path.join(root, "plugin", "src", "EmbyLyricEnhance.Plugin", "UserThemeService.cs"), "utf8");

assert(adapter.includes("PLAYER_THEME_V2_REGISTRY"), "the web editor should expose one V2 parameter registry");
["defaultValue", "validate", "editor", "binding", "serialize", "serverValidate", "serverRule", "migrate"].forEach((field) => {
    assert(adapter.includes(field), `registered parameters should declare ${field}`);
});

["landscape", "portrait"].forEach((profile) => {
    assert(adapter.includes(`\"${profile}\"`) || adapter.includes(`${profile}:`), `${profile} should have a saved layout profile`);
    assert(models.includes(`\"${profile}\"`), `${profile} should be server-validated`);
});
assert(adapter.includes('layoutModel: PLAYER_THEME_LAYOUT_MODEL') && models.includes('LayoutModel = "fixed-canvas-v1"'),
    "V6 themes should declare the fixed canvas model");
assert(adapter.includes("absolutePlayerThemeV6Layer")
    && adapter.includes("delete layer.anchorX") && adapter.includes("delete layer.anchorY"),
    "V1-V5 anchors must migrate into absolute V6 canvas coordinates and disappear from new documents");
assert(validator.includes("fixedCanvas") && validator.includes("Only Theme V6 can define a fixed canvas"),
    "the server must distinguish strict fixed V6 canvases from anchored V4/V5 layouts");
assert(validator.includes("ValidateSystemChrome") && validator.includes("ValidateOverlays")
    && validator.includes("ValidateVolume") && validator.includes("ValidateV6Console"),
    "all V6 visual parameter families must use strict server-side validation");
assert(adapter.includes("createMetadataSummaryFieldControl")
    && adapter.includes("createPlayerThemeV6RangeSetting") && adapter.includes("syncPlayerThemeV6Settings"),
    "V6 metadata, chrome, overlay and volume parameters must remain editable instead of JSON-only");
assert(adapter.includes('PLAYER_THEME_LEGACY_V5_LAYOUT_MODEL = "anchored-canvas-v2"')
    && models.includes('LegacyV5LayoutModel = "anchored-canvas-v2"'),
    "existing V5 account drafts should migrate once into the fixed 16:9/9:16 canvas");
assert(/applyPlayerThemeDefinition\(\s*renderer,\s*preferences\.playerThemeDesign\s*\)/.test(adapter)
    && adapter.includes('服务器 Workspace 接口未确认新的 revision'),
    "Workspace drafts must restore regardless of their source preset and sync only after a revision acknowledgement");
assert(adapter.includes('viewport: { fit: "contain", alignX: "center", alignY: "end" }')
    && adapter.includes("canvas: clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES.landscape)")
    && adapter.includes("canvas: clonePlayerThemeV2Value(PLAYER_THEME_CANVAS_SIZES.portrait)"),
    "V6 should use two immutable design canvases and one contain/end viewport transform");
assert(validator.includes("Theme V4 must declare its anchored canvas layout model")
    && validator.includes("Theme V4 must contain both anchored layouts")
    && validator.includes("Theme V4 layouts must contain all editable layers")
    && validator.includes("Theme V4 tuning cannot contain duplicate geometry fields"),
    "internal V4 server storage should enforce the same single-geometry contract as portable themes");

["artwork", "metadata", "lyrics", "visualizer", "controlDock"].forEach((layer) => {
    assert(adapter.includes(`${layer}: defaultPlayerThemeV2Layer`) || adapter.includes(`\"${layer}\"`), `${layer} should be editable`);
    assert(models.includes(`\"${layer}\"`), `${layer} should be server-validated`);
});

["pointerdown", "setPointerCapture", "ArrowLeft", "restorePlayerThemeV2History", "snapPlayerThemeV2Value", "inverse", "requestAnimationFrame"].forEach((behavior) => {
    assert(adapter.includes(behavior), `the visual canvas should implement ${behavior}`);
});

["primary", "secondary", "tertiary"].forEach((line) => {
    assert(adapter.includes(`\"${line}\"`), `${line} lyric typography should be serialized`);
    assert(css.includes(`--elyric-v2-${line}-`), `${line} lyric typography should render through CSS`);
});

["sensitivity", "response", "smoothing", "density", "bassBoost", "minFrequency", "maxFrequency"].forEach((setting) => {
    assert(adapter.includes(`id: \"${setting}\"`), `${setting} should stay in the visualizer analysis registry`);
    assert(adapter.includes(`state.visualizer.analysis[definition.id]`), "analysis values should be part of every theme snapshot");
});

assert(!adapter.includes("MAX_USER_PLAYER_THEMES"), "named theme storage must not have an artificial count cap");
assert(adapter.includes("MAX_LEGACY_USER_PLAYER_THEMES = 24"), "only legacy migration should retain the old 24-theme bound");
assert(adapter.includes("PLAYER_PREFERENCES_SAVE_DELAY = 500"), "workspace drafts should use the specified 500 ms debounce");
assert(adapter.includes("PLAYER_THEME_V2_OFFLINE_QUEUE_KEY"), "offline edits should enter a persistent sync queue");
assert(adapter.includes("playerThemeV2ScopedKey") && adapter.includes("playerThemeV2AccountScope"),
    "workspace caches and offline edits must be isolated by server and user");
assert(adapter.includes("!renderer.__elyricWorkspaceReady"),
    "automatic saves must remain disabled until workspace initialization finishes");
assert(adapter.includes("legacyPersistUserPlayerPreferences") && !/function persistUserPlayerPreferences[\s\S]{0,1000}updateDisplayPreferences/.test(adapter),
    "daily persistence must write Workspace only, leaving DisplayPreferences for one-time migration");
const mountInitialization = adapter.match(/function ensureThemeControl[\s\S]*?function removeThemeControl/);
assert(mountInitialization && !/loadStored(?:Theme|PlayerLayout|ArtworkRotation|Number|HexColor|PlayerTuning)|loadVisualizerChoice|loadLyricScale/.test(mountInitialization[0]),
    "the live mount path must not apply unscoped legacy browser settings before UserWorkspace");
assert(!/if \(persist\) \{\s*(?:storeTheme|storePlayerLayout|storeArtworkRotation|storeVisualizerValue|storePlayerTuning)\(/.test(adapter),
    "daily edits must not keep writing unscoped legacy browser keys");
assert(adapter.includes("storeConfirmedPlayerThemeV2Workspace(renderer, value, summaries)"),
    "every confirmed Workspace PUT should refresh the account-scoped offline cache");
assert(adapter.includes("renderer.__elyricThemeLibraryApiError = themesResult.error || null")
    && adapter.includes("workspaceErrorStatus"),
    "a theme-list failure must not suppress an otherwise valid Workspace and API failures must remain diagnosable");
assert(adapter.includes("主题同步接口未加载（HTTP 404）")
    && adapter.includes("playerThemeV2WorkspaceUnavailableStatus(error)"),
    "the settings status must explain when the account-sync DLL route is missing instead of reporting a generic default");
assert(models.includes('"control-dock"') && validator.includes("ValidateControlDockProfile"),
    "the server must strictly validate V5 control dock profiles");

["UserWorkspace", "Themes/{Id}", "Assets/{Id}"].forEach((route) => {
    assert(service.includes(route), `${route} should be implemented by the plugin`);
});
assert(service.includes("IAuthorizationContext") && service.includes("GetAuthorizationInfo(Request)"),
    "user identity must come from the authenticated Emby request context");
assert(!service.match(/class (?:Get|Put|Post|Delete).*\bUserId\s*\{/),
    "public request DTOs must not accept a user id");
assert(store.includes("AtomicWriteJson") && store.includes("FileOptions.WriteThrough"),
    "theme writes should be atomic and flushed");
assert(store.includes("ConflictCopy") && store.includes("（冲突副本）"),
    "revision conflicts should preserve both versions");
assert(validator.includes("image/svg+xml") === false && validator.includes("font/woff2"),
    "the asset validator should reject active SVG and allow WOFF2");
assert(validator.includes("TuningRanges") && validator.includes("RejectUnknownProperties")
    && models.includes("ValidationRuleIds"),
    "server validation should enforce the same concrete rules named by the frontend registry");

const tuningBlock = adapter.match(/var PLAYER_TUNING_DEFINITIONS\s*=\s*\[([\s\S]*?)var PLAYER_THEME_V2_PROFILE_IDS/);
assert(tuningBlock, "the numeric tuning registry should be statically inspectable");
const tuningRanges = [...tuningBlock[1].matchAll(
    /id:\s*"([^"]+)"[\s\S]*?minimum:\s*(-?[\d.]+),\s*maximum:\s*(-?[\d.]+)/g
)];
assert(tuningRanges.length >= 50, "legacy inputs should remain available for V3 migration");
const geometricTuning = new Set([
    "artworkSize", "artworkX", "artworkY", "metadataWidth", "metadataX", "metadataY",
    "lyricsWidth", "lyricsHeight", "lyricsX", "lyricsY", "visualizerX", "visualizerY",
    "visualizerRotation", "visualizerOpacity", "progressWidth", "volumeWidth"
]);
tuningRanges.filter(([, id]) => !geometricTuning.has(id)).forEach(([, id, minimum, maximum]) => {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const serverRange = new RegExp(
        `\\["${escapedId}"\\]\\s*=\\s*\\(${minimum.replace(".", "\\.")}\\s*,\\s*${maximum.replace(".", "\\.")}\\)`
    );
    assert(serverRange.test(validator), `${id} should use the same numeric range on the server and in its editor`);
});
assert(adapter.includes("PLAYER_LEGACY_GEOMETRY_TUNING_IDS.indexOf(definition.id) < 0"),
    "V4 serialization should filter the duplicate legacy geometry tuning fields");
assert(css.includes("backdrop-filter: none !important"), "the settings editor should remain opaque and unblurred");
assert(css.includes("--elyric-layer-overlay") && css.includes("--elyric-layer-designer"),
    "single-root overlays and designer handles should use one bounded layer-token system");
assert(css.includes("V4 geometry ownership") && css.includes(".elyric-player-button-back")
    && css.includes(".elyric-player-button-cast"),
    "V6 should retain one geometry owner and fixed self-rendered system chrome");
assert(!adapter.includes('isCompactPlayerViewport() ? "compact" : "desktop"'),
    "runtime layout selection must never reintroduce compact or desktop profiles");
assert(!adapter.includes("rect.left / window.innerWidth"),
    "saved layout data must never be inferred from rendered viewport rectangles");
assert(!css.includes("data-elyric-player-layout"),
    "theme ids must never select geometry or hidden visual CSS");
assert(!css.includes("data-elyric-compact") && !adapter.includes("data-elyric-compact"),
    "the V4 runtime must not retain a third compact layout mode");
assert(!adapter.includes('setAttributeIfChanged(body, "data-elyric-player-layout"')
    && !adapter.includes('setAttributeIfChanged(renderer.itemsContainer, "data-elyric-player-layout"'),
"the V4 renderer must not expose a theme-id styling hook");
assert(adapter.includes("PLAYER_ARTWORK_MATERIALS") && adapter.includes("PLAYER_CONTROL_MATERIALS")
    && css.includes("data-elyric-artwork-material") && css.includes("data-elyric-control-material"),
"built-in visual identity must be reproducible through public material parameters");
assert(!adapter.includes("PLAYER_THEME_V3_BUILTIN_LAYOUTS") && !adapter.includes("builtInPlayerThemeV3State"),
    "V4 built-ins and migrations should not keep misleading V3 runtime names");
assert(!adapter.includes("portablePlayerThemeV3") && !adapter.includes("__elyricPlayerThemeV3Fixtures"),
    "V4 export and test hooks should not keep misleading V3 runtime names");
assert(adapter.includes("function portablePlayerThemeV5") && adapter.includes("__elyricPlayerThemeV6Fixtures")
    && adapter.includes("__elyricPortablePlayerThemeV6"),
"V6 export and built-in fixtures should expose first-class V6 names while preserving compatibility aliases");
assert(css.includes('[data-elyric-theme-v2="true"] .elyric-player-v2-layer')
    && css.includes("inset: auto !important") && css.includes("max-width: none !important"),
"V4 geometry ownership must override every legacy theme-specific rectangle while V3 stays compatible");
assert(/fixed-canvas-v1[\s\S]*?\.elyric-player-control-dock \.elyric-player-control-group\s*\{[^}]*position:\s*static\s*!important[^}]*inset:\s*auto\s*!important[^}]*flex:\s*0 0 auto\s*!important[^}]*width:\s*auto\s*!important[^}]*min-width:\s*0\s*!important[^}]*max-width:\s*none\s*!important[^}]*transform:\s*none\s*!important/s.test(css),
    "every V6 ControlDock group must clear legacy geometry so portrait auxiliary and volume controls cannot overlap");
const profileResolver = adapter.slice(adapter.indexOf("function currentPlayerThemeV2Profile"),
    adapter.indexOf("function resolvedPlayerThemeV2Layout"));
assert(profileResolver.includes("visualWidth || layoutWidth") && !profileResolver.includes("Math.max("),
    "orientation must prefer the real visualViewport instead of expanding to Emby's stale document dimensions");
assert(adapter.includes("function schedulePlayerOverlayReposition")
    && adapter.includes("function observePlayerOverlaySize")
    && adapter.includes("new ResizeObserver"),
"button-anchored overlays must perform a deferred final measurement and observe asynchronous content size changes");

function cssMediaBlocks(source) {
    const blocks = [];
    let cursor = 0;
    while ((cursor = source.indexOf("@media", cursor)) >= 0) {
        const open = source.indexOf("{", cursor);
        if (open < 0) break;
        let depth = 1;
        let end = open + 1;
        while (end < source.length && depth > 0) {
            if (source[end] === "{") depth += 1;
            else if (source[end] === "}") depth -= 1;
            end += 1;
        }
        blocks.push(source.slice(cursor, end));
        cursor = end;
    }
    return blocks;
}
const mediaBlocks = cssMediaBlocks(css)
    .filter((block) => /(?:max-width:\s*(?:760|1080)px|max-height|min-width:\s*1920px)/.test(block));
mediaBlocks.forEach((block) => {
    assert(!/\.elyric-player-v2-layer(?:-[a-z]+)?[^\{]*\{[^}]*\b(?:left|top|right|bottom|width|height|transform)\s*:/s.test(block),
        "legacy size breakpoints must not own V4 editable-layer geometry");
});

console.log("PlayerThemeV2 registry, storage, editor and rendering contracts: ok");
