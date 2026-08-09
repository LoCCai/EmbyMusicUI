# 开发日志

## 可选 C# 设置层（开发分支）

- 新增 .NET 8 解决方案、配置核心和 Emby `BasePlugin<TConfiguration>` 入口
- 新增管理设置页与仅返回非敏感显示字段的只读 `/EmbyLyricEnhance/PublicConfiguration` 接口
- 服务端和前端双重约束主题、字号、行距、字重、颜色、透明度、辉光、缩放、模糊与子行开关
- 管理员可决定浏览器主题是否覆盖服务器默认值；锁定时保留本地选择但不应用
- 插件或接口不可用时静默回退，歌词加载不依赖 C# 插件成功
- 同一页面过渡复用配置请求，离开再进入歌词页会重新读取管理员新设置
- 新增离线 C# 核心/契约测试、前后端同步测试、构建脚本、CI 和 Docker 成组更新/恢复脚本
- 已确认官方聚合 SDK 为 `MediaBrowser.Common 4.9.1.90`，并通过真实程序集 API 编译；Emby DLL 加载和 NAS 容器行为仍列为发布前外部验收项
- Windows/.NET 8 首批 Release 构建通过，0 警告、0 错误；设置页嵌入资源已核对
- Docker 部署脚本新增 `/config` 持久化阻断、校验状态、备份列表、最近/指定备份回滚和可选重启；模拟 Docker 测试覆盖安装、升级、回滚与保护分支
- Docker 插件脚本无参数运行时会自动筛选带 `emby` 特征的运行中容器并编号选择；列表保留“没有我要的容器”入口，无匹配时直接列出全部容器供手动输入
- Emby 4.9.5.0/.NET 8.0.25 实机日志确认：服务器枚举到了独立 Core DLL，但主插件加载上下文仍无法绑定它，导致 `ServiceController.Init` 崩溃循环
- 0.2.1 改为单 DLL 交付：Core 源码直接链接进主插件，安装时备份并清理旧版独立 Core DLL；Docker 宿主机无需额外安装 .NET SDK
- 0.2.1.0 单 DLL Release 构建通过，0 警告、0 错误；自动检查版本、独立 Core 引用和旧 Core 文件残留，防止再次发布不可加载组合
- 0.2.2 修复管理页：增加“歌词增强”左侧服务器菜单入口，清理动态导航遗留的重复页面实例，同时监听 `pageshow`/`viewshow`
- 保存配置改为单次提交并在成功后原地重新读取，移除会触发额外导航的通用结果处理器；新增动态页面去重、生命周期和保存往返测试

## Emby 4.9.5.0 定向适配

本版本不再修改通用的 `emby-itemscontainer.js` 与 `listview.js`，改为只注入 `videoosd/lyrics.js` 并追加 `videoosd/lyrics.css`。

### 调用链

```text
Stream.js / TrackEvents
  → LyricsRenderer.getItemsInternal()
  → 同时间事件合并与增强 LRC 解析
  → Emby 原生 listview 安全输出
  → MutationObserver 重建歌词专属 DOM
  → LyricsRenderer.onTimeUpdate(positionTicks, runtimeTicks)
  → 原生整行滚动 + requestAnimationFrame 逐字状态更新
```

### 数据处理

- 克隆事件，不修改 API 返回的原对象
- 按 `StartPositionTicks + 原始序号` 稳定排序
- 相同开始时间合并为任意数量的子行
- `<mm:ss.xx>` 转换为 100 ns tick 的绝对开始/结束时间
- 行内时间倒序、格式不足或无法确定边界时，整行退回普通文本
- 不依赖事件中可能无效的原文 `EndPositionTicks`；优先使用下一个标签和下一组歌词开始时间
- 歌曲最后一组增强歌词缺少闭合时间标签、且默认结束时间早于最后一个字时，仅为最后一个字补 1 秒安全边界

### 渲染与安全

原生 listview 保持不变。适配器仅在 `.osdLyricsItemsContainer` 内处理带 `data-index` 的歌词节点，所有歌词内容通过 `createTextNode` 写入。白名单只允许 `<br>` 产生换行，其他标签和属性均作为文本显示。

### 平滑时间驱动

- Emby 原生 `onTimeUpdate` 继续负责整行选择与滚动
- 连续两个原生位置确认播放前进后，逐字层使用 `requestAnimationFrame` 插值
- 原生位置每次到达都会重新校准，不累积时间误差
- 暂停、缓冲、快进、后退和页面隐藏时停止插值
- 单个原生样本最多向前外推 800ms，超时后保持当前状态
- 逐字颜色、透明度和阴影过渡由 120ms 缩短为 80ms
- `played` 与 `active` 共享高亮样式，使高亮从行首累积到当前字，不再只点亮单个活动字

### 主题系统

- 内置 `classic`、`focus`、`gradient`、`apple`、`minimal` 五种主题
- 固定定位选择器的视觉层挂在 `document.body`，避免被播放页的 `overflow` 或 `transform` 裁剪，同时不污染虚拟歌词列表，也不修改 `videoosd.html`
- 控件生命周期仍归当前 `LyricsRenderer` 和歌词容器管理；不可见的旧渲染器不会创建、抢占或删除活动控件
- 额外检查歌词容器是否仍连接、拥有可见布局且未被其他页面覆盖；隐藏页面中的旧控件会设置 `hidden`，重新进入时解除
- 页面顶层只保留一个活动主题选择器，清理页面复用留下的重复控件
- 主题通过歌词容器的 `data-elyric-theme` 属性和作用域 CSS 切换，不复制或分叉计时逻辑
- 可见歌词行根据绝对播放位置标记为 `future`、`current` 或 `past`，平滑动画帧也会同步更新行状态
- 用户选择写入浏览器 `localStorage`，存储失败时仍可在当前页面临时切换
- 播放器重复回调不会重复创建选择器，`LyricsRenderer.destroy()` 会移除控件及主题属性
- 尊重 `prefers-reduced-motion`，关闭主题缩放与淡化过渡动画

### 安装安全

- 适配版本：Emby 4.9.5.0
- 校验两个原始文件的 SHA-256
- 校验 `_exports.default=LyricsRenderer` 注入锚点恰好出现一次
- 同时生成 JS/CSS 后再替换目标文件
- 原版与增强版均保存在 `/config/emby-lyric-enhance/4.9.5.0/`
- 未知文件状态会停止，避免用旧备份覆盖升级后的 Emby 前端
