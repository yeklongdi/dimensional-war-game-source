# 次元战争

项目内容统一分为两个目录：

- [次元战争代码](次元战争代码/)：正式程序、运行素材、制作原件、剧本输入副本、测试和工具。
- [游戏说明](游戏说明/README.md)：剧情原稿、设定、规则、任务书、制作说明、验收和交接提示词。

## 开发与检查

在终端进入`次元战争代码`后运行：

```powershell
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

正式子路径构建：`npm run build -- --base /dimensional-war-game-source/`。

Git仓库根目录是本目录，沿用原提交历史和现有远程仓库。Actions从代码目录运行检查，只将其`dist`发布到[现有正式网站](https://yeklongdi.github.io/dimensional-war-game-source/)。

剧情原稿在说明区，正式接入的只读副本在代码区`source`。改写原稿不会自动替换正式副本；导入、导出和剧情修改仍须遵守[工程规则](次元战争代码/AGENTS.md)及[任务书](游戏说明/工程/01-任务书.md)。

完整目录规则和旧路径对照见[说明入口](游戏说明/README.md)，当前游戏状态与历史交付见[工程README](游戏说明/工程/README.md)。本次整理不新增独立决策日志。

程序及技术文档许可见[LICENSE](LICENSE)，剧情、角色、图片、音乐等仍按[资源说明](游戏说明/工程/THIRD_PARTY_NOTICES.md)的原有范围处理。
