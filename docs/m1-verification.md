# M1 对话播放器验收记录

日期：2026-10-19。工程：`E:\笔记\次元战争设定\游戏文件`。

## 验收结果

- `npm run typecheck && npm test && npm run build` 成功，退出码 0。原有 19 项测试保留，新增 14 项播放器规则测试，共 33 项通过。
- 直接依赖仍只有 TypeScript 5.9.3、Vite 8.3.4、Vitest 5.0.5；没有运行时依赖。当前最长代码文件为 `src/tests/player.test.ts`，218 行；其余代码文件也均未超过 400 行。
- 在实际浏览器中从 p001 开始，逐次点击或键盘推进，完整经过 p001–p009，再由结束页进入 a001–a016。共经过 25 个主场景；三条未完成路线保留在 JSON 中，按数据禁用，不属于本次可进入路线。
- 两个占位卡分别显示 `battle_prologue_tutorial` 和 `battle_black_humanoid`。点击一次按胜利恢复，清理各自敌方立绘，保留男高等其余角色。纯规则测试同时验证重复旧 token 不会再次恢复。
- A007 四项全部显示，仅导出数据启用的第二项可选；实际点击禁用的第一项没有改变等待位置。选择第二项进入 a008，主播仍位于 right，老师、怪盗、反派按确认的配置退场。
- A010 提示语来自导出数据。先点「回班上」，记录原 SET，显示原有 `【暂无线性后果】`，再回同一选择；之后选择进入施工区，正常到 a011。未执行返回分支原 JUMP a016，原 JSON 保持不变。
- A012 的幻象 CALL 发出一次占位警告，未知 CG 和 CAMERA 只进制作记录，原有幻象旁白继续播放，流程没有卡住。
- 正常玩家界面未发现 `【待确认】`、`【不可执行】`、`[变量名待定]`、CHECK、CAMERA 或镜头备注。8 句混合 STAGE 镜头句按用户确认的配置进入开发记录，其他正文保留。
- `~` 可开启、关闭开发浮层，显示幕、场景、节点位置、flag、人物状态和隐藏备注。第一幕结束时记录 12 个原导出 flag；重新开始回 p001，flag 归零且会话 token 更新。
- 浏览器当前页面会话控制台为 **0 条 error，51 条 warning，51 个不同 key**：50 条未绑定素材提示和 1 条幻象 CALL 提示。M0 的内容诊断数仍为 158，两者口径不同。
- 空格、回车、点击均检查过；未打完的句子第一次输入只补全，下一次才推进。正文检查未发现溢出。页面逻辑尺寸为 1280×720，按容器比例缩放居中。
- 两张立绘实际加载成功；序幕 masked id 使用「蒙面人」色块、首字「蒙」，第一幕使用怪盗原图。首次真实输入后观察到 BGM 的 audio 播放状态和 currentTime 推进；没有进行人工听音验收。

实际预览地址：`http://127.0.0.1:5173/`。本次最后将预览重新开始并停在序幕 p001。

## 原文与资源保护

- 四份 source、三份剧情 JSON、原 types.ts、八份导出器文件、三份原有测试文件，共 **19 份**文件的执行前后 SHA-256 一致。
- 指定两图两 WAV 的副本与 vault 原始文件 SHA-256 一致。未复制其他媒体，未生成游戏图片。
- `docs/open-questions.md` 沿用 M0 自动产物，没有手工加入 M1 说明；原有导出回归测试仍逐字核对该文件与三份 JSON。
- 具体哈希与构建清单见 [protected-hashes.json](verification/protected-hashes.json)，实际浏览器摘要及去重警告见 [browser-checks.json](verification/browser-checks.json)。

## 已知内容缺口与范围边界

- 普通 STAGE 内尚有 8 句镜头说明未在 M0 数据中单独标 meta；本轮已用精确配置处理，未来内容管线更新时需同步核对该配置。source、原 JSON 和导出器均未为此更改。
- 同学甲乙只有对白没有 SHOW，本轮只显示名字框。其余未绑定立绘、全部背景、绝大多数 BGM 与全部 SFX 仍占位或静默。
- 两张已有立绘只有静态原图，不能实际切换姿态/表情差分；状态变化已逐次保存，可在开发浮层查看。
- 幻象事件与 CG 没有额外动画，三条其他路线正文仍未完成。没有补写剧情或设定。
- 两场战斗只按胜利占位；主菜单、关卡选择、存档、多周目、战棋、第二幕均未实现。

## 本轮具体文件变更

新增运行配置与代码（16 份）：

```text
src/content/audio-map.json
src/content/overrides.json
src/game/state.ts
src/game/audio.ts
src/game/controller.ts
src/game/story/config.ts
src/game/story/library.ts
src/game/story/player.ts
src/game/story/presentation.ts
src/game/ui/elements.ts
src/game/ui/portraits.ts
src/game/ui/dev-overlay.ts
src/game/ui/player-view.ts
src/styles/player.css
src/tests/player-helpers.ts
src/tests/player.test.ts
```

原样复制媒体（4 份）：

```text
public/assets/portraits/hero.png
public/assets/portraits/thief.png
public/assets/audio/homecoming.wav
public/assets/audio/liuxie.wav
```

新增文档与验收证据（9 份）：

```text
docs/m1-verification.md
docs/verification/browser-checks.json
docs/verification/protected-hashes.json
docs/verification/p001-start.png
docs/verification/prologue-battle.png
docs/verification/a007-choice.png
docs/verification/a010-return.png
docs/verification/act1-battle.png
docs/verification/act1-end.png
```

修改已有工程文件（4 份）：

```text
src/main.ts
index.html
README.md
docs/decisions.md
```

构建自动新增 6 份、重建 1 份、删除旧输出 1 份：

```text
新增 dist/assets/index--kgG8Zw1.js
新增 dist/assets/index-C_2y8YjP.css
新增 dist/assets/portraits/hero.png
新增 dist/assets/portraits/thief.png
新增 dist/assets/audio/homecoming.wav
新增 dist/assets/audio/liuxie.wav
重建 dist/index.html
删除 dist/assets/index-P2Xu9kJm.js
```

没有删除工程源码、原文、测试或手写文档。以上不枚举 node_modules 内部的工具缓存。
