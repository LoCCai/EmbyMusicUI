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

class FakeNode {
    constructor(tagName, text) {
        this.tagName = tagName || null;
        this.nodeText = text || "";
        this.children = [];
        this.attributes = {};
        this._className = "";
        this.classList = new FakeClassList(this);
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
    adapter
)(LyricsRenderer, document, MutationObserver, performance, requestAnimationFrame, cancelAnimationFrame, localStorage);

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
    const renderer = new LyricsRenderer();
    const visible = createLyricElement(0);
    const playbackPage = new FakeNode("div");
    document.body.appendChild(playbackPage);
    renderer.itemsContainer = new FakeNode("div");
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
    assert.strictEqual(items.length, 1, "same-time events should be grouped");
    assert.strictEqual(items[0].__elyric.sublines.length, 2);
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), "classic");
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 1);
    const themeSelect = document.body.querySelector(".elyric-theme-select");
    assert(themeSelect, "theme picker should be attached to the playback page overlay");
    assert.strictEqual(renderer.__elyricThemeControl.parentNode, playbackPage,
        "theme picker must stay inside the playback page instead of document.body");
    assert.strictEqual(themeSelect.children.length, 5, "all built-in themes should be selectable");

    themeSelect.value = "focus";
    themeSelect.dispatchEvent({ type: "change", stopPropagation() {} });
    assert.strictEqual(renderer.itemsContainer.getAttribute("data-elyric-theme"), "focus");
    assert.strictEqual(storedValues.get("emby-lyric-enhance.theme"), "focus");

    renderer.onTimeUpdate(0, 20000000);
    let words = renderer.itemsContainer.querySelectorAll("[data-elyric-start][data-elyric-end]");
    assert(words[0].classList.contains("elyric-word-active"));
    assert(words[1].classList.contains("elyric-word-pending"));
    assert(visible.body.textContent.includes("<img src=x onerror=bad>translation"));
    assert(!createdTags.includes("img"), "lyric HTML must remain text");
    assert(!createdTags.includes("canvas") && !createdTags.includes("svg"),
        "the lyric adapter must never create waveform or curve elements");
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
    assert.strictEqual(document.body.querySelectorAll(".elyric-theme-picker").length, 0,
        "leaving the playback page must also remove the picker from the visible document tree");
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.getAttribute("hidden"), "hidden",
        "a detached playback page must hide its retained picker");
    const reopenedPlaybackPage = new FakeNode("div");
    document.body.appendChild(reopenedPlaybackPage);
    const staleControl = new FakeNode("div");
    staleControl.classList.add("elyric-theme-picker");
    reopenedPlaybackPage.appendChild(staleControl);
    reopenedPlaybackPage.appendChild(renderer.itemsContainer);
    renderer.onTimeUpdate(0, 20000000);
    assert.strictEqual(renderer.__elyricThemeControl.parentNode, reopenedPlaybackPage,
        "reopening playback should move the existing picker to the current page host");
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

    const secondRenderer = new LyricsRenderer();
    const secondPlaybackPage = new FakeNode("div");
    document.body.appendChild(secondPlaybackPage);
    secondRenderer.itemsContainer = new FakeNode("div");
    secondPlaybackPage.appendChild(secondRenderer.itemsContainer);
    secondRenderer.sourceEvents = renderer.sourceEvents;
    await secondRenderer.getItemsInternal();
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

    console.log("adapter parsing, open endings, safety, themes, navigation, seeking, pause and smooth timing: ok");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
