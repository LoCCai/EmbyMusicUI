"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(
    path.join(root, "plugin", "src", "EmbyLyricEnhance.Plugin", "Configuration", "configPage.html"),
    "utf8"
);
const scriptMatch = html.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/);
assert(scriptMatch, "configuration page script should be embedded in the page");

function createControl(initial) {
    return {
        value: "",
        checked: false,
        disabled: false,
        textContent: "",
        style: {},
        listeners: {},
        addEventListener(type, listener) {
            this.listeners[type] = listener;
        },
        ...(initial || {})
    };
}

async function flushPromises() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
}

async function main() {
    const ids = [
        "elyricDefaultTheme",
        "elyricAllowUserThemeOverride",
        "elyricFontSizePercent",
        "elyricLineHeight",
        "elyricFontWeight",
        "elyricUseThemeColor",
        "elyricHighlightColor",
        "elyricPendingOpacity",
        "elyricGlowStrength",
        "elyricCurrentLineScale",
        "elyricOtherLinesOpacity",
        "elyricOtherLinesBlurPixels",
        "elyricShowSecondLine",
        "elyricShowThirdAndLaterLines",
        "elyricSaveStatus"
    ];
    const pages = [];
    function createPage() {
        const controls = Object.fromEntries(ids.map((id) => [id, createControl()]));
        const submitButton = createControl();
        const formListeners = {};
        const attributes = {};
        const form = {
            addEventListener(type, listener) {
                formListeners[type] = listener;
            },
            querySelector(selector) {
                return selector === 'button[type="submit"]' ? submitButton : null;
            }
        };
        const page = {
            nodeType: 1,
            isConnected: true,
            matches(selector) {
                return selector === "#EmbyLyricEnhanceConfigPage";
            },
            closest(selector) {
                return this.matches(selector) ? this : null;
            },
            getAttribute(name) {
                return attributes[name] || null;
            },
            setAttribute(name, value) {
                attributes[name] = value;
            },
            querySelector(selector) {
                if (selector === "#EmbyLyricEnhanceConfigForm") {
                    return form;
                }
                return controls[selector.slice(1)] || null;
            },
            parentNode: {
                removeChild(candidate) {
                    const index = pages.indexOf(candidate);
                    assert(index >= 0, "only an attached page should be removed");
                    pages.splice(index, 1);
                    candidate.isConnected = false;
                }
            }
        };
        return { attributes, controls, formListeners, page, submitButton };
    }

    let configuration = {
        Display: {
            DefaultTheme: "classic",
            AllowUserThemeOverride: true,
            FontSizePercent: 100,
            LineHeight: 1.25,
            FontWeight: 600,
            UseThemeColor: true,
            HighlightColor: "#ffffff",
            PendingOpacity: 0.46,
            GlowStrength: 0.45,
            CurrentLineScale: 1.08,
            OtherLinesOpacity: 0.34,
            OtherLinesBlurPixels: 0.4,
            ShowSecondLine: true,
            ShowThirdAndLaterLines: true
        }
    };
    let getCalls = 0;
    let updateCalls = 0;
    const documentListeners = {};
    const documentListenerCounts = {};
    let mutationCallback = null;
    let observerCount = 0;
    class MutationObserver {
        constructor(callback) {
            mutationCallback = callback;
            observerCount += 1;
        }

        observe() {}
    }
    const context = {
        ApiClient: {
            getPluginConfiguration() {
                getCalls += 1;
                return Promise.resolve(JSON.parse(JSON.stringify(configuration)));
            },
            updatePluginConfiguration(pluginId, nextConfiguration) {
                assert.strictEqual(pluginId, "efbd3f14-8799-4a7d-a5ad-7ef93c5b0e5d");
                updateCalls += 1;
                configuration = JSON.parse(JSON.stringify(nextConfiguration));
                return Promise.resolve({});
            }
        },
        Dashboard: {
            hideLoadingMsg() {},
            showLoadingMsg() {}
        },
        document: {
            documentElement: {},
            addEventListener(type, listener) {
                documentListeners[type] = listener;
                documentListenerCounts[type] = (documentListenerCounts[type] || 0) + 1;
            },
            querySelectorAll() {
                return pages.slice();
            }
        },
        console,
        Promise,
        window: { console, MutationObserver, setTimeout }
    };

    const stale = createPage();
    vm.runInNewContext(scriptMatch[1], context, { filename: "configPage.inline.js" });
    pages.push(stale.page);
    mutationCallback([{ addedNodes: [stale.page] }]);
    await flushPromises();

    assert.strictEqual(stale.attributes["data-elyric-config-bound"], "true");
    assert.strictEqual(getCalls, 1, "initial configuration should be loaded exactly once");
    assert.strictEqual(stale.controls.elyricFontSizePercent.value, 100);

    const current = createPage();
    vm.runInNewContext(scriptMatch[1], context, { filename: "configPage.inline.js" });
    pages.push(current.page);
    mutationCallback([{ addedNodes: [current.page] }]);
    await flushPromises();

    assert.strictEqual(pages.length, 1, "only one configuration page should remain after delayed insertion");
    assert.strictEqual(pages[0], current.page, "the newest configuration page should replace the stale page");
    assert.strictEqual(current.attributes["data-elyric-config-bound"], "true");
    assert.strictEqual(getCalls, 2, "the replacement page should load the persisted configuration once");
    assert.strictEqual(current.controls.elyricFontSizePercent.value, 100);
    assert(documentListeners.pageshow && documentListeners.viewshow,
        "both Emby lifecycle handlers should be registered on the document");
    assert.strictEqual(documentListenerCounts.pageshow, 1, "re-evaluating the script should reuse the lifecycle manager");
    assert.strictEqual(documentListenerCounts.viewshow, 1, "re-evaluating the script should not duplicate listeners");
    assert.strictEqual(observerCount, 1, "re-evaluating the script should reuse one insertion observer");

    documentListeners.viewshow({ target: current.page });
    await flushPromises();
    assert.strictEqual(getCalls, 3, "viewshow should refresh the visible page from the server");

    current.controls.elyricDefaultTheme.value = "apple";
    current.controls.elyricAllowUserThemeOverride.checked = false;
    current.controls.elyricFontSizePercent.value = "125";
    current.controls.elyricLineHeight.value = "1.4";
    current.controls.elyricFontWeight.value = "700";
    current.controls.elyricUseThemeColor.checked = false;
    current.controls.elyricHighlightColor.value = "#123456";
    current.controls.elyricPendingOpacity.value = "0.5";
    current.controls.elyricGlowStrength.value = "0.6";
    current.controls.elyricCurrentLineScale.value = "1.1";
    current.controls.elyricOtherLinesOpacity.value = "0.3";
    current.controls.elyricOtherLinesBlurPixels.value = "0.8";
    current.controls.elyricShowSecondLine.checked = false;
    current.controls.elyricShowThirdAndLaterLines.checked = false;

    const submitEvent = { preventDefault() {} };
    current.formListeners.submit(submitEvent);
    current.formListeners.submit(submitEvent);
    await flushPromises();
    await flushPromises();

    assert.strictEqual(updateCalls, 1, "a double submit should result in only one update request");
    assert.strictEqual(configuration.Display.DefaultTheme, "apple");
    assert.strictEqual(configuration.Display.FontSizePercent, 125);
    assert.strictEqual(configuration.Display.HighlightColor, "#123456");
    assert.strictEqual(getCalls, 5, "save should read the current configuration and then verify the persisted result");
    assert.strictEqual(current.controls.elyricSaveStatus.textContent, "设置已保存并重新读取。");
    assert.strictEqual(current.submitButton.disabled, false);

    console.log("plugin configuration page deduplication, lifecycle and save round trip: ok");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
