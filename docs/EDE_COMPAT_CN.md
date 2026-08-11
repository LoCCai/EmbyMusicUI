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

补丁文件：[`patches/ede-user-v1.47-view-lifecycle.patch`](patches/ede-user-v1.47-view-lifecycle.patch)。服务器安装时无需依赖容器中的 `patch` 命令，统一安装器会执行同样的精确转换。

在 Docker 宿主机执行：

```bash
sh docker-install.sh <Emby容器名或ID> ede
sh docker-install.sh <Emby容器名或ID> ede-status
```

安装器只在六组易受影响代码各出现一次时应用修复，并先把原文件持久备份到 `/config/emby-lyric-enhance/ede-1.47/original/ede.user.js`，再在目标目录原子替换。重复运行不会重复修改；EDE 不存在时安全跳过；未知版本或已有备份与当前文件不一致时停止，不会覆盖文件。恢复命令：

```bash
sh docker-install.sh <Emby容器名或ID> ede-restore
```

如果检测到 CustomCssJS Provider，安装器会提示其后续重新生成 `ede.user.js` 可能覆盖修复；此时还应同步更新 Provider 中的原始脚本条目。

## 验收

- 连续切换“歌词增强”、Cinema Intros、CustomCssJS Provider 和日志页，只有当前页可见。
- 控制台不再出现 `ede.user.js` 的 `itemId` 赋值异常。
- 打开视频播放页后弹幕开关、匹配、时间轴和退出播放清理仍正常。
