# 测试、命令与故障证据归档

归档日期：2026-08-13

## 1. 本地环境

| 项目 | 值 |
|---|---|
| 工作区 | `EmbyMusicUI` 仓库根目录 |
| Shell | Windows PowerShell |
| Node | Codex bundled Node.js |
| Node 路径 | `%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` |
| Git 基线 | `main@71f0662` |
| 前端构建 | `2026.08.13-theme-v5-fixed-canvas-sync-r2` |
| DLL | `plugin/artifacts/package/EmbyLyricEnhance.dll` |
| DLL SHA-256 | `5B4601BB75168A98F4B8360830451BE3A0BED9C7803288091F35CFC4320C693B` |

## 2. 已执行并通过的本地验证

以下命令可从当前任务的测试记录确认已通过：

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check adapters\4.9.5.0\lyrics.inject.js

& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\anchored-canvas-v4.test.js
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\theme-v2-contract.test.js
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\single-root-osd.test.js
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\videoosd-runtime.test.js
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\plugin-integration.test.js
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\plugin-config-page.test.js

powershell -NoProfile -ExecutionPolicy Bypass -File plugin\scripts\test-core.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File plugin\scripts\build.ps1

git diff --check
```

验证覆盖：

- JavaScript 语法。
- `1920 × 1080` / `1080 × 1920` fixed canvas 和 contain 缩放。
- Theme V5 参数、迁移、序列化与服务端模型合同。
- 单根播放器 DOM 合同。
- Workspace 初始化、账号/服务器隔离、500ms 防抖 PUT、revision 冲突。
- 插件入口、配置页和真实 MediaBrowser API 合同编译。
- Core 测试和单 DLL Release 构建。
- 补丁空白与冲突标记检查。

## 3. 本地环境未执行的测试

下列测试依赖 POSIX `sh`，本轮 Windows 环境没有可用的 POSIX shell，因此未在本地运行：

```powershell
& '<node.exe>' tests\container-manager.test.js
& '<node.exe>' tests\docker-install.test.js
& '<node.exe>' tests\docker-plugin-install.test.js
```

这是测试宿主环境限制，不代表功能失败。应在 Linux/Docker 宿主机或包含 POSIX shell 的 CI 中补跑。

## 4. 用户在服务器执行过的关键命令

```sh
git pull --ff-only origin main
sh docker-install.sh
sh docker-install.sh emby-emby-server-1 ede
```

统一安装器的交互选择曾为：

```text
容器：1（emby-emby-server-1）
功能：1 2 3
```

执行结果：前端安装成功、DLL 安装成功；第一版 EDE 特征检查拒绝修改。拉取更新后，单独执行 EDE 修复成功，并在 `/config/emby-lyric-enhance/ede-1.47/original/ede.user.js` 保存原文件。

## 5. Git 拉取冲突证据

服务器曾两次因本地修改拒绝 fast-forward：

```text
docker-install.sh
scripts/ede-manager.sh
```

以及：

```text
docker-plugin-install.sh
scripts/container-manager.sh
```

Git 的行为是正确的：`git pull --ff-only` 不会覆盖工作区修改。安全的同步与明确覆盖流程见[部署文档](DEPLOYMENT_AND_VERIFICATION_CN.md)。

## 6. 原生 AMD 模块 404 证据

浏览器控制台曾出现：

```text
GET /web/modules/common/browser.js?v=4.9.5.0 404
GET /web/modules/common/common/appsettings.js?v=4.9.5.0 404
GET /web/modules/common/emby-apiclient/events.js?v=4.9.5.0 404
Uncaught (in promise) Error: Load failed: modules/common/browser.js
```

用户还观察到 `servicelocator.js`、`qualitydetection.js`、`browser.js`、`appsettings.js` 和 `events.js` 存在概率性未加载。该问题与 EDE 1.47 页面生命周期/AMD 加载冲突一起处理，同时安装器坚持 `lyrics.js/lyrics.css` 使用原版文件，避免把不完整模块路径写回系统目录。

## 7. 最后一次真实浏览器调查

最后一次可确认的线上会话中，真实页面不是可验收状态：

```text
workspaceRevision=0
apiAvailable=false
workspaceSource=safe-default
```

服务端请求：

```text
GET /emby/EmbyLyricEnhance/UserWorkspace -> HTTP 500
GET /emby/EmbyLyricEnhance/Themes        -> HTTP 500
```

响应：

```text
The plugin theme store is not initialized.
```

页面同时存在以下视觉问题：

- 测试歌曲没有可用歌词，根节点为 `data-elyric-has-lyrics=false`。
- 封面过大或错位。
- 控制区下方有空卡片。
- 频谱区域被压缩或与其他图层重叠。
- 控制坞内容溢出。
- 默认图层几何发生覆盖。

## 8. 调查后的本地修复

`71f0662` 包含以下 r2 修复：

- 横屏固定 `1920 × 1080`，竖屏固定 `1080 × 1920`。
- 非目标比例 contain 居中缩放，不拉伸、不扩展长边。
- 调整五个默认图层的安全几何。
- 修正控制坞按钮尺寸和旧移动端 CSS 对 V5 布局的干扰。
- 增强 Workspace 草稿、revision 和账号同步诊断。
- 服务端主题存储初始化回退与持久化路径修复。
- 旧主题存储迁移。
- 重新构建 `EmbyLyricEnhance.dll`。

本地通过不等于线上通过。必须部署 r2 前端和 DLL、重启容器、清理站点缓存，然后重新读取 API、诊断对象和真实页面。

## 9. 本次归档操作的可复核命令

```powershell
git status -sb
git branch --show-current
git remote -v
git diff --stat
git log -8 --oneline --decorate --all

Get-FileHash -Algorithm SHA256 <参考图片或DLL路径>
git diff --check
```

20 张图片均从仍存在的本地临时附件按原字节复制。EDE 附件做过静态敏感模式检查：脚本包含运行时从 Emby API 获取 token 的代码路径，但附件中没有发现硬编码的真实 Authorization、Cookie 或静态访问令牌。
