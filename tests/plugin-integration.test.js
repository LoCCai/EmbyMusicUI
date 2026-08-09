"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const adapterJs = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.js"), "utf8");
const adapterCss = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.css"), "utf8");
const pluginRoot = path.join(root, "plugin", "src", "EmbyLyricEnhance.Plugin");
const coreRoot = path.join(root, "plugin", "src", "EmbyLyricEnhance.Core");
const pluginSource = fs.readFileSync(path.join(pluginRoot, "Plugin.cs"), "utf8");
const serviceSource = fs.readFileSync(path.join(pluginRoot, "PublicConfigurationService.cs"), "utf8");
const projectSource = fs.readFileSync(path.join(pluginRoot, "EmbyLyricEnhance.Plugin.csproj"), "utf8");
const pageSource = fs.readFileSync(path.join(pluginRoot, "Configuration", "configPage.html"), "utf8");
const themeSource = fs.readFileSync(path.join(coreRoot, "ThemeIds.cs"), "utf8");
const publicOptionsSource = fs.readFileSync(path.join(coreRoot, "PublicDisplayOptions.cs"), "utf8");

const themes = ["classic", "focus", "gradient", "apple", "minimal"];
themes.forEach((theme) => {
    assert(adapterJs.includes(`id: "${theme}"`), `${theme} should exist in the frontend catalog`);
    assert(themeSource.includes(`= "${theme}";`), `${theme} should exist in the C# catalog`);
    assert(adapterCss.includes(`[data-elyric-theme="${theme}"]`), `${theme} should have frontend CSS`);
    assert(pageSource.includes(`value="${theme}"`), `${theme} should be selectable in the admin page`);
});

const pluginId = "efbd3f14-8799-4a7d-a5ad-7ef93c5b0e5d";
assert(pluginSource.includes(pluginId), "the plugin entry point should expose the stable plugin id");
assert(pageSource.includes(pluginId), "the admin page should use the same plugin id");
assert(pluginSource.includes("IsMainConfigPage = true"), "Emby should register the settings page as the main plugin configuration page");
assert(pluginSource.includes("EnableInMainMenu = true"), "the settings page should have a persistent server menu entry");
assert(pluginSource.includes('MenuSection = "server"'), "the settings page should be grouped with server administration pages");
assert(pageSource.includes("__embyLyricEnhanceConfigurationManager"),
    "the lifecycle manager should survive replacement of an individual configuration page");
assert(pageSource.includes("document.querySelectorAll(pageSelector)"),
    "dynamic evaluation should scan all configuration page instances");
assert(pageSource.includes("pages[pages.length - 1]"), "dynamic evaluation should retain the newest page instance");
assert(pageSource.includes("candidate.parentNode.removeChild(candidate)"), "stale duplicate configuration pages should be removed");
assert(pageSource.includes('document.addEventListener("pageshow"') && pageSource.includes('document.addEventListener("viewshow"'),
    "both legacy and current Emby page lifecycle events should be observed across replaced pages");
assert(pageSource.includes("new window.MutationObserver"),
    "page insertion should be observed when Emby evaluates the script before attaching its page");
assert(pageSource.includes("scanSoon"), "page insertion scans should be deferred until the new page is attached");
assert(pageSource.includes("if (loadPromise)"), "repeated page events should share one configuration request");
assert(pageSource.includes("if (saving)"), "repeated form submissions should be ignored while a save is active");
assert(pageSource.includes("设置已保存并重新读取"), "successful saves should confirm a server round trip inline");
assert(pageSource.includes("var(--theme-background"), "the configuration page should cover the previous transparent route");
assert(!pageSource.includes("processPluginConfigurationUpdateResult"),
    "saving should not invoke the navigation-oriented helper that can duplicate dynamic pages");

const publicRoute = "EmbyLyricEnhance/PublicConfiguration";
assert(adapterJs.includes(`PUBLIC_CONFIGURATION_PATH = "${publicRoute}"`));
assert(serviceSource.includes(`/EmbyLyricEnhance/PublicConfiguration`));
assert(serviceSource.includes("\"GET\""), "public display defaults should be read-only");
assert(!serviceSource.includes("POST") && !serviceSource.includes("PUT") && !serviceSource.includes("DELETE"),
    "the public display route must not expose mutations");

const publicFields = [
    "defaultTheme",
    "allowUserThemeOverride",
    "fontSizePercent",
    "lineHeight",
    "fontWeight",
    "useThemeColor",
    "highlightColor",
    "pendingOpacity",
    "glowStrength",
    "currentLineScale",
    "otherLinesOpacity",
    "otherLinesBlurPixels",
    "showSecondLine",
    "showThirdAndLaterLines"
];
publicFields.forEach((field) => {
    assert(publicOptionsSource.includes(`Name = "${field}"`), `${field} should be serialized by the C# DTO`);
    assert(adapterJs.includes(`"${field}"`), `${field} should be consumed by the adapter`);
});

const settingIds = [
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
    "elyricShowThirdAndLaterLines"
];
settingIds.forEach((id) => {
    const occurrences = pageSource.match(new RegExp(id, "g")) || [];
    assert(occurrences.length >= 3, `${id} should be declared, loaded and saved`);
});

[
    "--elyric-font-size",
    "--elyric-line-height",
    "--elyric-font-weight",
    "--elyric-highlight-color",
    "--elyric-pending-opacity",
    "--elyric-glow-size",
    "--elyric-current-scale",
    "--elyric-other-lines-opacity",
    "--elyric-other-lines-blur"
].forEach((propertyName) => {
    assert(adapterJs.includes(propertyName), `${propertyName} should be assigned by JavaScript`);
    assert(adapterCss.includes(propertyName), `${propertyName} should be consumed by CSS`);
});

assert(projectSource.includes('Include="MediaBrowser.Common"'), "the official aggregate Emby SDK should be referenced");
assert(projectSource.includes('Compile Include="..\\EmbyLyricEnhance.Core\\*.cs"'),
    "core sources should be linked into the main plugin DLL for Emby load-context compatibility");
assert(!projectSource.includes("ProjectReference"), "the deployed plugin must not require a second project DLL");
assert(!projectSource.includes('Include="MediaBrowser.Controller"'));
assert(!projectSource.includes('Include="MediaBrowser.Model"'));
assert(projectSource.includes("4.9.1.90"), "the successfully restored Emby SDK should be pinned");

assert(!pageSource.includes("innerHTML"), "the configuration page should not use unsafe HTML assignment");
assert(pageSource.includes("ApiClient.getPluginConfiguration"));
assert(pageSource.includes("ApiClient.updatePluginConfiguration"));
const pageScript = pageSource.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
assert(pageScript, "the admin page should contain its lifecycle script");
assert.doesNotThrow(() => new Function(pageScript[1]), "the admin page script should parse as JavaScript");
assert(pageSource.includes("data-elyric-config-bound"), "the admin page should not bind duplicate lifecycle handlers");
assert(pageSource.includes(".catch(handleError)"), "configuration load and save failures should be surfaced safely");
assert(pageSource.includes("pattern=\"#[0-9A-Fa-f]{6}\""), "the admin page should constrain custom colors before save");
assert(adapterCss.includes(".elyric-subline:nth-child(n+3)"), "third and later sublines should share consistent styling");

console.log("plugin ids, routes, settings, themes and CSS variables stay synchronized: ok");
