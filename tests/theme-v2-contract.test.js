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
assert(adapter.includes("layoutOverrides") && models.includes("layoutOverrides"),
    "unedited responsive profiles should persist nearest-layout inheritance state");

["artwork", "metadata", "lyrics", "visualizer", "progress", "transport", "volume", "auxiliary"].forEach((layer) => {
    assert(adapter.includes(`${layer}: defaultPlayerThemeV2Layer`) || adapter.includes(`\"${layer}\"`), `${layer} should be editable`);
    assert(models.includes(`\"${layer}\"`), `${layer} should be server-validated`);
});

["pointerdown", "setPointerCapture", "ArrowLeft", "restorePlayerThemeV2History", "snapPlayerThemeV2Value"].forEach((behavior) => {
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
assert(tuningRanges.length >= 50, "all legacy numeric controls should remain in the V2 registry");
tuningRanges.forEach(([, id, minimum, maximum]) => {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const serverRange = new RegExp(
        `\\["${escapedId}"\\]\\s*=\\s*\\(${minimum.replace(".", "\\.")}\\s*,\\s*${maximum.replace(".", "\\.")}\\)`
    );
    assert(serverRange.test(validator), `${id} should use the same numeric range on the server and in its editor`);
});
assert(css.includes("backdrop-filter: none !important"), "the settings editor should remain opaque and unblurred");
assert(css.includes("z-index: 2147483600"), "the settings editor should stay above lyrics, queue and canvas handles");

console.log("PlayerThemeV2 registry, storage, editor and rendering contracts: ok");
