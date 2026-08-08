# 开发日志

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
- 在播放页顶层注入一个固定定位的原生选择器，不污染虚拟歌词列表，也不修改 `videoosd.html`
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
