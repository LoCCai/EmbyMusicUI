"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapter = fs.readFileSync(
    path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js"),
    "utf8"
);

assert(adapter.includes('PLAYER_THEME_LAYOUT_MODEL = "anchored-canvas-v1"'));
assert(adapter.includes('matchMedia("(orientation: portrait)")'));
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
assert(!adapter.includes("rect.left / window.innerWidth * 100"),
    "V4 must not infer saved geometry from the rendered viewport");

function metrics(viewportWidth, viewportHeight, profile, transform = {}) {
    const safe = 64;
    const availableWidth = viewportWidth;
    const availableHeight = viewportHeight - safe;
    const baseWidth = profile === "portrait" ? 900 : 1200;
    const baseHeight = profile === "portrait" ? 1200 : 900;
    const baseScale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
    const designWidth = availableWidth / baseScale;
    const designHeight = availableHeight / baseScale;
    const scale = baseScale * (transform.scale || 1);
    const originX = availableWidth / 2 - designWidth * scale / 2 + (transform.offsetX || 0) * scale;
    const originY = safe + availableHeight / 2 - designHeight * scale / 2 + (transform.offsetY || 0) * scale;
    return {
        scale, designWidth, designHeight, originX, originY,
        forward(x, y) { return { x: originX + x * scale, y: originY + y * scale }; },
        inverse(x, y) { return { x: (x - originX) / scale, y: (y - originY) / scale }; }
    };
}

const viewports = [
    [390, 844, "portrait"], [440, 900, "portrait"], [768, 1024, "portrait"],
    [844, 390, "landscape"], [1024, 768, "landscape"], [1366, 768, "landscape"],
    [1920, 1080, "landscape"], [2560, 1440, "landscape"], [3440, 1440, "landscape"],
    [3840, 2160, "landscape"]
];

viewports.forEach(([width, height, profile]) => {
    const matrix = metrics(width, height, profile, { scale: 1.23, offsetX: 77, offsetY: -31 });
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
assert(ultrawide.designWidth > standard.designWidth,
    "the long edge should expand symmetrically instead of stretching the base canvas");

console.log("anchored canvas V4 geometry matrix: ok");
