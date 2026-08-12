"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const manager = path.join(root, "scripts", "container-manager.sh");
const adapterJs = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.js"), "utf8");
const adapterCss = fs.readFileSync(path.join(root, "adapters", "4.9.5.0", "lyrics.inject.css"), "utf8");
const managerSource = fs.readFileSync(manager, "utf8");
const jsBuild = adapterJs.match(/ELYRIC_BUILD:([^\s*]+)/);
const cssBuild = adapterCss.match(/ELYRIC_BUILD:([^\s*]+)/);
const managerBuild = managerSource.match(/^BUILD_ID="([^"]+)"/m);
assert(jsBuild && cssBuild && managerBuild);
assert.strictEqual(jsBuild[1], cssBuild[1]);
assert.strictEqual(managerBuild[1], jsBuild[1]);

function findShell() {
    for (const candidate of [process.env.TEST_SH, process.platform === "win32" ? "C:\\Program Files\\Git\\bin\\sh.exe" : null, "sh"].filter(Boolean)) {
        const probe = spawnSync(candidate, ["-c", "exit 0"]);
        if (!probe.error && probe.status === 0) return candidate;
    }
    throw new Error("POSIX sh was not found");
}
function posixPath(value) {
    const normalized = value.replace(/\\/g, "/");
    return /^[A-Za-z]:\//.test(normalized) ? `/${normalized[0].toLowerCase()}${normalized.slice(2)}` : normalized;
}
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

const temporaryRoot = fs.mkdtempSync(path.join(root, ".elyric-container-manager-test-"));
try {
    const targetRoot = path.join(temporaryRoot, "system", "dashboard-ui", "videoosd");
    const configRoot = path.join(temporaryRoot, "config");
    const payloadRoot = path.join(temporaryRoot, "payload");
    const recoveryRoot = path.join(temporaryRoot, "recovered-original");
    [targetRoot, configRoot, payloadRoot, recoveryRoot].forEach((directory) => fs.mkdirSync(directory, { recursive: true }));
    const originals = {
        "videoosd.js": "define(function(){_exports.default=VideoOsd});\n",
        "videoosd.css": ".videoOsd { display: block; }\n",
        "lyrics.js": "define(function(){_exports.default=LyricsRenderer});\n",
        "lyrics.css": ".lyricsItem { color: white; }\n"
    };
    const payloadJs = "/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */\nvar PUBLIC_CONFIGURATION_PATH=\"EmbyLyricEnhance/PublicConfiguration\";\n/* ELYRIC_ENHANCE_END:4.9.5.0 */\n";
    const payloadCss = "/* ELYRIC_ENHANCE_BEGIN:4.9.5.0 */\n.elyric-player-root{}\n/* ELYRIC_ENHANCE_END:4.9.5.0 */\n";
    Object.entries(originals).forEach(([name, content]) => {
        fs.writeFileSync(path.join(targetRoot, name), content);
        fs.writeFileSync(path.join(recoveryRoot, name), content);
    });
    fs.writeFileSync(path.join(payloadRoot, "lyrics.inject.js"), payloadJs);
    fs.writeFileSync(path.join(payloadRoot, "lyrics.inject.css"), payloadCss);
    const environment = {
        ...process.env,
        ELYRIC_TARGET_ROOT: posixPath(path.relative(root, targetRoot)),
        ELYRIC_CONFIG_ROOT: posixPath(path.relative(root, configRoot)),
        ELYRIC_PAYLOAD_ROOT: posixPath(path.relative(root, payloadRoot)),
        ELYRIC_RECOVERY_ROOT: posixPath(path.relative(root, recoveryRoot)),
        ELYRIC_EXPECTED_VIDEOOSD_JS: sha256(originals["videoosd.js"]),
        ELYRIC_EXPECTED_VIDEOOSD_CSS: sha256(originals["videoosd.css"]),
        ELYRIC_EXPECTED_LYRICS_JS: sha256(originals["lyrics.js"]),
        ELYRIC_EXPECTED_LYRICS_CSS: sha256(originals["lyrics.css"])
    };
    const shell = findShell();
    const run = (action) => spawnSync(shell, [posixPath(path.relative(root, manager)), action], { cwd: root, encoding: "utf8", env: environment });

    let result = run("recover-original");
    assert.strictEqual(result.status, 0, result.stderr);
    result = run("install");
    assert.strictEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const installedVideoOsd = fs.readFileSync(path.join(targetRoot, "videoosd.js"), "utf8");
    assert(installedVideoOsd.includes("EmbyLyricEnhance/PublicConfiguration"));
    assert.strictEqual((installedVideoOsd.match(/ELYRIC_ENHANCE_BEGIN:4\.9\.5\.0/g) || []).length, 1);
    assert.strictEqual(fs.readFileSync(path.join(targetRoot, "lyrics.js"), "utf8"), originals["lyrics.js"], "native lyrics must be pristine");
    assert.strictEqual(fs.readFileSync(path.join(targetRoot, "lyrics.css"), "utf8"), originals["lyrics.css"], "native lyric CSS must be pristine");

    fs.writeFileSync(path.join(payloadRoot, "lyrics.inject.js"), payloadJs.replace("PublicConfiguration", "PublicConfigurationV2"));
    result = run("enhanced");
    assert.strictEqual(result.status, 0, result.stderr);
    assert(fs.readFileSync(path.join(targetRoot, "videoosd.js"), "utf8").includes("PublicConfigurationV2"));
    result = run("original");
    assert.strictEqual(result.status, 0, result.stderr);
    Object.entries(originals).forEach(([name, content]) => assert.strictEqual(fs.readFileSync(path.join(targetRoot, name), "utf8"), content));

    // A deployed V4 installation lives in lyrics.js. With complete pristine
    // backups, V5 must migrate it into videoosd.js and restore native lyrics.
    fs.writeFileSync(path.join(targetRoot, "lyrics.js"), `${originals["lyrics.js"]}${payloadJs}`);
    result = run("install");
    assert.strictEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert(fs.readFileSync(path.join(targetRoot, "videoosd.js"), "utf8").includes("ELYRIC_ENHANCE_BEGIN:4.9.5.0"));
    assert.strictEqual(fs.readFileSync(path.join(targetRoot, "lyrics.js"), "utf8"), originals["lyrics.js"]);
    console.log("four-file VideoOsd injection, pristine lyrics and rollback: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
