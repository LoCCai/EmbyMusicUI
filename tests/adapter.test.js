"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

class FakeClassList {
    constructor(owner) {
        this.owner = owner;
        this.values = [];
        this.syncCount = 0;
    }
    sync() {
        this.syncCount += 1;
        this.owner.className = this.values.join(" ");
    }
    add(...values) {
        values.forEach((value) => {
            if (!this.values.includes(value)) this.values.push(value);
        });
        this.sync();
    }
    remove(...values) {
        this.values = this.values.filter((value) => !values.includes(value));
        this.sync();
    }
    contains(value) {
        return this.values.includes(value);
    }
}

class FakeStyle {
    constructor() {
        this.values = new Map();
    }
    setProperty(name, value) {
        this.values.set(name, String(value));
    }
    removeProperty(name) {
        const previous = this.values.get(name) || "";
        this.values.delete(name);
        return previous;
    }
    getPropertyValue(name) {
        return this.values.get(name) || "";
    }
}

class FakeCanvasContext {
    constructor() {
        this.fillRectCalls = 0;
        this.arcCalls = 0;
        this.strokeCalls = 0;
    }
    setTransform() {}
    clearRect() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    stroke() { this.strokeCalls += 1; }
    fill() {}
    fillRect() { this.fillRectCalls += 1; }
    arc() { this.arcCalls += 1; }
    createLinearGradient() {
        return { addColorStop() {} };
    }
}

class FakeNode {
    constructor(tagName, text) {
        this.tagName = tagName || null;
        this.nodeText = text || "";
        this.children = [];
        this.attributes = {};
        this._className = "";
        this.classList = new FakeClassList(this);
        this.style = new FakeStyle();
        this.parentNode = null;
        this.listeners = {};
        this.scrollIntoViewCalls = [];
    }
    set className(value) {
        this._className = String(value);
        if (this.classList) this.classList.values = this._className.split(/\s+/).filter(Boolean);
    }
    get className() {
        return this._className;
    }
    setAttribute(name, value) {
        this.attributes[name] = String(value);
    }
    getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    }
    removeAttribute(name) {
        delete this.attributes[name];
    }
    appendChild(child) {
        if (child.parentNode && child.parentNode !== this) {
            child.parentNode.removeChild(child);
        }
        this.children.push(child);
        child.parentNode = this;
        return child;
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) this.children.splice(index, 1);
        child.parentNode = null;
        return child;
    }
    addEventListener(type, listener) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(listener);
    }
    removeEventListener(type, listener) {
        this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener);
    }
    dispatchEvent(event) {
        (this.listeners[event.type] || []).forEach((listener) => listener.call(this, event));
        return true;
    }
    click() {
        this.dispatchEvent({ type: "click", target: this, currentTarget: this, stopPropagation() {} });
    }
    focus() {
        document.activeElement = this;
    }
    get firstChild() {
        return this.children[0] || null;
    }
    get isConnected() {
        let node = this;
        while (node.parentNode) node = node.parentNode;
        return node === document.body;
    }
    getClientRects() {
        return this.isConnected ? [{}] : [];
    }
    getBoundingClientRect() {
        if (this.boundingRect) return this.boundingRect;
        return this.isConnected
            ? { left: 0, right: 100, top: 0, bottom: 100 }
            : { left: 0, right: 0, top: 0, bottom: 0 };
    }
    scrollIntoView(options) {
        this.scrollIntoViewCalls.push(options || null);
    }
    getContext(type) {
        if (this.tagName !== "canvas" || type !== "2d") return null;
        if (!this.canvasContext) this.canvasContext = new FakeCanvasContext();
        return this.canvasContext;
    }
    contains(node) {
        while (node) {
            if (node === this) return true;
            node = node.parentNode;
        }
        return false;
    }
    get textContent() {
        if (undefined !== this._textContent) return this._textContent;
        return this.tagName ? this.children.map((child) => child.textContent).join("") : this.nodeText;
    }
    set textContent(value) {
        this._textContent = String(value);
        this.children = [];
    }
    matches(selector) {
        if (selector === "audio" || selector === "video") return this.tagName === selector;
        if (/^[a-z][a-z0-9-]*$/i.test(selector)) return this.tagName === selector.toLowerCase();
        if (/^\.[a-z0-9_-]+$/i.test(selector)) return this.classList.contains(selector.slice(1));
        if (selector === ".listItemBodyText") return this.classList.contains("listItemBodyText");
        if (selector === ".lyricsItem[data-index]") {
            return this.classList.contains("lyricsItem") && null != this.getAttribute("data-index");
        }
        if (selector === "[data-elyric-start][data-elyric-end]") {
            return null != this.getAttribute("data-elyric-start") && null != this.getAttribute("data-elyric-end");
        }
        if (selector === ".elyric-theme-picker") return this.classList.contains("elyric-theme-picker");
        if (selector === ".elyric-theme-select") return this.classList.contains("elyric-theme-select");
        return false;
    }
    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }
    querySelectorAll(selector) {
        const result = [];
        const visit = (node) => node.children.forEach((child) => {
            if (child.matches && child.matches(selector)) result.push(child);
            visit(child);
        });
        visit(this);
        return result;
    }
}

const createdTags = [];
const document = {
    hidden: false,
    head: new FakeNode("head"),
    body: new FakeNode("body"),
    activeElement: null,
    frontElement: null,
    listeners: {},
    addEventListener(type, listener) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(listener);
    },
    removeEventListener(type, listener) {
        this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener);
    },
    dispatchEvent(event) {
        (this.listeners[event.type] || []).forEach((listener) => listener.call(this, event));
        return true;
    },
    elementFromPoint() {
        return this.frontElement || this.body;
    },
    createElement(tagName) {
        createdTags.push(tagName.toLowerCase());
        return new FakeNode(tagName.toLowerCase());
    },
    createTextNode(text) {
        return new FakeNode(null, String(text));
    }
};

const storedValues = new Map();
const localStorage = {
    getItem(key) {
        return storedValues.has(key) ? storedValues.get(key) : null;
    },
    setItem(key, value) {
        storedValues.set(key, String(value));
    },
    removeItem(key) {
        storedValues.delete(key);
    }
};

let serverConfigurationRequests = 0;
let connectionManagerRequests = 0;
let mediaItemRequests = 0;
let displayPreferencesRequests = 0;
let displayPreferencesUpdates = 0;
let partialDisplayPreferencesUpdates = 0;
let lastDisplayPreferences = null;
let themeApiMode = "offline";
const themeApiRequests = [];
const userDisplayPreferences = {};
const requestedConfigurationPaths = [];
const ApiClient = {
    getUrl(pathValue) {
        requestedConfigurationPaths.push(pathValue);
        return `/emby/${pathValue}`;
    },
    getJSON(url) {
        serverConfigurationRequests += 1;
        assert.strictEqual(url, "/emby/EmbyLyricEnhance/PublicConfiguration");
        return Promise.resolve({
            defaultTheme: "apple",
            allowUserThemeOverride: true,
            fontSizePercent: serverConfigurationRequests === 1 ? 135 : 145,
            lineHeight: 1.5,
            fontWeight: 700,
            useThemeColor: false,
            highlightColor: "#12Ab34",
            pendingOpacity: 0.25,
            glowStrength: 0.8,
            currentLineScale: 1.12,
            otherLinesOpacity: 0.3,
            otherLinesBlurPixels: 1.2,
            showSecondLine: false,
            showThirdAndLaterLines: false
        });
    },
    ajax(request) {
        themeApiRequests.push(request);
        if (themeApiMode === "offline") {
            return Promise.reject(new Error("theme api offline"));
        }
        if (themeApiMode === "not-found") {
            const error = new Error("theme api route missing");
            error.status = 404;
            return Promise.reject(error);
        }
        if (themeApiMode === "healthy") {
            const payload = request.data && typeof request.data === "string"
                ? JSON.parse(request.data)
                : {};
            if (request.type === "POST") {
                return Promise.resolve({
                    Id: payload.Id,
                    Name: payload.Name,
                    Revision: 1,
                    ThemeJson: payload.ThemeJson
                });
            }
            if (request.type === "PUT") {
                return Promise.resolve({ Value: {
                    Id: payload.Id,
                    Name: payload.Name,
                    Revision: Number(payload.ExpectedRevision || 0) + 1,
                    ThemeJson: payload.ThemeJson
                } });
            }
            if (request.type === "DELETE") {
                return Promise.resolve({ Deleted: true });
            }
        }
        return Promise.resolve({});
    },
    getCurrentUserId() {
        return "test-user";
    },
    getDisplayPreferences(userId) {
        displayPreferencesRequests += 1;
        assert.strictEqual(userId, "test-user");
        return Promise.resolve(userDisplayPreferences);
    },
    isMinServerVersion(version) {
        assert.strictEqual(version, "4.9.0.23");
        return true;
    },
    updatePartialDisplayPreferences(preferences, userId) {
        displayPreferencesUpdates += 1;
        partialDisplayPreferencesUpdates += 1;
        assert.strictEqual(userId, "test-user");
        lastDisplayPreferences = preferences;
        Object.assign(userDisplayPreferences, preferences);
        return Promise.resolve();
    },
    updateDisplayPreferences(preferences, userId) {
        displayPreferencesUpdates += 1;
        assert.strictEqual(userId, "test-user");
        lastDisplayPreferences = preferences;
        Object.assign(userDisplayPreferences, preferences);
        return Promise.resolve();
    },
    getItem(userId, itemId) {
        mediaItemRequests += 1;
        assert.strictEqual(userId, "test-user");
        assert.strictEqual(itemId, "metadata-test");
        return Promise.resolve({
            Id: itemId,
            Name: "测试歌曲",
            Path: "/music/测试歌曲.wav",
            DateCreated: "2024-09-17T01:05:00Z",
            MediaSources: [{
                Path: "/music/测试歌曲.wav",
                Container: "wav",
                Size: 146381210,
                MediaStreams: [
                    {
                        Type: "Audio",
                        DisplayTitle: "PCM_S16LE 6 ch",
                        Codec: "pcm_s16le",
                        Channels: 6,
                        BitRate: 4233600,
                        SampleRate: 44100,
                        BitDepth: 16,
                        IsDefault: false
                    },
                    {
                        Type: "Video",
                        Codec: "mjpeg",
                        Profile: "Baseline",
                        Level: -99,
                        Width: 600,
                        Height: 654,
                        RealFrameRate: 90000,
                        ColorSpace: "bt470bg",
                        BitDepth: 8,
                        PixelFormat: "yuvj444p",
                        RefFrames: 1,
                        IsDefault: false
                    },
                    {
                        Type: "Subtitle",
                        DisplayTitle: "(TEXT)",
                        Title: "Lyrics",
                        Codec: "text",
                        IsDefault: false,
                        IsExternal: false
                    }
                ]
            }]
        });
    }
};
const connectionManager = {
    default: {
        getApiClient(item) {
            connectionManagerRequests += 1;
            assert(item, "the live Emby connection manager should receive the renderer item");
            return ApiClient;
        }
    }
};

class MutationObserver {
    observe() {}
    disconnect() {}
}

let clockNow = 0;
let nextFrameId = 1;
const frames = new Map();
const performance = { now: () => clockNow };
let liveFrequencyReads = 0;
let liveWaveformReads = 0;
let audioDestinationConnections = 0;
class FakeAnalyserNode {
    constructor() {
        this.fftSize = 2048;
        this.frequencyBinCount = 1024;
        this.smoothingTimeConstant = 0;
    }
    getByteFrequencyData(target) {
        liveFrequencyReads += 1;
        target.fill(96);
        for (let i = 0; i < Math.min(48, target.length); i++) target[i] = 196 - i;
    }
    getByteTimeDomainData(target) {
        liveWaveformReads += 1;
        for (let i = 0; i < target.length; i++) target[i] = 128 + Math.round(Math.sin(i / 9) * 48);
    }
    disconnect() {}
}
class FakeAudioContext {
    constructor() {
        this.state = "running";
        this.closed = false;
        this.destination = {};
    }
    createMediaStreamSource() {
        return {
            connect(target) {
                if (!(target instanceof FakeAnalyserNode)) audioDestinationConnections += 1;
            },
            disconnect() {}
        };
    }
    createAnalyser() { return new FakeAnalyserNode(); }
    resume() { this.state = "running"; return Promise.resolve(); }
    close() { this.state = "closed"; this.closed = true; return Promise.resolve(); }
}
global.window = {
    devicePixelRatio: 1,
    innerWidth: 1440,
    innerHeight: 900,
    listeners: {},
    matchMedia() { return { matches: true }; },
    addEventListener(type, listener) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(listener);
    },
    removeEventListener(type, listener) {
        this.listeners[type] = (this.listeners[type] || []).filter((value) => value !== listener);
    },
    dispatchEvent(event) {
        (this.listeners[event.type] || []).forEach((listener) => listener.call(this, event));
        return true;
    }
};
function requestAnimationFrame(callback) {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
}
function cancelAnimationFrame(id) {
    frames.delete(id);
}
function runFrame(afterMs) {
    clockNow += afterMs;
    const callbacks = Array.from(frames.values());
    frames.clear();
    callbacks.forEach((callback) => callback(clockNow));
}

function LyricsRenderer() {}
LyricsRenderer.prototype.getItemsInternal = function () {
    return Promise.resolve(this.sourceEvents);
};
LyricsRenderer.prototype.onTimeUpdate = function () {};
LyricsRenderer.prototype.destroy = function () {};

const adapterPath = path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js");
const normalizeLineEndings = (value) => value.replace(/\r\n?/g, "\n");
const adapter = normalizeLineEndings(fs.readFileSync(adapterPath, "utf8"));
const adapterCssPath = path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.css");
const adapterCss = normalizeLineEndings(fs.readFileSync(adapterCssPath, "utf8"));
const playerThemeV2Models = fs.readFileSync(path.join(
    __dirname, "..", "plugin", "src", "EmbyLyricEnhance.Core", "PlayerThemeV2Models.cs"
), "utf8");
const validationRuleBlock = playerThemeV2Models.match(/ValidationRuleIds\s*=\s*\{([\s\S]*?)\};/);
assert(validationRuleBlock, "the server should publish its PlayerThemeV2 validation rule catalog");
const serverValidationRules = new Set(
    [...validationRuleBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
);
new Function(
    "LyricsRenderer",
    "document",
    "MutationObserver",
    "performance",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "localStorage",
    "ApiClient",
    "_connectionmanager",
    adapter
)(
    LyricsRenderer,
    document,
    MutationObserver,
    performance,
    requestAnimationFrame,
    cancelAnimationFrame,
    localStorage,
    ApiClient,
    connectionManager
);

const playerThemeV2Registry = window.__elyricPlayerThemeV2Registry;
assert(Array.isArray(playerThemeV2Registry) && playerThemeV2Registry.length > 400,
    "the V2 registry should enumerate every scalar and responsive layer parameter");
assert.strictEqual(new Set(playerThemeV2Registry.map((item) => item.id)).size,
    playerThemeV2Registry.length, "registered PlayerThemeV2 ids should be unique");
playerThemeV2Registry.forEach((item) => {
    assert(item.hasDefault && item.hasValidator && item.hasMigration,
        `${item.id} should declare defaults, validation and migration`);
    assert(item.editor && item.binding && item.serialize && item.serverValidate,
        `${item.id} should declare editor, renderer, serialization and server validation bindings`);
    assert(item.serverRule && serverValidationRules.has(item.serverRule),
        `${item.id} should reference a concrete validation rule enforced by the server`);
});

function valueAtPath(source, dottedPath) {
    return dottedPath.split(".").reduce((value, part) => value == null ? undefined : value[part], source);
}

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

function createLyricElement(index) {
    const item = new FakeNode("div");
    item.classList.add("lyricsItem");
    item.setAttribute("data-index", String(index));
    const body = new FakeNode("div");
    body.classList.add("listItemBodyText");
    item.appendChild(body);
    return { item, body };
}

(async () => {
    const nativeClicks = { back: 0, cast: 0, previous: 0, playPause: 0, stop: 0, next: 0, lyrics: 0, shuffle: 0, repeat: 0, queue: 0, mute: 0 };
    let hiddenNativeQueueClicks = 0;
    const hiddenNativeQueue = new FakeNode("button");
    hiddenNativeQueue.classList.add("btnPlayQueue");
    hiddenNativeQueue.getBoundingClientRect = () => ({ width: 0, height: 0 });
    hiddenNativeQueue.addEventListener("click", () => { hiddenNativeQueueClicks += 1; });
    const nativeControls = {};
    const nativeDefinitions = [
        ["back", "headerBackButton"],
        ["cast", "headerCastButton"],
        ["previous", "btnPreviousTrack"],
        ["playPause", "videoOsd-btnPause"],
        ["stop", "btnVideoOsd-stop"],
        ["next", "btnNextTrack"],
        ["lyrics", "btnLyrics"],
        ["shuffle", "btnOsdShuffle-bottom"],
        ["repeat", "btnOsdRepeatMode-bottom"],
        ["queue", "btnPlayQueue"],
        ["mute", "buttonMute"]
    ];
    nativeDefinitions.forEach(([action, className]) => {
        const button = new FakeNode("button");
        button.classList.add(className);
        if (action === "shuffle") button.classList.add("toggleButton-active");
        if (action === "lyrics") button.classList.add("toggleButton-active");
        button.addEventListener("click", () => {
            nativeClicks[action] += 1;
            if (action === "queue") {
                button.classList.add("toggleButton-active");
                if (nativeControls.lyrics) nativeControls.lyrics.classList.remove("toggleButton-active");
            } else if (action === "lyrics") {
                button.classList.add("toggleButton-active");
                if (nativeControls.queue) nativeControls.queue.classList.remove("toggleButton-active");
            }
        });
        if (action === "queue") {
            button.getBoundingClientRect = () => ({ width: 42, height: 42 });
        }
        nativeControls[action] = button;
        document.body.appendChild(button);
    });
    const nativeSeek = new FakeNode("input");
    nativeSeek.classList.add("videoOsdPositionSlider");
    nativeSeek.max = "100";
    nativeSeek.value = "0";
    let nativeSeekInputs = 0;
    let nativeSeekChanges = 0;
    nativeSeek.addEventListener("input", () => { nativeSeekInputs += 1; });
    nativeSeek.addEventListener("change", () => { nativeSeekChanges += 1; });
    document.body.appendChild(nativeSeek);
    const nativeVolume = new FakeNode("input");
    nativeVolume.classList.add("videoOsdVolumeSlider");
    nativeVolume.max = "100";
    nativeVolume.value = "65";
    let nativeVolumeInputs = 0;
    let nativeVolumeChanges = 0;
    nativeVolume.addEventListener("input", () => { nativeVolumeInputs += 1; });
    nativeVolume.addEventListener("change", () => { nativeVolumeChanges += 1; });
    document.body.appendChild(nativeVolume);

    const renderer = new LyricsRenderer();
    const visible = createLyricElement(0);
    const playbackPage = new FakeNode("div");
    playbackPage.classList.add("view-videoosd-videoosd");
    document.body.appendChild(playbackPage);
    playbackPage.appendChild(hiddenNativeQueue);
    Object.values(nativeControls).forEach((button) => playbackPage.appendChild(button));
    document.body.appendChild(nativeControls.back);
    document.body.appendChild(nativeControls.cast);
    playbackPage.appendChild(nativeSeek);
    playbackPage.appendChild(nativeVolume);
    renderer.itemsContainer = new FakeNode("div");
    renderer.currentItem = { Id: "server-config-test" };
    playbackPage.appendChild(renderer.itemsContainer);
    renderer.itemsContainer.appendChild(visible.item);
    renderer.sourceEvents = [
        {
            Id: "main",
            Text: "<00:00.00>A<00:00.50>B<00:01.00>",
            StartPositionTicks: 0,
            EndPositionTicks: 0
        },
        { Id: "translation", Text: "<img src=x onerror=bad><br>translation", StartPositionTicks: 0, EndPositionTicks: 20000000 }
    ];

    const items = await renderer.getItemsInternal();
    await flushPromises();
    assert.strictEqual(items.length, 1, "same-time events should be grouped");
    assert.strictEqual(items[0].__elyric.sublines.length, 2);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), "apple",
        "the server theme should apply when the browser has no saved override");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-has-lyrics"), "true",
        "the player shell should expose whether the current media has lyric events");
    assert.strictEqual(document.body.getAttribute("data-elyric-has-lyrics"), "true");
    assert.strictEqual(renderer.__elyricThemeControl.querySelector(".elyric-player-lyrics-empty")
        .getAttribute("hidden"), "hidden",
        "the no-lyrics status should stay hidden while synchronized lyrics are available");
    assert.strictEqual(serverConfigurationRequests, 1, "overlapping renderers should share one configuration request");
    assert.strictEqual(connectionManagerRequests, 1,
        "Emby 4.9.5 should resolve its authenticated API client through the module connection manager");
    assert.deepStrictEqual(requestedConfigurationPaths, [
        "EmbyLyricEnhance/PublicConfiguration",
        "EmbyLyricEnhance/UserWorkspace",
        "EmbyLyricEnhance/Themes"
    ]);
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "135%");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-line-height"), "1.5");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-font-weight"), "700");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-highlight-color"), "#12ab34");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-pending-opacity"), "0.25");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-glow-percent"), "80%");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-current-scale"), "1.12");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-other-lines-opacity"), "0.3");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-other-lines-blur"), "1.2px");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), "false");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-third-plus"), "false");
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 1);
    assert(renderer.__elyricThemeControl.classList.contains("elyric-player-shell"),
        "the lyric view should mount the custom music player shell");
    assert(document.body.classList.contains("elyric-player-active-page"),
        "the visible lyric renderer should own the full playback page layout");
    assert.strictEqual(document.body.getAttribute("data-elyric-player-layout"), "album");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-player-layout"), "album");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-player-layout"), "album");
    assert.strictEqual(renderer.__elyricThemeControl.style.getPropertyValue("--elyric-highlight-color"), "#12ab34");
    assert.strictEqual(renderer.__elyricPlayerTitle.textContent, "正在播放");
    assert.strictEqual(renderer.__elyricPlayerArtist.textContent, "Emby 音乐");
    assert.strictEqual(renderer.__elyricPlayerButtons.shuffle.getAttribute("data-elyric-active"), "true",
        "native shuffle state should be reflected by the custom control");
    assert.strictEqual(renderer.__elyricPlayerButtons.back.disabled, false,
        "the custom back button should find Emby's body-level playback header");
    assert.strictEqual(renderer.__elyricPlayerButtons.cast.disabled, false,
        "the custom cast button should proxy Emby's body-level cast control");
    const themeButtons = renderer.__elyricThemeButtons;
    assert.strictEqual(themeButtons.length, 5,
        "all lyric styles should be exposed as direct segmented buttons");
    assert.strictEqual(themeButtons.find((button) => button.getAttribute("data-elyric-choice") === "apple")
        .getAttribute("aria-pressed"), "true");
    assert(themeButtons.every((button) => button.disabled === false));
    assert.strictEqual(document.body.querySelector(".elyric-theme-select"), null,
        "the V3 settings should not require a dropdown");
    assert.strictEqual(renderer.__elyricThemeControl.parentNode, document.body,
        "the visual overlay should use document.body to avoid playback host clipping");
    const settingsPanel = renderer.__elyricSettingsPanel;
    assert(settingsPanel, "the full player should expose its own settings drawer");
    assert.strictEqual(settingsPanel.parentNode, document.body,
        "the settings drawer should sit above the native lyric stacking layer");
    assert.strictEqual(settingsPanel.getAttribute("aria-modal"), "true",
        "the settings drawer should expose modal semantics to assistive technology");
    assert.strictEqual(renderer.__elyricOverlayScrim.parentNode, document.body,
        "settings and media details should share a document-level modal scrim");
    assert.strictEqual(settingsPanel.getAttribute("hidden"), "hidden");
    renderer.__elyricSettingsButton.click();
    assert.strictEqual(settingsPanel.getAttribute("hidden"), null);
    assert.strictEqual(document.activeElement, settingsPanel.querySelector(".elyric-player-settings-close"),
        "opening settings should move keyboard focus into the dialog");
    assert.strictEqual(renderer.__elyricOverlayScrim.getAttribute("hidden"), null,
        "opening settings should place a click-blocking scrim above oversized lyrics");
    assert.strictEqual(renderer.__elyricSettingsButton.getAttribute("aria-expanded"), "true");
    assert.strictEqual(document.body.querySelectorAll(".elyric-player-settings-panel").length, 1,
        "opening settings must not duplicate the drawer");
    document.frontElement = renderer.__elyricOverlayScrim;
    renderer.onTimeUpdate(0, 20000000);
    assert(visible.item.classList.contains("elyric-line-multilingual"),
        "grouped pronunciation or translation rows should expose a multilingual layout hook");
    assert.strictEqual(visible.body.querySelector(".elyric-subline-1")
        .getAttribute("data-elyric-subline-role"), "primary");
    assert.strictEqual(visible.body.querySelector(".elyric-subline-2")
        .getAttribute("data-elyric-subline-role"), "secondary");
    assert.strictEqual(settingsPanel.getAttribute("hidden"), null,
        "the player scrim must not be mistaken for a different page covering playback");
    assert.strictEqual(renderer.__elyricOverlayScrim.getAttribute("hidden"), null,
        "visibility checks must not oscillate the open settings scrim");
    document.frontElement = null;
    playbackPage.classList.add("hide");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricOverlayScrim.getAttribute("hidden"), "hidden",
        "leaving the player must hide the document-level scrim even when a drawer was open");
    playbackPage.classList.remove("hide");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricOverlayScrim.getAttribute("hidden"), null,
        "returning to the player should restore the open drawer and its scrim together");
    const panelCloseFollowCount = visible.item.scrollIntoViewCalls.length;
    settingsPanel.querySelector(".elyric-player-settings-close").click();
    assert.strictEqual(settingsPanel.getAttribute("hidden"), "hidden");
    assert.strictEqual(document.activeElement, renderer.__elyricSettingsButton,
        "closing settings should restore focus to its launcher");
    assert.strictEqual(renderer.__elyricOverlayScrim.getAttribute("hidden"), "hidden");
    assert(visible.item.scrollIntoViewCalls.length > panelCloseFollowCount,
        "closing a sheet should recenter the active multilingual lyric after responsive layout changes");
    renderer.__elyricSettingsButton.click();
    renderer.__elyricThemeV2DesignerToggle.click();
    assert.strictEqual(renderer.__elyricThemeV2DesignerOpen, true,
        "starting canvas editing should retain designer state after closing settings");
    assert.strictEqual(settingsPanel.getAttribute("hidden"), "hidden",
        "starting canvas editing should close the settings drawer so its modal cannot block handles");
    assert.strictEqual(renderer.__elyricOverlayScrim.getAttribute("hidden"), "hidden",
        "canvas editing should not retain the settings click-blocking scrim");
    assert.strictEqual(renderer.__elyricThemeV2Boxes.length, 8,
        "canvas editing should expose one editable box for every player layer");
    assert(renderer.__elyricThemeV2Boxes.every((box) => box.parentNode === document.body),
        "canvas handles should remain mounted after the settings drawer closes");
    const designerExitButton = renderer.__elyricThemeV2ExitButton;
    assert(designerExitButton && designerExitButton.parentNode === document.body,
        "canvas editing should expose a touch-accessible completion button above every layer box");
    assert.strictEqual(designerExitButton.getAttribute("aria-label"), "完成画布编辑并返回设置");
    renderer.__elyricThemeV2LayerButtons
        .find((button) => button.getAttribute("data-layer") === "auxiliary").click();
    renderer.__elyricThemeV2HideButton.click();
    assert.strictEqual(renderer.__elyricPlayerTools.getAttribute("data-elyric-v2-user-hidden"), "true",
        "hiding the auxiliary layer should use the safe-entry CSS hook");
    assert.strictEqual(renderer.__elyricSettingsButton.parentNode, renderer.__elyricPlayerTools,
        "the settings launcher must remain in the auxiliary layer as its recovery entry");
    assert(adapterCss.includes(
        '.elyric-player-v2-layer-auxiliary[data-elyric-v2-user-hidden="true"] > :not(.elyric-player-button-settings)'
    ) && adapterCss.includes(
        '.elyric-player-v2-layer-auxiliary[data-elyric-v2-user-hidden="true"] .elyric-player-button-settings'
    ), "hiding auxiliary controls should keep only the settings recovery button visible");
    renderer.__elyricThemeV2HideButton.click();
    designerExitButton.click();
    assert.strictEqual(renderer.__elyricThemeV2DesignerOpen, false,
        "the canvas completion button should finish editing");
    assert.strictEqual(renderer.__elyricThemeV2Boxes.length, 0,
        "finishing canvas editing should remove every handle before showing settings");
    assert.strictEqual(settingsPanel.getAttribute("hidden"), null,
        "finishing canvas editing should return directly to the settings drawer");
    settingsPanel.querySelector(".elyric-player-settings-close").click();
    renderer.__elyricThemeV2DesignerToggle.click();
    let designerEscapePrevented = false;
    let designerEscapeStopped = false;
    document.dispatchEvent({
        type: "keydown",
        key: "Escape",
        preventDefault() { designerEscapePrevented = true; },
        stopPropagation() { designerEscapeStopped = true; }
    });
    assert.strictEqual(renderer.__elyricThemeV2DesignerOpen, false,
        "Escape should exit canvas editing without requiring a page refresh");
    assert.strictEqual(renderer.__elyricThemeV2Boxes.length, 0);
    assert(designerEscapePrevented && designerEscapeStopped,
        "the canvas Escape shortcut should not leak to Emby's page-level shortcuts");
    renderer.__elyricThemeV2DesignerToggle.click();
    playbackPage.classList.add("hide");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeV2DesignerOpen, false,
        "leaving the playback route should always finish canvas editing");
    assert.strictEqual(renderer.__elyricThemeV2Boxes.length, 0,
        "leaving the playback route should remove document-level canvas handles");
    playbackPage.classList.remove("hide");
    renderer.onTimeUpdate(0, 20000000);
    const layoutButtons = renderer.__elyricLayoutButtons;
    assert.strictEqual(layoutButtons.length, 10,
        "all nine supplied reference layouts and the custom composition should be selectable");
    assert.deepStrictEqual(
        layoutButtons.map((button) => button.getAttribute("data-elyric-choice")),
        ["album", "center", "mobile", "mint", "deck", "stack", "coverflow", "lyrics", "rose", "custom"]
    );
    assert.strictEqual(layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "album")
        .getAttribute("aria-pressed"), "true");
    assert.strictEqual(document.body.querySelector(".elyric-layout-select"), null);
    assert.strictEqual(renderer.__elyricPlayerButtons.lyrics, undefined,
        "lyrics are always visible, so V3 must not expose a redundant lyrics button");
    ["back", "cast", "previous", "playPause", "next", "mute", "shuffle", "repeat", "stop", "queue"]
        .forEach((action) => {
            assert(renderer.__elyricPlayerButtons[action].getAttribute("data-elyric-icon"),
                `${action} should use the shared SVG icon presentation`);
        });
    assert.strictEqual(renderer.__elyricMediaButton.getAttribute("data-elyric-icon"), "info");
    assert.strictEqual(renderer.__elyricSecondLineButton.getAttribute("data-elyric-icon"), "subtitle");
    assert.strictEqual(renderer.__elyricArtworkRotationButton.getAttribute("data-elyric-icon"), "rotation");
    assert.strictEqual(renderer.__elyricSettingsButton.getAttribute("data-elyric-icon"), "settings");
    assert.strictEqual(renderer.__elyricVisualizer.children.length, 1,
        "the player should mount one horizontal canvas visualizer");
    assert.strictEqual(renderer.__elyricVisualizer.children[0].tagName, "canvas");
    assert(renderer.__elyricVisualizerContext.strokeCalls > 0,
        "the default spectrum shape should paint rounded center-balanced bars into the canvas");
    assert.strictEqual(renderer.__elyricVisualizerStyleButtons.length, 9);
    assert.strictEqual(renderer.__elyricCoverflowArtworks.length, 5,
        "the coverflow reference should use a real five-card DOM stage");
    assert.strictEqual(renderer.__elyricVisualizerRangeButtons.length, 3);
    assert.strictEqual(renderer.__elyricVisualizerColorModeButtons.length, 4);
    assert.strictEqual(renderer.__elyricBackgroundButtons.length, 4);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-style"), "line");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-range"), "wide");
    assert.strictEqual(renderer.__elyricVisualizerWidthInput.value, "62");
    assert.strictEqual(renderer.__elyricVisualizerHeightInput.value, "8");
    assert.strictEqual(renderer.__elyricVisualizerAmplitudeInput.value, "70");
    assert.strictEqual(renderer.__elyricVisualizerAnalysisInputs.sensitivity.value, "125");
    assert.strictEqual(renderer.__elyricVisualizerAnalysisInputs.response.value, "80");
    assert.strictEqual(renderer.__elyricVisualizerAnalysisInputs.smoothing.value, "25");
    assert.strictEqual(renderer.__elyricVisualizerAnalysisInputs.density.value, "56");
    assert.strictEqual(renderer.__elyricVisualizerAnalysisInputs.bassBoost.value, "100");
    assert.strictEqual(renderer.__elyricPlayerTuningInputs.backgroundBlur.value, "44",
        "missing local values must use balanced defaults instead of coercing null to zero");
    assert.strictEqual(renderer.__elyricPlayerTuningInputs.artworkX.value, "18");
    assert.strictEqual(renderer.__elyricPlayerTuningInputs.artworkSize.value, "46");
    assert.strictEqual(renderer.__elyricPlayerTuningInputs.metadataWidth.value, "42");
    assert.strictEqual(renderer.__elyricPlayerTuningInputs.lyricsHeight.value, "48");
    assert(settingsPanel.querySelector(".elyric-player-settings-action"),
        "the custom composition workspace should expose a one-click reset action");
    assert(settingsPanel.textContent.includes("显示注音 / 翻译")
        && settingsPanel.textContent.includes("隐藏注音 / 翻译"),
    "multiline lyric controls should describe both pronunciation and translation rows");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-source"), "estimated",
        "test browsers without Web Audio should use the explicit rhythm-estimation fallback");
    const liveMediaElement = new FakeNode("video");
    liveMediaElement.paused = false;
    liveMediaElement.ended = false;
    liveMediaElement.captureStream = () => ({ getAudioTracks: () => [{}] });
    playbackPage.appendChild(liveMediaElement);
    window.AudioContext = FakeAudioContext;
    renderer.__elyricVisualizerAnalyserRetryAt = 0;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-source"), "live",
        "an active media capture stream should switch the visualizer to live audio analysis");
    assert(liveFrequencyReads > 0, "live spectrum frames should read analyser frequency bins");
    assert.strictEqual(audioDestinationConnections, 0,
        "the analyser source should never connect to the AudioContext destination");
    renderer.__elyricVisualizerAnalysisInputs.bassBoost.value = "0";
    renderer.__elyricVisualizerEnergy = null;
    renderer.__elyricVisualizerAnalysisInputs.bassBoost
        .dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricVisualizerBassBoost, 0,
        "zero low-frequency weight must not be replaced by the default value");
    assert(renderer.__elyricVisualizerEnergy[0] < renderer.__elyricVisualizerEnergy.at(-1),
        "zero low-frequency weight should attenuate bass instead of oversampling the first bins");
    const liveAudioContext = renderer.__elyricVisualizerAudioContext;
    renderer.__elyricVisualizerStyleButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "waveform")
        .click();
    renderer.onTimeUpdate(0, 20000000);
    assert(liveWaveformReads > 0, "the waveform style should read live time-domain samples");
    const chromaStrokeCalls = renderer.__elyricVisualizerContext.strokeCalls;
    renderer.__elyricVisualizerStyleButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "chroma")
        .click();
    renderer.onTimeUpdate(0, 20000000);
    assert(renderer.__elyricVisualizerContext.strokeCalls > chromaStrokeCalls,
        "the chromatic mirrored reference should paint live dual-sided energy bars");
    const particleArcCalls = renderer.__elyricVisualizerContext.arcCalls;
    renderer.__elyricVisualizerStyleButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "balls")
        .click();
    renderer.onTimeUpdate(0, 20000000);
    assert(renderer.__elyricVisualizerContext.arcCalls > particleArcCalls,
        "the particle style should paint audio-reactive primary and reflected particles");
    renderer.__elyricVisualizerStyleButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "curve")
        .click();
    renderer.__elyricVisualizerRangeButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "full")
        .click();
    renderer.__elyricVisualizerWidthInput.value = "83";
    renderer.__elyricVisualizerWidthInput.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerHeightInput.value = "16";
    renderer.__elyricVisualizerHeightInput.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerAmplitudeInput.value = "130";
    renderer.__elyricVisualizerAmplitudeInput.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerAnalysisInputs.response.value = "95";
    renderer.__elyricVisualizerAnalysisInputs.response.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerAnalysisInputs.smoothing.value = "15";
    renderer.__elyricVisualizerAnalysisInputs.smoothing.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerAnalysisInputs.density.value = "80";
    renderer.__elyricVisualizerAnalysisInputs.density.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerColorModeButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "multi")
        .click();
    renderer.__elyricVisualizerColorInputs[0].value = "#123456";
    renderer.__elyricVisualizerColorInputs[0].dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricVisualizerColorInputs[1].value = "not-a-color";
    renderer.__elyricVisualizerColorInputs[1].dispatchEvent({ type: "input", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricVisualizerColorInputs[1].getAttribute("aria-invalid"), "true");
    renderer.__elyricBackgroundButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "white")
        .click();
    assert.strictEqual(renderer.__elyricAlignmentButtons.length, 3,
        "lyric alignment should expose only the explicit left, center and right anchors");
    renderer.__elyricAlignmentButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "right")
        .click();
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-alignment"), "right");
    renderer.__elyricAlignmentButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "center")
        .click();
    renderer.__elyricLyricScaleInput.value = "125";
    renderer.__elyricLyricScaleInput.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricPlayerTuningInputs.backgroundBlur.value = "32";
    renderer.__elyricPlayerTuningInputs.backgroundBlur.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricPlayerTuningInputs.artworkX.value = "82";
    renderer.__elyricPlayerTuningInputs.artworkX.dispatchEvent({ type: "input", stopPropagation() {} });
    renderer.__elyricPlayerTuningInputs.lyricsWidth.value = "52";
    renderer.__elyricPlayerTuningInputs.lyricsWidth.dispatchEvent({ type: "input", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-style"), "curve");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-range"), "custom");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-color-mode"), "multi");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-background-mode"), "white");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-alignment"), "center");
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "125%");
    assert.strictEqual(renderer.__elyricVisualizerWidthValue.textContent, "83%");
    assert.strictEqual(renderer.__elyricVisualizerHeightValue.textContent, "16%");
    assert.strictEqual(renderer.__elyricVisualizerAmplitudeValue.textContent, "130%");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-style"), "curve");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-range"), "custom");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-width"), "83");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-height"), "16");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-amplitude"), "130");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-response"), "95");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-smoothing"), "15");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-density"), "80");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-color-mode"), "multi");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.visualizer-color-1"), "#123456");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.background-mode"), "white");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.lyric-alignment"), "center");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.lyric-scale"), "125");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.background-blur"), "32");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.artwork-x"), "82");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.lyrics-width"), "52");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-playback-active"), "false");
    const artworkRotationButton = renderer.__elyricArtworkRotationButton;
    assert(artworkRotationButton, "the full player should expose an artwork rotation toggle");
    assert.strictEqual(artworkRotationButton.disabled, false,
        "all record-based layouts should allow artwork rotation");
    assert.strictEqual(artworkRotationButton.getAttribute("aria-pressed"), "true",
        "circular artwork rotation should default to enabled");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-artwork-rotate"), "true");
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "center").click();
    assert.strictEqual(document.body.getAttribute("data-elyric-player-layout"), "center");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-player-layout"), "center");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-player-layout"), "center");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.player-layout"), "center");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-background-mode"), "blur");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-alignment"), "left");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-style"), "curve");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-color-mode"), "solid");
    assert.strictEqual(renderer.__elyricVisualizerColorInputs[0].value, "#1ED760",
        "selecting a supplied reference should apply its coordinated visual defaults");
    assert.strictEqual(artworkRotationButton.disabled, false,
        "the turntable layout should allow artwork rotation control");
    artworkRotationButton.click();
    assert.strictEqual(artworkRotationButton.getAttribute("aria-pressed"), "false");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-artwork-rotate"), "false");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.artwork-rotation"), "false");
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "lyrics").click();
    assert.strictEqual(artworkRotationButton.disabled, false,
        "the lyrics-first circular layout should also allow artwork rotation control");
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "rose").click();
    assert.strictEqual(renderer.__elyricSettingsPanel.style.getPropertyValue("--elyric-v2-panel-bg"), "#fff0f4",
        "the settings drawer should use the active theme surface instead of an unrelated black/white surface");
    assert.strictEqual(renderer.__elyricSettingsPanel.style.getPropertyValue("--elyric-v2-panel-on"), "#111318",
        "the settings drawer should calculate a readable foreground for a light themed surface");
    assert.strictEqual(document.body.style.getPropertyValue("--elyric-v2-panel-bg"), "#fff0f4",
        "theme semantic colors should reach document-level Emby popups and queue cards");
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "stack").click();
    assert.strictEqual(renderer.__elyricPlayerThemeLibrarySelect.value, "builtin:stack",
        "the theme library should follow built-in theme buttons");
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "custom").click();
    assert.strictEqual(document.body.getAttribute("data-elyric-player-layout"), "custom");
    assert.strictEqual(renderer.__elyricPlayerThemeLibrarySelect.value, "builtin:stack",
        "an unsaved custom draft should retain its built-in composition basis");

    themeButtons.find((button) => button.getAttribute("data-elyric-choice") === "focus").click();
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), "focus");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.theme"), "focus");
    await new Promise((resolve) => setTimeout(resolve, 650));
    assert.strictEqual(displayPreferencesRequests, 1,
        "the authenticated Emby display preferences should be read once per player instance");
    assert(displayPreferencesUpdates >= 1,
        "local player choices should migrate to the current Emby user profile");
    assert(partialDisplayPreferencesUpdates >= 1,
        "Emby 4.9.5 should save only the custom player key through its partial preference API");
    const syncedPlayerPreferences = JSON.parse(
        lastDisplayPreferences["emby-lyric-enhance.player-preferences.v2"]
    );
    assert.strictEqual(syncedPlayerPreferences.layout, "custom");
    assert.strictEqual(syncedPlayerPreferences.theme, "focus");
    assert.strictEqual(syncedPlayerPreferences.visualizerHeight, 16);
    assert.strictEqual(syncedPlayerPreferences.visualizerResponse, 95);
    assert.strictEqual(syncedPlayerPreferences.visualizerSmoothing, 15);
    assert.strictEqual(syncedPlayerPreferences.visualizerDensity, 80);
    assert.strictEqual(syncedPlayerPreferences.tuning.backgroundBlur, 44,
        "selecting a built-in theme should apply its complete parameter set");
    assert.strictEqual(syncedPlayerPreferences.tuning.artworkX, 24);
    assert.strictEqual(syncedPlayerPreferences.tuning.lyricsWidth, 44);

    const themeLibrarySelect = renderer.__elyricPlayerThemeLibrarySelect;
    const themeNameInput = renderer.__elyricPlayerThemeNameInput;
    themeNameInput.value = "按钮弹卡主题";
    settingsPanel.querySelector(".elyric-theme-new").click();
    await flushPromises();
    let storedPlayerThemes = JSON.parse(
        storedValues.get("emby-lyric-enhance.player-themes.v1")
    );
    assert.strictEqual(storedPlayerThemes.length, 1,
        "the current parameter composition should be saveable as a user theme");
    playerThemeV2Registry.forEach((item) => {
        assert.notStrictEqual(valueAtPath(storedPlayerThemes[0], item.themePath), undefined,
            `${item.id} should be present in every V2 named-theme snapshot`);
    });
    const firstUserThemeId = storedPlayerThemes[0].id;
    assert.strictEqual(storedPlayerThemes[0].revision, 0,
        "a failed POST must keep a local theme unconfirmed instead of inventing a remote revision");
    let offlineThemeOperations = JSON.parse(
        storedValues.get("emby-lyric-enhance.theme-v2.offline-queue") || "[]"
    );
    assert(offlineThemeOperations.some((operation) => operation.kind === "theme-create"
        && operation.themeId === firstUserThemeId && operation.method === "POST"),
    "a failed create should retain one identifiable POST for later synchronization");
    assert(themeApiRequests.some((request) => request.type === "POST"
        && request.url === "/emby/EmbyLyricEnhance/Themes"
        && request.contentType === "application/json"),
    "theme writes should use Emby's authenticated ajax transport before relying on window.fetch");
    assert(renderer.__elyricPlayerThemeLibraryStatus.textContent.includes("无法连接服务器主题库"),
        "theme save failures should distinguish a network/API failure from a revision conflict");
    assert.strictEqual(themeLibrarySelect.value, `user:${firstUserThemeId}`);
    assert.strictEqual(document.body.getAttribute("data-elyric-player-layout"), "custom");
    themeLibrarySelect.value = `user:${firstUserThemeId}`;
    themeLibrarySelect.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-theme-v2"), "true",
        "selecting a user theme should apply its V2 layer layout");
    assert.strictEqual(renderer.__elyricPlayerArtworkStage.style.getPropertyValue("position"), "fixed");
    renderer.__elyricThemeV2.typography.primary.fontAssetId = "font-old";
    renderer.__elyricThemeV2TypographyInputs.primary.fontUrl.value = "https://cdn.example.test/new-font.woff2";
    renderer.__elyricThemeV2TypographyInputs.primary.fontUrl.dispatchEvent({
        type: "change", stopPropagation() {}
    });
    assert.strictEqual(renderer.__elyricThemeV2.typography.primary.fontAssetId, "",
        "choosing a remote font should stop the old uploaded asset from taking precedence");
    assert(renderer.__elyricThemeV2FontStyle.textContent.includes("https://cdn.example.test/new-font.woff2"),
        "changing a remote font URL should rebuild the active font-face rule");
    renderer.__elyricPlayerEmbyArtworkUrl = "/emby/Items/current/Images/Primary";
    renderer.__elyricThemeV2ArtworkUrl.value = "https://cdn.example.test/custom-cover.webp";
    renderer.__elyricThemeV2ArtworkUrl.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricPlayerArtwork.src, "https://cdn.example.test/custom-cover.webp");
    renderer.__elyricThemeV2ArtworkSource.value = "emby";
    renderer.__elyricThemeV2ArtworkSource.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricPlayerArtwork.src, renderer.__elyricPlayerEmbyArtworkUrl,
        "switching the cover source back to Emby should immediately restore the current item artwork");
    themeLibrarySelect.value = "builtin:stack";
    themeLibrarySelect.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-theme-v2"), null,
        "switching from a user theme to a built-in theme should clear V2 mode hooks");
    assert.strictEqual(renderer.__elyricPlayerArtworkStage.style.getPropertyValue("position"), "",
        "built-in themes should not inherit fixed positioning from the previous user canvas");
    themeLibrarySelect.value = `user:${firstUserThemeId}`;
    themeLibrarySelect.dispatchEvent({ type: "change", stopPropagation() {} });
    renderer.__elyricPlayerThemeChoiceButtons.mediaSurface
        .find((button) => button.getAttribute("data-elyric-choice") === "floating").click();
    renderer.__elyricMediaFieldButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "image").click();
    renderer.__elyricUserPlayerThemes[0].revision = 3;
    renderer.__elyricPlayerThemeSaveButton.click();
    storedPlayerThemes = JSON.parse(storedValues.get("emby-lyric-enhance.player-themes.v1"));
    assert.strictEqual(storedPlayerThemes[0].revision, 3,
        "saving a named theme should retain its server revision for optimistic concurrency");
    assert.strictEqual(storedPlayerThemes[0].choices.mediaSurface, "floating",
        "the information card background style should be part of a saved theme");
    assert.strictEqual(storedPlayerThemes[0].mediaFields.image, true,
        "the information range should be part of a saved theme");
    themeNameInput.value = "大屏锚定主题";
    renderer.__elyricPlayerThemeRenameButton.click();
    assert.strictEqual(JSON.parse(storedValues.get("emby-lyric-enhance.player-themes.v1"))[0].name,
        "大屏锚定主题");
    themeApiMode = "not-found";
    settingsPanel.querySelector(".elyric-theme-duplicate").click();
    await flushPromises();
    assert(renderer.__elyricPlayerThemeLibraryStatus.textContent.includes("服务器未加载主题同步接口（HTTP 404）"),
        "a missing plugin route should be reported distinctly from offline and revision-conflict states");
    themeApiMode = "offline";
    storedPlayerThemes = JSON.parse(storedValues.get("emby-lyric-enhance.player-themes.v1"));
    assert.strictEqual(storedPlayerThemes.length, 2, "user themes should be duplicable");
    assert.strictEqual(storedPlayerThemes[1].name, "大屏锚定主题 副本",
        "a duplicated theme should be distinguishable in the theme library");
    const duplicateUserThemeId = storedPlayerThemes[1].id;
    assert.strictEqual(themeLibrarySelect.value, `user:${duplicateUserThemeId}`);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const syncedThemeLibrary = JSON.parse(
        lastDisplayPreferences["emby-lyric-enhance.player-preferences.v2"]
    );
    assert.deepStrictEqual(syncedThemeLibrary.playerThemes, [],
        "named themes should stay out of legacy Emby display preferences once the V2 server library is active");
    assert.strictEqual(syncedThemeLibrary.activePlayerThemeId, duplicateUserThemeId,
        "the active user theme should sync with its library");
    renderer.__elyricPlayerThemeDeleteButton.click();
    await flushPromises();
    offlineThemeOperations = JSON.parse(
        storedValues.get("emby-lyric-enhance.theme-v2.offline-queue") || "[]"
    );
    assert(!offlineThemeOperations.some((operation) => operation.themeId === duplicateUserThemeId),
        "deleting an unconfirmed local theme should cancel its pending create instead of queuing revision 0 DELETE");
    assert(renderer.__elyricPlayerThemeLibraryStatus.textContent.includes("不会再上传服务器"),
        "deleting an offline-only theme should clearly confirm that the pending upload was cancelled");
    themeLibrarySelect.value = `user:${firstUserThemeId}`;
    themeLibrarySelect.dispatchEvent({ type: "change", stopPropagation() {} });
    renderer.__elyricPlayerThemeDeleteButton.click();
    await flushPromises();
    offlineThemeOperations = JSON.parse(
        storedValues.get("emby-lyric-enhance.theme-v2.offline-queue") || "[]"
    );
    assert(offlineThemeOperations.some((operation) => operation.kind === "theme-delete"
        && operation.themeId === firstUserThemeId),
    "deleting a server-confirmed theme while offline should retain one revisioned DELETE operation");
    assert.deepStrictEqual(JSON.parse(storedValues.get("emby-lyric-enhance.player-themes.v1")), [],
        "deleted user themes should be removed from persistent storage");
    assert.strictEqual(themeNameInput.value, "",
        "switching back to an immutable built-in theme should clear a stale user-theme name");

    themeApiMode = "healthy";
    themeNameInput.value = "服务器往返主题";
    settingsPanel.querySelector(".elyric-theme-new").click();
    await flushPromises();
    storedPlayerThemes = JSON.parse(storedValues.get("emby-lyric-enhance.player-themes.v1"));
    assert.strictEqual(storedPlayerThemes.length, 1);
    assert.strictEqual(storedPlayerThemes[0].revision, 1,
        "a successful authenticated POST should replace the local revision 0 record with the server revision");
    assert(renderer.__elyricPlayerThemeLibraryStatus.textContent.includes("已同步到服务器（revision 1）"),
        "a successful save should visibly confirm the server revision");
    renderer.__elyricPlayerThemeDeleteButton.click();
    await flushPromises();
    assert.deepStrictEqual(JSON.parse(storedValues.get("emby-lyric-enhance.player-themes.v1")), [],
        "a server-confirmed theme should complete its authenticated DELETE round trip");
    themeApiMode = "offline";
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "custom").click();
    await new Promise((resolve) => setTimeout(resolve, 650));

    const hiddenRenderer = new LyricsRenderer();
    hiddenRenderer.itemsContainer = new FakeNode("div");
    hiddenRenderer.sourceEvents = renderer.sourceEvents;
    await hiddenRenderer.getItemsInternal();
    hiddenRenderer.onTimeUpdate(0, 20000000);
    assert(!hiddenRenderer.__elyricThemeControl,
        "a detached renderer must not create or take over the global visual overlay");
    assert.strictEqual(document.body.querySelector(".elyric-theme-choice"), themeButtons[0],
        "an invisible old renderer must not replace the active picker");
    hiddenRenderer.destroy();

    renderer.currentItem = {
        Id: "metadata-test",
        Name: "测试歌曲",
        Artists: ["歌手甲", "歌手乙"],
        Album: "测试专辑",
        ImageTags: { Primary: "primary-tag" }
    };
    renderer.onTimeUpdate(0, 20000000);
    let words = renderer.itemsContainer.querySelectorAll("[data-elyric-start][data-elyric-end]");
    assert(words[0].classList.contains("elyric-word-active"));
    assert(words[1].classList.contains("elyric-word-pending"));
    assert(visible.body.textContent.includes("<img src=x onerror=bad>translation"));
    assert.strictEqual(createdTags.filter((tag) => tag === "img").length, 7,
        "only dedicated artwork, background and coverflow elements may be images; lyric HTML must remain text");
    assert.strictEqual(renderer.__elyricPlayerTitle.textContent, "测试歌曲");
    assert.strictEqual(renderer.__elyricPlayerArtist.textContent, "歌手甲 · 歌手乙");
    assert.strictEqual(renderer.__elyricPlayerAlbum.textContent, "测试专辑");
    assert.strictEqual(
        renderer.__elyricPlayerArtwork.getAttribute("src"),
        "/emby/Items/metadata-test/Images/Primary",
        "artwork should use the authenticated Emby API URL without parsing lyric HTML"
    );
    assert.strictEqual(renderer.__elyricPlayerBackground.getAttribute("src"),
        "/emby/Items/metadata-test/Images/Primary");
    assert(renderer.__elyricCoverflowArtworks.every((image) =>
        image.getAttribute("src") === "/emby/Items/metadata-test/Images/Primary"),
    "all spatial coverflow cards should stay synchronized with authenticated Emby artwork");
    const mediaPanel = renderer.__elyricMediaPanel;
    assert.strictEqual(mediaPanel.parentNode, document.body,
        "media details should use a dedicated body-level drawer");
    assert.strictEqual(mediaPanel.getAttribute("aria-modal"), "true",
        "media details should expose modal semantics to assistive technology");
    assert.strictEqual(mediaPanel.getAttribute("hidden"), "hidden");
    renderer.__elyricMediaButton.boundingRect = {
        left: 1180, right: 1224, top: 790, bottom: 834, width: 44, height: 44
    };
    mediaPanel.boundingRect = {
        left: 0, right: 490, top: 0, bottom: 520, width: 490, height: 520
    };
    mediaPanel.scrollHeight = 520;
    renderer.__elyricMediaButton.click();
    assert.strictEqual(document.activeElement, mediaPanel.querySelector(".elyric-player-settings-close"),
        "opening media details should move keyboard focus into the dialog");
    await flushPromises();
    assert.strictEqual(mediaItemRequests, 1,
        "opening media details should request the full authenticated Emby item exactly once");
    assert.strictEqual(mediaPanel.getAttribute("hidden"), null);
    assert.strictEqual(mediaPanel.getAttribute("data-elyric-anchor-mode"), "button",
        "desktop media details must be positioned from the launcher button");
    assert.strictEqual(mediaPanel.getAttribute("data-elyric-anchor-placement"), "above");
    assert.strictEqual(mediaPanel.style.getPropertyValue("left"), "934px");
    assert.strictEqual(mediaPanel.style.getPropertyValue("top"), "258px");
    assert.strictEqual(mediaPanel.style.getPropertyValue("max-height"), "762px");
    assert.strictEqual(mediaPanel.style.getPropertyValue("--elyric-media-anchor-tip-x"), "268px");
    [
        "/music/测试歌曲.wav", "WAV", "139.6 MB", "PCM_S16LE 6 ch", "PCM_S16LE",
        "6 ch", "4.23 Mbps", "44,100 Hz", "16 bit"
    ].forEach((value) => assert(mediaPanel.textContent.includes(value), `media drawer should include ${value}`));
    ["MJPEG", "600×654", "(TEXT)", "Lyrics"].forEach((value) => {
        assert(!mediaPanel.textContent.includes(value), `${value} should respect the default information range`);
    });
    ["image", "lyrics"].forEach((fieldId) => renderer.__elyricMediaFieldButtons
        .find((button) => button.getAttribute("data-elyric-choice") === fieldId).click());
    ["MJPEG", "600×654", "90,000", "yuvj444p", "(TEXT)", "Lyrics", "TEXT"]
        .forEach((value) => assert(mediaPanel.textContent.includes(value),
            `${value} should appear when its information group is enabled`));
    renderer.__elyricMediaFieldButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "file").click();
    assert(!mediaPanel.textContent.includes("/music/测试歌曲.wav"),
        "each media information group should be independently hideable");
    let escapeDefaultPrevented = false;
    let escapePropagationStopped = false;
    document.dispatchEvent({
        type: "keydown",
        key: "Escape",
        preventDefault() { escapeDefaultPrevented = true; },
        stopPropagation() { escapePropagationStopped = true; }
    });
    assert.strictEqual(mediaPanel.getAttribute("hidden"), "hidden",
        "Escape should close the active media dialog");
    assert.strictEqual(document.activeElement, renderer.__elyricMediaButton,
        "Escape should restore focus to the media launcher");
    assert(escapeDefaultPrevented && escapePropagationStopped,
        "closing an overlay with Escape must not also trigger Emby's page-level shortcut");
    window.innerWidth = 390;
    window.innerHeight = 844;
    renderer.__elyricMediaButton.click();
    assert.strictEqual(mediaPanel.getAttribute("data-elyric-anchor-mode"), "drawer",
        "portrait phones should use the safe bottom drawer instead of a desktop fixed position");
    ["left", "top", "right", "bottom", "max-height", "--elyric-media-anchor-tip-x"]
        .forEach((propertyName) => assert.strictEqual(
            mediaPanel.style.getPropertyValue(propertyName), "",
            `${propertyName} should be cleared when the information card becomes a phone drawer`
        ));
    renderer.__elyricMediaButton.click();
    window.innerWidth = 1440;
    window.innerHeight = 900;
    assert.strictEqual(renderer.__elyricPlayerFormat.textContent,
        "WAV · PCM_S16LE · 44.1 kHz · 16 bit · 6 ch");
    assert.strictEqual(createdTags.filter((tag) => tag === "canvas").length, 1,
        "the visualizer should use one isolated canvas");
    assert(!createdTags.includes("audio"));
    renderer.__elyricPlayerButtons.next.click();
    renderer.__elyricPlayerButtons.playPause.dispatchEvent({ type: "pointerdown", stopPropagation() {} });
    renderer.__elyricPlayerButtons.playPause.click();
    renderer.__elyricPlayerButtons.stop.click();
    renderer.__elyricPlayerButtons.mute.click();
    assert.strictEqual(nativeVolume.value, "0");
    assert.strictEqual(renderer.__elyricVolumeSlider.style.getPropertyValue("--elyric-player-volume"), "0%");
    assert.strictEqual(renderer.__elyricVolumeValue.textContent, "0%");
    assert.strictEqual(renderer.__elyricPlayerButtons.mute.getAttribute("data-elyric-icon"), "volumeMute");
    assert.strictEqual(renderer.__elyricPlayerButtons.mute.getAttribute("aria-pressed"), "true");
    renderer.__elyricPlayerButtons.mute.click();
    assert.strictEqual(nativeVolume.value, "65");
    assert.strictEqual(renderer.__elyricVolumeValue.textContent, "65%");
    renderer.__elyricPlayerButtons.back.click();
    renderer.__elyricPlayerButtons.cast.click();
    renderer.__elyricSettingsButton.click();
    renderer.__elyricPlayerButtons.queue.click();
    renderer.itemsContainer.classList.add("hide");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(nativeClicks.next, 1, "custom next should delegate to Emby's native transport");
    assert.strictEqual(nativeClicks.playPause, 1, "custom play/pause should delegate to Emby's native transport");
    assert.strictEqual(renderer.__elyricPlayerButtons.playPause.getAttribute("data-elyric-playing"), "true",
        "pointer-down playback should update the custom control optimistically");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-playback-active"), "true",
        "playback state should drive both artwork and visualizer animation");
    assert.strictEqual(renderer.__elyricPlayerButtons.playPause.getAttribute("data-elyric-icon"), "pause");
    assert.strictEqual(nativeClicks.stop, 1);
    assert.strictEqual(nativeClicks.mute, 0,
        "custom mute should operate the current player volume slider without double-toggling Emby's mute button");
    assert.strictEqual(nativeClicks.back, 1);
    assert.strictEqual(nativeClicks.cast, 1);
    assert.strictEqual(nativeClicks.queue, 1, "custom queue should delegate to Emby's native queue view");
    assert.strictEqual(hiddenNativeQueueClicks, 0,
        "native control delegation should skip a zero-sized duplicate when a rendered control exists");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), null,
        "hiding the lyric section for the queue must keep the page-level player shell visible");
    assert(document.body.classList.contains("elyric-player-active-page"));
    assert.strictEqual(settingsPanel.getAttribute("hidden"), "hidden",
        "opening queue should close the settings drawer without leaving the enhanced player");
    assert.strictEqual(mediaPanel.getAttribute("hidden"), "hidden",
        "opening queue should also close media details");
    const nativeQueuePanel = new FakeNode("div");
    nativeQueuePanel.classList.add("osdPlayQueue");
    nativeQueuePanel.setAttribute("data-contentsection", "playqueue");
    const nativeQueueItem = new FakeNode("div");
    nativeQueueItem.classList.add("listItem");
    const nativeQueueArtwork = new FakeNode("img");
    nativeQueueArtwork.setAttribute("src", "/emby/Items/queue-next/Images/Primary");
    const nativeQueueTitle = new FakeNode("div");
    nativeQueueTitle.classList.add("listItemBodyText");
    nativeQueueTitle.appendChild(new FakeNode(null, "Queue next"));
    nativeQueueItem.appendChild(nativeQueueArtwork);
    nativeQueueItem.appendChild(nativeQueueTitle);
    nativeQueuePanel.appendChild(nativeQueueItem);
    playbackPage.appendChild(nativeQueuePanel);
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "coverflow").click();
    renderer.__elyricCoverflowPreviewAt = 0;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(
        renderer.__elyricCoverflowArtworks[0].getAttribute("src"),
        "/emby/Items/queue-next/Images/Primary",
        "coverflow side cards should bind to native Emby queue artwork when it is available"
    );
    assert.strictEqual(renderer.__elyricCoverflowCaptions[0].textContent, "Queue next");
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "stack").click();
    layoutButtons.find((button) => button.getAttribute("data-elyric-choice") === "custom").click();
    document.dispatchEvent({ type: "pointerdown", target: nativeQueueItem });
    assert.strictEqual(renderer.__elyricPlayerButtons.queue.getAttribute("aria-pressed"), "true",
        "interacting with queue contents must keep the drawer open");
    document.dispatchEvent({ type: "pointerdown", target: playbackPage });
    assert.strictEqual(renderer.__elyricPlayerButtons.queue.getAttribute("aria-pressed"), "false",
        "clicking anywhere outside the queue should dismiss it");
    renderer.__elyricPlayerButtons.queue.click();
    assert.strictEqual(nativeClicks.queue, 2,
        "the dismissed queue should reopen through Emby's native queue data source");
    renderer.__elyricPlayerButtons.queue.click();
    renderer.itemsContainer.classList.remove("hide");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(nativeClicks.lyrics, 2,
        "closing V3 queue by outside click or its button should restore Emby's lyric data source");
    assert.strictEqual(renderer.__elyricPlayerButtons.queue.getAttribute("aria-pressed"), "false");
    assert.strictEqual(document.body.getAttribute("data-elyric-queue-open"), "false",
        "clicking the queue button again should hide the queue while always-on lyrics remain visible");
    nativeControls.lyrics.classList.remove("toggleButton-active");
    nativeControls.queue.classList.add("toggleButton-active");
    renderer.__elyricNativeLyricsPendingUntil = 0;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(nativeClicks.lyrics, 3,
        "a stale native queue state after refresh should be repaired so the lyric renderer receives items");
    assert(nativeControls.lyrics.classList.contains("toggleButton-active"));
    nativeControls.playPause.setAttribute("aria-label", "播放");
    renderer.__elyricOptimisticPlayingUntil = 0;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-playback-active"), "false",
        "a confirmed pause should stop artwork rotation and the playback visualizer");
    renderer.__elyricProgressSlider.value = "500";
    renderer.__elyricProgressSlider.dispatchEvent({ type: "input", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricPlayerPosition.textContent, "0:01");
    renderer.__elyricProgressSlider.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(nativeSeek.value, "50");
    assert.strictEqual(nativeSeekInputs, 1);
    assert.strictEqual(nativeSeekChanges, 1);
    assert.strictEqual(renderer.__elyricVolumeSlider.value, "65");
    renderer.__elyricVolumeSlider.value = "33";
    renderer.__elyricVolumeSlider.dispatchEvent({ type: "input", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricVolumeSlider.style.getPropertyValue("--elyric-player-volume"), "33%",
        "dragging volume should repaint the filled track immediately while scrubbing");
    assert.strictEqual(renderer.__elyricVolumeValue.textContent, "33%");
    renderer.__elyricVolumeSlider.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(nativeVolume.value, "33");
    assert.strictEqual(nativeVolumeInputs, 3);
    assert.strictEqual(nativeVolumeChanges, 3);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), "false");
    renderer.__elyricSecondLineButton.click();
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), "true",
        "the player shell should expose a session-level annotation toggle");
    const playerPageClassWrites = document.body.classList.syncCount;
    renderer.onTimeUpdate(0, 20000000);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(document.body.classList.syncCount, playerPageClassWrites,
        "full-page synchronization must not rewrite body.class and retrigger its MutationObserver");
    assert.strictEqual(frames.size, 0, "one native sample must not start interpolation");
    assert(visible.item.classList.contains("elyric-line-current"));
    const followedScrollCount = visible.item.scrollIntoViewCalls.length;
    renderer.itemsContainer.dispatchEvent({ type: "wheel" });
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-manual-scroll"), "true",
        "manual lyric scrolling should suspend automatic following");
    assert.strictEqual(renderer.__elyricLyricFollowButton.getAttribute("hidden"), null,
        "manual lyric scrolling should expose an immediate return-to-current-line button");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(visible.item.scrollIntoViewCalls.length, followedScrollCount,
        "the player should not fight the user while the manual-scroll idle window is active");
    renderer.__elyricManualScrollUntil = Date.now() - 1;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("data-elyric-manual-scroll"), "false");
    assert.strictEqual(renderer.__elyricLyricFollowButton.getAttribute("hidden"), "hidden");
    assert(visible.item.scrollIntoViewCalls.length > followedScrollCount,
        "expired manual scrolling should smoothly return to the current lyric line");
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 1, "time updates must not duplicate the picker");

    const coveringPage = new FakeNode("div");
    renderer.__elyricSettingsButton.click();
    assert.strictEqual(settingsPanel.getAttribute("hidden"), null);
    const castDialog = new FakeNode("div");
    castDialog.classList.add("dialogContainer");
    const castDialogContent = new FakeNode("div");
    castDialog.appendChild(castDialogContent);
    document.body.appendChild(castDialog);
    document.frontElement = castDialogContent;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), null,
        "an Emby cast dialog may cover playback without restoring the native player interface");
    assert(document.body.classList.contains("elyric-player-active-page"));
    document.frontElement = null;
    document.body.removeChild(castDialog);
    document.body.appendChild(coveringPage);
    document.frontElement = coveringPage;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), "hidden",
        "a different page covering playback must hide the picker");
    assert.strictEqual(settingsPanel.getAttribute("hidden"), "hidden",
        "a temporarily covered playback page must also hide its settings drawer");
    assert.strictEqual(renderer.__elyricSettingsButton.getAttribute("aria-expanded"), "true",
        "transient visibility sampling must not convert a hidden drawer into a user close action");
    assert(!document.body.classList.contains("elyric-player-active-page"));
    document.frontElement = null;
    document.body.removeChild(coveringPage);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), null,
        "the picker should return when playback is topmost again");
    assert.strictEqual(settingsPanel.getAttribute("hidden"), null,
        "an open settings drawer should return with the same playback renderer");
    assert(document.body.classList.contains("elyric-player-active-page"));

    document.body.removeChild(playbackPage);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), "hidden",
        "a detached playback page must hide its body-mounted picker");
    const reopenedPlaybackPage = new FakeNode("div");
    document.body.appendChild(reopenedPlaybackPage);
    const staleControl = new FakeNode("div");
    staleControl.classList.add("elyric-theme-picker");
    reopenedPlaybackPage.appendChild(staleControl);
    const staleSettingsPanel = new FakeNode("div");
    staleSettingsPanel.classList.add("elyric-player-settings-panel");
    reopenedPlaybackPage.appendChild(staleSettingsPanel);
    const staleMediaPanel = new FakeNode("div");
    staleMediaPanel.classList.add("elyric-player-media-panel");
    reopenedPlaybackPage.appendChild(staleMediaPanel);
    reopenedPlaybackPage.appendChild(renderer.itemsContainer);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.parentNode, document.body,
        "reopening playback should keep the visual overlay outside clipping hosts");
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 1,
        "reopening playback must restore exactly one picker");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), null,
        "the picker should become visible again on the active playback page");
    assert.strictEqual(staleControl.parentNode, null, "reopening playback should remove stale duplicate controls");
    assert.strictEqual(staleSettingsPanel.parentNode, null, "reopening playback should remove stale settings drawers");
    assert.strictEqual(staleMediaPanel.parentNode, null, "reopening playback should remove stale media drawers");
    assert.strictEqual(document.body.querySelectorAll(".elyric-player-settings-panel").length, 1);
    assert.strictEqual(document.body.querySelectorAll(".elyric-player-media-panel").length, 1);

    clockNow = 400;
    renderer.onTimeUpdate(4000000, 20000000);
    assert.strictEqual(frames.size, 1, "forward native samples should start interpolation");
    runFrame(150);
    words = renderer.itemsContainer.querySelectorAll("[data-elyric-start][data-elyric-end]");
    assert(words[0].classList.contains("elyric-word-played"));
    assert(words[1].classList.contains("elyric-word-active"), "animation frame should cross the 500ms boundary");
    const classicRule = adapterCss.match(
        /\[data-elyric-theme="classic"\] \.elyric-word-active,\s*\[data-elyric-theme="classic"\] \.elyric-word-played\s*\{([^}]*)\}/s
    );
    assert(classicRule && /color:/.test(classicRule[1]) && /opacity:\s*1/.test(classicRule[1]) && /text-shadow:/.test(classicRule[1]),
        "classic played and active words should share cumulative highlighting");
    ["classic", "focus", "gradient", "apple", "minimal"].forEach((themeId) => {
        assert(adapterCss.includes(`[data-elyric-theme="${themeId}"]`), `${themeId} theme CSS should exist`);
    });
    ["album", "center", "mobile", "mint", "deck", "stack", "coverflow", "lyrics", "rose"].forEach(
        (layoutId) => {
            assert(adapter.includes(`id: "${layoutId}"`), `${layoutId} reference layout should be selectable`);
            assert(adapterCss.includes(`data-elyric-player-layout="${layoutId}"`),
                `${layoutId} reference layout should have dedicated CSS`);
        }
    );
    assert(adapter.includes("PLAYER_LAYOUT_PRESET_DEFAULTS"),
        "reference layouts should carry coordinated background, lyric and visualizer defaults");
    assert(adapterCss.includes(".elyric-player-coverflow-card"),
        "the spatial coverflow reference should use an implemented card family");
    assert(adapterCss.includes(".elyric-player-shell"));
    assert(adapterCss.includes(".elyric-player-active-page"));
    assert(adapterCss.includes("contain: none !important"),
        "the playback page must release Emby's strict paint containment for body-level lyrics");
    assert(adapterCss.includes('.osdContentSection[data-contentsection="playqueue"]'),
        "the native queue should be restyled inside the enhanced player");
    assert(adapterCss.includes(".elyric-player-settings-panel"),
        "the enhanced player should provide a themed settings drawer");
    assert(adapterCss.includes(".elyric-player-media-panel"),
        "the enhanced player should provide a detailed media drawer");
    assert(adapterCss.includes(".elyric-player-segmented"),
        "theme and layout switching should use direct segmented controls");
    assert(adapterCss.includes(".elyric-player-visualizer"),
        "the playback page should provide a lightweight animated rhythm row");
    assert(adapterCss.includes(".elyric-player-visualizer-canvas"),
        "all spectrum shapes should be drawn in one horizontal canvas band");
    assert(adapterCss.includes("--elyric-visualizer-width") && adapterCss.includes("--elyric-visualizer-height"),
        "spectrum width and height must be independently adjustable");
    assert(adapterCss.includes("data-elyric-playback-active=\"true\""),
        "playback animations must only run while Emby reports active playback");
    ["spectrum", "mirror", "waveform", "fall", "curve", "line", "chroma", "balls", "pulse"].forEach((styleId) => {
        assert(adapter.includes(`id: "${styleId}"`), `${styleId} visualizer shape should be available`);
    });
    assert(adapter.includes("captureStream") && adapter.includes("createMediaStreamSource")
        && adapter.includes("getByteFrequencyData") && adapter.includes("getByteTimeDomainData"),
    "the visualizer should analyse the active Emby media stream before using its fallback envelope");
    assert(adapter.includes("bandAverage * .76 + bandPeak * .24")
        && adapter.includes("Math.pow((i + 1) / count, 1.12)"),
    "frequency styles should average perceptual bands instead of repeatedly sampling bass bins");
    assert(adapter.includes("waveformGain")
        && adapter.includes("displayEnergy = Math.pow")
        && adapter.includes("particleSpan = ballEnergy * height * .46")
        && adapter.includes("pulseEnergy = Math.pow"),
    "quiet live audio should remain visibly reactive in waveform, curve, particle and pulse modes");
    assert(adapter.includes("spectralBalance = .58 + Math.pow(normalizedX, .58) * .62"),
        "display weighting should keep naturally loud low bins from dominating the spectrum");
    assert(!adapter.includes("connect(audioContext.destination)"),
        "passive spectrum analysis must not reroute Emby's audio output");
    assert(adapter.includes("var LYRIC_FOLLOW_IDLE_MS = 10000"),
        "automatic lyric following should resume after ten seconds of user inactivity");
    ["--elyric-surface", "--elyric-panel-text", "--elyric-panel-muted", "--elyric-accent"]
        .forEach((token) => assert(adapterCss.includes(token), `${token} semantic color should exist`));
    assert(adapterCss.includes("bottom: max(6.4rem"),
        "the desktop queue should reserve the transport and progress safety zone");
    assert(adapterCss.includes(".elyric-player-icon"),
        "player controls should share one vector icon system");
    ["solid", "dual", "multi", "rainbow"].forEach((modeId) => {
        assert(adapter.includes(`id: "${modeId}"`), `${modeId} visualizer color mode should be available`);
    });
    ["black", "white", "blur"].forEach((backgroundId) => {
        assert(adapterCss.includes(`data-elyric-background-mode="${backgroundId}"`),
            `${backgroundId} background should be independent from layout`);
    });
    assert(adapterCss.includes(
        '.elyric-player-shell.elyric-theme-picker[data-elyric-player-layout][data-elyric-background-mode="white"]'
    ) && adapterCss.includes("--elyric-player-foreground: #111827"),
    "the white background must override the high-specificity dark shell palette");
    assert(adapterCss.includes('.osdContentSection[data-contentsection="lyrics"].hide'),
        "opening Emby's queue must not hide the always-on lyric region");
    assert(adapterCss.includes('data-elyric-queue-open="false"'),
        "the queue button should be able to close its panel without restoring a lyric toggle");
    assert(adapterCss.includes("max-height: calc(100dvh"),
        "the queue drawer must stay within the full-player viewport on long queues and mobile browsers");
    assert(adapterCss.includes("--elyric-custom-artwork-safe-size")
        && adapterCss.includes("--elyric-custom-metadata-safe-width")
        && adapterCss.includes("--elyric-custom-lyrics-safe-width")
        && adapterCss.includes("--elyric-custom-lyrics-safe-top"),
    "custom composition should clamp artwork, metadata and lyrics to viewport safety zones");
    assert(adapterCss.includes("width: min(var(--elyric-visualizer-width, 92vw), calc(100dvw - 1.4rem))"),
        "mobile visualizer width should respect the user's saved width without overflowing the viewport");
    assert(adapterCss.includes("position: sticky") && adapterCss.includes("var(--elyric-surface-solid)"),
        "the native queue should retain a readable sticky heading in every theme");
    assert(adapterCss.includes(".elyric-player-overlay-scrim") && adapterCss.includes("z-index: 1410"),
        "modal surfaces should remain clickable above any oversized lyric composition");
    assert(adapterCss.includes(".elyric-player-settings-panel {\n    background: var(--elyric-surface-solid);")
        && adapterCss.includes(".elyric-player-overlay-scrim {\n    position: fixed;")
        && adapterCss.includes("background: transparent;"),
        "settings should keep the player visible without a full-screen Gaussian blur");
    assert(adapterCss.includes(".elyric-player-settings-panel .elyric-player-settings-header")
        && adapterCss.includes("-webkit-backdrop-filter: none;"),
        "the settings header should not reintroduce blur inside the opaque drawer");
    assert(adapterCss.includes(".elyric-player-settings-panel[data-elyric-background-mode]")
        && adapterCss.includes("--elyric-panel-text: var(--elyric-v2-panel-on, #fff)")
        && adapterCss.includes("background: var(--elyric-v2-panel-bg, #121722) !important")
        && adapterCss.includes(".elyric-player-settings-panel option")
        && adapterCss.includes("color: var(--elyric-v2-panel-on, #fff)"),
    "the theme dropdown and every V2 setting control should share one readable theme-derived palette");
    assert(adapterCss.includes(".elyric-player-media-panel[data-elyric-background-mode]")
        && adapterCss.includes("--elyric-panel-text: var(--elyric-v2-media-on, #fff)")
        && adapterCss.includes(".elyric-player-active-page .osdContentSection[data-contentsection=\"playqueue\"]")
        && adapter.includes("targets.push(document.body)"),
    "media cards and the play queue should receive the same auto-contrasted semantic theme colors");
    assert(adapterCss.includes(".elyric-v2-designer-exit")
        && adapter.includes("完成画布编辑并返回设置"),
    "canvas editing should always provide an obvious mouse and touch exit");
    assert(adapterCss.includes(':not([data-elyric-player-layout="custom"]) .elyric-player-artwork-stage'),
        "saved custom artwork scale must not leak into the supplied layout presets");
    assert(adapterCss.includes('[data-elyric-player-layout="center"] .elyric-player-metadata')
        && adapterCss.includes("transform: none;"),
    "the Spotify poster metadata should not inherit a centering transform into its artwork column");
    assert(adapterCss.includes(".elyric-visualizer-style-segments")
        && adapterCss.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"),
    "all spectrum shape labels should fit in a wrapping desktop grid");
    assert(adapterCss.includes(".elyric-player-progress-slider::-webkit-slider-runnable-track")
        && adapterCss.includes("height: .42rem"),
    "the playback seek rail should expose a thicker rounded drag target");
    assert(adapterCss.includes("@starting-style") && adapterCss.includes("transition-behavior: allow-discrete"),
        "settings and media sheets should enter and leave with a discrete-safe easing transition");
    assert(adapterCss.includes("calc(52vw - 2rem)")
        && adapterCss.includes("bottom: max(8.1rem"),
    "desktop presets and the queue should not push the seek rail off-screen or cover it");
    assert(adapterCss.includes("bottom: max(7.75rem"),
        "mobile lyrics, spectrum and the seek rail should occupy separate vertical safety zones");
    assert(adapterCss.includes(".elyric-line-credit") && adapter.includes("isLyricCreditLine"),
        "embedded title and production credits should not compete with the main song identity");
    assert(adapterCss.includes(".elyric-line-title-credit") && adapter.includes("isLyricTitleCreditLine"),
        "an embedded title credit should not repeat the player identity as an oversized lyric");
    assert(adapterCss.includes('[data-elyric-alignment="right"]'),
        "lyrics should support an explicit right text anchor without moving their container");
    assert(adapterCss.includes("@media (min-width: 761px) and (max-height: 520px)")
        && adapterCss.includes('data-elyric-player-layout="coverflow"] .elyric-player-coverflow')
        && adapterCss.includes('left: 52vw !important;')
        && adapterCss.includes('data-elyric-player-layout="custom"] .elyric-player-identity')
        && adapterCss.includes('bottom: max(10.4rem'),
        "short landscape layouts should keep coverflow and custom compositions in separate safe zones");
    assert(adapterCss.includes('data-elyric-player-layout="album"] .elyric-player-title')
        && adapterCss.includes("font-size: clamp(3.25rem, 5vw, 6.5rem)")
        && adapterCss.includes("-webkit-line-clamp: 2"),
        "editorial preset titles should remain readable for long CJK names");
    assert(adapterCss.includes('data-elyric-player-layout="album"] .elyric-player-identity')
        && adapterCss.includes("width: min(74vw, 18rem)")
        && adapterCss.includes("top: 55vh !important"),
        "mobile editorial vinyl should keep its label and lyrics inside the viewport");
    assert(adapterCss.includes('data-elyric-player-layout="lyrics"] .elyric-player-artwork')
        && adapterCss.includes("min-width: 56%")
        && adapterCss.includes("height: 56% !important"),
        "mobile vinyl artwork should remain a square center label instead of collapsing into a pill");
    assert(adapterCss.includes('data-elyric-player-layout="mint"] .osdContentSection[data-contentsection="lyrics"]')
        && adapterCss.includes("height: clamp(4.5rem, 14vh, 8rem)"),
        "the mint preset should reserve a readable lyric strip above the visualizer");
    assert(adapterCss.includes("height: 44px")
        && adapterCss.includes("flex: 0 0 44px")
        && adapterCss.includes("width: auto !important")
        && adapterCss.includes("bottom: max(5.1rem")
        && adapterCss.includes("height: 7.85rem")
        && adapterCss.includes("bottom: max(8.25rem")
        && adapterCss.includes("bottom: max(10.45rem"),
        "mobile controls should provide explicit 44px targets across a full-width, non-overlapping tool row");
    assert(adapterCss.includes("/* V3.10: preserve each preset's artwork ratio on phones and tall narrow windows. */")
        && adapterCss.includes("width: min(68vw, 28rem) !important")
        && adapterCss.includes("width: 72% !important")
        && adapterCss.includes("width: 88% !important")
        && adapterCss.includes("width: 42% !important")
        && adapterCss.includes("width: 56% !important")
        && adapterCss.includes("width: min(86vw, 34rem) !important")
        && adapterCss.includes("@media (min-width: 521px) and (max-width: 760px)"),
        "mobile presets should keep distinct artwork proportions and use the available seek width");
    assert(adapterCss.includes("/* V3.11: give the rose preset a balanced two-column desktop composition. */")
        && adapterCss.includes("--elyric-rose-artwork-size: clamp(18rem, min(26vw, 38vh), 54rem)")
        && adapterCss.includes("--elyric-rose-left-center: 24.5vw")
        && adapterCss.includes("top: calc(43% + var(--elyric-rose-artwork-half)")
        && adapterCss.includes("width: min(47vw, 112rem) !important")
        && adapterCss.includes("top: calc(38% + var(--elyric-rose-artwork-half)")
        && adapterCss.includes("height: min(62vh, 84rem) !important"),
        "rose desktop should center a larger artwork and metadata group opposite a balanced lyric sheet");
    assert(adapterCss.includes("/* V3.9: balanced desktop canvases and scalable 2K/4K compositions. */")
        && adapterCss.includes("@media (min-width: 1920px) and (min-height: 1000px)")
        && adapterCss.includes("width: min(82vw, 180rem)")
        && adapterCss.includes("font-size: clamp(1.5rem, 1.25vw, 2.5rem)"),
        "2K and 4K playback canvases should scale controls, progress and lyric typography together");
    assert(adapterCss.includes('data-elyric-player-layout="center"] .elyric-player-identity')
        && adapterCss.includes("width: min(29vw, 56vh, 72rem)")
        && adapterCss.includes("top: 40vh")
        && adapterCss.includes("height: min(58vh, 68rem)"),
        "the desktop poster preset should distribute artwork, metadata and lyrics through the usable height");
    [
        "width: min(56vw, 92vh)",
        "width: min(42vw, 66vh)",
        "width: clamp(24rem, 30vh, 48rem)",
        "width: min(44vw, 58vh, 78rem)",
        "width: min(40vw, 60vh, 76rem)",
        "width: min(82vw, 150rem)",
        "width: min(43vw, 64vh, 82rem)",
        "width: clamp(28rem, 24vw, 64rem)"
    ].forEach((sizeRule) => assert(adapterCss.includes(sizeRule),
        `${sizeRule} should keep every supplied composition proportional on a large desktop`));
    assert(adapterCss.includes('data-elyric-player-layout="center"] .elyric-player-metadata')
        && adapterCss.includes("border-left: .22rem solid #1ed760")
        && adapterCss.includes('data-elyric-player-layout="stack"] .elyric-player-artwork-stage')
        && adapterCss.includes("transform: rotate(-2deg)"),
        "Spotify poster and album-list presets should retain distinct mobile compositions");
    assert(adapterCss.includes('data-elyric-coverflow-index="2"] .elyric-player-coverflow-caption')
        && adapterCss.includes('data-elyric-player-layout="rose"][data-elyric-has-lyrics="false"]')
        && adapter.includes("syncLyricAvailability"),
        "coverflow metadata and the rose no-lyrics state should avoid redundant empty cards");
    assert(adapterCss.includes(".videoOsdBottom-maincontrols"),
        "the native OSD control layer should be visually suppressed behind custom controls");
    assert(adapterCss.includes(".videoOsdHeader"),
        "the native header should be visually replaced after back and cast actions are proxied");
    ["album", "center", "lyrics", "stack"].forEach((layoutId) => {
        assert(adapterCss.includes(`data-elyric-player-layout="${layoutId}"`), `${layoutId} layout CSS should exist`);
    });
    assert(adapterCss.includes('[data-elyric-player-layout][data-elyric-artwork-rotate="true"] .elyric-player-artwork'),
        "every record-based layout should support opt-in artwork rotation");

    clockNow = 800;
    renderer.onTimeUpdate(4000000, 20000000);
    assert.strictEqual(frames.size, 0, "a stationary native position should stop interpolation");
    assert(words[0].classList.contains("elyric-word-active"), "pause calibration should restore the absolute state");
    assert(words[1].classList.contains("elyric-word-pending"));

    clockNow = 1200;
    renderer.onTimeUpdate(18000000, 20000000);
    assert.strictEqual(frames.size, 0, "a large seek should not be extrapolated");

    clockNow = 1600;
    renderer.onTimeUpdate(19000000, 20000000);
    assert.strictEqual(frames.size, 1, "normal playback after seeking should resume interpolation");
    runFrame(801);
    assert.strictEqual(frames.size, 0, "one native sample must not be extrapolated beyond 800ms");

    clockNow = 2600;
    renderer.onTimeUpdate(19500000, 20000000);
    renderer.onTimeUpdate(20000000, 20000000);
    assert(visible.item.classList.contains("elyric-line-past"));
    renderer.__elyricThemeV2ProfileSelect.value = "phonePortrait";
    renderer.__elyricThemeV2ProfileSelect.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricThemeV2Profile, "phonePortrait",
        "the editor should allow configuring a non-current responsive profile from desktop");
    renderer.__elyricThemeV2.layoutOverrides.desktop = true;
    renderer.__elyricThemeV2.layoutOverrides.tablet = false;
    renderer.__elyricThemeV2.layouts.desktop.lyrics.x = 17;
    renderer.__elyricThemeV2SelectedLayer = "lyrics";
    renderer.__elyricThemeV2ProfileSelect.value = "tablet";
    renderer.__elyricThemeV2ProfileSelect.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(Number(renderer.__elyricThemeV2GeometryInputs.x.value), 17,
        "an unedited responsive profile should inherit the nearest edited layout");
    renderer.__elyricThemeV2GeometryInputs.x.value = "23";
    renderer.__elyricThemeV2GeometryInputs.x.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricThemeV2.layoutOverrides.tablet, true,
        "editing inherited geometry should detach that responsive profile");
    assert.strictEqual(renderer.__elyricThemeV2.layouts.tablet.lyrics.x, 23);
    renderer.__elyricThemeV2InheritanceReset.click();
    assert.strictEqual(renderer.__elyricThemeV2.layoutOverrides.tablet, false,
        "the editor should allow returning a profile to nearest-layout inheritance");
    assert.strictEqual(Number(renderer.__elyricThemeV2GeometryInputs.x.value), 17);
    renderer.__elyricThemeV2ProfileSelect.value = "desktop";
    renderer.__elyricThemeV2ProfileSelect.dispatchEvent({ type: "change", stopPropagation() {} });
    const themeControl = renderer.__elyricThemeControl;
    const queueDismissHandler = renderer.__elyricQueueDismissHandler;
    const lyricFollowHost = renderer.__elyricLyricFollowHost;
    const lyricFollowHandler = renderer.__elyricLyricManualScrollHandler;
    renderer.destroy();
    assert.strictEqual(frames.size, 0, "destroy should cancel any pending animation frame");
    assert.strictEqual(renderer.__elyricClock, null);
    assert.strictEqual(themeControl.parentNode, null, "destroy should remove theme controls");
    assert.strictEqual(settingsPanel.parentNode, null, "destroy should remove the separate settings drawer");
    assert.strictEqual(mediaPanel.parentNode, null, "destroy should remove the separate media drawer");
    assert(!(document.body.listeners.pointerdown || []).includes(queueDismissHandler),
        "destroy should release the global click-outside queue handler");
    assert(!(lyricFollowHost.listeners.wheel || []).includes(lyricFollowHandler),
        "destroy should release manual lyric-follow listeners");
    assert.strictEqual(liveAudioContext.closed, true,
        "destroy should close the passive analyser context during player navigation");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), null);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), null);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-player-layout"), null);
    assert(!document.body.classList.contains("elyric-player-active-page"));
    assert.strictEqual(document.body.getAttribute("data-elyric-player-layout"), null);
    assert.strictEqual(renderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "",
        "destroy should remove server display variables from a reusable container");

    const secondRenderer = new LyricsRenderer();
    const secondPlaybackPage = new FakeNode("div");
    document.body.appendChild(secondPlaybackPage);
    secondRenderer.itemsContainer = new FakeNode("div");
    secondPlaybackPage.appendChild(secondRenderer.itemsContainer);
    secondRenderer.sourceEvents = renderer.sourceEvents;
    await secondRenderer.getItemsInternal();
    await flushPromises();
    assert.strictEqual(serverConfigurationRequests, 2,
        "reopening lyrics should refresh server defaults saved since the previous view");
    assert.strictEqual(secondRenderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "125%",
        "the locally selected lyric size should remain independent from refreshed server defaults");
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-theme"), "focus",
        "the selected theme should be restored from browser storage");
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-player-layout"), "custom",
        "the selected full-player interface should be restored from Emby user preferences");
    assert.strictEqual(secondRenderer.__elyricThemeControl.getAttribute("data-elyric-artwork-rotate"), "false",
        "the artwork rotation choice should be restored from browser storage");
    assert.strictEqual(secondRenderer.__elyricArtworkRotationButton.disabled, false);
    assert.strictEqual(secondRenderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-style"), "line",
        "the last selected reference preset should restore its paired visualizer style");
    assert.strictEqual(secondRenderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-range"), "custom");
    assert.strictEqual(secondRenderer.__elyricVisualizerWidthInput.value, "83");
    assert.strictEqual(secondRenderer.__elyricVisualizerHeightInput.value, "16");
    assert.strictEqual(secondRenderer.__elyricVisualizerAmplitudeInput.value, "130");
    assert.strictEqual(secondRenderer.__elyricVisualizerAnalysisInputs.response.value, "95");
    assert.strictEqual(secondRenderer.__elyricVisualizerAnalysisInputs.smoothing.value, "15");
    assert.strictEqual(secondRenderer.__elyricVisualizerAnalysisInputs.density.value, "80");
    assert.strictEqual(secondRenderer.__elyricThemeControl.getAttribute("data-elyric-visualizer-color-mode"), "dual");
    assert.strictEqual(secondRenderer.__elyricThemeControl.getAttribute("data-elyric-background-mode"), "blur");
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-alignment"), "left");
    assert.strictEqual(secondRenderer.__elyricPlayerTuningInputs.backgroundBlur.value, "44");
    assert.strictEqual(secondRenderer.__elyricPlayerTuningInputs.artworkX.value, "24");
    assert.strictEqual(secondRenderer.__elyricPlayerTuningInputs.lyricsWidth.value, "44");
    secondRenderer.sourceEvents = [];
    const emptyItems = await secondRenderer.getItemsInternal();
    await flushPromises();
    assert.deepStrictEqual(emptyItems, []);
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-has-lyrics"), "false");
    assert.strictEqual(secondRenderer.__elyricThemeControl.getAttribute("data-elyric-has-lyrics"), "false");
    assert.strictEqual(document.body.getAttribute("data-elyric-has-lyrics"), "false");
    assert.strictEqual(secondRenderer.__elyricThemeControl.querySelector(".elyric-player-lyrics-empty")
        .getAttribute("hidden"), null,
        "a track without lyric events should expose an intentional live status instead of an empty card");
    secondRenderer.sourceEvents = [
        { Id: "instrumental-title", Text: "古筝", StartPositionTicks: 0, EndPositionTicks: 10000000 },
        { Id: "instrumental-placeholder", Text: "纯音乐，请欣赏", StartPositionTicks: 10000000, EndPositionTicks: 20000000 }
    ];
    const instrumentalItems = await secondRenderer.getItemsInternal();
    await flushPromises();
    assert.strictEqual(instrumentalItems.length, 2);
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-has-lyrics"), "false",
        "short instrumental placeholder text should use the no-lyrics presentation");
    assert.strictEqual(secondRenderer.__elyricThemeControl.querySelector(".elyric-player-lyrics-empty")
        .getAttribute("hidden"), null,
        "instrumental placeholders should not leave an oversized empty lyric card");
    secondRenderer.sourceEvents = [
        { Id: "short-real-lyric", Text: "纯音乐的世界也有回声", StartPositionTicks: 0, EndPositionTicks: 10000000 }
    ];
    await secondRenderer.getItemsInternal();
    await flushPromises();
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-has-lyrics"), "true",
        "real short lyrics containing the same words should not be mistaken for a placeholder");
    secondRenderer.destroy();
    assert.strictEqual(document.body.getAttribute("data-elyric-has-lyrics"), null,
        "leaving the player should remove the media-specific lyric availability state");

    const openEndedRenderer = new LyricsRenderer();
    const openEndedPlaybackPage = new FakeNode("div");
    document.body.appendChild(openEndedPlaybackPage);
    openEndedRenderer.itemsContainer = new FakeNode("div");
    openEndedPlaybackPage.appendChild(openEndedRenderer.itemsContainer);
    openEndedRenderer.sourceEvents = [
        {
            Id: "last-original",
            Text: "夕阳山外山",
            StartPositionTicks: 2239800000,
            EndPositionTicks: 0
        },
        {
            Id: "last-romanization",
            Text: "<03:43.98>zi <03:45.00>yoeng <03:46.03>san <03:47.31>oi <03:49.40>san",
            StartPositionTicks: 2239800000,
            EndPositionTicks: 0
        }
    ];
    const openEndedItems = await openEndedRenderer.getItemsInternal();
    const openEndedLine = openEndedItems[0].__elyric.sublines[1];
    assert(openEndedLine.words, "the final enhanced line should allow a missing closing timestamp");
    assert.strictEqual(openEndedLine.words.length, 5);
    assert.strictEqual(openEndedLine.text.trim(), "zi yoeng san oi san");
    assert(openEndedLine.words[4].endTicks > openEndedLine.words[4].startTicks,
        "the final open-ended word should receive an inferred end time");
    assert(openEndedItems[0].EndPositionTicks >= openEndedLine.words[4].endTicks,
        "the final lyric item should include the inferred word boundary");
    openEndedRenderer.destroy();

    const boundedRenderer = new LyricsRenderer();
    const boundedPlaybackPage = new FakeNode("div");
    document.body.appendChild(boundedPlaybackPage);
    boundedRenderer.itemsContainer = new FakeNode("div");
    boundedPlaybackPage.appendChild(boundedRenderer.itemsContainer);
    boundedRenderer.sourceEvents = [
        {
            Id: "malformed-middle",
            Text: "<00:00.00>A<00:02.00>B",
            StartPositionTicks: 0,
            EndPositionTicks: 0
        },
        {
            Id: "next-line",
            Text: "next",
            StartPositionTicks: 15000000,
            EndPositionTicks: 25000000
        }
    ];
    const boundedItems = await boundedRenderer.getItemsInternal();
    assert.strictEqual(boundedItems[0].__elyric.sublines[0].words, null,
        "an intermediate open ending must not extend beyond the next lyric line");
    boundedRenderer.destroy();

    function LockedLyricsRenderer() {}
    LockedLyricsRenderer.prototype.getItemsInternal = function () {
        return Promise.resolve(this.sourceEvents);
    };
    LockedLyricsRenderer.prototype.onTimeUpdate = function () {};
    LockedLyricsRenderer.prototype.destroy = function () {};

    let lockedConfigurationRequests = 0;
    const lockedApiClient = {
        getUrl(pathValue) {
            return pathValue;
        },
        getJSON() {
            lockedConfigurationRequests += 1;
            return Promise.resolve({
                DefaultTheme: "minimal",
                AllowUserThemeOverride: false,
                FontSizePercent: 999,
                LineHeight: Number.NaN,
                FontWeight: 999,
                UseThemeColor: false,
                HighlightColor: "url(javascript:bad)",
                PendingOpacity: -1,
                GlowStrength: 3,
                CurrentLineScale: 4,
                OtherLinesOpacity: 0,
                OtherLinesBlurPixels: 99,
                ShowSecondLine: true,
                ShowThirdAndLaterLines: true
            });
        }
    };

    new Function(
        "LyricsRenderer",
        "document",
        "MutationObserver",
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "localStorage",
        "ApiClient",
        adapter
    )(
        LockedLyricsRenderer,
        document,
        MutationObserver,
        performance,
        requestAnimationFrame,
        cancelAnimationFrame,
        localStorage,
        lockedApiClient
    );

    storedValues.delete("emby-lyric-enhance.lyric-scale");
    const lockedRenderer = new LockedLyricsRenderer();
    const lockedPlaybackPage = new FakeNode("div");
    document.body.appendChild(lockedPlaybackPage);
    lockedRenderer.itemsContainer = new FakeNode("div");
    lockedPlaybackPage.appendChild(lockedRenderer.itemsContainer);
    lockedRenderer.sourceEvents = [{
        Id: "locked",
        Text: "locked",
        StartPositionTicks: 0,
        EndPositionTicks: 10000000
    }];
    await lockedRenderer.getItemsInternal();
    await flushPromises();
    assert.strictEqual(lockedConfigurationRequests, 1);
    assert.strictEqual(lockedRenderer.itemsContainer.getAttribute("data-elyric-theme"), "minimal",
        "a locked server default should override the browser's stored theme");
    assert(lockedRenderer.__elyricThemeButtons.every((button) => button.disabled === true),
        "every theme segment should be disabled when user overrides are forbidden");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "170%",
        "the player-level lyric control should cap oversized server values to its safe maximum");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-line-height"), "1.25");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-font-weight"), "900");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-highlight-color"), "#ffffff");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-pending-opacity"), "0.1");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-glow-percent"), "100%");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-current-scale"), "1.25");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-other-lines-opacity"), "0.1");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-other-lines-blur"), "4px");
    lockedRenderer.__elyricThemeButtons
        .find((button) => button.getAttribute("data-elyric-choice") === "gradient")
        .click();
    assert.strictEqual(lockedRenderer.itemsContainer.getAttribute("data-elyric-theme"), "minimal",
        "a disabled picker must not bypass the server lock through a synthetic change");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.theme"), "focus",
        "the server lock should preserve the saved browser choice for possible later use");
    lockedRenderer.destroy();

    function FallbackLyricsRenderer() {}
    FallbackLyricsRenderer.prototype.getItemsInternal = function () {
        return Promise.resolve(this.sourceEvents);
    };
    FallbackLyricsRenderer.prototype.onTimeUpdate = function () {};
    FallbackLyricsRenderer.prototype.destroy = function () {};

    const fallbackValues = new Map();
    const fallbackStorage = {
        getItem(key) {
            return fallbackValues.has(key) ? fallbackValues.get(key) : null;
        },
        setItem(key, value) {
            fallbackValues.set(key, String(value));
        }
    };
    const failingApiClient = {
        getUrl(pathValue) {
            return pathValue;
        },
        getJSON() {
            return Promise.reject(new Error("plugin endpoint unavailable"));
        }
    };

    new Function(
        "LyricsRenderer",
        "document",
        "MutationObserver",
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "localStorage",
        "ApiClient",
        adapter
    )(
        FallbackLyricsRenderer,
        document,
        MutationObserver,
        performance,
        requestAnimationFrame,
        cancelAnimationFrame,
        fallbackStorage,
        failingApiClient
    );

    const fallbackRenderer = new FallbackLyricsRenderer();
    const fallbackPlaybackPage = new FakeNode("div");
    document.body.appendChild(fallbackPlaybackPage);
    fallbackRenderer.itemsContainer = new FakeNode("div");
    fallbackPlaybackPage.appendChild(fallbackRenderer.itemsContainer);
    fallbackRenderer.sourceEvents = [{
        Id: "fallback",
        Text: "fallback",
        StartPositionTicks: 0,
        EndPositionTicks: 10000000
    }];
    const fallbackItems = await fallbackRenderer.getItemsInternal();
    await flushPromises();
    assert.strictEqual(fallbackItems.length, 1, "a missing C# plugin must not block lyric loading");
    assert.strictEqual(fallbackRenderer.itemsContainer.getAttribute("data-elyric-theme"), "classic");
    assert(fallbackRenderer.__elyricThemeButtons.every((button) => button.disabled === false));
    fallbackRenderer.destroy();

    console.log("adapter parsing, plugin defaults, fallback, locks, open endings, safety, themes, navigation and timing: ok");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
