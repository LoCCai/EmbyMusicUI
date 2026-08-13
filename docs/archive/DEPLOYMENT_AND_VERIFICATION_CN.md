# Git、安装、恢复原装与真实环境验收

本文记录 2026-08-13 r2 构建的服务器操作方式。命令应在 Emby Docker 宿主机的仓库目录执行。

## 1. 正常从 Git 更新并安装

确认服务器工作区没有需要保留的本地修改：

```sh
git status --short
git pull --ff-only origin main
sh docker-install.sh
```

在交互菜单中选择目标 Emby 容器，然后输入：

```text
1 2
```

含义：安装/更新单根播放器前端和服务端插件 DLL。统一脚本在 DLL 更新后会重启容器一次。

如果还需要应用 EDE 1.47 兼容修复，输入：

```text
1 2 3
```

也可以非交互执行全部功能：

```sh
sh docker-install.sh emby-emby-server-1 all
```

只更新 DLL：

```sh
sh docker-install.sh emby-emby-server-1 plugin
```

只应用 EDE 修复：

```sh
sh docker-install.sh emby-emby-server-1 ede
```

## 2. 服务器有本地修改时

`git pull --ff-only` 拒绝覆盖本地文件是保护机制。推荐先保存修改，再拉取：

```sh
git status --short
git diff > ../EmbyMusicUI-server-local.patch
git stash push -u -m "server local changes before upstream sync"
git pull --ff-only origin main
```

若确认服务器本地代码全部不要，并明确要让 `origin/main` 覆盖，仍应先生成补丁，然后执行：

```sh
git fetch origin main
git reset --hard origin/main
```

`git reset --hard` 会丢弃已跟踪文件的本地修改；不要在未检查路径、未保存补丁时执行。它不会自动删除未跟踪文件，本项目也不建议用广泛的清理命令处理服务器目录。

## 3. 卸载并恢复安装前原文件

交互执行：

```sh
sh docker-install.sh
```

选择功能 `4`，再按提示输入大写 `YES`。脚本会：

1. 恢复 EDE 修改前文件。
2. 恢复 Emby 原版 `videoosd.js/css` 和 `lyrics.js/css`。
3. 卸载 `EmbyLyricEnhance.dll`。
4. 重启容器。

非交互入口：

```sh
sh docker-install.sh emby-emby-server-1 uninstall
```

主题数据、插件配置和安全备份默认保留，不随卸载删除。

单独恢复 EDE：

```sh
sh docker-install.sh emby-emby-server-1 ede-restore
```

查看/回滚 DLL 备份：

```sh
sh docker-plugin-install.sh emby-emby-server-1 backups
sh docker-plugin-install.sh emby-emby-server-1 rollback-restart
```

## 4. r2 部署必须满足的版本

| 项目 | 期望值 |
|---|---|
| Emby Web | `4.9.5.0` |
| 插件 | `0.5.0` |
| 前端 build ID | `2026.08.13-theme-v5-fixed-canvas-sync-r2` |
| layout model | `fixed-canvas-v1` |
| DLL SHA-256 | `5B4601BB75168A98F4B8360830451BE3A0BED9C7803288091F35CFC4320C693B` |

安装器会在 `/config/emby-lyric-enhance/` 保存持久备份。若容器没有挂载 `/config`，脚本会警告并要求确认；不应通过删除/重建容器来切换增强版和原版。

## 5. 浏览器缓存处理

完成服务器安装和容器重启后：

1. 关闭所有该 Emby 站点标签页。
2. 清除该站点的缓存和站点数据，或使用浏览器开发者工具勾选 Disable cache 后完整刷新。
3. 重新登录同一 Emby 账号。
4. 打开真实音乐播放页，不使用旧标签页恢复的 DOM 判断新构建。

## 6. API 和账号同步验收

在已登录页面验证：

- `/EmbyLyricEnhance/UserWorkspace` 不再返回 500。
- `/EmbyLyricEnhance/Themes` 不再返回 500。
- 初次新账号允许 revision 0；第一次成功 PUT 后 revision 必须递增。
- 前端不能长期停留在 `workspaceSource=safe-default`。
- `apiAvailable=true`，同步状态最终为“账号已同步”。
- PC 修改 landscape 后，手机同账号能取得该主题，同时保留独立 portrait 数据。
- 两个 Emby 用户和两个服务器的缓存/离线队列互不串用。
- 非空 Workspace 必须胜过陈旧 localStorage 和 DisplayPreferences。

如果仍出现：

```text
The plugin theme store is not initialized.
```

说明服务器仍未加载 r2 DLL，或插件持久目录初始化失败。先核对容器内 DLL 哈希、插件日志和 `/config` 挂载，再重启容器；不要用浏览器本地设置掩盖 API 500。

## 7. 单根播放器与布局验收

真实播放时应满足：

```text
.elyric-player-root === 1
旧 .elyric-player-shell（非 root）=== 0
```

检查尺寸：

- `1920 × 1080` 横屏应 1:1 显示设计画布。
- `1080 × 1920` 竖屏应 1:1 显示设计画布。
- 其他横屏和竖屏只做 contain 等比缩放。
- 超宽屏、窄屏或非 16:9/9:16 屏幕的多余区域应留空，元素不得拉伸。
- 横竖旋转后分别恢复独立布局。
- 设置/退出按钮始终位于舞台外，任何歌词、队列或图层不能遮挡。

## 8. 真实歌曲矩阵

至少测试：

- 无歌词。
- 普通单行歌词。
- 翻译第二行。
- 注音第二/第三行。
- 三行及以上同时间歌词。
- 长标题、长歌手名和长专辑名。
- 无封面、用户图片和 HTTPS 图片。
- 暂停、切歌、拖动进度、音量、队列和投屏。

尺寸至少覆盖：

```text
390×844    768×1024   1080×1920
844×390    1366×768   1920×1080
2560×1440  3440×1440  3840×2160
```

九套内置主题和另存为后的用户主题均需检查歌曲信息、歌词、频谱、控制坞、媒体卡、队列和设置面板的遮挡、溢出、文字对比度与触控可达性。

## 9. 发布完成判定

只有同时满足以下条件才能称为服务器已同步：

- 本地自动化通过。
- Linux/POSIX 安装器测试通过。
- GitHub `main`、服务器仓库和容器活动文件属于同一 build ID。
- DLL 哈希匹配并已在重启后加载。
- Workspace/Themes API 返回成功。
- 账号 revision 真实递增并完成跨设备恢复。
- 单根 DOM 合同成立。
- 清缓存后的真实歌曲视觉矩阵无阻断问题。
