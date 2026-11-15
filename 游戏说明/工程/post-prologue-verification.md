# 序幕后玩法原型专项验收

## 玩法与验证范围

从隔离的 v5 C013 场景头存档进入，实际播放场景尾段并通过原 END 结算，随后在 Chrome 完成两轮日程和两座大副本。第二轮结算后，刷新并读取自动档恢复演示完成画面。两轮各 10 天、职业演示配置、报酬、物价和敌人强度均为演示暂定配置。

- 实走放学后、傍晚、夜晚、跳过今日、夜末及清晨幕间、两次截止日与副本锁图。按日程实做委托、打工和战斗战利品，买入并使用治疗药水、魔法飞弹卷轴、强酸。
- 浏览器经奶奶家选择法师进入单双人战斗，实走短休、长休、战败读取战前、独立手动槽和两个同源窗口。四职业洗点、回气、三项武器精通、术士先天术法、道具及林克飞行和治疗另有定向规则用例。
- 用独立浏览器上下文制造 v4 六槽和写入／清理故障。覆盖首启保留、失败保留、成功新建后精确清理及失败后的单独重试。两个同源窗口还验证同活动运行的旧自动档修订会被暂停。正式或个人浏览器档未用于测试。
- 类型检查通过，Vitest 47 文件 635 项通过。隔离 Chrome 三个上下文通过，页面和控制台错误 0。功能验收通过后，普通构建和 `/dimensional-war-game-source/` 子路径构建均通过。

## 截图与复现

运行代码区 `tools/check-post-prologue.py`，传入独立本机 Vite 地址及截图目录。脚本使用已有 Python Playwright，在三个新建的临时 Chrome 浏览器上下文运行。

| 场景 | 截图 |
|---|---|
| v5 首次新建确认 | [01](verification/post-prologue/01-v4-confirmation.png) |
| C013 进入日程 | [02](verification/post-prologue/02-c013-handoff.png) |
| 夜晚商店与资金 | [03](verification/post-prologue/03-night-shop.png) |
| 奶奶家一级构筑 | [04](verification/post-prologue/04-class-change.png) |
| 战败后选择存档 | [05](verification/post-prologue/05-defeat-load.png) |
| 双人战斗与能力面板 | [06](verification/post-prologue/06-dual-battle.png) |
| 副本安全点补给与长休 | [07](verification/post-prologue/07-safe-point.png) |
| 第二轮结束 | [08](verification/post-prologue/08-demo-complete.png) |

## 试玩限制

第五、六幕和副本前后剧情使用明确占位。敌阵按一级玩家能独立挑战的规格配置，林克保留原卡战力，双人会显著降低难度。魔法飞弹集中在单个目标上，法师护甲随长休结束。护盾术、林克传奇动作与传奇抗性选用、抓擒推撞等强制位移为下一阶段的待接入数据。

职业中文名称参考 5eTools 的 XPHB 2024 条目。玩法使用 Wizards of the Coast LLC 的 System Reference Document 5.2.1 所述规则，并适配到本项目的格数、时段和目标操作。 [5eTools 中文资料站](https://5e.kiwee.top/) · [SRD 5.2.1](https://www.dndbeyond.com/srd) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## 本次文件清单

- 新增日程和遭遇源文件。代码区 `src/game/loop/` 的 `types.ts`、`config.ts`、`characters.ts`、`progress.ts`、`checkpoint.ts`、`route.ts`、`encounters.ts`。
- 新增存档、战棋与界面源文件。代码区 `src/game/save-run.ts`、`save-v5.ts`，`src/game/battle/` 的 `loop-abilities.ts`、`timed.ts`，`src/game/ui/` 的 `loop-view.ts`、`loop-build.ts`、`battle-abilities.ts`，以及 `src/styles/loop.css`。
- 修改路由和存档接入。代码区 `src/game/` 的 `state.ts`、`router.ts`、`runtime.ts`、`controller.ts`、`campaign.ts`、`map-navigation.ts`、`system-types.ts`、`vault-storage.ts`、`save-format.ts`、`save-storage.ts`、`save-v2.ts`、`save-v3.ts`、`save-v4.ts`。
- 修改战棋。代码区 `src/game/battle/` 的 `types.ts`、`battle.ts`、`combat.ts`、`dice.ts`、`format-log.ts`、`grid.ts`、`initiative.ts`、`move-path.ts`、`movement.ts`、`render.ts`、`rules.ts`、`state-helpers.ts`、`turn.ts`。
- 修改视图。代码区 `src/game/ui/` 的 `map-view.ts`、`map-popup.ts`、`system-view.ts`、`battle-view.ts`、`battle-controls.ts`、`battle-dialogs.ts`。
- 新增测试 `src/tests/post-prologue.test.ts`、`post-prologue-battle.test.ts` 和 `save-v5.test.ts`，更新 `src/tests/menu-helpers.ts`。新增浏览器脚本 `tools/check-post-prologue.py`，更新 `tools/story-diagnostics.mjs` 的待决项模板。
- 更新代码区 `AGENTS.md` 与说明区 `README.md`、`工程/01-任务书.md`、`工程/open-questions.md`。新增本报告和上表的八张浏览器证据。未移动或删除项目文件。
- 发布构建刷新本机 `dist/`。最终子路径产物为 `index.html`、`assets/index-BXa6Jl4c.js`、`assets/index-CdBgPdxD.css` 及运行资源副本。普通构建的 `assets/index-CGUAHAQX.js` 随最终构建替换。Git 保留源码与验收证据。
