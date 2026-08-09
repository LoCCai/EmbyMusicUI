# Emby Danmaku Extension 1.47 页面生命周期修复

## 问题

`ede.user.js` 把 `window.ede.itemId` 赋值放在 `video-osd` 判断之外。Emby 打开配置页、日志页或其他非播放页时，`window.ede` 通常尚未创建，因此 `viewshow` 监听器抛出：

```text
TypeError: Cannot set properties of undefined (setting 'itemId')
```

该异常会中断 Emby 自身的页面显隐流程，造成多个管理页同时显示、保存后叠层或刷新后界面状态异常。

## 修复

修复仅对 Emby Danmaku Extension 1.47 做三项生命周期保护：

1. 只在 `detail.type === 'video-osd'` 且已创建 EDE 实例后写入 `itemId`。
2. 对 `e.detail`、`detail.params`、`window.ede` 和定时器数组做空值保护。
3. 在初始化播放页 UI 前写入当前 `itemId`，避免异步逻辑读到上一个媒体 ID。

补丁文件：[`patches/ede-user-v1.47-view-lifecycle.patch`](patches/ede-user-v1.47-view-lifecycle.patch)。

应用前先备份实际使用的 `ede.user.js`。在该文件所在目录执行：

```bash
cp ede.user.js ede.user.js.before-view-lifecycle-fix
patch -p1 < /path/to/EmbyLyricEnhance/docs/patches/ede-user-v1.47-view-lifecycle.patch
```

如果脚本由 CustomCssJS Provider 管理，则用修正后的完整脚本替换原条目，保存后刷新 Emby Web。

## 验收

- 连续切换“歌词增强”、Cinema Intros、CustomCssJS Provider 和日志页，只有当前页可见。
- 控制台不再出现 `ede.user.js` 的 `itemId` 赋值异常。
- 打开视频播放页后弹幕开关、匹配、时间轴和退出播放清理仍正常。
