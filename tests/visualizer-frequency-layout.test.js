"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(
    __dirname, "..", "adapters", "4.9.5.0", "lyrics.inject.js"
), "utf8");

function extractFunction(name) {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    assert(start >= 0, `${name} should exist`);
    const bodyStart = source.indexOf("{", start);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index++) {
        if (source[index] === "{") depth += 1;
        if (source[index] === "}") depth -= 1;
        if (depth === 0) return source.slice(start, index + 1);
    }
    throw new Error(`unterminated ${name}`);
}

const context = {};
vm.createContext(context);
vm.runInContext([
    extractFunction("resampleVisualizerBand"),
    extractFunction("mapVisualizerFrequencyLayout")
].join("\n"), context);

const bands = [1, .76, .5, .28, .12, .04];
const center = context.mapVisualizerFrequencyLayout(bands, 57, "centerOut");
for (let index = 0; index < center.length; index++) {
    assert(Math.abs(center[index] - center[center.length - 1 - index]) < 1e-12,
        "centerOut must mirror every logarithmic sample exactly");
}
assert(center[Math.floor(center.length / 2)] > center[0],
    "centerOut should place low-frequency energy at the visual center");

const traditional = context.mapVisualizerFrequencyLayout(bands, 57, "lowToHigh");
assert(traditional[0] > traditional.at(-1),
    "lowToHigh should retain the traditional left-to-right frequency order");

const radial = context.mapVisualizerFrequencyLayout(bands, 56, "radial");
assert(Math.abs(radial[0] - radial[28]) < 1e-12,
    "radial must place bass on opposite sides of the ring");
assert(Math.abs(radial[14] - radial[42]) < 1e-12,
    "radial must place high frequencies on the other opposite axis");

assert(source.includes("analyser.fftSize = 4096"),
    "live analysis should retain sufficient resolution in the first audible octaves");
assert(source.includes("totalWeight += overlap"),
    "log bands should use fractional FFT-bin overlap instead of duplicate integer bins");

console.log("visualizer logarithmic sampling and balanced frequency layouts: ok");
