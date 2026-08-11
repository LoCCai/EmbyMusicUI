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

const vulnerableEde = `function destroy() {
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
const temporaryRoot = fs.mkdtempSync(path.join(root, ".elyric-ede-test-"));

try {
    const target = path.join(temporaryRoot, "ede.user.js");
    const backupRoot = path.join(temporaryRoot, "backup");

    function run(action, overrides) {
        return spawnSync(shell, [posixPath(manager), action], {
            cwd: root,
            encoding: "utf8",
            env: {
                ...process.env,
                EDE_TARGET: posixPath(target),
                EDE_BACKUP_ROOT: posixPath(backupRoot),
                ...(overrides || {})
            }
        });
    }

    function expectSuccess(result, label) {
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
    assert(fixed.includes("window.ede.itemId = params.id || '';"));
    assert(!fixed.includes("window.ede.itemId = e.detail.params.id"));
    assert.strictEqual((fixed.match(/if \(window\.ede\.danmaku\) \{/g) || []).length, 4,
        "the four valid danmaku checks outside beforeDestroy must remain untouched");
    assert.strictEqual((fixed.match(/if \(window\.ede && window\.ede\.danmaku\) \{/g) || []).length, 1,
        "only beforeDestroy should receive the lifecycle guard");
    assert(fixed.indexOf("window.ede = createEde();") < fixed.indexOf("window.ede.itemId = params.id || '';"),
        "itemId must be assigned only after the EDE instance is created");
    assert.strictEqual(
        fs.readFileSync(path.join(backupRoot, "original", "ede.user.js"), "utf8"),
        vulnerableEde,
        "the exact original EDE file must remain recoverable"
    );

    const repeated = run("install");
    expectSuccess(repeated, "idempotent repeated EDE repair");
    assert(repeated.stdout.includes("无需重复修改"));
    assert.strictEqual(fs.readFileSync(target, "utf8"), fixed,
        "repeated installation must not alter the fixed file");

    const status = run("status");
    expectSuccess(status, "fixed EDE status");
    assert(status.stdout.includes("修复已应用"));

    const restore = run("restore");
    expectSuccess(restore, "EDE original restoration");
    assert.strictEqual(fs.readFileSync(target, "utf8"), vulnerableEde);
    assert(fs.readdirSync(path.join(backupRoot, "restore-safety")).length === 1,
        "restore must preserve the replaced fixed file");

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
