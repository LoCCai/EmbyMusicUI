# ![preview](image/README/preview.png)

EmbyLyricEnhance 用于增强 Emby Web 歌词显示。

当前适配版本：**Emby Server 4.9.5.0**

## 功能

- 合并开始时间相同的原文、注音和翻译，支持两行、三行及更多子行
- 解析增强 LRC 的 `<mm:ss.xx>` 逐字时间，并随播放、快进和后退重新计算状态
- 使用 `requestAnimationFrame` 在 Emby 原生时间回调之间平滑插值，逐字效果不再以约 400ms 为步长跳动
- 内置五种歌词渲染样式，可在播放页即时切换；个人偏好由认证用户的 `UserWorkspace` 跨浏览器同步
- 接管歌词播放页的整屏视觉层，提供九套只读内置预设和不设人为数量上限的用户主题库
- 使用统一 `PlayerThemeV2` 注册表连接编辑控件、校验、CSS/Canvas 渲染、序列化、迁移与服务端规则
- 封面、歌曲信息、歌词、频谱和约束控制坞支持拖拽、缩放、旋转、层级、锁定、对齐、吸附、键盘微调与撤销/重做
- 只保存 landscape 与 portrait 两套锚定画布，不再生成 compact 等第三模式，并始终保留设置入口安全区
- 控制坞可按横竖屏独立设置行、分组、按钮顺序、显隐、对齐、间距和换行；进度与播放/暂停始终保留
- 整合歌曲/歌手/专辑/封面、进度、音量、静音、停止、上一首、播放暂停、下一首、随机、循环、队列、注音和封面旋转开关
- 封面内外层尺寸/圆角/XY、歌曲信息、歌词三态文字与背景、频谱、进度条、音量条均可独立定位和造型
- 媒体信息弹卡可选展示歌曲、文件、音频、图像和歌词流；PC/横屏从信息按钮附近展开，手机竖屏使用底部安全抽屉
- 中心对称胶囊频谱替代高密度柱状墙，并保留频谱尺寸、幅度、形态和配色调节
- 可选 C# 插件设置层：管理员统一配置服务器默认主题和显示参数，并可锁定主题策略
- 自有歌词实现整行选中、点击跳转、自动跟随与手动滚动暂停
- 只在 `videoosd.js/css` 注入，不修改通用的 `listview.js` 和 `emby-itemscontainer.js`
- 歌词文本使用 DOM `textContent` 安全渲染，只把 `<br>` 识别为换行
- 自动备份，可在原版和增强版之间反复切换
- 通过 4.9.5.0 文件 SHA-256 和唯一注入锚点阻止误覆盖其他版本

## Docker 一键安装

在 **Emby Docker 宿主机**下载或克隆本仓库，然后执行：

```bash
cd EmbyLyricEnhance
sh docker-install.sh
```

不传容器参数时，脚本会先从运行中的容器名称、镜像和状态里自动检索 `emby`（不区分大小写），把候选项按编号列出。候选列表始终保留“没有我要的容器，手动输入”；如果完全没有自动匹配项，则直接列出全部运行中容器，并接受容器名或容器 ID（不是镜像名）。

容器只需选择一次。之后可以选择：

1. 安装或更新歌词播放器前端
2. 安装或更新服务端插件 DLL
3. 修复 EDE 1.47 页面生命周期与内嵌 Danmaku 的 AMD 加载冲突
4. 卸载本项目并恢复安装前原文件

安装功能支持单选和空格分隔多选，例如输入 `1` 只安装前端，输入 `1 2 3` 会依次执行全部三项。恢复原装必须单独输入 `4` 并再次输入 `YES` 确认。恢复会还原 Emby 原版 `videoosd.js/css` 与 `lyrics.js/css`、恢复 EDE 修改前文件、备份后卸载本项目 DLL，并统一重启容器一次；插件配置、用户主题和全部安全备份默认保留。

常用非交互组合命令：

```bash
sh docker-install.sh <容器名或ID> all
sh docker-install.sh <容器名或ID> plugin
sh docker-install.sh <容器名或ID> ede
sh docker-install.sh <容器名或ID> uninstall
```

`all` 等同于交互输入 `1 2 3`。`plugin` 安装 DLL 并重启一次，`ede` 只应用 EDE 修复且不重启。`uninstall` 与菜单 4 相同，会要求输入 `YES` 后恢复原装。

原有前端管理命令继续兼容，也可以直接传参：

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

EDE 修复只识别经过验证的 1.47 代码特征。除了页面生命周期保护，它还禁用内嵌 Danmaku UMD 包的匿名 AMD 注册，避免污染 Emby Alameda 模块队列并随机请求 `/web/modules/common/common/...` 等错误路径。原文件会持久备份到 `/config/emby-lyric-enhance/ede-1.47/original/ede.user.js`，每次增量修改前还会创建安全副本；重复执行是幂等的，未知版本则拒绝修改。可用以下命令检查或恢复：

```bash
sh docker-install.sh <容器名或ID> ede-status
sh docker-install.sh <容器名或ID> ede-restore
```

## C# 设置插件与用户主题服务

0.5.0 插件保留经过清洗的公共显示默认值接口，并提供需要认证的 Theme V5 工作区、命名主题库、控制坞校验和私有资源接口。用户身份只从当前 Emby 请求会话取得，客户端不能传入其他用户 ID。每个工作区和主题分别原子写入插件数据目录并使用整数 `revision`；跨设备并发写入时保留服务器版本，同时创建“冲突副本”，不会静默覆盖。

命名主题不设人为数量上限。管理员可配置单个主题 JSON、单个上传资源和每用户资源配额。上传内容只允许通过文件签名校验的 PNG、JPEG、WebP、AVIF 和 WOFF2。前端修改约 500ms 后自动同步草稿，断网时进入本地待同步队列；首次升级会从 `DisplayPreferences.CustomPrefs` 和旧 `localStorage` 导入设置及最多 24 套旧主题，服务端确认后仍保留本地离线缓存。

仓库附带单文件预编译 Release 插件；构建、Docker 安装、重启要求和真实环境验收清单见 [`plugin/README_CN.md`](plugin/README_CN.md)。首次安装或更新 DLL 后必须重启 Emby；仅切换前端主题或保存显示设置不需要重启。

## 自有音乐播放器与歌词主题

打开播放页歌词后，歌词增强会接管整页视觉层，不再在原界面上叠加底部控制条。播放器提供歌曲/歌手/专辑、封面氛围背景、进度拖动、音量/静音、停止、上一首、播放/暂停、下一首、随机、循环、歌词、播放队列、注音开关、封面旋转和歌词主题。

九套内置界面已迁移到完整 Theme V5 参数模型并保持只读。进入“画布编辑”会先捕获当前实际构图、关闭设置模态层，再显示封面、歌曲信息、歌词、频谱、控制坞五个图层编辑框；设置页始终位于最高交互层、保持不透明且不启用高斯模糊，歌词和队列不能遮挡它。对内置主题的修改需要另存为用户主题。

封面支持当前 Emby 图片、私有上传和 HTTPS URL，并可设置适应方式、焦点、圆角、边框、阴影、内外层与 `polygon(...)` 裁切。主歌词、第二行、第三行及以后分别支持字体来源、字号、字重、斜体、字距、行距、颜色、透明度、描边、阴影和辉光，已播/当前/未播颜色与透明度可独立配置；歌词位置、宽高和左中右对齐均可自由调整。

主题库允许把当前参数另存为用户主题，并执行保存、复制、重命名和删除。全部频谱分析参数、封面来源、三层歌词、歌词跟随等待、媒体字段、弹卡样式和控制安全区都属于主题快照。PC 和横屏界面按信息按钮实时锚定弹卡并自动翻转、避让边缘，手机竖屏使用底部抽屉。

频谱固定绘制在播放器底部的横向 Canvas 带中，不创建 Web Audio 音频链路，也不改变 Emby 的声音输出。默认形态使用低密度、中心对称的圆角律动，避免高密度柱状墙遮抢歌词；窄幅、宽幅、全宽预设用于快速选择，展示宽度 36%–90%、展示高度 4%–18% 和 25%–140% 波动幅度还可继续用滑杆精调。纯色/渐变的自定义色使用安全的十六进制文本输入和色块预览，不调用曾在部分浏览器中卡死的原生颜色选择器。

播放器草稿和命名主题只写入 0.5.0 用户主题服务，以 `serverId + userId` 为边界同步到其他浏览器和设备；旧 `DisplayPreferences.CustomPrefs` 与无作用域 `localStorage` 只参与全新工作区的首次迁移。服务端确认缓存和待同步队列均按账号作用域隔离。

这个面板负责界面与交互，实际播放、进度跳转和队列状态仍交给 Emby `playbackmanager` 的当前播放会话；因此不会另起一套音频播放器。自有音量滑杆、静音、上下首、随机、循环、队列和投屏均调用正式播放接口，对应能力不可用时按钮会禁用。

设置抽屉中的“歌词样式”选择器可以即时切换以下主题：

| 主题 | 效果 |
| --- | --- |
| 经典累积 | 已唱字和当前字从行首连续高亮 |
| 单字聚焦 | 只强调正在唱的字，已唱字弱化 |
| 渐变扫光 | 累积高亮并在当前字显示渐变亮边 |
| Apple 风格 | 当前行放大，其他行缩小、淡化并轻微模糊 |
| 简洁整行 | 不显示逐字明暗差异，只突出当前整行 |

切换立即生效，不需要刷新、重新注入或重启 Emby。歌词样式与其他播放器偏好一同保存到当前认证用户的 `UserWorkspace`；同一账户在其他浏览器或设备打开歌词页时会恢复。旧的 `DisplayPreferences.CustomPrefs` 和无作用域 `localStorage` 只在服务端工作区全新且 `LegacyImported=false` 时迁移一次。

整屏播放器由 `VideoOsd.onResume/onPause/destroy` 管理，所有可见播放器元素、歌词、队列、设置、媒体卡和设计器都位于唯一的 `.elyric-player-root` 内。歌词直接读取当前媒体的默认字幕流，队列直接读取结构化播放列表；不再复用或定位 Emby 原生歌词、队列和按钮 DOM。单根成功挂载后才隐藏原生 OSD，初始化异常、离开页面或销毁时逐项恢复原状态。当前会话可在 URL 加 `?elyric=off` 强制使用原生 OSD，不会删除主题数据。

歌词渲染仍是 Emby Web 前端适配器，覆盖 Emby Web 及复用该 Web 前端的客户端，不会强制改变 Android、iOS 或电视端的原生歌词页面。可选 C# 插件只提供服务器设置层，不会改变这一客户端边界。

如果安装了 C# 插件，它的颜色、字号等默认值只会被最新前端适配器读取。因此插件 DLL 和四个受管前端文件需要分别更新；只运行 `docker-plugin-install.sh` 不会改动 Emby Web 文件。

## 备份与容器更新警告

原始文件和生成后的增强文件保存在：

```text
/config/emby-lyric-enhance/4.9.5.0/
├── original/
│   ├── lyrics.js
│   ├── lyrics.css
│   ├── videoosd.js
│   └── videoosd.css
└── enhanced/
    ├── lyrics.js
    ├── lyrics.css
    ├── videoosd.js
    └── videoosd.css
```

> **不要通过删除、重建容器或重建镜像来切换原版/增强版。** 注入发生在容器的 `/system` 中，容器更新或重建会覆盖该目录，当前增强效果会消失。

如果 `/config` 已正确映射到宿主机，备份会随 `/config` 保留。重建后仍是 Emby 4.9.5.0 时，可以重新运行本脚本注入；如果已经升级到其他 Emby 版本，请等待对应适配，脚本会因文件指纹不同而停止，不会用 4.9.5.0 的旧备份覆盖新版本。

如果脚本未检测到 `/config` 持久挂载，会先警告并要求确认。

如果当前 `/system` 已是旧增强版，但原版备份丢失，新版安装器会从当前 Emby 容器的不可变镜像 ID 创建一个不启动的临时容器，提取并校验四个原文件；正在运行的 Emby 容器不会被删除或重建。

## 修改范围

4.9.5.0 适配只修改容器中的：

```text
/system/dashboard-ui/videoosd/lyrics.js
/system/dashboard-ui/videoosd/lyrics.css
/system/dashboard-ui/videoosd/videoosd.js
/system/dashboard-ui/videoosd/videoosd.css
```

不会修改：

```text
/system/dashboard-ui/modules/emby-elements/emby-itemscontainer/emby-itemscontainer.js
/system/dashboard-ui/modules/listview/listview.js
/system/dashboard-ui/videoosd/videoosd.html
```

仓库中的注入载荷位于：

```text
adapters/4.9.5.0/lyrics.inject.js
adapters/4.9.5.0/lyrics.inject.css
```

## 工作原理

`videoosd.js` 中的自有歌词仓库取得 `TrackEvents` 后，按 `StartPositionTicks + 原始顺序` 稳定排序，并把相同开始时间的事件合并为一个歌词项目。增强 LRC 示例：

```text
<00:59.62>四<00:59.87>周<01:00.24>环<01:01.49>
```

会转换为带绝对开始、结束时间的逐字数据。PlaybackBridge 收到当前播放器的时间事件后，按绝对播放位置更新自有歌词的 `pending`、`active`、`played` 状态；点击歌词行直接调用 `seek()`。

歌曲最后一组增强歌词可以省略末尾闭合时间标签。如果最后一个字已经超过事件的默认结束时间，适配器只为该字补一个 1 秒安全边界；中间歌词仍必须在下一行开始前闭合，避免跨行高亮。

逐字层使用 `requestAnimationFrame` 在相邻原生回调之间插值播放位置，通常按显示器刷新率更新。只有连续两次原生位置表明播放正在前进时才会启动插值；暂停、缓冲、前后跳转或页面隐藏时立即停止。单次最多外推 800ms，避免播放器停止回调后歌词继续自行前进。Emby 原生整行选择与滚动频率保持不变。

歌词文本永远不会整体写入 `innerHTML`，因此 `<img>`、`<script>` 和事件属性只会显示成文字。切歌会使旧请求失效，并按项目、媒体源和字幕流缓存结果。

## 版本校验

本适配识别的原始文件：

```text
lyrics.js
32b712b634d0191da1dec23eebd63bde2a94bba67ba1fd6cea5b2959309649bb

lyrics.css
82c4df323c0a6dd100863d0e261a5e09317530c8f39cd55c203ebac8899224b7

videoosd.js
8c254d3a3844ee80f9d03205c94b04e60bc5440f44cf776e697c3ce96fd69687

videoosd.css
491e78881253de76cad25f76af3132cb13daf207bd865de92ccc8a68ac2bf3a7
```

文件已被其他插件修改、Emby 版本不同、原始备份不完整或注入锚点数量不为 1 时，安装会停止。

开发者可运行：

```bash
node tests/videoosd-runtime.test.js
node tests/single-root-osd.test.js
node tests/theme-v2-contract.test.js
node tests/plugin-integration.test.js
node tests/docker-install.test.js
node tests/ede-manager.test.js
```

或在 Windows 使用 `plugin\scripts\verify.ps1`，同时验证参数注册表、服务端校验、用户主题、单根 DOM、VideoOsd 生命周期、PlaybackBridge、自有歌词/队列及四文件原子安装回退。真实部署仍需更新 DLL 和四个前端文件，重启 Emby 加载 DLL，清理站点缓存后再用真实歌曲验收。

## 旧版本说明

`replacement/` 和 `main.template.sh` 是原有 4.8.11.0 全局劫持方案，4.9.5.0 安装器不会使用它们。不要把两套适配同时注入同一个容器。
