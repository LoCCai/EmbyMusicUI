# ![preview](image/README/preview.png)

EmbyLyricEnhance 用于增强 Emby Web 歌词显示。

当前适配版本：**Emby Server 4.9.5.0**

## 功能

- 合并开始时间相同的原文、注音和翻译，支持两行、三行及更多子行
- 解析增强 LRC 的 `<mm:ss.xx>` 逐字时间，并随播放、快进和后退重新计算状态
- 使用 `requestAnimationFrame` 在 Emby 原生时间回调之间平滑插值，逐字效果不再以约 400ms 为步长跳动
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

会转换为带绝对开始、结束时间的逐字数据。每次 Emby 调用 `onTimeUpdate(positionTicks, runtimeTicks)` 时，先执行原生整行选中和滚动，再按绝对播放位置将字词设置为 `pending`、`active` 或 `played`，因此快进和后退不依赖旧状态。

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
```

验证歌词合并、安全文本渲染、快进/后退、暂停识别、动画帧插值与 800ms 超时停止。

## 旧版本说明

`replacement/` 和 `main.template.sh` 是原有 4.8.11.0 全局劫持方案，4.9.5.0 安装器不会使用它们。不要把两套适配同时注入同一个容器。
