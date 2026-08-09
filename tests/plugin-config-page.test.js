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
        attributes: {},
        listeners: {},
        addEventListener(type, listener) {
            this.listeners[type] = listener;
        },
        getAttribute(name) {
            return this.attributes[name] || null;
        },
        setAttribute(name, value) {
            this.attributes[name] = value;
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
        "elyricSaveStatus",
        "elyricReloadButton",
        "elyricSubmitLabel"
    ];
    const pages = [];
    function createPage() {
        const controls = Object.fromEntries(ids.map((id) => [id, createControl()]));
        const submitButton = createControl();
        const formListeners = {};
        const pageListeners = {};
        const attributes = {};
        const classes = new Set();
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
            classList: {
                add(name) {
                    classes.add(name);
                },
                contains(name) {
                    return classes.has(name);
                },
                remove(name) {
                    classes.delete(name);
                }
            },
            addEventListener(type, listener) {
                pageListeners[type] = listener;
            },
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
            removeAttribute(name) {
                delete attributes[name];
            },
            querySelector(selector) {
                if (selector === "#EmbyLyricEnhanceConfigForm") {
                    return form;
                }
                return controls[selector.slice(1)] || null;
            },
            parentNode: {
                removeChild() {
                    assert.fail("the plugin must not remove pages owned by Emby's router");
                }
            }
        };
        return { attributes, classes, controls, formListeners, page, pageListeners, submitButton };
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
    let failNextGet = false;
    const documentListeners = {};
    const documentListenerCounts = {};
    let mutationCallback = null;
    let observerCount = 0;
    let scriptPage = null;
    class MutationObserver {
        constructor(callback) {
            mutationCallback = callback;
            observerCount += 1;
        }

        observe() {}
    }
    const pageConsole = { error() {} };
    const context = {
        ApiClient: {
            getPluginConfiguration() {
                getCalls += 1;
                if (failNextGet) {
                    failNextGet = false;
                    return Promise.reject(new Error("simulated read failure"));
                }
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
                    return scriptPage;
                }
            },
            documentElement: {},
            addEventListener(type, listener) {
                documentListeners[type] = listener;
                documentListenerCounts[type] = (documentListenerCounts[type] || 0) + 1;
            },
            querySelectorAll() {
                return pages.slice();
            }
        },
        console: pageConsole,
        Promise,
        window: { console: pageConsole, MutationObserver, setTimeout }
    };

    const stale = createPage();
    scriptPage = stale.page;
    vm.runInNewContext(scriptMatch[1], context, { filename: "configPage.inline.js" });
    pages.push(stale.page);
    mutationCallback([{ addedNodes: [stale.page] }]);
    await flushPromises();

    assert.strictEqual(stale.attributes["data-elyric-config-bound"], "true");
    assert.strictEqual(getCalls, 1, "initial configuration should be loaded exactly once");
    assert.strictEqual(stale.controls.elyricFontSizePercent.value, 100);

    const current = createPage();
    scriptPage = current.page;
    vm.runInNewContext(scriptMatch[1], context, { filename: "configPage.inline.js" });
    pages.push(current.page);
    mutationCallback([{ addedNodes: [current.page] }]);
    await flushPromises();

    assert.strictEqual(pages.length, 2, "router-owned configuration pages should remain in Emby's DOM");
    assert(stale.classes.has("elyric-managed-hidden"), "the stale plugin page should be hidden non-destructively");
    assert(!current.classes.has("elyric-managed-hidden"), "the newest plugin page should remain visible");
    assert.strictEqual(current.attributes["data-elyric-config-bound"], "true");
    assert.strictEqual(getCalls, 2, "the replacement page should load the persisted configuration once");
    assert.strictEqual(current.controls.elyricFontSizePercent.value, 100);
    assert(documentListeners.pageshow && documentListeners.viewshow,
        "both Emby lifecycle handlers should be registered on the document");
    assert.strictEqual(documentListenerCounts.pageshow, 1, "re-evaluating the script should reuse the lifecycle manager");
    assert.strictEqual(documentListenerCounts.viewshow, 1, "re-evaluating the script should not duplicate listeners");
    assert.strictEqual(observerCount, 1, "re-evaluating the script should reuse one insertion observer");

    stale.pageListeners.viewshow();
    await flushPromises();
    assert(!stale.classes.has("elyric-managed-hidden"), "Emby may safely reactivate a retained page instance");
    assert(current.classes.has("elyric-managed-hidden"), "the inactive duplicate should be hidden without removal");
    assert.strictEqual(getCalls, 3, "reactivating a retained page should reload its server values");

    documentListeners.viewshow({ target: current.page });
    await flushPromises();
    assert(stale.classes.has("elyric-managed-hidden"), "reactivating the newest page should hide the retained duplicate");
    assert(!current.classes.has("elyric-managed-hidden"));
    assert.strictEqual(getCalls, 4, "viewshow should refresh the visible page from the server");

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
    assert.strictEqual(getCalls, 6, "save should read the current configuration and then verify the persisted result");
    assert(current.controls.elyricSaveStatus.textContent.includes("保存成功，服务器已回读确认"));
    assert.strictEqual(current.controls.elyricSaveStatus.attributes["data-state"], "success");
    assert.strictEqual(current.controls.elyricSaveStatus.hidden, false);
    assert.strictEqual(current.controls.elyricSubmitLabel.textContent, "保存");
    assert.strictEqual(current.submitButton.disabled, false);

    failNextGet = true;
    current.controls.elyricReloadButton.listeners.click();
    await flushPromises();
    assert.strictEqual(getCalls, 7, "manual reload should perform a new server read");
    assert.strictEqual(current.controls.elyricSaveStatus.attributes["data-state"], "error");
    assert(current.controls.elyricSaveStatus.textContent.includes("读取服务器设置失败"));
    assert.strictEqual(current.submitButton.disabled, true, "saving should be blocked after a failed server read");

    current.formListeners.submit(submitEvent);
    await flushPromises();
    assert.strictEqual(updateCalls, 1, "an unread configuration must never overwrite server settings");
    assert(current.controls.elyricSaveStatus.textContent.includes("尚未成功读取服务器设置"));

    current.controls.elyricReloadButton.listeners.click();
    await flushPromises();
    assert.strictEqual(getCalls, 8, "manual retry should read the server again");
    assert.strictEqual(current.controls.elyricSaveStatus.attributes["data-state"], "ready");
    assert.strictEqual(current.submitButton.disabled, false);

    console.log("plugin configuration page routing, lifecycle, save round trip and load failure safety: ok");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
