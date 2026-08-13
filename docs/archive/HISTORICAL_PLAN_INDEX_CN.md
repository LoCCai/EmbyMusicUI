# 历史方案与最终决策映射

本页用于解释三个阶段方案的关系，避免后续把已废弃的断点或坐标模型重新带回运行时。完整当前方案以仓库根 `docs` 下的正式文档为准。

## 阶段一：完整主题系统（PlayerThemeV2 目标）

用户最初要求建立统一 `PlayerThemeV2` 参数注册表，每个参数同时具备默认值、校验、编辑控件、CSS/Canvas 渲染、序列化和测试。目标能力包括：

- 封面、歌曲信息、歌词、频谱、进度、播放控制、音量和辅助按钮全部成为可编辑图层。
- 拖拽、缩放、旋转、层级、隐藏、锁定、吸附、键盘微调、撤销/重做。
- 封面支持 Emby 图片、上传和 HTTPS URL；歌词支持主行、第二行、第三行及以后分别设置。
- 所有频谱分析参数、媒体字段、弹卡样式和控制参数进入主题快照。
- 按当前 Emby 认证用户隔离 Workspace、Themes、Assets；revision 冲突保留副本，不静默覆盖。
- 主题数量不设人为上限，500ms 防抖保存草稿，命名主题显式保存。

这一阶段确定了“参数必须完整接线”和“账号服务端同步”的长期约束，但最初四类设备布局和图层数量后来被双方向画布取代。

## 阶段二：Theme V4 双方向统一画布

用户要求废弃 desktop/tablet/mobile/compact 等隐式模式，只保留 landscape/portrait，并把所有可编辑图层统一放进同一舞台坐标系。该阶段引入锚点、设计单位、统一矩阵、逆矩阵拖拽和九套主题完全参数化。

对应正式历史文档：[V4 参数化主题系统](../V4_PARAMETRIC_THEME_PLAN_CN.md)。

已被后续决策替换的内容：

- 早期横屏 `1200 × 900`、竖屏 `900 × 1200` 基础画布。
- 屏幕长边超出基础比例时向两侧扩展。
- artwork/metadata/lyrics/visualizer/progress/transport/volume/auxiliary 多个独立控制图层。

仍然有效的约束：

- 只有横屏和竖屏两份布局。
- 几何只由布局文档产生，CSS 不再按主题 ID 硬编码位置。
- 内置主题是完整只读参数预设，另存为后结果必须一致。
- 编辑器与渲染器共享同一变换数学。

## 阶段三：Theme V5 账号同步与控制坞

在单根播放器基础上，Workspace 改为账号唯一权威源，浏览器缓存按 `serverId + userId` 隔离。控制图层合并为 `controlDock`，正式舞台只保留：

1. `artwork`
2. `metadata`
3. `lyrics`
4. `visualizer`
5. `controlDock`

控制坞内部保存横竖独立的行、分组、按钮顺序、显隐、对齐、间距和换行。进度与播放/暂停不可删除，退出和设置入口位于舞台外安全工具栏。

对应正式当前文档：[单根播放器升级计划](../SINGLE_ROOT_PLAYER_UPGRADE_PLAN_CN.md)。

## 最终固定画布决策

最终用户决策覆盖所有较早画布尺寸与扩展规则：

| Profile | 唯一设计画布 | 缩放规则 |
|---|---:|---|
| landscape | `1920 × 1080` | contain 居中等比缩放 |
| portrait | `1080 × 1920` | contain 居中等比缩放 |

禁止拉伸，禁止根据长边扩展设计画布，非目标比例的多余区域直接留空。当前主题格式为 `schemaVersion: 5`、`layoutModel: "fixed-canvas-v1"`；V3、V4 和早期 V5 `anchored-canvas-v2` 只作为兼容输入迁移。

## 不得回退的硬约束

- Workspace 非空时，陈旧 localStorage 或 DisplayPreferences 不能覆盖账号服务端草稿。
- 初始化完成前不得触发自动保存。
- 运行时不得按主题 ID 分支几何，也不得使用主题专属定位 CSS。
- 播放器只能有一个 `.elyric-player-root`，旧 shell 必须为 0。
- `lyrics.js/lyrics.css` 保持 Emby 原版；自定义逻辑位于 `videoosd.js/videoosd.css` 注入结果。
- 设置/退出入口永远可达，歌词、队列和舞台图层不能覆盖设置编辑器。
- 控制坞按钮的视觉尺寸与至少 `44 × 44 CSS px` 命中区域分离。
- 播放、进度、音量、队列和投屏继续代理 Emby 原生会话，不创建第二套音频内核。
