"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapterPath = path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js");
const cssPath = path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.css");
const modelPath = path.join(__dirname, "..", "plugin", "src", "EmbyLyricEnhance.Core", "PlayerThemeV2Models.cs");
const adapter = fs.readFileSync(adapterPath, "utf8").replace(/\r\n?/g, "\n");
const css = fs.readFileSync(cssPath, "utf8").replace(/\r\n?/g, "\n");
const models = fs.readFileSync(modelPath, "utf8");

class Node {
    constructor(tagName) {
        this.tagName = tagName || "div";
        this.children = [];
        this.attributes = {};
        this.style = { setProperty() {}, removeProperty() {} };
        this.classList = { add() {}, remove() {}, contains() { return false; } };
    }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] || null; }
    removeAttribute(name) { delete this.attributes[name]; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    addEventListener() {}
    removeEventListener() {}
}

const document = {
    body: new Node("body"),
    head: new Node("head"),
    documentElement: new Node("html"),
    createElement(tagName) { return new Node(tagName); },
    createElementNS(namespace, tagName) { return new Node(tagName); },
    createTextNode() { return new Node(null); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {}
};
const window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
    matchMedia() { return { matches: false }; }
};
const storage = new Map();
const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
};
class MutationObserver { observe() {} disconnect() {} }
function VideoOsd() {}
VideoOsd.prototype.onResume = function () {};
VideoOsd.prototype.onPause = function () {};
VideoOsd.prototype.destroy = function () {};

global.window = window;
global.document = document;
global.location = { search: "", hash: "#!/videoosd/videoosd.html", pathname: "/web/index.html" };

new Function(
    "VideoOsd", "document", "MutationObserver", "performance",
    "requestAnimationFrame", "cancelAnimationFrame", "localStorage", "ApiClient",
    "_connectionmanager", "_playbackmanager", "_events", "_approuter", adapter
)(
    VideoOsd, document, MutationObserver, { now: () => Date.now() },
    () => 1, () => {}, localStorage, {}, {}, { default: {} }, {}, {}
);

const validationRuleBlock = models.match(/ValidationRuleIds\s*=\s*\{([\s\S]*?)\};/);
assert(validationRuleBlock, "the server must publish the validation rule catalog");
const serverRules = new Set([...validationRuleBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]));
const registry = window.__elyricPlayerThemeV2Registry;
assert(Array.isArray(registry) && registry.length > 250,
    "the parameter registry must enumerate the complete V6 theme surface");
assert.strictEqual(new Set(registry.map((entry) => entry.id)).size, registry.length,
    "theme parameter ids must be unique");
registry.forEach((entry) => {
    assert(entry.hasDefault && entry.hasValidator && entry.hasMigration,
        `${entry.id} must define default, validation and migration behavior`);
    assert(entry.editor && entry.binding && entry.serialize && entry.serverValidate,
        `${entry.id} must bind editor, renderer, serializer and server validation`);
    assert(entry.serverRule && serverRules.has(entry.serverRule),
        `${entry.id} must use a validation rule implemented by C#`);
});
assert(registry.some((entry) => entry.id === "visualizer.enabled" && entry.themePath === "v2.visualizer.enabled"),
    "visualizer.enabled must be part of the persisted registry");

const fixtures = window.__elyricPlayerThemeV6Fixtures;
assert.strictEqual(fixtures.length, 9, "the built-in catalog must contain nine V6 documents");
fixtures.forEach((fixture) => {
    assert.strictEqual(fixture.format, "emby-lyric-theme");
    assert.strictEqual(fixture.schemaVersion, 6);
    assert.strictEqual(fixture.layoutModel, "fixed-canvas-v1");
    assert.strictEqual(fixture.visualizer.enabled, true);
    ["landscape", "portrait"].forEach((profileId) => {
        const layout = fixture.layouts[profileId];
        const canvas = profileId === "landscape"
            ? { width: 1920, height: 1080 }
            : { width: 1080, height: 1920 };
        assert.deepStrictEqual(layout.canvas, canvas);
        ["artwork", "metadata", "lyrics", "visualizer", "controlDock"].forEach((layerId) => {
            const layer = layout[layerId];
            assert(layer && ["x", "y", "width", "height", "rotation", "z", "opacity", "hidden", "locked"]
                .every((key) => Object.prototype.hasOwnProperty.call(layer, key)),
            `${fixture.baseTheme}.${profileId}.${layerId} must use the complete V6 layer contract`);
        });
    });
});

const source = fixtures.find((fixture) => fixture.baseTheme === "rose");
const imported = JSON.parse(JSON.stringify(source));
imported.layouts.landscape.artwork.z = 27;
imported.layouts.portrait.lyrics.x = -31;
imported.console.material = "rainbow";
imported.visualizer.enabled = false;
const migrated = window.__elyricMigratePlayerThemeV2State(imported, "rose");
assert.strictEqual(migrated.layouts.landscape.artwork.z, 27, "valid user z values must survive migration");
assert.strictEqual(migrated.layouts.portrait.lyrics.x, -31,
    "ordinary partially off-canvas geometry must not be silently repaired");
assert.strictEqual(migrated.console.material, "rainbow");
assert.strictEqual(migrated.visualizer.enabled, false);

const portable = window.__elyricPortablePlayerThemeV6({
    id: "roundtrip",
    name: "V6 round trip",
    baseLayout: "rose",
    tuning: {}, choices: { controlMaterial: "black" }, colors: {}, player: {}, mediaFields: {},
    v2: migrated
});
assert.strictEqual(portable.schemaVersion, 6);
assert.strictEqual(portable.layouts.landscape.artwork.z, 27);
assert.strictEqual(portable.layouts.portrait.lyrics.x, -31);
assert.strictEqual(portable.console.material, "rainbow",
    "portable V6 console.material must win over legacy choices.controlMaterial");
assert.strictEqual(portable.visualizer.enabled, false);

assert(!/scrollIntoView\s*\(/.test(adapter), "lyric following must never scroll an ancestor document");
assert(!/(?:lyricsScroller|lyricsItem|secondaryText|listItemBodyText)/.test(adapter),
    "the Shadow player must not use native Emby lyric classes");
assert(/attachShadow\s*\(\s*\{\s*mode:\s*["']open["']\s*\}/.test(adapter));
assert(/\.elyric-player-host\s*\{[\s\S]*?position:\s*fixed/.test(css));
assert(/fixed-canvas-v1[\s\S]*?\.elyric-player-lyric-viewport \.elyric-lyric-row\s*\{[\s\S]*?height:\s*auto\s*!important/.test(css),
    "V6 lyric rows must size to their own content instead of inheriting the viewport height");
assert(/\.elyric-player-lyric-viewport::-webkit-scrollbar\s*\{[\s\S]*?width:\s*0/.test(css),
    "the owned lyric viewport must keep scrolling without exposing an unthemed native scrollbar");
assert(!/layoutRepairRevision|repairPlayerThemeV5State/.test(adapter),
    "runtime layout repair markers and mutators must be removed");

console.log("adapter V6 registry, fixtures, migration, isolation and persistence contract: ok");
