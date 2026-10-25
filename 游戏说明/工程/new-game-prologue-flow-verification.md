# 新游戏直入序幕（一）与奶奶家序幕（二）入口：专项验收

日期：2026-10-25。执行窗口：专项验收窗（另一窗口只测本次改动，不改正式游戏实现）。
结论：**本次专项 T01–T09 均未发现失败项**；本结论只覆盖新游戏入口、序幕一 P004→P005／P007→P008 两处内部衔接、P009 回图后的奶奶家“序幕（二）”入口、A003→act1_02/A004，以及与这些流程直接相关的恢复。**不代表全项目验收、全量回归或上线。**

## 1. 基线与交付确认

主窗已交付实现（不是“待实现”），基线固定如下。验收期间产品代码未再变化。

- Git 根：`E:\笔记\次元战争设定`，分支 `main`，HEAD `294f0e7bc06fc7edfe5c0ff449f9b4c1a5b4edad`（背景发布回执）。
- 本轮实现为**未提交工作区差异**，与[实现记录](new-game-prologue-flow-implementation.md)一致：6 个产品／样式文件修改，文档若干，未提交。
- 产品代码 SHA-256（验收开始与结束时一致，见 §7 复核）：

| 文件 | SHA-256 |
|---|---|
| `次元战争代码/src/content/levels.ts` | `9b9ae75c…b59bbbb7` |
| `次元战争代码/src/game/router.ts` | `2efc219d…ec365753b` |
| `次元战争代码/src/game/runtime.ts` | `2f2316f7…ab9094f8b` |
| `次元战争代码/src/game/ui/map-popup.ts` | `ab87df55…ec7ee63937` |
| `次元战争代码/src/game/ui/map-view.ts` | `f79dc815…68941a14c6ff93dc9cfc60189c87b6e85ccd9` |
| `次元战争代码/src/styles/map.css` | `f12fa60d…ca4365e02a8576` |

本轮只改测试与验收文档；没有改 runtime、router、关卡配置、存档实现、剧情 JSON、导出器、素材或战斗内核。

## 2. 实际执行的命令与用例数

全部在 `E:\笔记\次元战争设定\次元战争代码` 执行，只按文件路径或 `-t` 精确筛选，**未运行**不带筛选的 `npm test`、全量 typecheck、build、正式 base 构建、导出、素材扫描、整九关通关或两场战斗实打。

| # | 命令 | 结果 |
|---|---|---|
| 01 | `npm test -- src/tests/new-game-prologue-flow.test.ts src/tests/new-game-prologue-map.test.ts` | 2 文件 **19 passed**（9＋10），日志 `verification/new-game-prologue-flow/vitest-targeted.log` |
| 02 | `npm test -- src/tests/system-runtime.test.ts -t "空档新游戏写入成功后直入"` | 1 passed / 17 skipped |
| 03 | `npm test -- src/tests/system-runtime.test.ts -t "已有进度的新游戏取消不变"` | 1 passed / 17 skipped |
| 04 | `npm test -- src/tests/router.test.ts -t "战斗胜利不提前通关序幕"` | 1 passed / 20 skipped |
| 05 | `npm test -- src/tests/fast-forward.test.ts -t "关末转入下一内部关"` | 1 passed / 9 skipped |
| 06 | `npm test -- src/tests/map-flow.test.ts -t "新档仅奶奶家"` | 1 passed / 9 skipped |
| 07 | `npm test -- src/tests/map-flow.test.ts -t "序幕一连续播完后逐个返图六次"` | 1 passed / 9 skipped |
| 08 | `npm test -- src/tests/map-flow.test.ts -t "最后一句先补全"` | 1 passed / 9 skipped |

日志：`vitest-updated-legacy.log`（02–08 汇总）。02–08 对应的 7 条旧断言在验收开始时的失败状态已逐条复现并记录（见 §5），更新后全部通过，未删除任何既有防护。

新增专项测试不 mock 新入口、结算或保存激活：直接使用 `reduceRuntime`／`reduceApp`／`reduceCampaign`／`startScene`、正式 `storyLibrary`、真实 `dw.save.v4` 容器（`createStoryVaultStore` + 真实 `VaultStore` 协调器与串行锁），只把浏览器存储换成内存 Map，注入的失败只在“写入失败”一项中令 `setItem` 抛错。

## 3. 浏览器范围

- 开发预览：`npx vite --port 5199 --strictPort`，隔离 origin `http://localhost:5199/`，独立空档（首次打开显示“尚无自动档”），未触碰维护者正式档案。测试结束已关闭浏览器与开发服务器。
- 工具：`agent-browser`（Chromium）。真实主菜单起步，未用开发预览页或手柄注入状态。
- 实际路径：主菜单 →「开始新游戏」→ P001（序幕（一））→ 300ms 快进 → **P004→P005 自动衔接** → 快进 → **P006 教学战停等** → 系统菜单「跳过」→ P007 正文 → 快进 → **P007→P008 自动衔接** → 快进 → **P009 结尾 → 回地图（奶奶家浮窗已展开）** → 点击「序幕（二）」卡片 → **A001** → 快进 → **A003 完成 → 回地图（学校 / act1_02）** → 进入 **A004** → 刷新 → 主菜单「读取」自动档 → 回到 A004 场景头 → 系统菜单「返回主菜单」→「开始新游戏」确认框 → 取消。
- 全程只用快进缩短等待；**P006 教学战是主动“跳过”，不是战斗实打胜利**。跳过会同时写入 `flag_battle_prologue_tutorial_skipped` 与 `flag_battle_prologue_tutorial_won`（既有跳过契约，`battle-skip.test.ts` 原有断言如此），本报告只记为“跳过”。
- 证据截图（`游戏说明/工程/verification/new-game-prologue-flow/`）：

| 文件 | 内容 |
|---|---|
| `00-menu.png` | 隔离 origin 主菜单，“尚无自动档” |
| `01-new-game-p001.png` | 点击开始新游戏后首个可玩画面即 P001，未经过地图 |
| `02-boundary-p004-p005.png` | P004→P005 自动衔接后停在 P005 首句，自动档=仓库区事件 |
| `03-p006-battle-wait.png` | P006 教学战停等（未开始战斗） |
| `04-boundary-p007-p008.png` | P007→P008 自动衔接后停在 P008 首句，自动档=回家与睡前 |
| `05-map-prologue2-popup.png` | P009 后回图：奶奶家浮窗展开、关标“序幕（二）”、第4关卡片“序幕（二）” |
| `06-a001-entry.png` | 点击序幕（二）后进入 A001（序幕（二）·清晨卧室） |
| `07-after-a003-map-act1_02.png` | A003 完成后回图，主线 4/9·教室与校园导览，选中学校 |
| `08-a004-entry.png` | 进入 act1_02，从 A004 开始 |
| `09-resume-a004-after-reload.png` | 刷新后读取自动档，从 A004 场景头恢复 |
| `10-new-game-confirm.png` | 有进度时“开始新游戏？”确认框 |

浏览器内读取的真实磁盘状态（`dw.save.v4`，节选）：新游戏后 `checkpoint={kind:'level',levelId:'prologue_01',sceneId:'p001'}, completedLevelIds=[], flags={}, contentVersion='prologue_four_parts_v1'`；P005 处 `prologue_02/p005`、完成前缀 1；P008 处 `prologue_03/p008`、前缀 2；回图后 `checkpoint={kind:'map'}`、前缀 3；A003 后前缀 4、选中 `high_school`、浮窗关闭。

## 4. T01–T09 逐项结论

| 编号 | 结论 | 依据 |
|---|---|---|
| T01 | **通过** | 单测：空档新游戏激活后 `screen='story'`、`activeLevelId='prologue_01'`、`sceneId='p001'`、自动档检查点 `prologue_01/p001`、`map` 未建立、首句 `origin.nodeIndex=3` 且 `revealed=0`（启动点击未穿透补全或跳句）；重复新游戏、旧菜单导航 token、旧激活回调均返回同一状态。浏览器：`01` 首个画面即 P001，界面显示“序幕（一）/ 奶奶家门前”，自动档为关内场景。 |
| T02 | **通过**（写入失败与手动槽／设置在单测覆盖） | 单测：有进度时 `new` 进确认框，取消后 `dw.save.v4` 字节不变；确认后直入 P001，`manual` 六槽对象与 `settings` 保持原值；`setItem` 抛错时保留旧档与旧 `completedLevelIds`、提示包含“保存失败”，重试确认后才进入 P001。浏览器：`10` 确认框存在，取消后存档字节完全一致（`CANCEL_KEEPS_SAVE=yes`）。六槽／设置功能本身未遍历。 |
| T03 | **通过** | 单测：P004 末句前 `completed=[]`、`flag_prologue_p005_01` 未执行；补全后再推进一步才结算 `prologue_01` 并直接处于 `prologue_02/p005`，`screen='story'`、`map` 未建立、`waiting={kind:'text',revealed:0}`、自动档 `prologue_02/p005`；旧 token 不再改变状态。P007 同理只结算 `prologue_02` 进入 `prologue_03/p008`，前缀长度 1→2，`flag_prologue_completed` 仍为 `undefined`。快进在关末停止，落在 P005 正常等待，不自动获胜。浏览器：`02`、`04` 两处衔接均未出现地图或选关卡片。 |
| T04 | **通过（跳过路径）** | 单测＋浏览器：P006 仍停在 `battle_prologue_tutorial` 且无结果、无跳过标志、`flag_prologue_p006_01` 未执行；经系统菜单“跳过”返回后 `flag_battle_prologue_tutorial_skipped=true`、`flag_prologue_p006_01=true`，完成前缀仍为 1；继续到 P007 末句仍为 1，边界后才变 2。返回剧情后旧战斗 token 的 `continue-story`／`skip-battle` 被拒绝。未测战斗数值、AI、移动或完整实打。 |
| T05 | **通过** | 单测：P009 最后一句仍在 `prologue_03`（前缀 2，`map` 未建立），补全并推进后才 `screen='map'`、前缀 3、`flag_prologue_completed=true`、自动档 `{kind:'map'}`、`map={selected:'grandma_home',popupOpen:true,unlock:true}`、相机等于 `focusCamera(grandma_home)`、`sceneId` 仍为 `p009`、无任何 `flag_act1_*`。浏览器：`05` 与磁盘状态一致。 |
| T06 | **通过**（DOM 文案以浏览器为准） | 单测：`act1_01.locationId='grandma_home'`、`name='上学途中与校门'`、`levelMapTitle='序幕（二）'`；`school_road` 只剩 `prologue4_01`；前缀 3 可见地点不含 `school_road`；三个已完成关卡 `enter-level` 均被拒绝；进入 `act1_01` 后 `sceneId='a001'`、自动档 `act1_01/a001`、前缀仍 3。浏览器：奶奶家节点 `aria-label="查看奶奶家的关卡，当前：序幕（二）"`、节点章节标“序幕（二）”、浮窗标题“奶奶家”、卡片主文字“序幕（二）”、补充“上学途中与校门”、状态“开始关卡”且可用，已完成卡片禁用。未做地图拖缩／其他分辨率回归。 |
| T07 | **通过** | 单测（标注为受控 `act1_01/a001` 档）：A003 完成后前缀 4、`map={selected:'high_school',popupOpen:false}`、`sceneId='a003'`、当前关 `act1_02`；进入后 `a004`。浏览器：从真实 A001 走完 A003，`07` 显示 4/9、选中学校、浮窗关闭，`08` 进入 A004。到此停止，未继续第五关以后。 |
| T08 | **通过**（浏览器仅抽查一处） | 单测：`prologue_01/p004` 中途档从场景头恢复并衔接 P005，不回 P001；`prologue_03/p008` 中途档恢复后走到 P009 结尾才回图且前缀补齐到 3（过程中 `flag_prologue_completed` 未提前写）；`prologue_02/p005` 主动返回地图后 `selected='old_warehouse'`、前缀仍 1，再次进入从 P005 场景头开始；旧 v4 地图档（前缀 3＋`{kind:'map'}`）回图后不补记、不自动展开浮窗、进入 `act1_01` 才是 A001；`prologue_02/p006` 档恢复后仍按规定进入教学战，跳过／胜利标志均未提前存在。浏览器：刷新后经“读取→自动档→确认”回到 A004 场景头，前缀仍为 4。未做完整六槽、存档迁移或多窗口测试。 |
| T09 | **通过** | 单测：完整前缀的进度线为 4 条、全部 `from!==to`、最新一条为 `grandma_home→school_road`；前缀 3 只有一条历史线 `old_warehouse→grandma_home` 且无 `latest`，不存在奶奶家自连线；`currentLevel(前缀3)='act1_01'` 且地点、关标来自配置；把活动关上下文改回 `prologue_01` 的过期状态下推进请求被拒绝。浏览器：P009 后 `.map-route` 只有 1 条 `old_warehouse→grandma_home`，无自连线；副标题“主线进度 3 / 9 · 序幕（二）”与实际配置一致。 |

## 5. 被本次需求替代的旧断言及更新

验收开始时这些用例全部失败，且失败点均等于“旧行为”而非新功能缺陷；按规格改写为本次目标，保留原有防护理路（写失败、取消、身份、旧 token 拒绝、坏档、通关顺序等）。

| 文件 | 旧断言 | 更新为 | 复跑 |
|---|---|---|---|
| `src/tests/system-runtime.test.ts` | “空档成功写入后才进地图” | “空档新游戏写入成功后直入序幕一 P001”，并校验自动档检查点为关内 | 1 passed |
| `src/tests/system-runtime.test.ts` | 新游戏确认后 `screen='map'` | `screen='story'`、`sceneId='p001'`、自动档 `prologue_01/p001` | 1 passed |
| `src/tests/router.test.ts` | P009 后 `map.selected='school_road'` | `{selected:'grandma_home',popupOpen:true}` | 1 passed |
| `src/tests/fast-forward.test.ts` | “关末不进入下一关”，结束于地图 | “关末转入下一内部关并在 P005 正常停等”，`fastForward` 停止、前缀 1 | 1 passed |
| `src/tests/map-flow.test.ts` | 显现节点数 `[1,2,2,3,4,5,5,5,5]`、5 条历史线 | `[1,2,2,2,3,4,4,4,5]`、4 条线且无自连线 | 1 passed |
| `src/tests/map-flow.test.ts` | 八次返图后停在 C003 | 序幕一连续播完后逐个返图六次：`prologue_03, act1_01, act1_02, act1_03, act1_04, prologue3_01`，仍停在 C003 阻断 | 1 passed |
| `src/tests/map-flow.test.ts` | 边界后 `screen='map'` 且下一场 SET 不执行 | 边界后 `screen='story'`、`sceneId='p005'`、前缀 1；下一场自己的开场 SET 在 P005 正式开始后执行，边界前不执行，旧 token 仍被拒绝 | 1 passed |

新增防护（未削弱旧防护）：`new-game-prologue-flow.test.ts` 9 例、`new-game-prologue-map.test.ts` 10 例，共享 `new-game-prologue-helpers.ts`（真实 v4 盘与 runtime 装配，仅内存存储）。

## 6. 未测与限制

明确**未测**，不得据本报告推断为通过：

- 不带筛选的全量 `npm test`、全量 `typecheck`、`build`、正式 base 构建、剧情导出、素材哈希扫描。
- 战斗内核：数值、AI、移动、完整实打；本报告只有“明确跳过”。战斗日志与逐回合记录未复核。
- 六手动槽、设置项逐项行为、存档迁移（v1–v3）、多窗口竞争、其他分辨率、地图拖缩、背景图库、立绘、音量。
- 第五关（`act1_03`）及以后，包括整九关通关。
- 浏览器未覆盖：写入失败的 IO 错误注入（存储层抛错只在单测模拟）、五次以上重复点击的输入竞争、同一次鼠标事件穿透的逐帧观测（以“首句未补全、`nodeIndex` 未前进”作为等价证据）。
- `MapView`／`MapPopup` 的 DOM 文案没有单测：本仓库测试环境无 DOM，未引入新依赖；关标与卡片文字由浏览器截图与 DOM 读取结果作为证据，配置层另有断言。

观察记录（不构成失败、未要求修复）：

1. 跳过教学战会同时写入 `_skipped` 与 `_won` 两个标志，这是 `campaign.ts` 既有的“跳过按胜利返回”契约（`battle-skip.test.ts` 原有断言），本次未改；本报告一律记“跳过”。
2. `p006` 的战后正文节点带 `meta:true`，跳过战斗后直接进入 `p007` 首句，属既有内容处理，不是入口回归。
3. 系统菜单快进说明仍写“遇选项、战斗或关末停止”。实测关末确实停止（落在下一内部关首句并归零补全进度），文案与实际一致，未改。
4. 剧情页右侧“自动档”标签使用关卡原名（如“上学途中与校门”），地图关标／卡片使用“序幕（二）”，符合规格“地点与关卡名不改，仅地图入口显示章节名”。

## 7. 结束复核与文件变更

- 验收结束时 6 个产品文件 SHA-256 与 §1 完全一致，`git diff -- 次元战争代码/src` 的新增行只来自本次测试文件改动；产品代码零修改。
- 按用户本次“测试结束后上传到 github”的指令，验收窗只做提交与推送，不改产品代码：
  - 提交 `fb0a97c`（父提交 `294f0e7`），推送 `origin/main` 成功，范围为本轮实现＋测试＋说明＋本报告证据；未纳入另一窗口遗留的本机日志（`verification/backgrounds-v1/dev-*.log` 仍为未跟踪）。
  - 推送触发仓库既有工作流 `Check, build and deploy game`（run `40197694942`），**build 与 deploy 两个 job 均 success**：CI 自行执行的全量 typecheck、全量 `vitest run`、Pages 构建与部署都通过。这是仓库 CI 的独立结果，**不是本窗口执行的全量验收**，也不能替代 §6 列出的未测项；§2 的本地限定范围不变。

本次新增：

- `次元战争代码/src/tests/new-game-prologue-flow.test.ts`（T01–T04，9 例）
- `次元战争代码/src/tests/new-game-prologue-map.test.ts`（T05–T09，10 例）
- `次元战争代码/src/tests/new-game-prologue-helpers.ts`（专项装配）
- `游戏说明/工程/new-game-prologue-flow-verification.md`（本文件）
- `游戏说明/工程/verification/new-game-prologue-flow/` 下 11 张截图与 2 份日志

本次修改：

- `次元战争代码/src/tests/system-runtime.test.ts`（2 条旧断言按新需求更新）
- `次元战争代码/src/tests/router.test.ts`（1 条）
- `次元战争代码/src/tests/fast-forward.test.ts`（1 条）
- `次元战争代码/src/tests/map-flow.test.ts`（3 条）

本次移动／删除：无。历史验收证据（`verification/m4`、`verification/backgrounds-v1` 等）未改动。

## 8. 结论

在固定基线上，本次“新游戏直入完整序幕（一），结束后奶奶家进入序幕（二）”的入口、两处内部衔接、P009 回图落点、地图关标与卡片、A001 首次进入、A003 后回到学校 A004，以及与之直接相关的恢复，均按规格工作；未发现需要交回主窗修复的缺陷。**这是专项结论，不是全项目验收**；仓库 CI 的全量检查已随本次推送通过并成功部署，但 §6 列出的战斗、存档迁移、多窗口、素材与地图拖缩等范围仍未由本窗口验证。
