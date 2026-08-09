"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const installer = path.join(root, "docker-plugin-install.sh");
const releasePackage = path.join(root, "plugin", "artifacts", "package");
const releasePlugin = path.join(releasePackage, "EmbyLyricEnhance.dll");
assert(fs.statSync(releasePlugin).size > 0, "prebuilt release plugin DLL is missing or empty");
assert(!fs.existsSync(path.join(releasePackage, "EmbyLyricEnhance.Core.dll")),
    "the release package must not contain the obsolete standalone Core DLL");

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
    throw new Error("POSIX sh was not found for the Docker installer test");
}

const shell = findShell();
const temporaryRoot = fs.mkdtempSync(path.join(root, ".elyric-docker-test-"));

try {
    const fakeBin = path.join(temporaryRoot, "bin");
    const packageRoot = path.join(temporaryRoot, "package");
    const remoteConfig = path.join(temporaryRoot, "remote-config");
    const remotePlugins = path.join(remoteConfig, "plugins");
    const remoteBackup = path.join(remoteConfig, "emby-lyric-enhance", "plugin-backup");
    const remoteStage = path.join(temporaryRoot, "remote-stage");
    const dockerLog = path.join(temporaryRoot, "docker.log");
    fs.mkdirSync(fakeBin, { recursive: true });
    fs.mkdirSync(packageRoot, { recursive: true });

    const fakeDocker = path.join(fakeBin, "docker");
    fs.writeFileSync(fakeDocker, `#!/bin/sh
set -eu
command=$1
shift
case "$command" in
    info)
        exit 0
        ;;
    ps)
        if [ "\${FAKE_PS_MODE:-matches}" = "no-match" ]; then
            printf '%s\\n' 'def456|database|postgres:16|Up 1 hour'
        else
            printf '%s\\n' 'abc123|emby-auto|emby/embyserver:4.9.5.0|Up 1 hour'
            printf '%s\\n' 'def456|database|postgres:16|Up 1 hour'
        fi
        ;;
    inspect)
        printf 'inspect %s\\n' "$*" >> "$FAKE_DOCKER_LOG"
        if [ "\${1:-}" = "--format" ]; then
            printf '%s\\n' "$FAKE_MOUNT_DESTINATION"
        fi
        exit 0
        ;;
    cp)
        source_file=$1
        target_file=\${2#*:}
        mkdir -p "$(dirname -- "$target_file")"
        cp "$source_file" "$target_file"
        ;;
    exec)
        if [ "\${1:-}" = "-u" ]; then
            shift 2
        fi
        shift
        PATH="$FAKE_BIN:$PATH"
        export PATH
        exec "$@"
        ;;
    restart)
        printf 'restart %s\\n' "$1" >> "$FAKE_DOCKER_LOG"
        ;;
    *)
        printf 'unexpected docker command: %s\\n' "$command" >&2
        exit 90
        ;;
esac
`, "utf8");
    fs.chmodSync(fakeDocker, 0o755);

    const fakeMove = path.join(fakeBin, "mv");
    fs.writeFileSync(fakeMove, `#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "$FAKE_MV_LOG"
source_file=
for argument in "$@"; do
    case "$argument" in
        */EmbyLyricEnhance.dll.new) source_file=$argument ;;
    esac
done
if [ "\${FAKE_FAIL_PLUGIN_MOVE_ONCE:-0}" = "1" ] &&
   [ -n "$source_file" ] &&
   [ ! -f "$FAKE_MV_MARKER" ]; then
    : > "$FAKE_MV_MARKER"
    exit 1
fi
exec /usr/bin/mv "$@"
`, "utf8");
    fs.chmodSync(fakeMove, 0o755);

    function writePackage(version) {
        fs.writeFileSync(path.join(packageRoot, "EmbyLyricEnhance.dll"), `plugin-${version}`, "utf8");
        fs.rmSync(path.join(packageRoot, "EmbyLyricEnhance.Core.dll"), { force: true });
    }

    const localPath = (value) => posixPath(path.relative(root, value));

    function createEnvironment(overrides) {
        return {
            ...process.env,
            PATH: `${localPath(fakeBin)}:/usr/bin:/bin`,
            ELYRIC_PACKAGE_ROOT: localPath(packageRoot),
            ELYRIC_REMOTE_STAGE: localPath(remoteStage),
            ELYRIC_REMOTE_PLUGINS: localPath(remotePlugins),
            ELYRIC_REMOTE_BACKUP: localPath(remoteBackup),
            ELYRIC_CONFIG_DESTINATION: localPath(remoteConfig),
            FAKE_MOUNT_DESTINATION: localPath(remoteConfig),
            FAKE_DOCKER_LOG: localPath(dockerLog),
            FAKE_BIN: localPath(fakeBin),
            FAKE_MV_LOG: localPath(path.join(temporaryRoot, "mv.log")),
            FAKE_MV_MARKER: localPath(path.join(temporaryRoot, "mv-failed-once")),
            ...(overrides || {})
        };
    }

    function run(action, backupName, overrides) {
        const args = [localPath(installer), "emby-test", action];
        if (backupName) {
            args.push(backupName);
        }
        return spawnSync(shell, args, { cwd: root, encoding: "utf8", env: createEnvironment(overrides) });
    }

    function runInteractive(input, overrides) {
        return spawnSync(shell, [localPath(installer)], {
            cwd: root,
            encoding: "utf8",
            env: createEnvironment(overrides),
            input
        });
    }

    function expectSuccess(result, label) {
        assert.strictEqual(
            result.status,
            0,
            `${label} failed:\nstdout=${result.stdout}\nstderr=${result.stderr}`
        );
    }

    fs.mkdirSync(remotePlugins, { recursive: true });
    fs.writeFileSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll"), "legacy-core", "utf8");
    writePackage("v1");
    expectSuccess(run("install"), "first install");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"), "plugin-v1");
    assert(!fs.existsSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll")),
        "installing the single-DLL package should remove the legacy Core DLL");
    const migrationBackup = fs.readFileSync(path.join(remoteBackup, "latest-install"), "utf8").trim();
    assert.strictEqual(
        fs.readFileSync(path.join(remoteBackup, migrationBackup, "EmbyLyricEnhance.Core.dll"), "utf8"),
        "legacy-core",
        "the removed legacy Core DLL should remain recoverable in the installation backup"
    );

    writePackage("v2");
    expectSuccess(run("install"), "second install");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"), "plugin-v2");
    const latestBackup = fs.readFileSync(path.join(remoteBackup, "latest-install"), "utf8").trim();
    assert.strictEqual(
        fs.readFileSync(path.join(remoteBackup, latestBackup, "EmbyLyricEnhance.dll"), "utf8"),
        "plugin-v1",
        "the second install should back up the first plugin as one restorable set"
    );

    const backupList = run("backups");
    expectSuccess(backupList, "backup listing");
    assert(backupList.stdout.includes(latestBackup) && backupList.stdout.includes("available"));

    const status = run("status");
    expectSuccess(status, "status");
    assert(status.stdout.includes("EmbyLyricEnhance.dll"));
    assert(status.stdout.includes("旧版独立 Core DLL：未安装（正常）"));

    expectSuccess(run("rollback"), "rollback");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"), "plugin-v1");
    assert(!fs.existsSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll")));
    assert(fs.existsSync(path.join(remoteBackup, latestBackup, ".restored")));
    const safetyBackup = fs.readdirSync(remoteBackup).find((name) => name.startsWith("rollback-safety-"));
    assert(safetyBackup, "rollback should preserve the files it replaced");

    const repeatedRollback = run("rollback", latestBackup);
    assert.notStrictEqual(repeatedRollback.status, 0, "a consumed backup should not be applied twice accidentally");

    const unsafeBackupName = run("rollback", "../outside");
    assert.notStrictEqual(unsafeBackupName.status, 0, "backup path traversal should be rejected before Docker execution");

    expectSuccess(run("rollback", safetyBackup), "specified rollback safety backup");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"), "plugin-v2");
    assert(fs.existsSync(path.join(remoteBackup, safetyBackup, ".restored")));

    writePackage("v3");
    expectSuccess(run("install-restart"), "install and restart");
    assert(fs.readFileSync(dockerLog, "utf8").includes("restart emby-test"));

    writePackage("v4");
    const partialFailure = run("install", null, { FAKE_FAIL_PLUGIN_MOVE_ONCE: "1" });
    assert.notStrictEqual(partialFailure.status, 0, "a failed single-DLL replacement should report failure");
    assert.strictEqual(
        fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"),
        "plugin-v3",
        "a failed move should restore the previous plugin DLL"
    );
    assert(!fs.existsSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll")),
        "failure recovery should preserve the previous single-DLL layout");

    const unpersisted = run("install", null, { FAKE_MOUNT_DESTINATION: "/not-the-config-mount" });
    assert.notStrictEqual(unpersisted.status, 0, "installation should stop when the config path is not persistent");
    assert(unpersisted.stderr.includes("没有持久挂载"));

    writePackage("v5");
    const automaticSelection = runInteractive("not-a-number\n99\n1\r\n");
    expectSuccess(automaticSelection, "automatic numbered container selection");
    assert(automaticSelection.stdout.includes("1) emby-auto"));
    assert(automaticSelection.stdout.includes("没有我要的容器"));
    assert(automaticSelection.stdout.includes("请输入列表中的数字序号"));
    assert(automaticSelection.stdout.includes("序号超出范围"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect emby-auto"));

    writePackage("v6");
    const manualSelection = runInteractive("2\nmanual-emby\n");
    expectSuccess(manualSelection, "manual fallback after numbered discovery");
    assert(manualSelection.stdout.includes("当前正在运行的全部 Docker 容器"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect manual-emby"));

    writePackage("v7");
    const noMatchSelection = runInteractive("manually-entered-emby\n", { FAKE_PS_MODE: "no-match" });
    expectSuccess(noMatchSelection, "manual input when no Emby-like container is found");
    assert(noMatchSelection.stdout.includes("没有自动发现"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect manually-entered-emby"));

    console.log("docker plugin discovery, install, backup, rollback, restart and persistence checks: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
