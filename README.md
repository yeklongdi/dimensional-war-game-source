# 次元战争 · 程序源码与技术演示

这是《次元战争》Web 垂直切片的公开程序源码快照。它保留原生 TypeScript/Vite 播放器、战棋规则、移动规划、地图交互与本地存档实现；仓库内的剧情输入、关卡数据和图片均为技术演示样例，不包含正式剧本、角色资料或正式美术/音频。

正式游戏体验：[次元战争 Web 垂直切片](https://yeklongdi.github.io/dimensional-war-game-pages/)。

## 本地运行

需要 Node.js 24 或更新的 LTS 版本和 npm。

~~~sh
npm ci
npm run dev
~~~

在浏览器打开 Vite 显示的本地地址。运行检查：

~~~sh
npm run typecheck
npm test
npm run build
~~~

公开版的导出器默认读取 samples/story/prologue.md 与 samples/story/act1.md。这两份文件只展示解析格式，不是正式剧情。可用 -- 指定自有输入文件，例如：

~~~sh
npm run export-story -- --prologue ./my-input/prologue.md --act1 ./my-input/act1.md
~~~

导出会更新 src/content/ 中的样例 JSON 和 docs-public/open-questions.md。

## 公开演示与正式游戏

公开源码仓库使用两段合成样例文本和中性样例单位、地图及 SVG 占位图。它不会复现正式游戏的七关内容、角色、战斗数据、媒体或故事。所有正式内容均由维护者另行管理；通过样例不能推断正式剧情或素材许可。

公开版在浏览器中的进度保存在当前 origin 的本地存储中。它没有账号系统、云存档或跨设备同步。正式网站和本地开发地址拥有各自独立的浏览器存储。

## 目录

- src/game/：剧情播放器、状态与存档、战棋规则、AI、移动规划、地图和界面实现。
- src/content/：类型与样例关卡配置。
- samples/story/：可替换的合成导出输入。
- public-tests/：公开技术测试。
- tools/：纯 Node 剧本格式解析和导出辅助模块。
- public-demo/：本仓库自制的中性 SVG 占位资源。
- docs-public/：公开技术说明与授权边界。
- .github/workflows/ci.yml：只执行安装、类型检查、测试与构建的 CI。

## 许可证范围

LICENSE 中的 MIT 许可适用于本仓库的程序源码、构建与测试配置、公开技术说明，以及明确列出的合成样例输入、演示数据和本仓库自制 SVG 占位图。samples/ 与 public-demo/ 不属于《次元战争》正式故事或美术；其逐项范围见 [素材与许可边界](docs-public/assets-and-licenses.md)。

正式剧情、角色设定、人物图像、城市地图、音乐、字体和其他游戏内容不随本仓库发布，也不由此仓库中的 MIT 文本授权。若未来加入任何第三方代码或资源，必须保留原许可和署名并在发布前单独审查。
