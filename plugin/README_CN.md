# Emby Lyric Enhance C# 插件

这是 EmbyLyricEnhance 的服务器设置层。它不会取代现有歌词解析器，而是向 Emby 管理后台增加显示设置页，并向 Emby Web 提供经过约束的只读显示配置。

## 与前端适配器的关系

完整功能由两部分组成：

1. `EmbyLyricEnhance.dll` 内含配置核心，保存、校验并提供服务器默认设置。
2. `adapters/4.9.5.0/lyrics.inject.js` 与 `lyrics.inject.css` 继续负责逐字解析、平滑计时、主题渲染和播放页控件。

只安装 DLL 不会自动修改 Emby Web 的歌词文件；只安装前端适配器时则继续使用内置默认值。前端访问插件失败、插件未安装或暂时不可用时，歌词不会被阻断。

## 当前设置

- 默认歌词主题，以及是否允许浏览器本地主题覆盖
- 字号、行距、字重
- 跟随 Emby 主题色或使用自定义高亮色
- 未唱字透明度、辉光强度
- 当前行缩放、其他行透明度和模糊
- 第二行、第三行及更多子行显示开关

公共读取接口为 `GET /EmbyLyricEnhance/PublicConfiguration`。Emby 4.9.5.0 实机在没有有效会话时返回 401，播放页因此通过歌词模块 `_connectionmanager` 取得当前服务器的认证 API 客户端后读取。接口只返回清洗后的非敏感显示字段，没有 POST、PUT 或 DELETE 路由，也不返回管理能力、路径、令牌或用户数据。管理员写入仍使用 Emby 内置且受保护的插件配置 API。

0.2.2 起，管理设置页会以“歌词增强”注册到 Emby 服务器左侧菜单。0.2.6 使用 Emby `data-controller` 加载独立 AMD 页面控制器，并通过 `apiClientResolver` 获取认证客户端。HTML 和控制器使用新资源名，避免 Emby 继续返回旧版缓存页面。控制器不删除 Emby 路由持有的节点，只对本插件重复页做非侵入隐藏；页面背景透明继承当前 Emby 主题。保存期间禁止重复提交，成功后原地重新读取服务器配置并回显摘要；读取失败时禁止保存空白表单。

## 构建

`codex/plugin-settings` 分支在 `plugin/artifacts/package/` 中附带单文件 Release DLL。只是在 Docker 宿主机安装现成版本时不需要安装 .NET SDK；修改 C# 源码或准备新版本时才需要重新构建并同步更新该 DLL。

需要 .NET 8 SDK 和可访问 NuGet 的网络：

```powershell
plugin\scripts\build.ps1
```

Linux/macOS：

```bash
sh plugin/scripts/build.sh
```

产物位于 `plugin/artifacts/package/`。已经确认 nuget.org 上的官方聚合 SDK 是 `MediaBrowser.Common 4.9.1.90`，它同时携带 `MediaBrowser.Model.dll`；不存在需要分别引用的 `MediaBrowser.Controller` 和 `MediaBrowser.Model` NuGet 包。默认构建版本已经固定为 `4.9.1.90`，也可显式覆盖：

```powershell
plugin\scripts\build.ps1 -EmbyApiVersion <已验证的API包版本>
```

服务器版本号与开发 API 包版本不一定完全相同；Emby Server 4.9.5.0 对应的已恢复开发 SDK 是 4.9.1.90。

初版 0.2.0.0 已在 Windows x64、.NET SDK 8.0.423 上完成真实 Release 构建且设置页正确嵌入。随后 Emby 4.9.5.0 实机验证发现其插件加载上下文不能稳定解析同目录的独立 `EmbyLyricEnhance.Core.dll`，因此 0.2.1 起把 Core 源码直接编入主插件，只交付 `EmbyLyricEnhance.dll`。当前 0.2.6.0 已使用恢复好的官方 SDK 离线 Release 构建，结果为 0 警告、0 错误；产物不引用 Core 程序集，并同时嵌入了更名后的配置页 HTML 和认证页面控制器。

## 本地验证

不访问 NuGet 的完整离线检查：

```powershell
plugin\scripts\verify.ps1
```

包含真实 `MediaBrowser.*` 恢复和插件编译：

```powershell
plugin\scripts\verify.ps1 -IncludeEmbyBuild
```

离线检查使用契约桩编译 C# 插件入口，并测试预编译 DLL 是否齐全、配置默认值、范围约束、前后端字段同步、插件缺失回退、主题锁定、页面生命周期和歌词计时。如果 `.packages` 中已有 4.9.1.90，它还会直接对官方真实程序集再次编译插件 API；源码发生变化后，正式 DLL 仍必须由 `build.ps1`、`build.sh` 或 CI 重新生成并更新。

## Docker 安装

仓库中的单文件预编译 DLL 可直接安装。在 Emby Docker 宿主机执行：

```bash
sh docker-plugin-install.sh
```

不传容器参数时，脚本会在运行中的容器里检索名称、镜像或状态包含 `emby`（不区分大小写）的候选项，并显示编号供选择。候选列表的最后一项固定为“没有我要的容器，手动输入”；选择后会列出全部运行中容器，再接受容器名或 ID。没有自动发现候选项时会直接进入手动输入。

也可以传参跳过交互选择：

```bash
sh docker-plugin-install.sh <Emby容器名> install
```

立即重启并加载插件：

```bash
sh docker-plugin-install.sh <Emby容器名> install-restart
```

查看容器中 DLL 状态：

```bash
sh docker-plugin-install.sh <Emby容器名> status
```

查看可用备份：

```bash
sh docker-plugin-install.sh <Emby容器名> backups
```

恢复最近一个尚未使用的安装备份：

```bash
sh docker-plugin-install.sh <Emby容器名> rollback
sh docker-plugin-install.sh <Emby容器名> rollback-restart
```

也可以从 `backups` 输出中选择一个备份名：

```bash
sh docker-plugin-install.sh <Emby容器名> rollback <备份名>
```

脚本会先确认容器的 `/config` 已持久挂载，再暂存主 DLL，并把现有主 DLL 与可能残留的旧版 Core DLL 作为一个可回滚集合备份。安装新版本后会清理独立 Core DLL；替换失败则恢复安装前状态。执行回滚前也会额外保存当前文件。备份保存在 `/config/emby-lyric-enhance/plugin-backup/`，已消费的备份会标记为 `restored`，避免误重复应用。

只有在明确接受容器重建后插件文件可能丢失时，才能临时设置 `ELYRIC_ALLOW_UNPERSISTED_CONFIG=1` 跳过持久化保护。

首次安装或更新 DLL 后必须重启 Emby。管理页保存显示设置、浏览器切换主题或重新注入前端文件不需要重启。

DLL 设置要影响播放页，容器还必须安装包含公共配置读取的最新前端适配器：

```bash
sh docker-plugin-install.sh <Emby容器名> install-restart
sh docker-install.sh <Emby容器名> install
```

DLL 安装脚本会检查活动 `lyrics.js`。若尚未包含 `EmbyLyricEnhance/PublicConfiguration`，会输出第二条命令的提示。

若第二条命令检测到旧增强标记但原版备份缺失，请先拉取最新安装器后重新执行。新安装器会从当前容器的不可变镜像中提取原文件，通过 4.9.5.0 指纹校验后补回 `/config` 备份，不会删除或重建正在运行的 Emby 容器。

## 发布前真实环境检查

- 构建产物由固定的 `MediaBrowser.Common 4.9.1.90` SDK 生成
- Release 插件能被 Emby 4.9.5.0 加载，且服务器日志无类型加载错误
- 管理后台能打开、保存并重新读取设置页
- 公共配置接口只允许 GET，并且只返回文档列出的非敏感显示字段
- 播放页能取得设置；删除或停用插件后仍安全回退
- 插件目录只有 `EmbyLyricEnhance.dll`，没有旧版独立 `EmbyLyricEnhance.Core.dll`
- Docker 自动发现/手动选择、更新、成组备份、失败恢复和容器重启行为符合预期

这些项目必须在真实 NAS/Emby 容器完成，不能用本地契约桩的通过结果代替。
