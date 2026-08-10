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
    throw new Error("POSIX sh was not found for the frontend Docker installer test");
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
        esac
        ;;
    cp|exec)
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

    function runInteractive(input, mode) {
        return spawnSync(shell, [localPath(installer)], {
            cwd: root,
            encoding: "utf8",
            input,
            env: {
                ...process.env,
                PATH: `${localPath(fakeBin)}:/usr/bin:/bin`,
                FAKE_DOCKER_LOG: localPath(dockerLog),
                FAKE_PS_MODE: mode || "matches"
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

    const automatic = runInteractive("not-a-number\n99\n1\r\n4\n");
    expectSuccess(automatic, "automatic Emby container selection");
    assert(automatic.stdout.includes("自动发现可能的 Emby 容器"));
    assert(automatic.stdout.includes("1) emby-auto"));
    assert(automatic.stdout.includes("没有我要的容器，手动输入"));
    assert(automatic.stdout.includes("请输入列表中的数字序号"));
    assert(automatic.stdout.includes("序号超出范围"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect emby-auto"));

    fs.writeFileSync(dockerLog, "", "utf8");
    const manualFallback = runInteractive("2\nmanual-emby\n4\n");
    expectSuccess(manualFallback, "manual input after automatic discovery");
    assert(manualFallback.stdout.includes("当前正在运行的全部 Docker 容器"));
    assert(manualFallback.stdout.includes("请输入 Emby 容器名或容器 ID"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect manual-emby"));

    fs.writeFileSync(dockerLog, "", "utf8");
    const noMatch = runInteractive("manually-entered-emby\n4\n", "no-match");
    expectSuccess(noMatch, "manual input when no Emby-like container exists");
    assert(noMatch.stdout.includes("没有自动发现"));
    assert(noMatch.stdout.includes("当前正在运行的全部 Docker 容器"));
    assert(fs.readFileSync(dockerLog, "utf8").includes("inspect manually-entered-emby"));

    console.log("frontend Docker container discovery, numbered selection and manual input: ok");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
