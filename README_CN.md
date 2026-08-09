# ![preview](image/README/preview.png)

EmbyLyricEnhance 用于增强 Emby Web 歌词显示。

当前适配版本：**Emby Server 4.9.5.0**

## 功能

- 合并开始时间相同的原文、注音和翻译，支持两行、三行及更多子行
- 解析增强 LRC 的 `<mm:ss.xx>` 逐字时间，并随播放、快进和后退重新计算状态
- 使用 `requestAnimationFrame` 在 Emby 原生时间回调之间平滑插值，逐字效果不再以约 400ms 为步长跳动
- 内置五种歌词主题，可在播放页即时切换并保存到当前浏览器
- 可选 C# 插件设置层：管理员统一配置服务器默认主题和显示参数，并可锁定主题策略
- 保留 Emby 原生整行选中、点击跳转和滚动行为
- 仅在歌词专属模块中注入，不修改通用的 `listview.js` 和 `emby-itemscontainer.js`
- 歌词文本使用 DOM `textContent` 安全渲染，只把 `<br>` 识别为换行
- 自动备份，可在原版和增强版之间反复切换
- 通过 4.9.5.0 文件 SHA-256 和唯一注入锚点阻止误覆盖其他版本

## Docker 一键安装

在 **Emby Docker 宿主机**下载或克隆本仓库，然后执行：

```bash
cd EmbyLyricEnhance
sh docker-install.sh
```

脚本会列出正在运行的容器，并提示输入：

```text
Emby 容器名或容器 ID（不是镜像名）
```

之后可以选择：

1. 安装或重新生成并启用增强版
2. 切换到原版，保留全部备份
3. 重新启用增强版
4. 查看状态

也可以直接传参：

```bash
sh docker-install.sh <容器名或ID> install
sh docker-install.sh <容器名或ID> original
sh docker-install.sh <容器名或ID> enhanced
sh docker-install.sh <容器名或ID> status
```

`undo` 可作为 `original` 的兼容别名：

```bash
sh docker-install.sh <容器名或ID> undo
```

切换文件后不需要重启 Emby，更不要为了切换而重建容器。请强制刷新浏览器；仍显示旧内容时，再清除 Emby 站点缓存。

## 可选 C# 设置插件

`codex/plugin-settings` 分支增加了混合插件模式：现有 JS/CSS 仍负责歌词解析和渲染，C# 插件只提供 Emby 管理设置页与只读显示配置接口。这样即使 DLL 未安装、接口暂时失败或插件停用，歌词仍会使用内置默认值继续工作。

管理员可设置默认主题、浏览器能否覆盖主题、字号、行距、字重、高亮色、透明度、辉光、缩放、模糊和多子行显示。播放页重新进入歌词视图时会重新读取服务器设置；管理员允许时，当前浏览器保存的主题仍优先。

插件分支已附带两枚预编译 Release DLL；构建、Docker 安装、重启要求和真实环境验收清单见 [`plugin/README_CN.md`](plugin/README_CN.md)。首次安装或更新 DLL 后必须重启 Emby；仅切换前端主题或保存显示设置不需要重启。

## 歌词主题

打开播放页歌词后，右上角的“歌词样式”选择器可以即时切换以下主题：

| 主题 | 效果 |
| --- | --- |
| 经典累积 | 已唱字和当前字从行首连续高亮 |
| 单字聚焦 | 只强调正在唱的字，已唱字弱化 |
| 渐变扫光 | 累积高亮并在当前字显示渐变亮边 |
| Apple 风格 | 当前行放大，其他行缩小、淡化并轻微模糊 |
| 简洁整行 | 不显示逐字明暗差异，只突出当前整行 |

切换立即生效，不需要刷新、重新注入或重启 Emby。选择保存在当前浏览器的 `localStorage`（键名 `emby-lyric-enhance.theme`）；同一浏览器下次打开歌词时会自动恢复。不同浏览器和设备分别保存自己的选择。

样式选择器的视觉浮层放在页面顶层，避免被 Emby 播放页的裁剪容器截断，但其可见性严格归当前歌词播放页控制。离开播放页、页面被隐藏、被其他页面覆盖或旧歌词容器脱离文档时会自动隐藏；再次打开时恢复显示，并清理可能残留的重复控件。

歌词渲染仍是 Emby Web 前端适配器，覆盖 Emby Web 及复用该 Web 前端的客户端，不会强制改变 Android、iOS 或电视端的原生歌词页面。可选 C# 插件只提供服务器设置层，不会改变这一客户端边界。

## 备份与容器更新警告

原始文件和生成后的增强文件保存在：

```text
/config/emby-lyric-enhance/4.9.5.0/
├── original/
│   ├── lyrics.js
│   └── lyrics.css
└── enhanced/
    ├── lyrics.js
    └── lyrics.css
```

> **不要通过删除、重建容器或重建镜像来切换原版/增强版。** 注入发生在容器的 `/system` 中，容器更新或重建会覆盖该目录，当前增强效果会消失。

如果 `/config` 已正确映射到宿主机，备份会随 `/config` 保留。重建后仍是 Emby 4.9.5.0 时，可以重新运行本脚本注入；如果已经升级到其他 Emby 版本，请等待对应适配，脚本会因文件指纹不同而停止，不会用 4.9.5.0 的旧备份覆盖新版本。

如果脚本未检测到 `/config` 持久挂载，会先警告并要求确认。

## 修改范围

4.9.5.0 适配只修改容器中的：

```text
/system/dashboard-ui/videoosd/lyrics.js
/system/dashboard-ui/videoosd/lyrics.css
```

不会修改：

```text
/system/dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js
/system/dashboard-ui/modules/listview/listview.js
/system/dashboard-ui/videoosd/videoosd.js
/system/dashboard-ui/videoosd/videoosd.html
```

仓库中的注入载荷位于：

```text
adapters/4.9.5.0/lyrics.inject.js
adapters/4.9.5.0/lyrics.inject.css
```

## 工作原理

`lyrics.js` 原生请求返回 `TrackEvents` 后，适配器按 `StartPositionTicks + 原始顺序` 稳定排序，并把相同开始时间的事件合并为一个歌词项目。增强 LRC 示例：

```text
<00:59.62>四<00:59.87>周<01:00.24>环<01:01.49>
```

会转换为带绝对开始、结束时间的逐字数据。每次 Emby 调用 `onTimeUpdate(positionTicks, runtimeTicks)` 时，先执行原生整行选中和滚动，再按绝对播放位置将字词设置为 `pending`、`active` 或 `played`，因此快进和后退不依赖旧状态。`played` 与 `active` 使用相同高亮样式，高亮会从行首累积到当前字，而不是只点亮正在播放的单个字。

歌曲最后一组增强歌词可以省略末尾闭合时间标签。如果最后一个字已经超过事件的默认结束时间，适配器只为该字补一个 1 秒安全边界；中间歌词仍必须在下一行开始前闭合，避免跨行高亮。

逐字层使用 `requestAnimationFrame` 在相邻原生回调之间插值播放位置，通常按显示器刷新率更新。只有连续两次原生位置表明播放正在前进时才会启动插值；暂停、缓冲、前后跳转或页面隐藏时立即停止。单次最多外推 800ms，避免播放器停止回调后歌词继续自行前进。Emby 原生整行选择与滚动频率保持不变。

歌词虚拟列表变化由 `MutationObserver` 监听；新增或复用的可见节点会根据 `data-index` 重建。歌词文本永远不会整体写入 `innerHTML`，因此 `<img>`、`<script>` 和事件属性只会显示成文字。

## 版本校验

本适配识别的原始文件：

```text
lyrics.js
32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb

lyrics.css
82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7
```

文件已被其他插件修改、Emby 版本不同、原始备份不完整或注入锚点数量不为 1 时，安装会停止。

开发者可运行：

```bash
node tests/adapter.test.js
node tests/plugin-integration.test.js
```

或在 Windows 使用 `plugin\scripts\verify.ps1`，同时验证 C# 配置核心、API 契约、前后端字段同步、插件缺失回退、歌词合并、安全文本渲染、五种主题、主题持久化、歌词行状态、累积高亮、快进/后退、暂停识别、动画帧插值与 800ms 超时停止。真实 `MediaBrowser.*` 包编译和 Emby 容器加载仍必须在线完成。

## 旧版本说明

`replacement/` 和 `main.template.sh` 是原有 4.8.11.0 全局劫持方案，4.9.5.0 安装器不会使用它们。不要把两套适配同时注入同一个容器。
