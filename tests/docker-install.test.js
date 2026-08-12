"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const installer = path.join(root, "docker-install.sh");

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
    throw new Error("POSIX sh was not found for the unified Docker installer test");
}

const shell = findShell();
const temporaryRoot = fs.mkdtempSync(path.join(root, ".elyric-frontend-docker-test-"));

try {
    const fakeBin = path.join(temporaryRoot, "bin");
    const dockerLog = path.join(temporaryRoot, "docker.log");
    fs.mkdirSync(fakeBin, { recursive: true });

    const fakeDocker = path.join(fakeBin, "docker");
    fs.writeFileSync(fakeDocker, `#!/bin/sh
set -eu
command=$1
shift
printf '%s %s\\n' "$command" "$*" >> "$FAKE_DOCKER_LOG"
case "$command" in
    info)
        exit 0
        ;;
    ps)
        case "$*" in
            *'|'*)
                if [ "\${FAKE_PS_MODE:-matches}" = "no-match" ]; then
                    printf '%s\\n' 'def456|database|postgres:16|Up 1 hour'
                else
                    printf '%s\\n' 'abc123|emby-auto|emby/embyserver:4.9.5.0|Up 1 hour'
                    printf '%s\\n' 'def456|database|postgres:16|Up 1 hour'
                fi
                ;;
            *)
                printf '%s\\n' 'emby-auto  emby/embyserver:4.9.5.0  Up 1 hour'
                printf '%s\\n' 'database   postgres:16                  Up 1 hour'
                ;;
        esac
        ;;
    inspect)
        case "$*" in
            *'.State.Running'*) printf '%s\\n' true ;;
            *'.Destination "/config"'*) printf '%s\\n' /host/emby-config ;;
            *'println .Destination'*) printf '%s\\n' /config ;;
        esac
        ;;
    cp)
        exit 0
        ;;
    exec)
        case "$*" in
            *ELYRIC_ENHANCE_BEGIN*) exit 1 ;;
        esac
        if [ "\${FAKE_FAIL_COMPONENT:-}" = "frontend" ]; then
            case "$*" in
                *container-manager.sh*install*) exit 71 ;;
            esac
        fi
        if [ "\${FAKE_FAIL_COMPONENT:-}" = "ede" ]; then
            case "$*" in
                *ede-manager.sh*install*) exit 72 ;;
            esac
        fi
        exit 0
        ;;
    restart)
        exit 0
        ;;
    *)
        printf 'unexpected docker command: %s\\n' "$command" >&2
        exit 90
        ;;
esac
`, "utf8");
    fs.chmodSync(fakeDocker, 0o755);

    const localPath = (value) => posixPath(path.relative(root, value));

    function runInteractive(input, mode, args, overrides) {
        return spawnSync(shell, [localPath(installer), ...(args || [])], {
            cwd: root,
            encoding: "utf8",
            input,
            env: {
                ...process.env,
                PATH: `${localPath(fakeBin)}:/usr/bin:/bin`,
                FAKE_DOCKER_LOG: localPath(dockerLog),
                FAKE_PS_MODE: mode || "matches",
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

    function resetLog() {
        fs.writeFileSync(dockerLog, "", "utf8");
    }

    function logLines(prefix) {
        return fs.readFileSync(dockerLog, "utf8")
            .split(/\r?\n/)
            .filter((line) => line.startsWith(prefix));
    }

    const automatic = runInteractive("not-a-number\n99\n1\r\n\nbad\n1,2\n1 2 3\n");
    expectSuccess(automatic, "automatic container selection and combined execution");
    assert(automatic.stdout.includes("自动发现可能的 Emby 容器"));
    assert(automatic.stdout.includes("1) emby-auto"));
    assert(automatic.stdout.includes("请输入列表中的数字序号"));
    assert(automatic.stdout.includes("序号超出范围"));
    assert.strictEqual((automatic.stdout.match(/输入无效/g) || []).length, 3);
    assert(automatic.stdout.includes("执行完成：1 2 3"));
    assert.strictEqual(logLines("restart emby-auto").length, 1,
        "selecting all features must restart the container exactly once");

    resetLog();
    const frontendOnly = runInteractive("1\n", null, ["emby-test"]);
    expectSuccess(frontendOnly, "single frontend feature");
    assert(frontendOnly.stdout.includes("执行完成：1"));
    assert.strictEqual(logLines("restart ").length, 0,
        "frontend-only installation must not restart the container");

    resetLog();
    const duplicates = runInteractive("1 2 1\n", null, ["emby-test"]);
    expectSuccess(duplicates, "duplicate feature removal");
    assert(duplicates.stdout.includes("执行功能：1 2"));
    assert.strictEqual(logLines("cp ").filter((line) => line.includes("lyrics.inject.js")).length, 1,
        "a duplicated frontend feature must execute once");
    assert.strictEqual(logLines("restart emby-test").length, 1,
        "a duplicated plugin feature must still restart once");

    resetLog();
    const pluginOnly = runInteractive("2\n", null, ["emby-test"]);
    expectSuccess(pluginOnly, "single plugin feature");
    assert.strictEqual(logLines("restart emby-test").length, 1,
        "plugin-only installation must restart exactly once");

    resetLog();
    const cancelledUninstall = runInteractive("4\nNO\n", null, ["emby-test"]);
    expectSuccess(cancelledUninstall, "cancelled full restoration");
    assert(cancelledUninstall.stdout.includes("已取消，未修改容器"));
    assert.strictEqual(fs.readFileSync(dockerLog, "utf8").includes("ede-manager.sh uninstall"), false,
        "a cancelled restoration must not run any destructive component");

    resetLog();
    const uninstall = runInteractive("4\nYES\n", null, ["emby-test"]);
    expectSuccess(uninstall, "confirmed full restoration");
    const uninstallLog = fs.readFileSync(dockerLog, "utf8");
    assert(uninstall.stdout.includes("本项目已卸载并恢复安装前原文件"));
    assert(uninstallLog.includes("ede-manager.sh uninstall"),
        "full restoration should restore the original EDE file");
    assert(uninstallLog.includes("container-manager.sh original"),
        "full restoration should restore the original lyrics frontend pair");
    assert(uninstallLog.includes("uninstall-safety-"),
        "full restoration should preserve and remove the project plugin DLLs");
    assert.strictEqual(logLines("restart emby-test").length, 1,
        "full restoration must restart the container exactly once after removing the DLL");

    resetLog();
    const failedFrontend = runInteractive("1 2 3\n", null, ["emby-test"], {
        FAKE_FAIL_COMPONENT: "frontend"
    });
    assert.notStrictEqual(failedFrontend.status, 0, "a failed component must stop the bundle");
    const failureLog = fs.readFileSync(dockerLog, "utf8");
    assert(!failureLog.includes("EmbyLyricEnhance.dll"),
        "a failed frontend step must stop before plugin installation");
    assert(!failureLog.includes("ede-manager.sh"),
        "a failed frontend step must stop before the EDE repair");
    assert.strictEqual(logLines("restart ").length, 0,
        "a failed bundle must not restart the container");

    resetLog();
    const failedEde = runInteractive("1 2 3\n", null, ["emby-test"], {
        FAKE_FAIL_COMPONENT: "ede"
    });
    assert.notStrictEqual(failedEde.status, 0, "a failed final component must fail the bundle");
    const edeFailureLog = fs.readFileSync(dockerLog, "utf8");
    assert(edeFailureLog.includes("EmbyLyricEnhance.dll"),
        "steps before the EDE failure should have completed");
    assert.strictEqual(logLines("restart emby-test").length, 1,
        "a failure after DLL installation must not prevent the required DLL restart");
    assert(failedEde.stderr.includes("前面已成功执行的功能不会回滚")
        && failedEde.stderr.includes("已完成的前端或 DLL 更新仍然有效"),
    "a partial bundle failure should explain that completed components remain installed");

    resetLog();
    const manualFallback = runInteractive("2\nmanual-emby\n3\n");
    expectSuccess(manualFallback, "manual input after automatic discovery");
    assert(manualFallback.stdout.includes("当前正在运行的全部 Docker 容器"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect manual-emby"));
    assert.strictEqual(logLines("restart ").length, 0,
        "the EDE repair does not require a container restart");

    resetLog();
    const noMatch = runInteractive("manually-entered-emby\n1\n", "no-match");
    expectSuccess(noMatch, "manual input when no Emby-like container exists");
    assert(noMatch.stdout.includes("没有自动发现"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect manually-entered-emby"));

    console.log("unified Docker installer selection, multi-select, deduplication and single restart: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
