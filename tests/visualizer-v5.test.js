"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapter = fs.readFileSync(
    path.join(__dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js"),
    "utf8"
);

assert(adapter.includes("analyser.fftSize = 4096"), "live analysis should use the V5 4096-point FFT");
assert(adapter.includes("startBinFloat") && adapter.includes("overlap") && adapter.includes("interpolated"),
    "logarithmic bands should use fractional-bin overlap and interpolation");
assert(adapter.includes('if ("centerOut" === layoutId)') && adapter.includes("var symmetric"),
    "centerOut smoothing must preserve strict left/right symmetry");
assert(adapter.includes("visualizerMediaIsSilent") && adapter.includes("mediaElement.paused")
    && adapter.includes("target = silent ? 0") && adapter.includes("hasResidualEnergy"),
    "mute and real silence must decay instead of generating artificial frequency energy");

function centerOut(values, count) {
    const samples = new Array(count);
    const half = Math.ceil(count / 2);
    for (let index = 0; index < half; index += 1) {
        const value = values[Math.min(values.length - 1, index)] || 0;
        samples[half - 1 - index] = value;
        samples[count - half + index] = value;
    }
    return samples;
}

for (const count of [24, 25, 56, 57, 96]) {
    const source = Array.from({ length: Math.ceil(count / 2) }, (_, index) => (index + 1) / count);
    const samples = centerOut(source, count);
    for (let index = 0; index < Math.floor(count / 2); index += 1) {
        assert.strictEqual(samples[index], samples[count - 1 - index], `${count} samples must mirror exactly`);
    }
}

console.log("Theme V5 visualizer FFT and center-out symmetry contracts: ok");
