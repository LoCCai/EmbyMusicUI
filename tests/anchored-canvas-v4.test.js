"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapter = fs.readFileSync(
    path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js"),
    "utf8"
);

assert(adapter.includes('PLAYER_THEME_LAYOUT_MODEL = "fixed-canvas-v1"'));
assert(adapter.includes('landscape: { width: 1920, height: 1080 }'));
assert(adapter.includes('portrait: { width: 1080, height: 1920 }'));
assert(adapter.includes('PLAYER_THEME_SCHEMA_VERSION = 6'));
assert(adapter.includes('width >= height ? "landscape" : "portrait"'));
assert(adapter.includes("keyboardReducedViewport") && adapter.includes("playerThemeV2ActiveProfile"),
    "soft-keyboard visual viewport changes must preserve the current physical orientation");
assert(adapter.includes("window.visualViewport"));
assert(adapter.includes("env(safe-area-inset-top,0px)") && adapter.includes("playerThemeV2SafeInsets"),
    "the stage should subtract platform safe-area insets");
assert(adapter.includes("inverse: function (clientX, clientY)"));
assert(adapter.includes("var frozenMetrics = playerThemeV2StageMetrics"));
assert(adapter.includes("requestAnimationFrame(renderMove)"));
assert(adapter.includes("snapPlayerThemeV2LayerGeometry") && adapter.includes("setPlayerThemeV2DesignerGuides"),
    "dragging should expose stage, sibling and equal-spacing snapping through visible guides");
assert(adapter.includes('"data-preview-label"') && adapter.includes('"data-simulated"'),
    "the non-current orientation should render in a labeled centered preview canvas");
assert(adapter.includes("var grab = 44"),
    "partially off-stage layers should retain the required 44 CSS-pixel grab region");
assert(adapter.includes("function applyPlayerThemeV6Stage")
    && /translate3d\("\s*\+\s*metrics\.originX[\s\S]{0,100}scale\("\s*\+\s*metrics\.scale/.test(adapter),
    "V6 must translate and scale the complete fixed design stage exactly once");
assert(adapter.includes('element.style.setProperty("position", "absolute", "important")'),
    "V6 layers must stay in unscaled design coordinates inside the transformed stage");
assert(!adapter.includes('element.style.setProperty("--elyric-control-stage-scale"'),
    "the control dock must not apply a second component-level canvas scale");
assert(adapter.includes("playerThemeV5LayoutIsSafe") && adapter.includes("playerThemeV6ControlDockError"),
    "V6 should validate only ControlDock operability before an explicit save");
assert(!adapter.includes("repairPlayerThemeV5State") && !adapter.includes("layoutRepairRevision"),
    "playback must never silently repair or revision user geometry");
assert(!adapter.includes("rect.left / window.innerWidth * 100"),
    "V4 must not infer saved geometry from the rendered viewport");

function metrics(viewportWidth, viewportHeight, profile) {
    const availableWidth = viewportWidth;
    const availableHeight = viewportHeight;
    const baseWidth = profile === "portrait" ? 1080 : 1920;
    const baseHeight = profile === "portrait" ? 1920 : 1080;
    const baseScale = Math.min(8, availableWidth / baseWidth, availableHeight / baseHeight);
    const designWidth = baseWidth;
    const designHeight = baseHeight;
    const scale = baseScale;
    const originX = (availableWidth - designWidth * scale) / 2;
    const originY = availableHeight - designHeight * scale;
    return {
        scale, designWidth, designHeight, originX, originY,
        forward(x, y) { return { x: originX + x * scale, y: originY + y * scale }; },
        inverse(x, y) { return { x: (x - originX) / scale, y: (y - originY) / scale }; }
    };
}

const viewports = [
    [390, 844, "portrait"], [440, 900, "portrait"], [768, 1024, "portrait"], [1080, 1920, "portrait"],
    [844, 390, "landscape"], [1024, 768, "landscape"], [1366, 768, "landscape"],
    [1920, 1080, "landscape"], [2560, 1440, "landscape"], [3440, 1440, "landscape"],
    [3840, 2160, "landscape"]
];

viewports.forEach(([width, height, profile]) => {
    const matrix = metrics(width, height, profile);
    const source = { x: 341.25, y: 187.75 };
    const rendered = matrix.forward(source.x, source.y);
    const roundTrip = matrix.inverse(rendered.x, rendered.y);
    assert(Math.abs(roundTrip.x - source.x) < 1e-9 && Math.abs(roundTrip.y - source.y) < 1e-9,
        `${width}x${height} should round-trip through the shared matrix`);
    const pointerDelta = { x: 53, y: -27 };
    const start = matrix.forward(source.x, source.y);
    const moved = matrix.inverse(start.x + pointerDelta.x * matrix.scale, start.y + pointerDelta.y * matrix.scale);
    assert(Math.abs(moved.x - source.x - pointerDelta.x) < 1e-9
        && Math.abs(moved.y - source.y - pointerDelta.y) < 1e-9,
    `${width}x${height} drag deltas should remain exact under scale and offset`);
});

const standard = metrics(1920, 1080, "landscape");
const ultrawide = metrics(3440, 1440, "landscape");
const uhd = metrics(3840, 2160, "landscape");
assert.strictEqual(standard.designWidth, 1920);
assert.strictEqual(standard.designHeight, 1080);
assert.strictEqual(standard.scale, 1,
    "the requested 1920x1080 viewport should render the design canvas at exactly 1:1");
assert.strictEqual(ultrawide.designWidth, 1920);
assert.strictEqual(ultrawide.designHeight, 1080,
    "every landscape viewport should retain one fixed 1920x1080 design canvas");
const ultrawideCanvasWidth = ultrawide.designWidth * ultrawide.scale;
assert(ultrawide.originX > 0 && ultrawideCanvasWidth < 3440,
    "ultrawide screens should center the contained canvas and leave both sides blank");
assert.strictEqual(uhd.designWidth * uhd.scale, 3840,
    "4K playback should uniformly scale the complete 1920x1080 canvas to 2x");
const portrait = metrics(1080, 1920, "portrait");
assert.strictEqual(portrait.designWidth, 1080);
assert.strictEqual(portrait.designHeight, 1920,
    "every portrait viewport should retain one fixed 1080x1920 design canvas");
assert.strictEqual(portrait.scale, 1,
    "the requested 1080x1920 viewport should render the design canvas at exactly 1:1");

assert(adapter.includes('"artwork", "metadata", "lyrics", "visualizer", "controlDock"'),
    "V6 should expose exactly five editable canvas layers");
assert(adapter.includes("normalizePlayerControlDockProfile") && adapter.includes("applyPlayerControlDock"),
    "V6 should normalize and render the constrained control dock");
const css = fs.readFileSync(
    path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.css"),
    "utf8"
);
assert(!css.includes("calc(44px / var(--elyric-control-stage-scale"),
    "control-dock buttons must not be inverse-scaled inside already sized rendered geometry");
assert(css.includes('[data-elyric-layout-model="fixed-canvas-v1"] .elyric-player-stage')
    && css.includes("will-change: transform"),
    "the fixed V6 stage should own the single viewport transform");
assert(!css.includes("calc(52px * var(--elyric-control-stage-scale"),
    "fixed design-pixel buttons must scale only through their stage ancestor");
assert(css.includes(".elyric-player-settings-body") && css.includes("--elyric-layer-overlay"),
    "settings and themed popovers must share the compact root-owned overlay system");
assert(!adapter.includes("playerThemeV5CompactLandscape")
    && !css.includes('data-elyric-short-landscape="true"'),
    "non-standard landscape sizes must not hide or rearrange individual V6 controls");
console.log("fixed dual-canvas V6 geometry matrix and control dock: ok");
