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
  → 原生整行滚动 + 逐字状态更新
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

### 安装安全

- 适配版本：Emby 4.9.5.0
- 校验两个原始文件的 SHA-256
- 校验 `_exports.default=LyricsRenderer` 注入锚点恰好出现一次
- 同时生成 JS/CSS 后再替换目标文件
- 原版与增强版均保存在 `/config/emby-lyric-enhance/4.9.5.0/`
- 未知文件状态会停止，避免用旧备份覆盖升级后的 Emby 前端

