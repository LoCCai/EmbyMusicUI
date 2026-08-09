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
    const controls = Object.fromEntries(ids.map((id) => [id, createControl()]));
    const submitButton = createControl();
    const formListeners = {};
    const form = {
        addEventListener(type, listener) {
            formListeners[type] = listener;
        },
        querySelector(selector) {
            return selector === 'button[type="submit"]' ? submitButton : null;
        }
    };
    const pageListeners = {};
    const attributes = {};
    const currentPage = {
        isConnected: true,
        addEventListener(type, listener) {
            pageListeners[type] = listener;
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
        }
    };
    let staleRemoved = false;
    const stalePage = {
        parentNode: {
            removeChild(candidate) {
                assert.strictEqual(candidate, stalePage);
                staleRemoved = true;
            }
        }
    };

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
            currentScript: {
                closest() {
                    return currentPage;
                }
            },
            querySelectorAll() {
                return [stalePage, currentPage];
            }
        },
        console,
        Promise,
        window: { console }
    };

    vm.runInNewContext(scriptMatch[1], context, { filename: "configPage.inline.js" });
    await flushPromises();

    assert(staleRemoved, "a stale configuration page should be removed when the new instance binds");
    assert.strictEqual(attributes["data-elyric-config-bound"], "true");
    assert(pageListeners.pageshow && pageListeners.viewshow, "both Emby lifecycle handlers should be registered");
    assert.strictEqual(getCalls, 1, "initial configuration should be loaded exactly once");
    assert.strictEqual(controls.elyricFontSizePercent.value, 100);

    controls.elyricDefaultTheme.value = "apple";
    controls.elyricAllowUserThemeOverride.checked = false;
    controls.elyricFontSizePercent.value = "125";
    controls.elyricLineHeight.value = "1.4";
    controls.elyricFontWeight.value = "700";
    controls.elyricUseThemeColor.checked = false;
    controls.elyricHighlightColor.value = "#123456";
    controls.elyricPendingOpacity.value = "0.5";
    controls.elyricGlowStrength.value = "0.6";
    controls.elyricCurrentLineScale.value = "1.1";
    controls.elyricOtherLinesOpacity.value = "0.3";
    controls.elyricOtherLinesBlurPixels.value = "0.8";
    controls.elyricShowSecondLine.checked = false;
    controls.elyricShowThirdAndLaterLines.checked = false;

    const submitEvent = { preventDefault() {} };
    formListeners.submit(submitEvent);
    formListeners.submit(submitEvent);
    await flushPromises();
    await flushPromises();

    assert.strictEqual(updateCalls, 1, "a double submit should result in only one update request");
    assert.strictEqual(configuration.Display.DefaultTheme, "apple");
    assert.strictEqual(configuration.Display.FontSizePercent, 125);
    assert.strictEqual(configuration.Display.HighlightColor, "#123456");
    assert.strictEqual(getCalls, 3, "save should read the current configuration and then verify the persisted result");
    assert.strictEqual(controls.elyricSaveStatus.textContent, "设置已保存并重新读取。");
    assert.strictEqual(submitButton.disabled, false);

    console.log("plugin configuration page deduplication, lifecycle and save round trip: ok");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
