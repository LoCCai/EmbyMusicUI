"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const manager = path.join(root, "scripts", "container-manager.sh");

function findShell() {
    const candidates = [
        process.env.TEST_SH,
        process.platform === "win32" ? "C:\\Program Files\\Git\\bin\\sh.exe" : null,
        "sh"
    ].filter(Boolean);
    for (const candidate of candidates) {
        const probe = spawnSync(candidate, ["-c", "exit 0"]);
        if (!probe.error && probe.status === 0) {
            return candidate;
        }
    }
    throw new Error("POSIX sh was not found for the container manager test");
}

function posixPath(value) {
    const normalized = value.replace(/\\/g, "/");
    return /^[A-Za-z]:\//.test(normalized)
        ? `/${normalized[0].toLowerCase()}${normalized.slice(2)}`
        : normalized;
}

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

const temporaryRoot = fs.mkdtempSync(path.join(root, ".elyric-container-manager-test-"));
try {
    const targetRoot = path.join(temporaryRoot, "system", "dashboard-ui", "videoosd");
    const configRoot = path.join(temporaryRoot, "config");
    const payloadRoot = path.join(temporaryRoot, "payload");
    const recoveryRoot = path.join(temporaryRoot, "recovered-original");
    [targetRoot, configRoot, payloadRoot, recoveryRoot].forEach((directory) => {
        fs.mkdirSync(directory, { recursive: true });
    });

    const originalJs = "define(function(){_exports.default=LyricsRenderer});\n";
    const originalCss = ".lyricsItem { color: white; }\n";
    const oldEnhancedJs = `${originalJs}/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */\nold\n`;
    const payloadJs = "/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */\nvar PUBLIC_CONFIGURATION_PATH = \"EmbyLyricEnhance/PublicConfiguration\";\n/* ELYRIC_ENHANCE_END:4.9.5.0 */\n";
    const payloadCss = "/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */\n:root { --elyric-font-size: 100%; }\n/* ELYRIC_ENHANCE_END:4.9.5.0 */\n";

    fs.writeFileSync(path.join(targetRoot, "lyrics.js"), oldEnhancedJs);
    fs.writeFileSync(path.join(targetRoot, "lyrics.css"), `${originalCss}${payloadCss}`);
    fs.writeFileSync(path.join(recoveryRoot, "lyrics.js"), originalJs);
    fs.writeFileSync(path.join(recoveryRoot, "lyrics.css"), originalCss);
    fs.writeFileSync(path.join(payloadRoot, "lyrics.inject.js"), payloadJs);
    fs.writeFileSync(path.join(payloadRoot, "lyrics.inject.css"), payloadCss);

    const environment = {
        ...process.env,
        ELYRIC_TARGET_ROOT: posixPath(path.relative(root, targetRoot)),
        ELYRIC_CONFIG_ROOT: posixPath(path.relative(root, configRoot)),
        ELYRIC_PAYLOAD_ROOT: posixPath(path.relative(root, payloadRoot)),
        ELYRIC_RECOVERY_ROOT: posixPath(path.relative(root, recoveryRoot)),
        ELYRIC_EXPECTED_JS: sha256(originalJs),
        ELYRIC_EXPECTED_CSS: sha256(originalCss)
    };
    const shell = findShell();
    function run(action) {
        return spawnSync(shell, [posixPath(path.relative(root, manager)), action], {
            cwd: root,
            encoding: "utf8",
            env: environment
        });
    }

    const recover = run("recover-original");
    assert.strictEqual(recover.status, 0, `recovery failed:\n${recover.stdout}\n${recover.stderr}`);
    const originalRoot = path.join(configRoot, "emby-lyric-enhance", "4.9.5.0", "original");
    assert.strictEqual(fs.readFileSync(path.join(originalRoot, "lyrics.js"), "utf8"), originalJs);
    assert.strictEqual(fs.readFileSync(path.join(originalRoot, "lyrics.css"), "utf8"), originalCss);

    const install = run("install");
    assert.strictEqual(install.status, 0, `install failed:\n${install.stdout}\n${install.stderr}`);
    const installedJs = fs.readFileSync(path.join(targetRoot, "lyrics.js"), "utf8");
    assert(installedJs.includes("EmbyLyricEnhance/PublicConfiguration"));
    assert.strictEqual((installedJs.match(/ELYRIC_ENHANCE_BEGIN:4\.9\.5\.0/g) || []).length, 1,
        "the recovered original must receive exactly one current adapter payload");
    assert.strictEqual(fs.readFileSync(path.join(originalRoot, "lyrics.js"), "utf8"), originalJs,
        "installation must preserve the validated pristine backup");

    console.log("container manager pristine-image recovery and reinjection: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
