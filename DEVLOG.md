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
- 0.2.3 修复 Emby 先执行嵌入脚本、后把配置页插入 DOM 的实际时序：使用文档级生命周期管理器和 `MutationObserver` 监听后续页面插入，始终保留并绑定最新实例
- 回归测试模拟首次进入、第二次脚本执行、延迟插入新页面和旧页面清理，确保监听器/观察器只注册一次，保存后仍从服务器回读
- 0.2.3.0 单 DLL Release 构建通过，0 警告、0 错误；程序集版本、无 Core 引用及嵌入设置页中的生命周期修复均已核对
- 0.2.4 撤销会破坏 Emby 路由页面栈的 DOM 节点删除：重复插件页仅添加专属隐藏类，切换回来时按 `pageshow`/`viewshow` 重新激活，不修改任何其他管理页
- 设置页移除固定黑色背景，透明继承 Emby 当前主题；新增主题色状态条、重新读取按钮、保存中状态、服务器回读成功摘要和明确失败提示
- 配置尚未成功读取或重新读取失败时禁用保存，防止空白表单覆盖服务器设置；HTML 同时带入安全默认值，避免加载期间显示一片空白
- 0.2.4.0 单 DLL Release 构建通过，0 警告、0 错误；版本、无 Core 引用及嵌入页的路由保护、主题和保存反馈均已核对
- Emby 4.9.5.0 实机确认 0.2.4 的内联脚本虽随配置页 HTML 插入，但没有执行；因此界面始终保持 HTML 默认值，无法保证读取和保存服务器设置
- 0.2.5 把设置逻辑迁移到 Emby `data-controller` 加载的独立 AMD 资源 `configPage.js`，仍保留非破坏性重复页隐藏、加载失败保护、双提交保护和保存后服务器回读
- 实机同时定位到服务器全局 `/web/ede.user.js:5058` 在 `viewshow` 中对空对象设置 `itemId`；该异常会中断 Emby 所有管理页的显隐流程，并非歌词插件独有问题
- 为 Emby Danmaku Extension 1.47 增加定向兼容补丁：`itemId` 只在 `video-osd` 分支中写入，并保护 `detail`/`params`/EDE 实例与销毁定时器数组；补丁已在用户提供的完整 1.47 脚本上试应用，并通过语法和管理页/播放页行为测试
- 实机下载并检查 `/web/videoosd/lyrics.js`，确认当前容器仍是旧前端适配器：不包含 `PublicConfiguration`、显示 CSS 变量或 DLL 配置读取；只更新 DLL 无法改变播放页效果
- 0.2.6 从 Emby 4.9.5.0 歌词 AMD 模块的 `_connectionmanager` 取得当前服务器的认证 API 客户端；设置页使用 `apiClientResolver`，并同时更换 HTML/控制器资源名以避开 Emby 按旧 URL 缓存的 0.2.4 页面
- DLL 安装脚本现会检查活动 `lyrics.js` 是否包含公共配置读取；若仍是旧前端，会明确提示再执行 `docker-install.sh`

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
