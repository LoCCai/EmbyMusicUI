# Emby Lyric Enhance C# 插件

这是 EmbyLyricEnhance 的服务器设置层。它不会取代现有歌词解析器，而是向 Emby 管理后台增加显示设置页，并向 Emby Web 提供经过约束的只读显示配置。

## 与前端适配器的关系

完整功能由两部分组成：

1. `EmbyLyricEnhance.dll` 和 `EmbyLyricEnhance.Core.dll` 保存、校验并提供服务器默认设置。
2. `adapters/4.9.5.0/lyrics.inject.js` 与 `lyrics.inject.css` 继续负责逐字解析、平滑计时、主题渲染和播放页控件。

只安装 DLL 不会自动修改 Emby Web 的歌词文件；只安装前端适配器时则继续使用内置默认值。前端访问插件失败、插件未安装或暂时不可用时，歌词不会被阻断。

## 当前设置

- 默认歌词主题，以及是否允许浏览器本地主题覆盖
- 字号、行距、字重
- 跟随 Emby 主题色或使用自定义高亮色
- 未唱字透明度、辉光强度
- 当前行缩放、其他行透明度和模糊
- 第二行、第三行及更多子行显示开关

公共读取接口为 `GET /EmbyLyricEnhance/PublicConfiguration`。官方公共 SDK 不提供此前假设的控制器鉴权特性，因此该接口按数据边界设计为匿名只读：只返回清洗后的非敏感显示字段，没有 POST、PUT 或 DELETE 路由，也不返回管理能力、路径、令牌或用户数据。管理员写入仍使用 Emby 内置且受保护的插件配置 API。

## 构建

`codex/plugin-settings` 分支已在 `plugin/artifacts/package/` 中附带经过验证的 Release DLL。只是在 Docker 宿主机安装现成版本时不需要安装 .NET SDK；修改 C# 源码或准备新版本时才需要重新构建并同步更新这两枚 DLL。

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

2026-08-09 已在 Windows x64、.NET SDK 8.0.423 上完成真实 Release 构建：0 警告、0 错误；插件版本为 0.2.0.0，设置页已正确嵌入 DLL。

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

仓库中的两枚预编译 DLL 可直接安装。在 Emby Docker 宿主机执行：

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

脚本会先确认容器的 `/config` 已持久挂载，再将两枚 DLL 作为一组暂存和备份。替换过程中若出现部分失败，会尝试恢复同一组旧文件；执行回滚前也会额外保存当前文件。备份保存在 `/config/emby-lyric-enhance/plugin-backup/`，已消费的备份会标记为 `restored`，避免误重复应用。

只有在明确接受容器重建后插件文件可能丢失时，才能临时设置 `ELYRIC_ALLOW_UNPERSISTED_CONFIG=1` 跳过持久化保护。

首次安装或更新 DLL 后必须重启 Emby。管理页保存显示设置、浏览器切换主题或重新注入前端文件不需要重启。

## 发布前真实环境检查

- 构建产物由固定的 `MediaBrowser.Common 4.9.1.90` SDK 生成
- Release 插件能被 Emby 4.9.5.0 加载，且服务器日志无类型加载错误
- 管理后台能打开、保存并重新读取设置页
- 公共配置接口只允许 GET，并且只返回文档列出的非敏感显示字段
- 播放页能取得设置；删除或停用插件后仍安全回退
- Docker 自动发现/手动选择、更新、成组备份、失败恢复和容器重启行为符合预期

这些项目必须在真实 NAS/Emby 容器完成，不能用本地契约桩的通过结果代替。
