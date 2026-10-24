# M2 验收记录

日期：2026-10-20。工程：`E:\笔记\次元战争设定\游戏文件`。本轮完成独立调试战，不接入剧情 CALL，不写剧情胜利 flag，不继续 M3。

## 命令与保护检查

实际执行 `npm run typecheck && npm test && npm run build`，整条命令退出码0：

| 检查 | 结果 |
|---|---|
| TypeScript | 通过，strict保持启用 |
| Vitest | 8个测试文件，90项通过；原33项保留，新增57项 |
| Vite生产构建 | 通过，40个模块；HTML、JS、CSS及原媒体输出到dist |
| 依赖 | package.json、lockfile均未改，无运行时依赖，仍为三个固定开发依赖 |
| 代码约束 | TS/MJS/CSS/HTML代码文件均不超过400行，无any或隐式随机规则状态 |
| 内部验收入口 | dist不包含tests页面或内部测试入口 |
| 原文保护 | 四份source与三份剧情JSON的SHA-256前后一致，仍为9/19场 |
| 其他保护 | 现有导出器、types.ts、原测试及辅助文件、open-questions.md、tsconfig、依赖配置均未改 |

25个受保护文件的前后哈希见 `verification/m2/protected-hashes.json`。未重新导出或手改剧情数据，M0的158条内容诊断保留。

## 实际浏览器：正式调试场

预览地址：`http://127.0.0.1:5173/?debug=battle&seed=42`。用真实按钮和棋格点击操作，未在浏览器注入或改写游戏状态。坐标从0起，所有序列从重开开始。

### 胜利与复现

先攻为乙19、男高15、甲10。等乙行动结束后，依次执行：

1. 移动到(4,3)，动作攻击甲，附赠徒手攻击甲，结束回合。
2. 移动到(5,3)，动作攻击乙，附赠徒手攻击乙，结束回合。
3. 动作攻击乙，附赠徒手攻击乙。

第3轮胜利，男高10HP，甲乙均被击败，RNG共17次。甲被击败后男高能走进(5,3)，灰色尸体标记保留但不占格。第二轮和第三轮动作失误后仍能使用武术附赠。

最终代码版本连续实际完成两次上述序列，两次会话不同，完整日志逐条一致；同时与纯规则重放的全部骰子、AI决策及显示日志一致。详见 `verification/m2/battle-browser.json` 和 `rule-replays.json` 的 attack42。调试页控制台0 error、0 warning，无剧情DOM或audio实例。

### 昏迷、死亡豁免与补刀失败

同seed42，男高每次只打开「技能→结束回合」，共5次。男高逐步受伤后零血，出现昏迷、倒地、失能及死亡豁免计数，没有立即判负。此后乙继续补刀增加一次失败；第6轮男高实际投出死亡豁免d20=6，失败累计2；随后乙命中，失败累计3，结算「男高死亡」。完整浏览器日志与 wait42 重放一致。

### 掩体

同seed42，男高首回合移动到(1,1)后结束。甲移动至(2,2)近战，乙远程，均在对应攻击线经过邻接箱子时显示AC16与「方向性半身掩护+2AC」。站箱旁但攻击线不穿箱、箱子不阻断及多箱不叠加由规则测试补充。

### 敌方借机攻击

同seed42，男高移动到(0,4)并结束回合，下次移动到(0,0)。从(0,3)离开甲触及的步骤前，甲自动借机：d20=18，+2=20命中，d6=3，男高10→7HP；甲反应消耗一次，后续路径正常完成至(0,0)。详见 provoke42 和对应截图。

## 实际浏览器：内部反应页

地址：`http://127.0.0.1:5173/tests/battle-reaction.html`，仅Vite开发服务器使用；复用正式规则、单位数值、地形与UI，合法移动由测试IO发起，正式AI未修改。

- 固定骰序 `[1,20,1,13,2]`，甲先行动。从(2,2)走向(4,3)，在离开男高触及前暂停。此时甲仍在(2,2)，只消耗三次先攻骰。
- 实际双击「借机攻击」：只结算一次，d20=13+4=17命中，d4=2+2=4，甲6→2HP，男高反应耗尽，骰子总数5。甲继续完整路径至(4,3)，剩20尺；借机没有解锁男高武术附赠。
- 重开后点「放弃」：男高保留反应，不掷攻击/伤害骰，骰子总数仍3，甲6HP；移动继续至(4,3)，剩20尺。
- 测试完成后停留供检查，控制台0 error、0 warning。证据见 `reaction-browser.json`；移动者昏迷/被击败导致取消路径、多个借机的后续取消由单测覆盖。

## 实际浏览器：布局与输入

内置浏览器视口设置未改变实际页面布局，因此使用开发页 `/tests/battle-scale.html` 的960×600嵌入浏览区域。实际测得stage为960×540，纵向居中留30px；棋盘为504×360。实际点击移动至(4,3)并攻击(5,3)，落点正确，甲6→2HP。此页仅包裹真实正式入口，不设置隐藏游戏状态，也不进入生产构建。

1280×720与缩放页面均检查了边缘操作面板；按钮位于画面内，选目标时不遮挡棋格。日志可聚焦并用Control+Home/End滚动，实测顶部scrollTop=0、底部约890.4，内容高度1410、可视高度520。控制台未见error。

## 实际浏览器：M1完整回归

正常入口 `http://127.0.0.1:5173/` 从p001逐句走完p009，点「进入第一幕」，再走a001–a016，共25个主场景；三个未完成路线仍保留在数据中且不可选。

- p006和a014分别停在原两张战斗占位卡，点击一次继续，没有进入M2调试场。
- A007显示四项，只有原enabled为true的第二项可选；点击禁用项不改变状态，第二项进入a008。
- A008主播保持right，A010沿用立绘。A010「回班上」执行SET、显示原说明、回同一选择，再选第一项进入a011。
- A012不因幻象CALL或CG停住；玩家文本无待确认、不可执行、变量待定、CHECK或镜头备注。唯一白名单说明按原约定显示。
- p009显示「序幕结束／进入第一幕」，a016显示「第一幕结束／重新开始」；开发浮层可见原12个flag，重开返回p001。
- 该完整会话0 error；51条warning、51个不同消息，都是M1保留的素材缺口或制作调用提示，没有同id反复刷屏。详见 `story-browser.json`。

## 验证范围与遗留

天然20苏醒、三成功稳定判负、天然1两失败、零血时临时HP/免疫/抗性、移动中首个借机致昏迷取消后续反应、远程12格边界和旧token等少见分支已通过单测，未在正式调试场逐个用浏览器碰骰验证。不能将这些单测结果表述为全部分支的浏览器实测。

正式剧情战斗接入、黑色人形、英雄激励、教学气泡、存档、菜单与其他M3内容未实现；M1已有素材及剧情缺口保留，未新增或补写剧情。AI依已确认的简单策略行动，不使用疾走、撤离、回避或主动寻找掩护。

## 留存证据

`verification/m2/` 保存胜利、昏迷、死亡、掩体、借机、反应提示、缩放与第一幕结束截图；另有正式战斗两次重放、内部反应、正常剧情、纯规则重放和保护哈希JSON。截图与结构化日志用于对照，自动生成的问题清单未覆盖。

逐文件变更清单见本节后附及 `verification/m2/file-changes.json`；不包含node_modules依赖或忽略的临时QA转译缓存。

<!-- m2-file-list -->

### 新增（50）

- `dist/assets/index-BVWBLZhk.js`
- `dist/assets/index-CYzC9fTx.css`
- `docs/m2-data-sources.md`
- `docs/m2-verification.md`
- `docs/verification/m2/battle-browser.json`
- `docs/verification/m2/checks.json`
- `docs/verification/m2/cover-seed42.png`
- `docs/verification/m2/death-seed42.png`
- `docs/verification/m2/file-changes.json`
- `docs/verification/m2/m1-act1-end.png`
- `docs/verification/m2/opportunity-seed42.png`
- `docs/verification/m2/protected-hashes.json`
- `docs/verification/m2/reaction-browser.json`
- `docs/verification/m2/reaction-prompt.png`
- `docs/verification/m2/rule-replays.json`
- `docs/verification/m2/scaled-board.png`
- `docs/verification/m2/story-browser.json`
- `docs/verification/m2/unconscious-seed42.png`
- `docs/verification/m2/victory-seed42.png`
- `src/content/battles.json`
- `src/content/combatants.json`
- `src/game/battle/ai.ts`
- `src/game/battle/battle.ts`
- `src/game/battle/combat.ts`
- `src/game/battle/controller.ts`
- `src/game/battle/debug-state.ts`
- `src/game/battle/definitions.ts`
- `src/game/battle/dice.ts`
- `src/game/battle/format-log.ts`
- `src/game/battle/grid.ts`
- `src/game/battle/initiative.ts`
- `src/game/battle/movement.ts`
- `src/game/battle/render.ts`
- `src/game/battle/rules.ts`
- `src/game/battle/state-helpers.ts`
- `src/game/battle/turn.ts`
- `src/game/battle/types.ts`
- `src/game/ui/battle-controls.ts`
- `src/game/ui/battle-view.ts`
- `src/styles/battle.css`
- `src/tests/battle-ai.test.ts`
- `src/tests/battle-flow.test.ts`
- `src/tests/battle-grid.test.ts`
- `src/tests/battle-helpers.ts`
- `src/tests/battle-rules.test.ts`
- `src/tests/battle-seed.test.ts`
- `src/tests/battle-simulation.ts`
- `src/tests/fixtures/reaction-browser.ts`
- `tests/battle-reaction.html`
- `tests/battle-scale.html`

### 修改（7）

- `README.md`
- `dist/index.html`
- `docs/01-任务书.md`
- `docs/decisions.md`
- `src/game/state.ts`
- `src/game/story/player.ts`
- `src/main.ts`

### 删除（2）

- `dist/assets/index--kgG8Zw1.js`
- `dist/assets/index-C_2y8YjP.css`
