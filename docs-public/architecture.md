# 技术架构

应用使用 Vite、TypeScript strict、浏览器 DOM/CSS 和 Canvas 2D。运行时不依赖框架或外部游戏引擎；数据和状态转换由纯函数处理，UI 控制器负责用户输入、绘制和浏览器 IO。

主要模块：

- src/game/story/：解析后的节点播放、恢复与展示配置。
- src/game/battle/：网格、骰子、战斗回合、AI、动作和路线规划。
- src/game/save-* 与 src/game/router.ts：存档格式校验、迁移和应用导航。
- src/game/ui/：主菜单、样例地图、对话与战斗界面。
- src/content/：公开演示所需的最小数据结构。
- tools/：独立于浏览器运行时的纯 Node 剧本格式解析器。

正式内容通常由本地内容管线提供。本仓库只携带 samples/story/ 下的合成输入及相应输出，因此开发预览展示的是演示内容。