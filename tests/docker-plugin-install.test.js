"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const installer = path.join(root, "docker-plugin-install.sh");

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
        printf '%s\\n' 'emby-test fake/image running'
        ;;
    inspect)
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
        fs.writeFileSync(path.join(packageRoot, "EmbyLyricEnhance.Core.dll"), `core-${version}`, "utf8");
    }

    function run(action, backupName, overrides) {
        const localPath = (value) => posixPath(path.relative(root, value));
        const args = [localPath(installer), "emby-test", action];
        if (backupName) {
            args.push(backupName);
        }
        const environment = {
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
        return spawnSync(shell, args, { cwd: root, encoding: "utf8", env: environment });
    }

    function expectSuccess(result, label) {
        assert.strictEqual(
            result.status,
            0,
            `${label} failed:\nstdout=${result.stdout}\nstderr=${result.stderr}`
        );
    }

    writePackage("v1");
    expectSuccess(run("install"), "first install");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"), "plugin-v1");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll"), "utf8"), "core-v1");

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
    assert(status.stdout.includes("EmbyLyricEnhance.Core.dll"));

    expectSuccess(run("rollback"), "rollback");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"), "plugin-v1");
    assert.strictEqual(fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll"), "utf8"), "core-v1");
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
    assert.notStrictEqual(partialFailure.status, 0, "a partial two-DLL replacement should report failure");
    assert.strictEqual(
        fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.dll"), "utf8"),
        "plugin-v3",
        "a failed second move should restore the previous plugin DLL"
    );
    assert.strictEqual(
        fs.readFileSync(path.join(remotePlugins, "EmbyLyricEnhance.Core.dll"), "utf8"),
        "core-v3",
        "a failed second move should also restore the previous core DLL"
    );

    const unpersisted = run("install", null, { FAKE_MOUNT_DESTINATION: "/not-the-config-mount" });
    assert.notStrictEqual(unpersisted.status, 0, "installation should stop when the config path is not persistent");
    assert(unpersisted.stderr.includes("没有持久挂载"));

    console.log("docker plugin install, backup, rollback, restart and persistence checks: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
