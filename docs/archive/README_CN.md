# EmbyMusicUI 项目调查与设计资料归档

归档日期：2026-08-13

本目录保存本轮 Emby Web 音乐歌词播放器改造中仍可从本地任务上下文、仓库、终端摘要和附件恢复的资料，包括用户需求时间线、测试/部署命令、真实浏览器调查结论、20 张原始参考图和一份 EDE 1.47 参考脚本。

## 归档口径

- 对话记录是依据当前任务仍可见的用户消息重建的项目记录，不是 Codex 系统数据库的逐字节导出。
- 自动注入的浏览器环境提示、系统提示、隐藏推理、认证头、Cookie、访问令牌和账号标识不纳入归档。
- 命令日志只记录能够从终端结果、仓库测试或本轮上下文确认的指令与结论；无法恢复的历史命令不会被虚构。
- 参考图片按原始字节复制，没有重新编码或压缩；索引记录尺寸、字节数和 SHA-256。
- EDE 文件是用户提供的第三方参考附件，保持原样，仅用于兼容性研究；其版权和许可证归原作者所有。

## 文件导航

- [需求与对话时间线](CONVERSATION_REQUIREMENTS_LOG_CN.md)
- [测试、命令与故障证据](TEST_AND_COMMAND_LOG_CN.md)
- [参考图片索引与校验清单](REFERENCE_IMAGES_CN.md)
- [部署、回滚与真实环境验收](DEPLOYMENT_AND_VERIFICATION_CN.md)
- [历史方案与最终决策映射](HISTORICAL_PLAN_INDEX_CN.md)
- [20 张原始参考图](reference-images/)
- [EDE 1.47 用户脚本参考附件](attachments/ede-v1.47.user.js)

仓库内与本归档直接相关的正式文档：

- [单根播放器、Theme V5、账号同步和固定画布计划](../SINGLE_ROOT_PLAYER_UPGRADE_PLAN_CN.md)
- [V4 参数化主题系统计划](../V4_PARAMETRIC_THEME_PLAN_CN.md)
- [V3 播放器开发备忘](../V3_PLAYER_PLAN_CN.md)
- [服务端插件计划](../PLUGIN_PLAN_CN.md)
- [EDE 1.47 兼容说明](../EDE_COMPAT_CN.md)

## 归档时的代码基线

| 项目 | 值 |
|---|---|
| Git 基线 | `71f0662 Fix Theme V5 canvas layout and persistent theme storage` |
| 分支 | `main` |
| Emby Web 目标版本 | `4.9.5.0` |
| 插件版本 | `0.5.0` |
| 前端构建 ID | `2026.08.13-theme-v5-fixed-canvas-sync-r2` |
| 主题 schema | `5` |
| 布局模型 | `fixed-canvas-v1` |
| 横屏设计画布 | `1920 × 1080` |
| 竖屏设计画布 | `1080 × 1920` |
| DLL SHA-256 | `5B4601BB75168A98F4B8360830451BE3A0BED9C7803288091F35CFC4320C693B` |

固定画布的约束是 contain 居中等比缩放，不拉伸、不按长边扩展；非 16:9 或 9:16 视口的多余区域保持空白。横竖屏分别保存布局和控制坞数据，同一 Emby 账号以服务端 Workspace 为权威同步源。

## 归档时的服务器状态

代码侧的 r2 修复和 DLL 已完成本地验证，但最后一次可确认的真实页面仍是旧部署调查结果：Workspace 和 Themes 接口返回 HTTP 500，响应为 `The plugin theme store is not initialized.`，前端诊断为 `workspaceRevision=0`、`apiAvailable=false`、`workspaceSource=safe-default`。因此“本地代码已修复”和“线上已重装 DLL、重启并验收”是两个不同状态，后者仍需按部署文档执行。
