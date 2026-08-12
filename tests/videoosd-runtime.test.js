"use strict";

const assert = require("assert");
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
    focus() { document.activeElement = this; }
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
    elementFromPoint() { return this.body; }, execCommand() { return true; }
};
document.documentElement.clientHeight = 900;

const window = {
    innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, listeners: {},
    visualViewport: { width: 1440, height: 900, offsetLeft: 0, offsetTop: 0, addEventListener() {}, removeEventListener() {} },
    matchMedia(query) { return { matches: query.includes("prefers-reduced-motion") }; },
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    removeEventListener(type, listener) { this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener); },
    getComputedStyle() { return { paddingTop: "0", paddingRight: "0", paddingBottom: "0", paddingLeft: "0", getPropertyValue() { return "0"; } }; }
};
class MutationObserver { observe() {} disconnect() {} }
const stored = new Map();
const localStorage = {
    getItem(key) { return stored.has(key) ? stored.get(key) : null; },
    setItem(key, value) { stored.set(key, String(value)); }, removeItem(key) { stored.delete(key); }
};
const performance = { now: () => Date.now() };
let frameId = 1;
const frames = new Map();
function requestAnimationFrame(callback) { const id = frameId++; frames.set(id, callback); return id; }
function cancelAnimationFrame(id) { frames.delete(id); }

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
        MediaSources: [{ Id: `source-${id}`, DefaultSubtitleStreamIndex: 2, MediaStreams: [{ Type: "Subtitle", Index: 2 }] }] };
}
const player = {};
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
};

const pendingLyrics = new Map();
const requestedUrls = [];
const ApiClient = {
    getUrl(value) { requestedUrls.push(value); return `/${value}`; },
    getJSON(url) {
        if (url.includes("PublicConfiguration")) return Promise.resolve({ defaultTheme: "apple", allowUserThemeOverride: true });
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
    getCurrentUserId() { return "runtime-user"; }, getDisplayPreferences() { return Promise.resolve({}); },
    isMinServerVersion() { return true; }, updatePartialDisplayPreferences() { return Promise.resolve(); },
    getScaledImageUrl(id) { return `/Items/${id}/Images/Primary`; }
};
const connectionManager = { default: { getApiClient() { return ApiClient; } } };
const router = { default: { back() { calls.push(["back"]); return Promise.resolve(); } } };

global.document = document; global.window = window; global.location = { search: "" };
global.MutationObserver = MutationObserver;
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

async function settle() {
    for (let index = 0; index < 8; index++) await Promise.resolve();
    await new Promise((resolve) => setImmediate(resolve));
    for (let index = 0; index < 4; index++) await Promise.resolve();
}
function createPage() {
    const page = new Node("div"); page.className = "view-videoosd-videoosd";
    const native = new Node("div"); native.className = "videoOsdBottom"; native.setAttribute("aria-hidden", "false");
    native.style.visibility = "visible"; native.style.pointerEvents = "auto"; page.appendChild(native); document.body.appendChild(page);
    return { page, native };
}
function deferLyrics(id) {
    let resolve; const promise = new Promise((done) => { resolve = done; });
    pendingLyrics.set(id, { promise, resolve }); return pendingLyrics.get(id);
}

(async () => {
    const first = createPage(); const osd = new VideoOsd(first.page);
    assert.strictEqual(osd.onResume(), "resume"); await settle();
    const root = first.page.querySelector(".elyric-player-root");
    assert(root, "onResume should mount the custom root");
    [".elyric-player-stage", ".elyric-player-lyric-viewport", ".elyric-player-queue-panel",
        ".elyric-player-settings-panel", ".elyric-player-media-panel"].forEach((selector) => {
        const element = root.querySelector(selector); assert(element && root.contains(element), `${selector} must live inside the root`);
    });
    assert.strictEqual(first.native.getAttribute("aria-hidden"), "true"); assert(first.native.hasAttribute("inert"));
    assert.strictEqual(first.native.style.visibility, "hidden");

    const lyrics = root.querySelector(".elyric-player-lyric-viewport");
    const lyricRows = lyrics.querySelectorAll(".lyricsItem[data-index]");
    assert.strictEqual(lyricRows.length, 1); assert(lyricRows[0].textContent.includes("translation"));
    lyricRows[0].click(); await settle();
    assert(calls.some((call) => call[0] === "seek" && call[1] === 0 && call[2] === player));

    root.querySelector(".elyric-player-button-queue").click(); await settle();
    const queuePanel = root.querySelector(".elyric-player-queue-panel");
    assert.strictEqual(queuePanel.getAttribute("data-elyric-overlay-mode"), "popover");
    assert.strictEqual(queuePanel.getAttribute("data-elyric-overlay"), "queue");
    assert(Number.parseInt(queuePanel.style.getPropertyValue("max-height"), 10) <= window.innerHeight * .66,
        "desktop queue should be bounded near its launcher instead of filling the page");
    assert(Number.parseInt(queuePanel.style.getPropertyValue("max-height"), 10) <= queuePanel.scrollHeight,
        "desktop queue should size to its content when the launcher side has enough room");
    const queueRows = root.querySelectorAll(".elyric-player-queue-row"); assert.strictEqual(queueRows.length, 2);
    queueRows[1].querySelector(".elyric-player-queue-main").click(); await settle();
    queueRows[1].querySelector(".elyric-player-queue-remove").click(); await settle();
    const transfer = { setData() {} };
    queueRows[0].dispatchEvent({ type: "dragstart", dataTransfer: transfer });
    queueRows[1].dispatchEvent({ type: "drop", dataTransfer: transfer }); await settle();
    assert(calls.some((call) => call[0] === "playQueue" && call[1] === "queue-b" && call[2] === player));
    assert(calls.some((call) => call[0] === "removeQueue" && call[1][0] === "queue-b" && call[2] === player));
    assert(calls.some((call) => call[0] === "moveQueue" && call[1] === "queue-a" && call[2] === 1 && call[3] === player));
    root.querySelector(".elyric-player-button-queue").click();
    root.querySelector(".elyric-player-button-settings").click();
    const settingsPanel = root.querySelector(".elyric-player-settings-panel");
    assert.strictEqual(settingsPanel.getAttribute("data-elyric-overlay-mode"), "popover");
    assert(settingsPanel.querySelector(".elyric-player-settings-body"),
        "settings should keep its heading fixed while only the body scrolls");
    assert(Number.parseInt(settingsPanel.style.getPropertyValue("max-height"), 10) <= window.innerHeight * .72,
        "desktop settings should be a compact launcher-anchored popover");

    const oldLyrics = deferLyrics("song-b"); const newLyrics = deferLyrics("song-c");
    currentItem = item("song-b", "歌曲 B"); state = Object.assign({}, state, { NowPlayingItem: currentItem }); trigger(player, "timeupdate");
    currentItem = item("song-c", "歌曲 C"); state = Object.assign({}, state, { NowPlayingItem: currentItem }); trigger(player, "timeupdate");
    newLyrics.resolve({ TrackEvents: [{ Text: "C 最新歌词", StartPositionTicks: 0, EndPositionTicks: 100000000 }] }); await settle();
    oldLyrics.resolve({ TrackEvents: [{ Text: "B 过期歌词", StartPositionTicks: 0, EndPositionTicks: 100000000 }] }); await settle();
    assert(lyrics.textContent.includes("C 最新歌词")); assert(!lyrics.textContent.includes("B 过期歌词"));

    assert.strictEqual(osd.onPause(), "pause"); assert(!first.page.querySelector(".elyric-player-root"));
    assert.strictEqual(first.native.getAttribute("aria-hidden"), "false"); assert(!first.native.hasAttribute("inert"));
    assert.strictEqual(first.native.style.visibility, "visible"); assert.strictEqual(bindings.length, 0); assert.strictEqual(frames.size, 0);
    assert.strictEqual(osd.destroy(), "destroy"); first.page.remove();

    const limited = createPage(); const next = manager.nextTrack; manager.nextTrack = null;
    currentItem = item("song-a", "歌曲 A"); state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const limitedOsd = new VideoOsd(limited.page); limitedOsd.onResume(); await settle();
    assert.strictEqual(limited.page.querySelector(".elyric-player-button-next").disabled, true);
    limitedOsd.onPause(); manager.nextTrack = next; limited.page.remove();

    const failed = createPage(); const getState = manager.getPlayerState; manager.getPlayerState = null;
    const failedOsd = new VideoOsd(failed.page); const oldError = console.error; console.error = function () {};
    failedOsd.onResume(); await settle(); console.error = oldError;
    assert(!failed.page.querySelector(".elyric-player-root")); assert.strictEqual(failed.native.style.visibility, "visible");
    manager.getPlayerState = getState; failedOsd.onPause(); failed.page.remove();

    const video = createPage(); currentItem = item("video-a", "视频 A", "Video"); state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const videoOsd = new VideoOsd(video.page); videoOsd.onResume(); await settle();
    assert(!video.page.querySelector(".elyric-player-root")); videoOsd.onPause(); video.page.remove();

    const rapid = createPage(); currentItem = item("song-a", "歌曲 A"); state = Object.assign({}, state, { NowPlayingItem: currentItem });
    const rapidOsd = new VideoOsd(rapid.page); rapidOsd.onResume(); rapidOsd.onPause(); await settle();
    assert(!rapid.page.querySelector(".elyric-player-root"), "an onPause before the resume microtask must cancel mounting");
    assert.strictEqual(rapid.native.style.visibility, "visible"); rapid.page.remove();

    assert(resumes >= 5 && pauses >= 5 && destroys === 1);
    assert(requestedUrls.some((url) => url.includes("Items/song-a/source-song-a/Subtitles/2/Stream.js")));
    console.log("VideoOsd runtime single-root, bridge, lyrics, queue and rollback: ok");
})().catch((error) => { console.error(error); process.exitCode = 1; });
