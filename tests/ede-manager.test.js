"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const manager = path.join(root, "scripts", "ede-manager.sh");

function posixPath(value) {
    const normalized = value.replace(/\\/g, "/");
    return /^[A-Za-z]:\//.test(normalized)
        ? `/${normalized[0].toLowerCase()}${normalized.slice(2)}`
        : normalized;
}

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
    throw new Error("POSIX sh was not found for the EDE manager test");
}

const amdVulnerable = `"function"==typeof define&&define.amd?define(e):`;
const amdFixed = `"function"==typeof define&&define.amd&&!1?define(e):`;
const embeddedDanmaku = `!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():${amdVulnerable}(t="undefined"!=typeof globalThis?globalThis:t||self).Danmaku=e()}(this,function(){return {}});`;

const vulnerableEde = `${embeddedDanmaku}
function destroy() {
        window.ede.destroyIntervalIds.map(id => clearInterval(id));
        window.ede.destroyIntervalIds = [];
}
const lifecycle = {
    beforeDestroy(e) {
        if (e.detail.type !== 'video-osd') {
            return;
        }
        if (window.ede.danmaku) {
            window.ede.danmaku.destroy();
        }
    },
    onViewShow(e) {
        prepareView();
        if (e.detail.type === 'video-osd') {
            window.ede = createEde();
        }
        window.ede.itemId = e.detail.params.id ? e.detail.params.id : '';
    }
};
function unrelatedOne() { if (window.ede.danmaku) { window.ede.danmaku.refresh(); } }
function unrelatedTwo() { if (window.ede.danmaku) { window.ede.danmaku.pause(); } }
function unrelatedThree() { if (window.ede.danmaku) { window.ede.danmaku.resume(); } }
function unrelatedFour() { if (window.ede.danmaku) { window.ede.danmaku.resize(); } }
`;

const shell = findShell();
const temporaryParent = process.env.ELYRIC_TEST_TMPDIR || path.join(root, ".test-tmp");
fs.mkdirSync(temporaryParent, { recursive: true });
const temporaryRoot = fs.mkdtempSync(path.join(temporaryParent, "elyric-ede-test-"));

try {
    const target = path.join(temporaryRoot, "ede.user.js");
    const backupRoot = path.join(temporaryRoot, "backup");

    function run(action, overrides) {
        return spawnSync(shell, [posixPath(manager), action], {
            cwd: root,
            encoding: "utf8",
            timeout: 20000,
            killSignal: "SIGKILL",
            env: {
                ...process.env,
                EDE_TARGET: posixPath(target),
                EDE_BACKUP_ROOT: posixPath(backupRoot),
                ...(overrides || {})
            }
        });
    }

    function expectSuccess(result, label) {
        assert(!result.error, `${label} failed to start or timed out: ${result.error && result.error.message}`);
        assert.strictEqual(
            result.status,
            0,
            `${label} failed:\nstdout=${result.stdout}\nstderr=${result.stderr}`
        );
    }

    fs.writeFileSync(target, vulnerableEde, "utf8");
    const install = run("install");
    expectSuccess(install, "EDE repair installation");
    const fixed = fs.readFileSync(target, "utf8");
    assert(fixed.includes("const detail = e && e.detail ? e.detail : {};"));
    assert(fixed.includes("if (detail.type === 'video-osd' && window.ede) {"));
    assert(fixed.includes("window.ede.itemId = params.id || '';"));
    assert(!fixed.includes("window.ede.itemId = e.detail.params.id"));
    assert(fixed.includes(amdFixed), "the embedded Danmaku UMD wrapper must have its AMD branch disabled");
    assert(!fixed.includes(amdVulnerable), "the Alameda-polluting anonymous AMD registration must be removed");
    assert.strictEqual((fixed.match(/if \(window\.ede\.danmaku\) \{/g) || []).length, 4,
        "the four valid danmaku checks outside beforeDestroy must remain untouched");
    assert.strictEqual((fixed.match(/if \(window\.ede && window\.ede\.danmaku\) \{/g) || []).length, 1,
        "only beforeDestroy should receive the lifecycle guard");
    assert(fixed.indexOf("window.ede = createEde();") < fixed.indexOf("window.ede.itemId = params.id || '';"),
        "itemId must be assigned only after the EDE instance is created");
    assert(!fixed.includes("        const params = detail.params || {};\n        window.ede.itemId = params.id || '';"),
        "ordinary Emby views must not assign itemId through an undefined EDE instance");
    assert.strictEqual(
        fs.readFileSync(path.join(backupRoot, "original", "ede.user.js"), "utf8"),
        vulnerableEde,
        "the exact original EDE file must remain recoverable"
    );

    const lifecycleOnlyFixed = fixed.replace(amdFixed, amdVulnerable);
    fs.writeFileSync(target, lifecycleOnlyFixed, "utf8");
    const incrementalAmdRepair = run("install");
    expectSuccess(incrementalAmdRepair, "incremental AMD repair after the lifecycle fix");
    assert.strictEqual(fs.readFileSync(target, "utf8"), fixed,
        "an already lifecycle-fixed server file should receive only the missing AMD isolation");
    assert(fs.readdirSync(path.join(backupRoot, "upgrade-safety")).length >= 2,
        "each mutating repair should preserve its immediate input as an upgrade safety copy");
    assert.strictEqual(
        fs.readFileSync(path.join(backupRoot, "original", "ede.user.js"), "utf8"),
        vulnerableEde,
        "an incremental repair must not overwrite the first original backup"
    );

    const safeItemBlock = `        if (detail.type === 'video-osd' && window.ede) {
            const params = detail.params || {};
            window.ede.itemId = params.id || '';
        }`;
    const legacyItemBlock = `        const params = detail.params || {};
        window.ede.itemId = params.id || '';`;
    const legacyFixed = fixed.replace(safeItemBlock, legacyItemBlock);
    assert.notStrictEqual(legacyFixed, fixed, "the legacy lifecycle fixture must remove the video-osd guard");
    fs.writeFileSync(target, legacyFixed, "utf8");
    const legacyUpgrade = run("install");
    expectSuccess(legacyUpgrade, "upgrade from the previous EDE lifecycle repair");
    assert.strictEqual(fs.readFileSync(target, "utf8"), fixed,
        "the previous repair must be atomically upgraded without restoring the vulnerable original");
    assert.strictEqual(
        fs.readFileSync(path.join(backupRoot, "original", "ede.user.js"), "utf8"),
        vulnerableEde,
        "upgrading the previous repair must preserve the first original backup"
    );

    const repeated = run("install");
    expectSuccess(repeated, "idempotent repeated EDE repair");
    assert(repeated.stdout.includes("无需重复修改"));
    assert.strictEqual(fs.readFileSync(target, "utf8"), fixed,
        "repeated installation must not alter the fixed file");

    const status = run("status");
    expectSuccess(status, "fixed EDE status");
    assert(status.stdout.includes("EDE 页面生命周期：已修复"));
    assert(status.stdout.includes("EDE Danmaku AMD 隔离：已修复"));

    const restore = run("restore");
    expectSuccess(restore, "EDE original restoration");
    assert.strictEqual(fs.readFileSync(target, "utf8"), vulnerableEde);
    assert(fs.readdirSync(path.join(backupRoot, "restore-safety")).length === 1,
        "restore must preserve the replaced fixed file");
    const repeatedUninstall = run("uninstall");
    expectSuccess(repeatedUninstall, "idempotent EDE uninstall after restoration");
    assert(repeatedUninstall.stdout.includes("无需重复恢复"));
    assert.strictEqual(fs.readdirSync(path.join(backupRoot, "restore-safety")).length, 1,
        "an already restored EDE file must not create redundant safety backups");

    fs.rmSync(backupRoot, { recursive: true, force: true });
    const serverDestroyEde = vulnerableEde.replace("function destroy() {", "function destroyAllInterval() {");
    fs.writeFileSync(target, serverDestroyEde, "utf8");
    const serverDestroyInstall = run("install");
    expectSuccess(serverDestroyInstall, "EDE repair with the server's destroyAllInterval helper");
    const serverDestroyFixed = fs.readFileSync(target, "utf8");
    assert(serverDestroyFixed.includes("ede.destroyIntervalIds.forEach(id => clearInterval(id));"));
    assert(!serverDestroyFixed.includes("window.ede.destroyIntervalIds.map(id => clearInterval(id));"),
        "the verified server destroyAllInterval helper should receive the timer guard");
    assert(serverDestroyFixed.includes(amdFixed));

    fs.rmSync(backupRoot, { recursive: true, force: true });
    const missingUmd = vulnerableEde.replace(embeddedDanmaku, "window.Danmaku = function Danmaku() {};");
    fs.writeFileSync(target, missingUmd, "utf8");
    const missingUmdResult = run("install");
    assert.notStrictEqual(missingUmdResult.status, 0,
        "a lifecycle-shaped file without the verified Danmaku UMD wrapper must be rejected");
    assert.strictEqual(fs.readFileSync(target, "utf8"), missingUmd,
        "a missing UMD signature must leave the EDE file untouched");

    const duplicateUmd = vulnerableEde.replace(embeddedDanmaku, `${embeddedDanmaku}\n${embeddedDanmaku}`);
    fs.writeFileSync(target, duplicateUmd, "utf8");
    const duplicateUmdResult = run("install");
    assert.notStrictEqual(duplicateUmdResult.status, 0,
        "multiple matching UMD wrappers must be rejected instead of broadly replaced");
    assert.strictEqual(fs.readFileSync(target, "utf8"), duplicateUmd,
        "ambiguous UMD signatures must leave the EDE file untouched");

    fs.rmSync(target);
    const absent = run("install");
    expectSuccess(absent, "missing EDE safe skip");
    assert(absent.stdout.includes("安全跳过"));

    fs.writeFileSync(target, "console.log('different EDE version');\n", "utf8");
    const unknown = run("install");
    assert.notStrictEqual(unknown.status, 0, "an unrecognized EDE version must be rejected");
    assert(unknown.stderr.includes("全局/目标函数") && unknown.stderr.includes("beforeDestroy-danmaku="),
        "an unrecognized file should report global and function-scope feature counts");
    assert.strictEqual(fs.readFileSync(target, "utf8"), "console.log('different EDE version');\n",
        "an unrecognized EDE file must remain untouched");

    console.log("EDE 1.47 guarded repair, idempotency, backup and restore: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
