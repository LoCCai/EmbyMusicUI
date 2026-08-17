"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class ClassList {
    constructor(owner) { this.owner = owner; this.values = []; }
    sync() { this.owner._className = this.values.join(" "); }
    add(...values) { values.forEach((value) => { if (!this.values.includes(value)) this.values.push(value); }); this.sync(); }
    remove(...values) { this.values = this.values.filter((value) => !values.includes(value)); this.sync(); }
    contains(value) { return this.values.includes(value); }
}

class Style {
    constructor() { this.values = new Map(); this.visibility = ""; this.pointerEvents = ""; }
    setProperty(name, value) { this.values.set(name, String(value)); }
    removeProperty(name) { const old = this.values.get(name) || ""; this.values.delete(name); return old; }
    getPropertyValue(name) { return this.values.get(name) || ""; }
}

class CanvasContext {
    setTransform() {} clearRect() {} beginPath() {} moveTo() {} lineTo() {}
    stroke() {} fill() {} fillRect() {} arc() {}
    createLinearGradient() { return { addColorStop() {} }; }
}

class Node {
    constructor(tagName, text) {
        this.tagName = tagName || null;
        this.nodeText = text || "";
        this.children = [];
        this.attributes = {};
        this._className = "";
        this.classList = new ClassList(this);
        this.style = new Style();
        this.parentNode = null;
        this.listeners = {};
        this.disabled = false;
        this.value = "";
        this.scrollHeight = 500;
    }
    set className(value) { this._className = String(value); this.classList.values = this._className.split(/\s+/).filter(Boolean); }
    get className() { return this._className; }
    setAttribute(name, value) { this.attributes[name] = String(value); if (name === "class") this.className = value; }
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); }
    removeAttribute(name) { delete this.attributes[name]; }
    appendChild(child) { if (child.parentNode) child.parentNode.removeChild(child); this.children.push(child); child.parentNode = this; return child; }
    removeChild(child) { const index = this.children.indexOf(child); if (index >= 0) this.children.splice(index, 1); child.parentNode = null; return child; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    removeEventListener(type, listener) { this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener); }
    dispatchEvent(event) {
        event.target ||= this; event.currentTarget = this;
        event.stopPropagation ||= function () {};
        event.preventDefault ||= function () { this.defaultPrevented = true; };
        (this.listeners[event.type] || []).slice().forEach((listener) => listener.call(this, event));
        return !event.defaultPrevented;
    }
    click() { this.dispatchEvent({ type: "click" }); }
    focus(options) {
        this.focusOptions = options || null;
        document.activeElement = this;
        if (!options || true !== options.preventScroll) {
            let root = this;
            while (root && (!root.classList || !root.classList.contains("elyric-player-root"))) {
                root = root.parentNode;
            }
            if (root) root.scrollTop = 144;
        }
    }
    select() {}
    scrollIntoView() { this.scrollIntoViewCount = (this.scrollIntoViewCount || 0) + 1; }
    get firstChild() { return this.children[0] || null; }
    get isConnected() { let node = this; while (node.parentNode) node = node.parentNode; return node === document.body || node === document.head; }
    getClientRects() { return this.isConnected ? [{}] : []; }
    getBoundingClientRect() { return { left: 0, top: 0, right: 900, bottom: 600, width: 900, height: 600 }; }
    getContext(type) { if (this.tagName !== "canvas" || type !== "2d") return null; return this.context ||= new CanvasContext(); }
    contains(node) { while (node) { if (node === this) return true; node = node.parentNode; } return false; }
    get textContent() { return undefined !== this._textContent ? this._textContent : this.tagName ? this.children.map((child) => child.textContent).join("") : this.nodeText; }
    set textContent(value) { this._textContent = String(value); this.children = []; }
    matches(selector) {
        if (/^[a-z][a-z0-9-]*$/i.test(selector)) return this.tagName === selector.toLowerCase();
        if (/^\.[a-z0-9_-]+$/i.test(selector)) return this.classList.contains(selector.slice(1));
        let match = selector.match(/^\.([a-z0-9_-]+)\[([a-z0-9_-]+)\]$/i);
        if (match) return this.classList.contains(match[1]) && this.hasAttribute(match[2]);
        match = selector.match(/^([a-z][a-z0-9-]*)\[([a-z0-9_-]+)=["']([^"']+)["']\]$/i);
        if (match) return this.tagName === match[1].toLowerCase() && this.getAttribute(match[2]) === match[3];
        if (selector === "[data-elyric-start][data-elyric-end]") return this.hasAttribute("data-elyric-start") && this.hasAttribute("data-elyric-end");
        match = selector.match(/^\[([a-z0-9_-]+)\]$/i);
        return !!match && this.hasAttribute(match[1]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    querySelectorAll(selector) {
        const result = [];
        const visit = (node) => node.children.forEach((child) => { if (child.matches(selector)) result.push(child); visit(child); });
        visit(this); return result;
    }
}

const document = {
    hidden: false, head: new Node("head"), body: new Node("body"), documentElement: new Node("html"),
    activeElement: null, listeners: {},
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    removeEventListener(type, listener) { this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener); },
    createElement(tag) { return new Node(String(tag).toLowerCase()); },
    createElementNS(namespace, tag) { return new Node(String(tag).toLowerCase()); },
    createTextNode(text) { return new Node(null, String(text)); },
    querySelector(selector) { return this.body.matches(selector) ? this.body : this.body.querySelector(selector); },
    querySelectorAll(selector) { return this.body.querySelectorAll(selector); },
    elementFromPoint() { return this.body; }, execCommand() { return true; }
};
document.documentElement.clientHeight = 900;
Node.prototype.attachShadow = function () {
    const shadow = new Node("shadow-root");
    shadow.host = this;
    shadow.parentNode = this;
    const append = shadow.appendChild.bind(shadow);
    shadow.appendChild = function (child) {
        const result = append(child);
        if (child.tagName === "link") setImmediate(() => child.onload && child.onload());
        return result;
    };
    this.shadowRoot = shadow;
    return shadow;
};
const ownedStylesheet = document.createElement("link");
ownedStylesheet.setAttribute("rel", "stylesheet");
ownedStylesheet.setAttribute("href", "/web/videoosd/videoosd.css?v=test");
document.body.appendChild(ownedStylesheet);

const window = {
    innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, listeners: {},
    visualViewport: { width: 1440, height: 900, offsetLeft: 0, offsetTop: 0, addEventListener() {}, removeEventListener() {} },
    matchMedia(query) { return { matches: query.includes("prefers-reduced-motion") }; },
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    removeEventListener(type, listener) { this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener); },
    getComputedStyle() { return { paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0", getPropertyValue() { return "0"; } }; },
    confirm() { return true; }
};
class MutationObserver { observe() {} disconnect() {} }
const resizeObservers = [];
class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnected = false; resizeObservers.push(this); }
    observe(target) { if (!this.targets.includes(target)) this.targets.push(target); }
    disconnect() { this.targets = []; this.disconnected = true; }
}
function notifyResize(target, width, height) {
    resizeObservers.filter((observer) => !observer.disconnected && observer.targets.includes(target))
        .forEach((observer) => observer.callback([{ target, contentRect: { width, height } }]));
}
const stored = new Map();
const localStorage = {
    getItem(key) { return stored.has(key) ? stored.get(key) : null; },
    setItem(key, value) { stored.set(key, String(value)); }, removeItem(key) { stored.delete(key); }
};
// Deliberately stale, unscoped V4-era values. A non-empty UserWorkspace must
// win without flashing or re-saving these browser values.
stored.set("emby-lyric-enhance.theme", "focus");
stored.set("emby-lyric-enhance.player-layout", "mobile");
stored.set("emby-lyric-enhance.background-mode", "white");
const performance = { now: () => Date.now() };
let frameId = 1;
const frames = new Map();
function requestAnimationFrame(callback) { const id = frameId++; frames.set(id, callback); return id; }
function cancelAnimationFrame(id) { frames.delete(id); }
function flushFrame(id) {
    const callback = frames.get(id);
    if (!callback) return;
    frames.delete(id);
    callback(Date.now());
}

const bindings = [];
const events = { default: {
    on(source, type, listener) { bindings.push({ source, type, listener }); },
    off(source, type, listener) {
        for (let index = bindings.length - 1; index >= 0; index--) {
            const entry = bindings[index];
            if (entry.source === source && entry.type === type && entry.listener === listener) bindings.splice(index, 1);
        }
    }
} };
function trigger(source, type) {
    bindings.filter((entry) => entry.source === source && entry.type === type).slice()
        .forEach((entry) => entry.listener({ type }));
}

function item(id, name, mediaType = "Audio") {
    return { Id: id, Name: name, MediaType: mediaType, RunTimeTicks: 1800000000, Artists: ["测试歌手"], Album: "测试专辑",
        MediaSources: [{ Id: `source-${id}`, DefaultSubtitleStreamIndex: -1, MediaStreams: [
            { Type: "Audio", Index: 0 },
            { Type: "Subtitle", Index: 2, Codec: "text", Title: "Lyrics", IsDefault: false }
        ] }] };
}
const player = {};
player.endSession = function () { calls.push(["endSession"]); return Promise.resolve(); };
player.getSupportedCommands = function () { return ["EndSession"]; };
let currentItem = item("song-a", "歌曲 A");
let state = { NowPlayingItem: currentItem,
    PlayState: { PositionTicks: 50000000, IsPaused: false, IsMuted: false, VolumeLevel: 64 },
    PlaylistItemId: "queue-a", PlaylistIndex: 0, PlaylistLength: 2 };
const calls = [];
const queue = [Object.assign(item("song-a", "歌曲 A"), { PlaylistItemId: "queue-a" }),
    Object.assign(item("song-b", "歌曲 B"), { PlaylistItemId: "queue-b" })];
const manager = {
    getCurrentPlayer() { return player; }, getPlayerState() { return state; }, currentItem() { return currentItem; },
    getShuffle() { return false; }, getRepeatMode() { return "RepeatNone"; },
    seek(...args) { calls.push(["seek", ...args]); return Promise.resolve(); },
    playPause(...args) { calls.push(["playPause", ...args]); return Promise.resolve(); },
    previousTrack(...args) { calls.push(["previous", ...args]); return Promise.resolve(); },
    nextTrack(...args) { calls.push(["next", ...args]); return Promise.resolve(); },
    stop(...args) { calls.push(["stop", ...args]); return Promise.resolve(); },
    setVolume(...args) { calls.push(["volume", ...args]); return Promise.resolve(); },
    toggleMute(...args) { calls.push(["mute", ...args]); return Promise.resolve(); },
    setShuffle(...args) { calls.push(["shuffle", ...args]); return Promise.resolve(); },
    setRepeatMode(...args) { calls.push(["repeat", ...args]); return Promise.resolve(); },
    getPlaylist(...args) { calls.push(["getPlaylist", ...args]); return Promise.resolve({ Items: queue }); },
    setCurrentPlaylistItem(...args) { calls.push(["playQueue", ...args]); return Promise.resolve(); },
    removeFromPlaylist(...args) { calls.push(["removeQueue", ...args]); return Promise.resolve(); },
    movePlaylistItem(...args) { calls.push(["moveQueue", ...args]); return Promise.resolve(); }
    ,getTargets() { return Promise.resolve([
        { Id: "remote-living-room", Name: "客厅 Emby", PlayerName: "Emby Theater" }
    ]); }
    ,getPlayerInfo() { return { Id: "local-browser", Name: "此设备", IsLocalPlayer: true }; }
    ,trySetActivePlayer(...args) { calls.push(["castTarget", ...args]); return Promise.resolve(); }
    ,setDefaultPlayerActive(...args) { calls.push(["castLocal", ...args]); return Promise.resolve(); }
};

const pendingLyrics = new Map();
const requestedUrls = [];
const detailedItemRequests = [];
let currentUserId = "runtime-user";
let currentServerId = "server-a";
let displayPreferenceWrites = 0;
let forceWorkspaceConflict = false;
let forceWorkspaceBadRequest = false;
let failThemeList = false;
let workspacePayload = null;
let themeCommitVersion = "v1";
let forceThemeCommitConflict = false;
let forceThemeCommitChecksumMismatch = false;
let corruptNextThemeReadback = false;
const remoteThemes = new Map();
const themeCommitBodies = [];
let resolveInitialWorkspace;
const initialWorkspace = new Promise((resolve) => { resolveInitialWorkspace = resolve; });
const workspaceWrites = [];
const ApiClient = {
    getUrl(value) { requestedUrls.push(value); return `/${value}`; },
    ajax(request) {
        if (request.url.endsWith("/EmbyLyricEnhance/ThemeCommit") && request.type === "PUT") {
            const body = JSON.parse(request.data);
            themeCommitBodies.push(body);
            const normalized = JSON.stringify(JSON.parse(body.ThemeJson));
            const checksum = crypto.createHash("sha256").update(normalized).digest("hex");
            const existing = remoteThemes.get(body.ThemeId) || null;
            if (forceThemeCommitConflict) {
                forceThemeCommitConflict = false;
                const conflictCopy = {
                    Id: `${body.ThemeId}-conflict`, Name: `${body.Name}（冲突副本）`, Revision: 1,
                    ThemeJson: normalized
                };
                remoteThemes.set(conflictCopy.Id, conflictCopy);
                return Promise.resolve({
                    Workspace: workspacePayload, Theme: existing || conflictCopy,
                    NormalizedThemeJson: normalized, Checksum: checksum,
                    Conflict: true, ConflictCopy: conflictCopy
                });
            }
            const themeRecord = {
                Id: body.ThemeId, Name: body.Name,
                Revision: Number(existing && existing.Revision || 0) + 1,
                ThemeJson: normalized
            };
            remoteThemes.set(body.ThemeId, themeRecord);
            workspacePayload = {
                Revision: Number(workspacePayload && workspacePayload.Revision || 0) + 1,
                DraftJson: normalized, GlobalStateJson: body.GlobalStateJson,
                ActiveThemeId: body.ThemeId, LegacyImported: true,
                Themes: [...remoteThemes.values()].map((theme) => ({
                    Id: theme.Id, Name: theme.Name, Revision: theme.Revision
                }))
            };
            const responseChecksum = forceThemeCommitChecksumMismatch ? "0".repeat(64) : checksum;
            forceThemeCommitChecksumMismatch = false;
            return Promise.resolve({
                Workspace: workspacePayload, Theme: themeRecord,
                NormalizedThemeJson: normalized, Checksum: responseChecksum,
                Conflict: false
            });
        }
        if (request.url.includes("UserWorkspace") && request.type === "GET") {
            return workspacePayload ? Promise.resolve(workspacePayload) : initialWorkspace;
        }
        const themeReadMatch = request.url.match(/\/EmbyLyricEnhance\/Themes\/([^/?]+)$/);
        if (themeReadMatch && request.type === "GET") {
            const record = remoteThemes.get(decodeURIComponent(themeReadMatch[1]));
            if (corruptNextThemeReadback && record) {
                corruptNextThemeReadback = false;
                return Promise.resolve(Object.assign({}, record, { ThemeJson: JSON.stringify({ schemaVersion: 6 }) }));
            }
            return Promise.resolve(record || {});
        }
        if (request.url.endsWith("/EmbyLyricEnhance/Themes") && request.type === "GET" && failThemeList) {
            return Promise.reject(Object.assign(new Error("theme list unavailable"), { status: 500 }));
        }
        if (request.url.endsWith("/EmbyLyricEnhance/Themes") && request.type === "GET") {
            return Promise.resolve([...remoteThemes.values()].map((theme) => ({
                Id: theme.Id, Name: theme.Name, Revision: theme.Revision
            })));
        }
        if (request.url.includes("UserWorkspace") && request.type === "PUT") {
            const body = JSON.parse(request.data);
            workspaceWrites.push(body);
            if (forceWorkspaceBadRequest) {
                forceWorkspaceBadRequest = false;
                return Promise.reject(Object.assign(new Error("workspace rejected"), {
                    status: 400,
                    responseText: "Theme schema version is unsupported."
                }));
            }
            if (forceWorkspaceConflict) {
                forceWorkspaceConflict = false;
                const conflictValue = Object.assign({}, workspacePayload, { Revision: 99 });
                workspacePayload = conflictValue;
                return Promise.resolve({
                    Value: conflictValue, Conflict: true,
                    ConflictCopy: { Id: "conflict-copy", Name: "自动保存冲突", Revision: 1, ThemeJson: body.DraftJson }
                });
            }
            workspacePayload = {
                Revision: Number(workspacePayload && workspacePayload.Revision || 0) + 1,
                DraftJson: body.DraftJson,
                GlobalStateJson: body.GlobalStateJson,
                ActiveThemeId: body.ActiveThemeId,
                LegacyImported: true,
                Themes: []
            };
            return Promise.resolve({ Value: workspacePayload, Conflict: false });
        }
        return Promise.resolve({});
    },
    getJSON(url) {
        if (url.includes("PublicConfiguration")) return Promise.resolve({
            defaultTheme: "apple", allowUserThemeOverride: true, themeSchemaVersion: 6,
            themeCommitVersion
        });
        if (url.includes("UserWorkspace")) return Promise.resolve({});
        if (url.endsWith("/EmbyLyricEnhance/Themes")) return Promise.resolve([]);
        const match = url.match(/\/Items\/([^/]+)\/[^/]+\/Subtitles\/2\/Stream\.js/);
        if (!match) return Promise.resolve({});
        if (pendingLyrics.has(match[1])) return pendingLyrics.get(match[1]).promise;
        return Promise.resolve({ TrackEvents: [
            { Text: `<00:00.00>${match[1]}<00:01.00> lyric`, StartPositionTicks: 0, EndPositionTicks: 100000000 },
            { Text: `${match[1]} translation`, StartPositionTicks: 0, EndPositionTicks: 100000000 }
        ] });
    },
    getCurrentUserId() { return currentUserId; }, serverId() { return currentServerId; },
    getItem(userId, itemId) {
        detailedItemRequests.push([userId, itemId]);
        return Promise.resolve(item(itemId, `详情 ${itemId}`));
    },
    getDisplayPreferences() { return Promise.resolve({}); }, isMinServerVersion() { return true; },
    updatePartialDisplayPreferences() { displayPreferenceWrites += 1; return Promise.resolve(); },
    getScaledImageUrl(id) { return `/Items/${id}/Images/Primary`; }
};
const connectionManager = { default: { getApiClient() { return ApiClient; } } };
const router = { default: { back() { calls.push(["back"]); return Promise.resolve(); } } };

global.document = document; global.window = window;
global.location = { search: "", hash: "#!/videoosd/videoosd.html", pathname: "/web/index.html" };
global.MutationObserver = MutationObserver;
global.ResizeObserver = ResizeObserver;
global.Emby = { importModule() { return Promise.resolve({ show(anchor) { calls.push(["cast", anchor]); } }); } };

function VideoOsd(view) { this.view = view; this.currentPlayer = player; }
let resumes = 0; let pauses = 0; let destroys = 0;
VideoOsd.prototype.onResume = function () { resumes += 1; return "resume"; };
VideoOsd.prototype.onPause = function () { pauses += 1; return "pause"; };
VideoOsd.prototype.destroy = function () { destroys += 1; return "destroy"; };

const adapter = fs.readFileSync(path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js"), "utf8");
new Function("VideoOsd", "document", "MutationObserver", "performance", "requestAnimationFrame", "cancelAnimationFrame",
    "localStorage", "ApiClient", "_connectionmanager", "_playbackmanager", "_events", "_approuter", adapter)(
    VideoOsd, document, MutationObserver, performance, requestAnimationFrame, cancelAnimationFrame,
    localStorage, ApiClient, connectionManager, { default: manager }, events, router);

const visualizerV5 = window.__elyricVisualizerV5;
assert(visualizerV5 && visualizerV5.logBandBounds && visualizerV5.mapFrequencyLayout);
const testFrequencies = [60, 250, 1000, 8000];
const bandCount = 48;
testFrequencies.forEach((frequency) => {
    const matchingBand = Array.from({ length: bandCount }, (_, index) => ({
        index, bounds: visualizerV5.logBandBounds(index, bandCount, 30, 16000, 4096, 48000, 2048)
    })).find((entry) => frequency >= entry.bounds.startFrequency && frequency < entry.bounds.endFrequency);
    const expected = Math.log(frequency / 30) / Math.log(16000 / 30) * bandCount;
    assert(matchingBand && Math.abs(matchingBand.index - expected) <= 1,
        `${frequency}Hz must map to its expected logarithmic low-to-high region`);
});
const mappedCenterOut = visualizerV5.mapFrequencyLayout(
    Array.from({ length: 24 }, (_, index) => index + 1), 48, "centerOut"
);
mappedCenterOut.forEach((value, index) => {
    assert.strictEqual(value, mappedCenterOut[mappedCenterOut.length - 1 - index],
        "the actual centerOut mapper must mirror every visual band exactly");
});

async function settle() {
    for (let index = 0; index < 8; index++) await Promise.resolve();
    await new Promise((resolve) => setImmediate(resolve));
    for (let index = 0; index < 4; index++) await Promise.resolve();
}
function wait(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
function createPage() {
    const page = new Node("div"); page.className = "view-videoosd-videoosd";
    const native = new Node("div"); native.className = "videoOsdBottom"; native.setAttribute("aria-hidden", "false");
    native.style.visibility = "visible"; native.style.pointerEvents = "auto"; page.appendChild(native); document.body.appendChild(page);
    return { page, native };
}
function mountedRoot() {
    const host = document.body.querySelector(".elyric-player-host");
    return host && host.shadowRoot && host.shadowRoot.querySelector(".elyric-player-root");
}
function deferLyrics(id) {
    let resolve; const promise = new Promise((done) => { resolve = done; });
    pendingLyrics.set(id, { promise, resolve }); return pendingLyrics.get(id);
}

(async () => {
    const first = createPage(); const osd = new VideoOsd(first.page);
    assert.strictEqual(osd.onResume(), "resume"); await settle();
    const root = mountedRoot();
    assert(root, "onResume should mount the custom root");
    assert.strictEqual(document.body.classList.contains("elyric-player-active-page"), false,
        "player state classes must stay on the Shadow host instead of polluting Emby body");
    assert.strictEqual(document.body.getAttribute("data-elyric-theme-v2"), null);
    assert.strictEqual(root.getAttribute("data-elyric-workspace-ready"), "false",
        "the editable stage must remain gated until UserWorkspace resolves");
    assert.strictEqual(root.querySelector(".elyric-player-stage").getAttribute("aria-busy"), "true");
    assert.notStrictEqual(root.querySelector(".elyric-player-lyric-viewport").getAttribute("data-elyric-theme"), "focus",
        "stale unscoped localStorage must never be applied during startup");
    root.querySelectorAll(".elyric-theme-choice")[1].click();
    await wait(550);
    assert.strictEqual(workspaceWrites.length, 0, "initialization must block debounced Workspace writes");
    assert.strictEqual(displayPreferenceWrites, 0, "daily persistence must never write DisplayPreferences");
    const pendingDraftKey = [...stored.keys()].find((key) => key.includes("theme-v6.pending-draft"));
    assert(pendingDraftKey, "a user edit made during loading should immediately enter the account-scoped local journal");
    const designKey = [...stored.keys()].find((key) => key.includes("player-theme-design") && key.endsWith("server-a.runtime-user"));
    const localDocument = JSON.parse(stored.get(designKey));
    assert.strictEqual(localDocument.schemaVersion, 6);
    assert.strictEqual(localDocument.v2, undefined,
        "account-scoped local persistence must store only portable ThemeDocumentV6, never an internal v2 wrapper");
    stored.delete(pendingDraftKey);

    const serverDraft = JSON.parse(JSON.stringify(window.__elyricPlayerThemeV6Fixtures[0]));
    assert.strictEqual(window.__elyricPlayerThemeV6Fixtures.length, 9,
        "the runtime must expose all nine built-in Theme V6 fixtures");
    window.__elyricPlayerThemeV6Fixtures.forEach((fixture) => {
        assert.strictEqual(fixture.schemaVersion, 6);
        assert.strictEqual(fixture.layoutModel, "fixed-canvas-v1");
        ["landscape", "portrait"].forEach((profile) => {
            Object.entries(fixture.layouts[profile]).forEach(([layerId, layer]) => {
                if (layerId !== "canvas") {
                    assert(!Object.prototype.hasOwnProperty.call(layer, "anchorX")
                        && !Object.prototype.hasOwnProperty.call(layer, "anchorY"),
                    `${fixture.baseTheme} ${profile} ${layerId} must use absolute V6 canvas geometry only`);
                }
            });
            assert(window.__elyricPlayerThemeV6LayoutIsSafe(fixture.layouts[profile], profile),
                `${fixture.baseTheme} ${profile} must pass the shared playback safety solver without fallback`);
        });
        assert.strictEqual(fixture.visualizer.frequencyLayout, fixture.baseTheme === "mint" ? "radial" : "centerOut");
    });
    const geometryV6 = window.__elyricPlayerThemeV6Geometry;
    const anchorLayout = {
        artwork: { x: -30, y: -20, width: 100, height: 60, rotation: 0, anchorX: "start", anchorY: "start" },
        metadata: { hidden: true }, lyrics: { hidden: true }, visualizer: { hidden: true }
    };
    assert.deepStrictEqual(
        geometryV6.compactLayoutBounds(anchorLayout, "portrait", { width: 1080, height: 1920 }),
        { top: -20, bottom: 40 },
        "compact bounds must retain legal negative coordinates instead of clipping to the canvas"
    );
    anchorLayout.artwork.anchorX = "center";
    anchorLayout.artwork.anchorY = "center";
    assert.deepStrictEqual(
        geometryV6.compactLayoutBounds(anchorLayout, "portrait", { width: 1080, height: 1920 }),
        { top: 910, bottom: 970 },
        "center anchors must be resolved before compact projection"
    );
    anchorLayout.artwork.anchorX = "end";
    anchorLayout.artwork.anchorY = "end";
    anchorLayout.artwork.rotation = 90;
    const rotatedEndBounds = geometryV6.compactLayoutBounds(
        anchorLayout, "portrait", { width: 1080, height: 1920 }
    );
    assert(Math.abs(rotatedEndBounds.top - 1820) < 1e-9
        && Math.abs(rotatedEndBounds.bottom - 1920) < 1e-9,
    "end anchors and the rotated AABB must participate in the shared compact bounds");
    anchorLayout.artwork.y = "invalid";
    assert.deepStrictEqual(
        geometryV6.compactLayoutBounds(anchorLayout, "portrait", { width: 1080, height: 1920 }),
        { top: 96, bottom: 1576 },
        "invalid compact geometry must fall back to the public portrait safe bounds"
    );

    const compactCases = [
        { width: 390, height: 844, profile: "portrait", mode: "compact-portrait" },
        { width: 844, height: 390, profile: "landscape", mode: "compact-landscape" },
        { width: 480, height: 320, profile: "landscape", mode: "compact-tight" }
    ];
    compactCases.forEach((compactCase) => {
        window.innerWidth = compactCase.width; window.innerHeight = compactCase.height;
        window.visualViewport.width = compactCase.width; window.visualViewport.height = compactCase.height;
        window.__elyricPlayerThemeV6Fixtures.forEach((fixture) => {
            const projectedRenderer = {
                __elyricThemeV2: JSON.parse(JSON.stringify(fixture)),
                __elyricControlMode: compactCase.mode
            };
            const metrics = geometryV6.metrics(projectedRenderer, compactCase.profile, {
                left: 0, top: 0, width: compactCase.width, height: compactCase.height
            });
            const constants = geometryV6.compactConstants;
            const dockHeight = compactCase.mode === "compact-landscape"
                ? constants.landscapeDockHeight : constants.stackedDockHeight;
            const dockTop = compactCase.height - constants.dockBottomMargin - dockHeight;
            ["artwork", "metadata", "lyrics", "visualizer"].forEach((layerId) => {
                const layer = projectedRenderer.__elyricThemeV2.layouts[compactCase.profile][layerId];
                if (!layer || layer.hidden) return;
                const rect = geometryV6.designRect(layer, metrics);
                const radians = Number(layer.rotation || 0) * Math.PI / 180;
                const halfHeight = (Math.abs(Math.sin(radians)) * rect.width / 2
                    + Math.abs(Math.cos(radians)) * rect.height / 2) * metrics.scale;
                const centerY = metrics.originY + (rect.top + rect.height / 2) * metrics.scale;
                assert(centerY + halfHeight <= dockTop - constants.contentGap + 1e-6,
                    `${fixture.baseTheme} ${compactCase.width}x${compactCase.height} ${layerId} must stay above compact dock`);
                assert(centerY - halfHeight >= -1e-6,
                    `${fixture.baseTheme} ${compactCase.width}x${compactCase.height} ${layerId} must stay below the safe viewport top`);
            });
        });
    });
    window.innerWidth = 1440; window.innerHeight = 900;
    window.visualViewport.width = 1440; window.visualViewport.height = 900;
    serverDraft.name = "账号权威主题";
    serverDraft.lyrics.style = "gradient";
    serverDraft.layouts.landscape.metadata.x = -1800;
    serverDraft.layouts.portrait.metadata.x = -1800;
    serverDraft.controls.profiles.landscape.groups.transport.gap = 19;
    serverDraft.controls.profiles.portrait.groups.transport.gap = 27;
    workspacePayload = {
        Revision: 7, DraftJson: JSON.stringify(serverDraft),
        GlobalStateJson: JSON.stringify({ theme: "gradient", layout: "album" }),
        LegacyImported: true, Themes: []
    };
    resolveInitialWorkspace(workspacePayload); await settle();
    assert.strictEqual(root.getAttribute("data-elyric-workspace-ready"), "true");
    assert.strictEqual(root.getAttribute("data-elyric-workspace-source"), "server");
    assert.strictEqual(root.getAttribute("data-elyric-workspace-revision"), "7");
    assert.strictEqual(root.getAttribute("data-elyric-account-scope"), "server-a.runtime-user");
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "full",
        "1440x900 should keep the ordinary V6 ControlDock");
    assert.strictEqual(root.querySelector(".elyric-player-lyric-viewport").getAttribute("data-elyric-theme"), "gradient");
    const fixedStage = root.querySelector(".elyric-player-stage");
    assert.strictEqual(fixedStage.style.getPropertyValue("width"), "1920px");
    assert.strictEqual(fixedStage.style.getPropertyValue("height"), "1080px");
    assert(fixedStage.style.getPropertyValue("transform").includes("scale(0.75)"),
        "1440x900 should transform the complete 1920x1080 stage once at 0.75");
    assert.strictEqual(root.querySelector(".elyric-player-metadata").style.getPropertyValue("position"), "absolute");
    assert.strictEqual(root.querySelector(".elyric-player-metadata").style.getPropertyValue("left"), "-1800px",
        "playback must preserve the user's V6 geometry without a silent safety rewrite");
    assert.strictEqual(osd.__elyricRenderer.__elyricPlayerLayout, "album");
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.metadata.x, -1800);
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeV2.layouts.portrait.metadata.x, -1800);
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeV2.controls.profiles.landscape.groups.transport.gap, 19);
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeV2.controls.profiles.portrait.groups.transport.gap, 27,
        "one account draft must retain independent landscape and portrait control profiles");
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeRuntimeRecord.document.schemaVersion, 6);
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeRuntimeRecord.document.layouts.landscape.metadata.x, -1800,
        "the runtime record must retain the exact portable V6 document applied to the stage");
    await wait(10); await settle();
    assert.strictEqual(workspaceWrites.length, 0,
        "loading an overlapping or partially off-canvas V6 draft must not silently rewrite Workspace");
    assert(![...stored.keys()].some((key) => key.includes("layout-repair")),
        "V6 runtime must not create legacy layout-repair markers or replacement drafts");
    assert(!root.querySelector(".elyric-theme-restore-repair"),
        "V6 must remove the legacy silent-repair rollback control");
    root.querySelectorAll(".elyric-theme-choice")[4].click();
    await wait(550); await settle();
    assert.strictEqual(workspaceWrites.length, 1, "a post-load edit should debounce into one Workspace PUT");
    assert.strictEqual(workspaceWrites[0].ExpectedRevision, 7);
    assert.strictEqual(JSON.parse(workspaceWrites[0].DraftJson).schemaVersion, 6);
    assert.strictEqual(JSON.parse(workspaceWrites[0].DraftJson).layoutModel, "fixed-canvas-v1");
    assert.deepStrictEqual(JSON.parse(workspaceWrites[0].GlobalStateJson), { version: 6 },
        "GlobalStateJson must not duplicate fields owned by ThemeDocumentV6");
    assert.strictEqual(root.getAttribute("data-elyric-workspace-revision"), "8",
        "the visible sync revision must update only after the server acknowledges the PUT");
    assert.strictEqual(displayPreferenceWrites, 0);
    const confirmedCacheKeys = [...stored.keys()].filter((key) => key.includes("workspace-cache"));
    assert(confirmedCacheKeys.some((key) => key.endsWith("server-a.runtime-user")),
        "the last server-confirmed cache must be isolated by server and user");
    failThemeList = true;
    osd.__elyricRenderer.__elyricThemeV2OnlineHandler();
    await settle();
    assert.strictEqual(root.getAttribute("data-elyric-workspace-source"), "server",
        "a theme-library list failure must not suppress an otherwise valid Workspace draft");
    assert.strictEqual(window.__elyricPlayerDiagnostics.themeLibraryApiAvailable, false);
    failThemeList = false;
    forceWorkspaceConflict = true;
    root.querySelectorAll(".elyric-theme-choice")[0].click();
    await wait(550); await settle();
    assert.strictEqual(root.getAttribute("data-elyric-workspace-source"), "conflict");
    assert.strictEqual(root.getAttribute("data-elyric-workspace-revision"), "99");
    assert.strictEqual(root.getAttribute("data-elyric-preference-state"), "conflict");
    assert(osd.__elyricRenderer.__elyricUserPlayerThemes.some((theme) => theme.id === "conflict-copy"),
        "revision conflicts must preserve the local draft as a named conflict copy");
    forceWorkspaceBadRequest = true;
    root.querySelectorAll(".elyric-theme-choice")[1].click();
    await wait(750); await settle();
    assert.strictEqual(forceWorkspaceBadRequest, false, "the debounced Workspace PUT should reach the mock server");
    assert.strictEqual(root.getAttribute("data-elyric-preference-state"), "local");
    assert(root.querySelector(".elyric-player-preference-status").textContent.includes("Theme schema version is unsupported"),
        "HTTP 400 validation details must be shown instead of being discarded");
    assert.strictEqual(root.getAttribute("data-elyric-server-theme-schema"), "6");
    [".elyric-player-stage", ".elyric-player-lyric-viewport", ".elyric-player-queue-panel",
        ".elyric-player-settings-panel", ".elyric-player-media-panel"].forEach((selector) => {
        const element = root.querySelector(selector); assert(element && root.contains(element), `${selector} must live inside the root`);
    });
    const themeNameInput = root.querySelector(".elyric-player-theme-name-input");
    const newThemeButton = root.querySelector(".elyric-theme-new");
    const saveThemeButton = root.querySelector(".elyric-theme-save");
    assert.strictEqual(newThemeButton.disabled, false, "themeCommitV1 must enable named-theme creation");
    themeNameInput.value = "原子往返主题";
    newThemeButton.click(); await osd.__elyricRenderer.__elyricThemeCommitChain; await settle();
    assert.strictEqual(themeCommitBodies.length, 1, "creating a named theme must use one ThemeCommit request");
    const committedThemeId = themeCommitBodies[0].ThemeId;
    assert.deepStrictEqual(JSON.parse(themeCommitBodies[0].GlobalStateJson), { version: 6 });
    assert(committedThemeId && remoteThemes.has(committedThemeId));
    assert.strictEqual(
        JSON.stringify(JSON.parse(remoteThemes.get(committedThemeId).ThemeJson)),
        JSON.stringify(JSON.parse(workspacePayload.DraftJson)),
        "the named theme and Workspace draft must contain the same normalized V6 document"
    );
    assert.strictEqual(workspacePayload.ActiveThemeId, committedThemeId);
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeRuntimeRecord.id, committedThemeId);
    assert.strictEqual(osd.__elyricRenderer.__elyricThemeRuntimeRecord.revision, 1);
    assert(root.querySelector(".elyric-player-theme-library-status").textContent.includes("原子保存并回读确认"));

    root.querySelector(".elyric-player-button-visualizer").click();
    osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.artwork.z = 27;
    osd.__elyricRenderer.__elyricThemeV2.layouts.portrait.lyrics.x = -31;
    osd.__elyricRenderer.__elyricThemeV2.console.material = "rainbow";
    saveThemeButton.click(); await osd.__elyricRenderer.__elyricThemeCommitChain; await settle();
    assert.strictEqual(themeCommitBodies.length, 2);
    const secondCommitDocument = JSON.parse(themeCommitBodies[1].ThemeJson);
    assert.strictEqual(secondCommitDocument.visualizer.enabled, false);
    assert.strictEqual(secondCommitDocument.layouts.landscape.artwork.z, 27);
    assert.strictEqual(secondCommitDocument.layouts.portrait.lyrics.x, -31);
    assert.strictEqual(secondCommitDocument.console.material, "rainbow",
        "console material must round-trip from the V6 document rather than a legacy choices cache");
    assert.strictEqual(secondCommitDocument.controlMode, undefined);
    assert.strictEqual(secondCommitDocument.compact, undefined,
        "compact safety projection must never enter portable ThemeDocumentV6 JSON");

    const validDockX = osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.controlDock.x;
    osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.controlDock.x = -5000;
    saveThemeButton.click(); await settle();
    assert.strictEqual(themeCommitBodies.length, 2,
        "a completely unreachable ControlDock must block save without mutating the draft");
    assert(root.querySelector(".elyric-player-theme-library-status").textContent.includes("44×44"));
    osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.controlDock.x = validDockX;
    osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.artwork.x = -20;
    osd.__elyricRenderer.__elyricThemeV2.layouts.landscape.metadata.x = -20;
    saveThemeButton.click(); await osd.__elyricRenderer.__elyricThemeCommitChain; await settle();
    assert.strictEqual(themeCommitBodies.length, 3,
        "ordinary overlap and partial overflow must remain user-owned and save unchanged");
    const overlapDocument = JSON.parse(themeCommitBodies[2].ThemeJson);
    assert.strictEqual(overlapDocument.layouts.landscape.artwork.x, -20);
    assert.strictEqual(overlapDocument.layouts.landscape.metadata.x, -20);

    const revisionBeforeConflict = workspacePayload.Revision;
    forceThemeCommitConflict = true;
    saveThemeButton.click(); await osd.__elyricRenderer.__elyricThemeCommitChain; await settle();
    assert.strictEqual(workspacePayload.Revision, revisionBeforeConflict,
        "a ThemeCommit revision conflict must not modify the active Workspace");
    assert(osd.__elyricRenderer.__elyricUserPlayerThemes.some((theme) => /-conflict$/.test(theme.id)));

    forceThemeCommitChecksumMismatch = true;
    saveThemeButton.click(); await osd.__elyricRenderer.__elyricThemeCommitChain; await settle();
    assert(root.querySelector(".elyric-player-theme-library-status").textContent.includes("本地待同步日志"),
        "checksum failures must stay visible and enter the persistent retry path");
    const retryQueueKey = [...stored.keys()].find((key) => key.includes("offline-queue") && key.endsWith("server-a.runtime-user"));
    assert(retryQueueKey && JSON.parse(stored.get(retryQueueKey)).some((entry) => entry.path === "EmbyLyricEnhance/ThemeCommit"));

    const settingsPanel = root.querySelector(".elyric-player-settings-panel");
    const settingsBody = settingsPanel.querySelector(".elyric-player-settings-body");
    assert(settingsBody && settingsPanel.contains(settingsBody), "settings content must scroll independently below its fixed header");
    const settingsButton = root.querySelector(".elyric-player-button-settings");
    settingsButton.getBoundingClientRect = () => ({ left: 520, top: 700, right: 564, bottom: 744, width: 44, height: 44 });
    let settingsPanelHeight = 180;
    settingsPanel.getBoundingClientRect = () => {
        const left = Number.parseFloat(settingsPanel.style.getPropertyValue("left")) || 0;
        const top = Number.parseFloat(settingsPanel.style.getPropertyValue("top")) || 0;
        return { left, top, right: left + 480, bottom: top + settingsPanelHeight, width: 480, height: settingsPanelHeight };
    };
    root.querySelector(".elyric-player-button-settings").click();
    assert.strictEqual(settingsPanel.getAttribute("data-elyric-anchor-mode"), "button");
    assert(["above", "below"].includes(settingsPanel.getAttribute("data-elyric-anchor-placement")));
    assert(Number.parseFloat(settingsPanel.style.getPropertyValue("max-height")) <= window.innerHeight * .78);
    assert.strictEqual(700 - (Number.parseFloat(settingsPanel.style.getPropertyValue("top")) + 180), 12,
        "an above overlay must use its rendered height and remain exactly 12px from the button");
    settingsPanelHeight = 320;
    notifyResize(settingsPanel, 480, settingsPanelHeight);
    flushFrame(osd.__elyricRenderer.__elyricOverlayRepositionFrames.settings.id);
    assert.strictEqual(700 - (Number.parseFloat(settingsPanel.style.getPropertyValue("top")) + settingsPanelHeight), 12,
        "an asynchronously growing overlay must be remeasured and remain exactly 12px from its button");
    settingsPanelHeight = 120;
    notifyResize(settingsPanel, 480, settingsPanelHeight);
    flushFrame(osd.__elyricRenderer.__elyricOverlayRepositionFrames.settings.id);
    assert.strictEqual(700 - (Number.parseFloat(settingsPanel.style.getPropertyValue("top")) + settingsPanelHeight), 12,
        "an asynchronously shrinking overlay must be remeasured and remain exactly 12px from its button");
    settingsPanel.querySelector(".elyric-player-settings-close").click();
    assert(!osd.__elyricRenderer.__elyricOverlayResizeObservers.settings,
        "closing an overlay must disconnect its ResizeObserver");
    root.querySelector(".elyric-player-button-queue").click(); await settle();
    const queuePanel = root.querySelector(".elyric-player-queue-panel");
    assert.strictEqual(queuePanel.getAttribute("data-elyric-anchor-mode"), "button");
    assert(Number.parseFloat(queuePanel.style.getPropertyValue("max-height")) <= window.innerHeight * .66);
    queuePanel.querySelector(".elyric-player-settings-close").click();
    const castButton = root.querySelector(".elyric-player-button-cast");
    castButton.click(); await settle();
    const castPanel = root.querySelector(".elyric-player-cast-panel");
    assert.strictEqual(castPanel.getAttribute("data-elyric-anchor-mode"), "button");
    assert(["above", "below", "left", "right"].includes(castPanel.getAttribute("data-elyric-anchor-placement")));
    const castTargets = castPanel.querySelectorAll(".elyric-player-cast-target");
    assert(castTargets.length >= 2 && castPanel.textContent.includes("客厅 Emby"),
        "the root-owned cast overlay should render local and remote Emby targets");
    castTargets[1].click(); await settle();
    assert(calls.some((call) => call[0] === "castTarget" && call[1] === "Emby Theater"),
        "selecting a target must use playbackmanager.trySetActivePlayer instead of a native dialog");
    castButton.click();
    const stopsBeforeResize = calls.filter((call) => call[0] === "stop").length;
    const lyricTextBeforeResize = root.querySelector(".elyric-player-lyric-viewport").textContent;
    document.documentElement.clientWidth = 1440;
    document.documentElement.clientHeight = 900;
    window.innerWidth = 390; window.innerHeight = 844;
    window.visualViewport.width = 390; window.visualViewport.height = 844;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(root.getAttribute("data-elyric-theme-v2-profile"), "portrait",
        "visualViewport must win over a stale landscape-sized Emby documentElement");
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "compact-portrait");
    assert.strictEqual(fixedStage.style.getPropertyValue("width"), "1080px");
    assert.strictEqual(fixedStage.style.getPropertyValue("height"), "1920px");
    assert(fixedStage.style.getPropertyValue("transform").includes("scale(0.3611111111111111)"),
        "390x844 should change only the shared portrait-stage transform");
    assert.strictEqual(root.querySelector(".elyric-player-metadata").style.getPropertyValue("left"), "-1800px",
        "orientation changes must preserve the independent portrait geometry without runtime repair");
    assert.strictEqual(document.body.querySelectorAll(".elyric-player-host").length, 1);
    assert.strictEqual(calls.filter((call) => call[0] === "stop").length, stopsBeforeResize,
        "profile changes must never stop the active Emby playback session");
    assert.strictEqual(root.querySelector(".elyric-player-lyric-viewport").textContent, lyricTextBeforeResize,
        "profile changes must preserve the current lyric window");
    assert.strictEqual(root.scrollTop, 0); assert.strictEqual(fixedStage.scrollTop, 0);
    const compactHost = root.querySelector(".elyric-player-compact-dock-host");
    const controlDock = root.querySelector(".elyric-player-control-dock");
    assert.strictEqual(controlDock.parentNode, compactHost,
        "compact must move the same ControlDock node into the viewport safety host");
    assert.strictEqual(controlDock.style.getPropertyValue("--elyric-v6-dock-button"), "44px");
    assert.strictEqual(controlDock.style.getPropertyValue("--elyric-v6-dock-play"), "58px");

    window.innerWidth = 844; window.innerHeight = 390;
    window.visualViewport.width = 844; window.visualViewport.height = 390;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "compact-landscape");
    window.innerWidth = 480; window.innerHeight = 320;
    window.visualViewport.width = 480; window.visualViewport.height = 320;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "compact-tight");
    window.innerWidth = 390; window.innerHeight = 844;
    window.visualViewport.width = 390; window.visualViewport.height = 844;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));

    const moreButton = root.querySelector(".elyric-player-button-more");
    const controlsPanel = root.querySelector(".elyric-player-compact-controls-panel");
    moreButton.getBoundingClientRect = () => ({ left: 310, top: 752, right: 354, bottom: 796, width: 44, height: 44 });
    controlsPanel.getBoundingClientRect = () => {
        const left = Number.parseFloat(controlsPanel.style.getPropertyValue("left")) || 0;
        const top = Number.parseFloat(controlsPanel.style.getPropertyValue("top")) || 0;
        return { left, top, right: left + 320, bottom: top + 156, width: 320, height: 156 };
    };
    moreButton.click();
    assert.strictEqual(controlsPanel.getAttribute("data-elyric-anchor-mode"), "button");
    assert.strictEqual(controlsPanel.querySelectorAll(".elyric-player-compact-control-tile").length, 6);
    assert.strictEqual(document.activeElement.focusOptions && document.activeElement.focusOptions.preventScroll, true,
        "More must focus its first real control without scrolling the player");
    const controlsEscape = {
        key: "Escape", type: "keydown", defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}
    };
    (document.listeners.keydown || []).slice().forEach((listener) => listener(controlsEscape));
    assert(controlsEscape.defaultPrevented && controlsPanel.hasAttribute("hidden"));
    assert.strictEqual(document.activeElement, moreButton,
        "closing More must restore focus to its viewport-anchored trigger");
    const muteButton = root.querySelector(".elyric-player-button-mute");
    assert.strictEqual(muteButton.getAttribute("data-elyric-volume"), "64");
    const volumePanel = root.querySelector(".elyric-player-volume-panel");
    const portraitVolumeSlider = volumePanel.querySelector(".elyric-player-volume-slider-portrait");
    muteButton.getBoundingClientRect = () => ({ left: 300, top: 560, right: 344, bottom: 604, width: 44, height: 44 });
    volumePanel.getBoundingClientRect = () => {
        const left = Number.parseFloat(volumePanel.style.getPropertyValue("left")) || 0;
        const top = Number.parseFloat(volumePanel.style.getPropertyValue("top")) || 0;
        const width = Number.parseFloat(volumePanel.style.getPropertyValue("width")) || 72;
        const height = Number.parseFloat(volumePanel.style.getPropertyValue("height")) || 240;
        return { left, top, right: left + width, bottom: top + height, width, height };
    };
    portraitVolumeSlider.getBoundingClientRect = () => {
        const panelRect = volumePanel.getBoundingClientRect();
        const length = panelRect.height - 38;
        return {
            left: panelRect.left + (panelRect.width - 44) / 2,
            top: panelRect.top + 19,
            right: panelRect.left + (panelRect.width + 44) / 2,
            bottom: panelRect.top + 19 + length,
            width: 44, height: length
        };
    };
    muteButton.click();
    assert(!volumePanel.hasAttribute("hidden") && volumePanel.getAttribute("data-elyric-anchor-mode") === "button",
        "portrait volume must open a root-owned button-anchored vertical slider");
    assert.strictEqual(volumePanel.getAttribute("data-elyric-anchor-placement"), "above");
    assert.strictEqual(volumePanel.style.getPropertyValue("width"), "72px");
    assert.strictEqual(volumePanel.style.getPropertyValue("height"), "240px");
    assert.strictEqual(volumePanel.style.getPropertyValue("max-height"), "240px");
    assert.strictEqual(560 - volumePanel.getBoundingClientRect().bottom, 12,
        "the full 72x240 volume box must remain exactly 12px from its trigger");
    const panelBox = volumePanel.getBoundingClientRect();
    const sliderBox = portraitVolumeSlider.getBoundingClientRect();
    assert(sliderBox.left >= panelBox.left + 13 && sliderBox.right <= panelBox.right - 13
        && sliderBox.top >= panelBox.top + 19 && sliderBox.bottom <= panelBox.bottom - 19,
    "the rotated vertical volume slider must remain fully inside the panel content box");
    notifyResize(volumePanel, 72, 240);
    flushFrame(osd.__elyricRenderer.__elyricOverlayRepositionFrames.volume.id);
    notifyResize(volumePanel, 72, 240);
    assert(!osd.__elyricRenderer.__elyricOverlayRepositionFrames.volume,
        "a stable fixed volume box must not create a ResizeObserver reposition loop");
    assert.strictEqual(document.activeElement, portraitVolumeSlider);
    assert.strictEqual(portraitVolumeSlider.focusOptions && portraitVolumeSlider.focusOptions.preventScroll, true,
        "opening a root-owned overlay must focus without scrolling the fixed player");
    assert.strictEqual(root.scrollTop, 0); assert.strictEqual(fixedStage.scrollTop, 0);
    const escapeEvent = {
        key: "Escape", type: "keydown", defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}
    };
    (document.listeners.keydown || []).slice().forEach((listener) => listener(escapeEvent));
    assert(escapeEvent.defaultPrevented && volumePanel.hasAttribute("hidden"),
        "Escape at the document boundary must close the volume overlay before Emby handles Back");
    assert.strictEqual(document.activeElement, muteButton);
    assert.strictEqual(muteButton.focusOptions && muteButton.focusOptions.preventScroll, true,
        "closing an overlay must restore trigger focus without scrolling the player");
    assert.strictEqual(root.scrollTop, 0); assert.strictEqual(fixedStage.scrollTop, 0);
    muteButton.getBoundingClientRect = () => ({ left: 300, top: 32, right: 344, bottom: 76, width: 44, height: 44 });
    muteButton.click();
    assert.strictEqual(volumePanel.getAttribute("data-elyric-anchor-placement"), "below",
        "the fixed-height volume box must flip below when the full panel cannot fit above");
    assert.strictEqual(volumePanel.getBoundingClientRect().top - 76, 12);
    muteButton.click();
    window.innerWidth = 1440; window.innerHeight = 900;
    window.visualViewport.width = 1440; window.visualViewport.height = 900;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(root.getAttribute("data-elyric-theme-v2-profile"), "landscape");
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "full");
    assert.strictEqual(root.querySelector(".elyric-player-control-dock").parentNode, fixedStage,
        "leaving compact must return the same ControlDock node to the V6 stage");
    assert.strictEqual(fixedStage.style.getPropertyValue("width"), "1920px");
    assert.strictEqual(fixedStage.style.getPropertyValue("height"), "1080px");
    assert.strictEqual(document.body.querySelectorAll(".elyric-player-host").length, 1);
    assert.strictEqual(calls.filter((call) => call[0] === "stop").length, stopsBeforeResize);

    window.innerWidth = 768; window.innerHeight = 1024;
    window.visualViewport.width = 768; window.visualViewport.height = 1024;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "full",
        "768x1024 has enough viewport space for an inverse-sized full portrait dock");
    window.innerWidth = 1024; window.innerHeight = 768;
    window.visualViewport.width = 1024; window.visualViewport.height = 768;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(root.getAttribute("data-elyric-control-mode"), "full",
        "1024x768 has enough viewport space for an inverse-sized full landscape dock");
    window.innerWidth = 1440; window.innerHeight = 900;
    window.visualViewport.width = 1440; window.visualViewport.height = 900;
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(first.native.getAttribute("aria-hidden"), "true"); assert(first.native.hasAttribute("inert"));
    assert.strictEqual(first.native.style.visibility, "hidden");

    const lyrics = root.querySelector(".elyric-player-lyric-viewport");
    const lyricRows = lyrics.querySelectorAll(".elyric-lyric-row[data-index]");
    assert.strictEqual(lyricRows.length, 1); assert(lyricRows[0].textContent.includes("translation"));
    assert(requestedUrls.some((url) => url.includes("Items/song-a/source-song-a/Subtitles/2/Stream.js")),
        "an explicitly named non-default Lyrics text stream must be selected");
    lyricRows[0].click(); await settle();
    assert(calls.some((call) => call[0] === "seek" && call[1] === 0 && call[2] === player));

    currentItem = {
        Id: "song-hydrated", Name: "精简播放快照", MediaType: "Audio", RunTimeTicks: 1800000000,
        Artists: ["测试歌手"], Album: "测试专辑"
    };
    state = Object.assign({}, state, { NowPlayingItem: currentItem });
    trigger(player, "timeupdate"); await settle();
    assert(detailedItemRequests.some((entry) => entry[1] === "song-hydrated"),
        "a playback snapshot without MediaSources must be hydrated through ApiClient");
    assert(lyrics.textContent.includes("song-hydrated lyric"),
        "hydrated non-default lyrics must render instead of falling back to an empty card");

    root.querySelector(".elyric-player-button-queue").click(); await settle();
    const queueRows = root.querySelectorAll(".elyric-player-queue-row"); assert.strictEqual(queueRows.length, 2);
    queueRows[1].querySelector(".elyric-player-queue-main").click(); await settle();
    queueRows[1].querySelector(".elyric-player-queue-remove").click(); await settle();
    const transfer = { setData() {} };
    queueRows[0].dispatchEvent({ type: "dragstart", dataTransfer: transfer });
    queueRows[1].dispatchEvent({ type: "drop", dataTransfer: transfer }); await settle();
    assert(calls.some((call) => call[0] === "playQueue" && call[1] === "queue-b" && call[2] === player));
    assert(calls.some((call) => call[0] === "removeQueue" && call[1][0] === "queue-b" && call[2] === player));
    assert(calls.some((call) => call[0] === "moveQueue" && call[1] === "queue-a" && call[2] === 1 && call[3] === player));

    const oldLyrics = deferLyrics("song-b"); const newLyrics = deferLyrics("song-c");
    currentItem = item("song-b", "歌曲 B"); state = Object.assign({}, state, { NowPlayingItem: currentItem }); trigger(player, "timeupdate");
    currentItem = item("song-c", "歌曲 C"); state = Object.assign({}, state, { NowPlayingItem: currentItem }); trigger(player, "timeupdate");
    newLyrics.resolve({ TrackEvents: [{ Text: "C 最新歌词", StartPositionTicks: 0, EndPositionTicks: 100000000 }] }); await settle();
    oldLyrics.resolve({ TrackEvents: [{ Text: "B 过期歌词", StartPositionTicks: 0, EndPositionTicks: 100000000 }] }); await settle();
    assert(lyrics.textContent.includes("C 最新歌词")); assert(!lyrics.textContent.includes("B 过期歌词"));

    osd.__elyricRenderer.__elyricItems = Array.from({ length: 100 }, (_, index) => ({
        Text: `长歌词 ${index}`,
        __elyric: {
            startTicks: index * 10000000,
            endTicks: (index + 1) * 10000000,
            sublines: [{ text: `长歌词 ${index}`, words: null }]
        }
    }));
    osd.__elyricRenderer.__elyricGeneration += 1;
    osd.__elyricRenderer.__elyricLastPositionTicks = 750000000;
    state = Object.assign({}, state, {
        PlayState: Object.assign({}, state.PlayState, { PositionTicks: 750000000 })
    });
    trigger(player, "timeupdate"); await settle();
    const virtualRows = lyrics.querySelectorAll(".elyric-lyric-row[data-index]");
    assert(virtualRows.length <= 37 && virtualRows.some((row) => row.getAttribute("data-index") === "75"),
        "long lyrics must keep only the current binary-seeked window in the DOM");

    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(osd.onPause(), undefined,
        "an Emby pause emitted during a viewport transition must not stop or unmount audio playback");
    assert(mountedRoot());
    location.hash = "#!/item?id=song-c";
    window.listeners.resize.forEach((listener) => listener({ type: "resize" }));
    assert.strictEqual(osd.onPause(), "pause",
        "the viewport grace period must not suppress a real pause after leaving the VideoOsd route");
    assert(!mountedRoot());
    location.hash = "#!/videoosd/videoosd.html";
    osd.onResume(); await settle();
    osd.__elyricRenderer.__elyricViewportTransitionUntil = 0;
    assert.strictEqual(osd.onPause(), "pause"); assert(!mountedRoot());
    assert.strictEqual(first.native.getAttribute("aria-hidden"), "false"); assert(!first.native.hasAttribute("inert"));
    assert.strictEqual(first.native.style.visibility, "visible"); assert.strictEqual(bindings.length, 0); assert.strictEqual(frames.size, 0);
    assert.strictEqual(osd.destroy(), "destroy"); first.page.remove();

    currentUserId = "other-user"; currentServerId = "server-b";
    const secondAccountDraft = JSON.parse(JSON.stringify(serverDraft));
    secondAccountDraft.layouts.landscape.metadata.x = 333;
    workspacePayload = {
        Revision: 3, DraftJson: JSON.stringify(secondAccountDraft),
        GlobalStateJson: JSON.stringify({ theme: "apple", layout: "custom" }),
        LegacyImported: true, Themes: []
    };
    const scoped = createPage(); const scopedOsd = new VideoOsd(scoped.page);
    scopedOsd.onResume(); await settle();
    const scopedRoot = mountedRoot();
    assert.strictEqual(scopedRoot.getAttribute("data-elyric-account-scope"), "server-b.other-user");
    assert.strictEqual(scopedOsd.__elyricRenderer.__elyricThemeV2.layouts.landscape.metadata.x, 333,
        "a second server/user pair must preserve geometry that already passes the V6 safety solver");
    const scopedCacheKeys = [...stored.keys()].filter((key) => key.includes("workspace-cache"));
    assert(scopedCacheKeys.some((key) => key.endsWith("server-a.runtime-user"))
        && scopedCacheKeys.some((key) => key.endsWith("server-b.other-user")),
    "confirmed browser caches must be isolated across both server and user identity");
    scopedOsd.onPause(); scoped.page.remove();

    themeCommitVersion = "";
    const legacyDll = createPage();
    const legacyDllOsd = new VideoOsd(legacyDll.page); legacyDllOsd.onResume(); await settle();
    const legacyDllRoot = mountedRoot();
    assert(legacyDllRoot, "an old DLL must not prevent local playback and preview");
    assert.strictEqual(legacyDllRoot.querySelector(".elyric-theme-new").disabled, true);
    assert.strictEqual(legacyDllRoot.querySelector(".elyric-theme-duplicate").disabled, true);
    assert.strictEqual(legacyDllRoot.querySelector(".elyric-theme-save").disabled, true);
    assert.strictEqual(legacyDllRoot.querySelector(".elyric-theme-copy-json").disabled, false,
        "an old DLL must leave local JSON export available while server saves are disabled");
    assert(legacyDllRoot.querySelector(".elyric-theme-new").getAttribute("title").includes("更新"));
    legacyDllOsd.onPause(); legacyDll.page.remove();
    themeCommitVersion = "v1";

    currentUserId = "runtime-user"; currentServerId = "server-a";
    workspacePayload = {
        Revision: 99, DraftJson: JSON.stringify(serverDraft),
        GlobalStateJson: JSON.stringify({ theme: "gradient", layout: "custom" }),
        LegacyImported: true, Themes: []
    };

    const limited = createPage(); const next = manager.nextTrack; manager.nextTrack = null;
    currentItem = item("song-a", "歌曲 A"); state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const limitedOsd = new VideoOsd(limited.page); limitedOsd.onResume(); await settle();
    assert.strictEqual(mountedRoot().querySelector(".elyric-player-button-next").disabled, true);
    limitedOsd.onPause(); manager.nextTrack = next; limited.page.remove();

    const delayedPlayerPage = createPage();
    const getCurrentPlayer = manager.getCurrentPlayer;
    let delayedPlayerReady = false;
    manager.getCurrentPlayer = () => delayedPlayerReady ? player : null;
    currentItem = item("song-delayed-player", "延迟播放器");
    state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const delayedPlayerOsd = new VideoOsd(delayedPlayerPage.page);
    delayedPlayerOsd.onResume(); await settle();
    assert(!mountedRoot() && delayedPlayerOsd.__elyricMountRetryTimer,
        "an unavailable currentPlayer must keep native OSD visible while a bounded retry is pending");
    delayedPlayerOsd.onResume();
    setTimeout(() => { delayedPlayerReady = true; }, 20);
    await wait(80); await settle();
    assert(mountedRoot() && document.body.querySelectorAll(".elyric-player-host").length === 1,
        "a later currentPlayer must mount exactly one Shadow player after repeated onResume");
    assert.strictEqual(delayedPlayerOsd.__elyricMountStatus, "mounted");
    assert.strictEqual(delayedPlayerOsd.__elyricMountRetryTimer, null);
    delayedPlayerOsd.onPause(); delayedPlayerPage.page.remove();
    manager.getCurrentPlayer = getCurrentPlayer;

    const delayedItemPage = createPage();
    const getCurrentItem = manager.currentItem;
    let delayedItemReady = false;
    currentItem = item("song-delayed-item", "延迟媒体项");
    state = Object.assign({}, state, { NowPlayingItem: currentItem });
    manager.currentItem = () => delayedItemReady ? currentItem : null;
    const delayedItemOsd = new VideoOsd(delayedItemPage.page);
    delayedItemOsd.onResume(); await settle();
    setTimeout(() => { delayedItemReady = true; }, 20);
    await wait(80); await settle();
    assert(mountedRoot(), "a delayed currentItem must mount on the next bounded retry");
    assert.strictEqual(delayedItemOsd.__elyricMountRetryTimer, null);
    delayedItemOsd.onPause(); delayedItemPage.page.remove();
    manager.currentItem = getCurrentItem;

    const failed = createPage(); const getState = manager.getPlayerState; manager.getPlayerState = null;
    const failedOsd = new VideoOsd(failed.page); const oldError = console.error; console.error = function () {};
    failedOsd.onResume(); await settle(); console.error = oldError;
    assert(!mountedRoot()); assert.strictEqual(failed.native.style.visibility, "visible");
    manager.getPlayerState = getState; failedOsd.onPause(); failed.page.remove();

    const video = createPage(); currentItem = item("video-a", "视频 A", "Video"); state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const videoOsd = new VideoOsd(video.page); videoOsd.onResume(); await settle();
    assert(!mountedRoot());
    assert.strictEqual(videoOsd.__elyricMountStatus, "unsupported");
    assert.strictEqual(videoOsd.__elyricMountRetryTimer, null);
    videoOsd.onPause(); video.page.remove();

    const rapid = createPage(); currentItem = item("song-a", "歌曲 A"); state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const rapidOsd = new VideoOsd(rapid.page); rapidOsd.onResume(); rapidOsd.onPause(); await settle();
    assert(!mountedRoot(), "an onPause before the resume microtask must cancel mounting");
    assert.strictEqual(rapid.native.style.visibility, "visible");
    assert.strictEqual(rapidOsd.__elyricMountRetryTimer, null); rapid.page.remove();

    const destroyedRetry = createPage();
    manager.getCurrentPlayer = () => null;
    const destroyedRetryOsd = new VideoOsd(destroyedRetry.page);
    destroyedRetryOsd.onResume(); await settle();
    assert(destroyedRetryOsd.__elyricMountRetryTimer);
    destroyedRetryOsd.destroy(); await wait(70); await settle();
    assert.strictEqual(destroyedRetryOsd.__elyricMountRetryTimer, null);
    assert(!mountedRoot(), "destroy must cancel all delayed mount attempts");
    manager.getCurrentPlayer = getCurrentPlayer;
    destroyedRetry.page.remove();

    const outerStyle = document.createElement("style");
    outerStyle.textContent = "button,input,*{all:unset!important}.lyricsItem{position:fixed!important}";
    document.body.appendChild(outerStyle);
    const stylesheet = document.createElement("link");
    stylesheet.setAttribute("rel", "stylesheet");
    stylesheet.setAttribute("href", "/web/videoosd/videoosd.css?v=test");
    document.body.appendChild(stylesheet);
    document.querySelectorAll = (selector) => document.body.querySelectorAll(selector);
    Node.prototype.attachShadow = function () {
        const shadow = new Node("shadow-root");
        shadow.host = this;
        shadow.parentNode = this;
        const append = shadow.appendChild.bind(shadow);
        shadow.appendChild = function (child) {
            const result = append(child);
            if (child.tagName === "link") setImmediate(() => child.onload && child.onload());
            return result;
        };
        this.shadowRoot = shadow;
        return shadow;
    };
    currentItem = item("song-shadow", "Shadow song");
    state = Object.assign({}, state, { NowPlayingItem: currentItem });
    workspacePayload = {
        Revision: 120, DraftJson: JSON.stringify(serverDraft),
        GlobalStateJson: JSON.stringify({ theme: "gradient", layout: "custom" }),
        LegacyImported: true, Themes: []
    };
    const shadowPage = createPage();
    const shadowOsd = new VideoOsd(shadowPage.page);
    shadowOsd.onResume(); await settle();
    const shadowHost = document.body.querySelector(".elyric-player-host");
    const shadowRoot = shadowHost && shadowHost.shadowRoot;
    const shadowPlayer = shadowRoot && shadowRoot.querySelector(".elyric-player-root");
    assert(shadowHost && shadowRoot && shadowPlayer,
        "real-capability mounts must create exactly one open Shadow Root player under body");
    assert.strictEqual(shadowRoot.querySelectorAll(".elyric-player-root").length, 1);
    assert.strictEqual(shadowPage.page.querySelector(".elyric-player-root"), null,
        "the Emby VideoOsd page must contain lifecycle nodes only, never visible custom player descendants");
    assert(shadowPlayer.querySelector(".elyric-player-button-back")
        && shadowPlayer.querySelector(".elyric-player-button-cast"));
    assert.strictEqual(shadowPlayer.scrollTop, 0);
    assert.strictEqual(shadowHost.scrollTop, 0);
    assert.strictEqual(shadowPlayer.querySelector(".elyric-player-title").hidden, false,
        "late V6 workspace application must refresh metadata field visibility for the current item");
    assert.strictEqual(shadowRoot.querySelectorAll(".lyricsItem").length, 0,
        "hostile outer Emby class rules must have no matching class inside the Shadow player");
    assert.strictEqual(shadowPage.native.style.visibility, "hidden",
        "native OSD may be hidden only after the Shadow stylesheet reports ready");
    shadowOsd.destroy(); await settle();
    assert.strictEqual(document.body.querySelector(".elyric-player-host"), null);
    assert.strictEqual(shadowPage.native.style.visibility, "visible");
    shadowPage.page.remove(); outerStyle.remove(); stylesheet.remove();

    const attachShadow = Node.prototype.attachShadow;
    delete Node.prototype.attachShadow;
    const unsupported = createPage();
    const unsupportedOsd = new VideoOsd(unsupported.page);
    const unsupportedError = console.error; console.error = function () {};
    unsupportedOsd.onResume(); await settle(); console.error = unsupportedError;
    assert.strictEqual(document.body.querySelector(".elyric-player-host"), null,
        "missing Shadow DOM support must fail closed without mounting into the Emby page");
    assert.strictEqual(unsupported.native.style.visibility, "visible");
    unsupportedOsd.onPause(); unsupported.page.remove();
    Node.prototype.attachShadow = attachShadow;

    assert(resumes >= 5 && pauses >= 5 && destroys === 3);
    assert(requestedUrls.some((url) => url.includes("Items/song-a/source-song-a/Subtitles/2/Stream.js")));
    console.log("VideoOsd runtime single-root, bridge, lyrics, queue and rollback: ok");
})().catch((error) => { console.error(error); process.exitCode = 1; });
