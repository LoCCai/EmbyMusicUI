"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

class FakeClassList {
    constructor(owner) {
        this.owner = owner;
        this.values = [];
    }
    sync() {
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
    dispatchEvent(event) {
        (this.listeners[event.type] || []).forEach((listener) => listener.call(this, event));
        return true;
    }
    click() {
        this.dispatchEvent({ type: "click", target: this, currentTarget: this, stopPropagation() {} });
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
        return this.isConnected
            ? { left: 0, right: 100, top: 0, bottom: 100 }
            : { left: 0, right: 0, top: 0, bottom: 0 };
    }
    contains(node) {
        while (node) {
            if (node === this) return true;
            node = node.parentNode;
        }
        return false;
    }
    get textContent() {
        return this.tagName ? this.children.map((child) => child.textContent).join("") : this.nodeText;
    }
    matches(selector) {
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
    body: new FakeNode("body"),
    frontElement: null,
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
    }
};

let serverConfigurationRequests = 0;
let connectionManagerRequests = 0;
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
const adapter = fs.readFileSync(adapterPath, "utf8");
const adapterCssPath = path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.css");
const adapterCss = fs.readFileSync(adapterCssPath, "utf8");
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
    const nativeClicks = { previous: 0, playPause: 0, next: 0, shuffle: 0, repeat: 0, queue: 0 };
    const nativeDefinitions = [
        ["previous", "btnPreviousTrack"],
        ["playPause", "videoOsd-btnPause"],
        ["next", "btnNextTrack"],
        ["shuffle", "btnOsdShuffle-bottom"],
        ["repeat", "btnOsdRepeatMode-bottom"],
        ["queue", "btnPlayQueue"]
    ];
    nativeDefinitions.forEach(([action, className]) => {
        const button = new FakeNode("button");
        button.classList.add(className);
        if (action === "shuffle") button.classList.add("toggleButton-active");
        button.addEventListener("click", () => { nativeClicks[action] += 1; });
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

    const renderer = new LyricsRenderer();
    const visible = createLyricElement(0);
    const playbackPage = new FakeNode("div");
    document.body.appendChild(playbackPage);
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
    assert.strictEqual(serverConfigurationRequests, 1, "overlapping renderers should share one configuration request");
    assert.strictEqual(connectionManagerRequests, 1,
        "Emby 4.9.5 should resolve its authenticated API client through the module connection manager");
    assert.deepStrictEqual(requestedConfigurationPaths, ["EmbyLyricEnhance/PublicConfiguration"]);
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
    assert.strictEqual(renderer.__elyricPlayerTitle.textContent, "正在播放");
    assert.strictEqual(renderer.__elyricPlayerArtist.textContent, "Emby 音乐");
    assert.strictEqual(renderer.__elyricPlayerButtons.shuffle.getAttribute("data-elyric-active"), "true",
        "native shuffle state should be reflected by the custom control");
    const themeSelect = document.body.querySelector(".elyric-theme-select");
    assert(themeSelect, "theme picker should be attached to the playback page overlay");
    assert.strictEqual(themeSelect.value, "apple");
    assert.strictEqual(themeSelect.disabled, false);
    assert.strictEqual(renderer.__elyricThemeControl.parentNode, document.body,
        "the visual overlay should use document.body to avoid playback host clipping");
    assert.strictEqual(themeSelect.children.length, 5, "all built-in themes should be selectable");

    themeSelect.value = "focus";
    themeSelect.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), "focus");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.theme"), "focus");

    const hiddenRenderer = new LyricsRenderer();
    hiddenRenderer.itemsContainer = new FakeNode("div");
    hiddenRenderer.sourceEvents = renderer.sourceEvents;
    await hiddenRenderer.getItemsInternal();
    hiddenRenderer.onTimeUpdate(0, 20000000);
    assert(!hiddenRenderer.__elyricThemeControl,
        "a detached renderer must not create or take over the global visual overlay");
    assert.strictEqual(document.body.querySelector(".elyric-theme-select"), themeSelect,
        "an invisible old renderer must not replace the active picker");
    hiddenRenderer.destroy();

    renderer.currentItem = {
        Id: "metadata-test",
        Name: "测试歌曲",
        Artists: ["歌手甲", "歌手乙"],
        ImageTags: { Primary: "primary-tag" }
    };
    renderer.onTimeUpdate(0, 20000000);
    let words = renderer.itemsContainer.querySelectorAll("[data-elyric-start][data-elyric-end]");
    assert(words[0].classList.contains("elyric-word-active"));
    assert(words[1].classList.contains("elyric-word-pending"));
    assert(visible.body.textContent.includes("<img src=x onerror=bad>translation"));
    assert.strictEqual(createdTags.filter((tag) => tag === "img").length, 1,
        "only the dedicated artwork element may be an image; lyric HTML must remain text");
    assert.strictEqual(renderer.__elyricPlayerTitle.textContent, "测试歌曲");
    assert.strictEqual(renderer.__elyricPlayerArtist.textContent, "歌手甲 · 歌手乙");
    assert.strictEqual(
        renderer.__elyricPlayerArtwork.getAttribute("src"),
        "/emby/Items/metadata-test/Images/Primary",
        "artwork should use the authenticated Emby API URL without parsing lyric HTML"
    );
    assert(!createdTags.includes("canvas") && !createdTags.includes("svg"),
        "the lyric adapter must never create waveform or curve elements");
    renderer.__elyricPlayerButtons.next.click();
    renderer.__elyricPlayerButtons.playPause.click();
    assert.strictEqual(nativeClicks.next, 1, "custom next should delegate to Emby's native transport");
    assert.strictEqual(nativeClicks.playPause, 1, "custom play/pause should delegate to Emby's native transport");
    renderer.__elyricProgressSlider.value = "500";
    renderer.__elyricProgressSlider.dispatchEvent({ type: "input", stopPropagation() {} });
    assert.strictEqual(renderer.__elyricPlayerPosition.textContent, "0:01");
    renderer.__elyricProgressSlider.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(nativeSeek.value, "50");
    assert.strictEqual(nativeSeekInputs, 1);
    assert.strictEqual(nativeSeekChanges, 1);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), "false");
    renderer.__elyricSecondLineButton.click();
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), "true",
        "the player shell should expose a session-level annotation toggle");
    renderer.__elyricFocusButton.click();
    assert(document.body.classList.contains("elyric-player-focus-page"));
    renderer.__elyricFocusButton.click();
    assert(!document.body.classList.contains("elyric-player-focus-page"));
    assert.strictEqual(frames.size, 0, "one native sample must not start interpolation");
    assert(visible.item.classList.contains("elyric-line-current"));
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 1, "time updates must not duplicate the picker");

    const coveringPage = new FakeNode("div");
    document.body.appendChild(coveringPage);
    document.frontElement = coveringPage;
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), "hidden",
        "a different page covering playback must hide the picker");
    document.frontElement = null;
    document.body.removeChild(coveringPage);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), null,
        "the picker should return when playback is topmost again");

    document.body.removeChild(playbackPage);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), "hidden",
        "a detached playback page must hide its body-mounted picker");
    const reopenedPlaybackPage = new FakeNode("div");
    document.body.appendChild(reopenedPlaybackPage);
    const staleControl = new FakeNode("div");
    staleControl.classList.add("elyric-theme-picker");
    reopenedPlaybackPage.appendChild(staleControl);
    reopenedPlaybackPage.appendChild(renderer.itemsContainer);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.parentNode, document.body,
        "reopening playback should keep the visual overlay outside clipping hosts");
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 1,
        "reopening playback must restore exactly one picker");
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), null,
        "the picker should become visible again on the active playback page");
    assert.strictEqual(staleControl.parentNode, null, "reopening playback should remove stale duplicate controls");

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
    assert(adapterCss.includes(".elyric-player-shell"));
    assert(adapterCss.includes(".elyric-player-focus-page"));

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
    const themeControl = renderer.__elyricThemeControl;
    renderer.destroy();
    assert.strictEqual(frames.size, 0, "destroy should cancel any pending animation frame");
    assert.strictEqual(renderer.__elyricClock, null);
    assert.strictEqual(themeControl.parentNode, null, "destroy should remove theme controls");
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), null);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-show-second"), null);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-focus-mode"), null);
    assert(!document.body.classList.contains("elyric-player-focus-page"));
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
    assert.strictEqual(secondRenderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "145%");
    assert.strictEqual(secondRenderer.itemsContainer.getAttribute("data-elyric-theme"), "focus",
        "the selected theme should be restored from browser storage");
    secondRenderer.destroy();

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
    assert.strictEqual(lockedRenderer.__elyricThemeSelect.disabled, true,
        "the theme picker should be disabled when user overrides are forbidden");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-font-size"), "180%",
        "frontend validation should cap server values even after C# validation");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-line-height"), "1.25");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-font-weight"), "900");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-highlight-color"), "#ffffff");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-pending-opacity"), "0.1");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-glow-percent"), "100%");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-current-scale"), "1.25");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-other-lines-opacity"), "0.1");
    assert.strictEqual(lockedRenderer.itemsContainer.style.getPropertyValue("--elyric-other-lines-blur"), "4px");
    lockedRenderer.__elyricThemeSelect.value = "gradient";
    lockedRenderer.__elyricThemeSelect.dispatchEvent({ type: "change", stopPropagation() {} });
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
    assert.strictEqual(fallbackRenderer.__elyricThemeSelect.disabled, false);
    fallbackRenderer.destroy();

    console.log("adapter parsing, plugin defaults, fallback, locks, open endings, safety, themes, navigation and timing: ok");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
