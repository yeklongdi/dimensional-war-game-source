# M4 验收记录

日期：2026-10-21。工程：`E:\笔记\次元战争设定\游戏文件`。本轮只完成主菜单、关卡选择、累计解锁、单槽自动存档与场景开头恢复，未制作第二幕或其他路线。

## 命令与保护结果

使用Node.js 24.18.0、npm 11.16.0，实际执行 `npm run typecheck && npm test && npm run build`，整条命令退出码0。

完整实际输出见 `verification/m4/commands.txt`。交付地址已实际打开确认主菜单、0 error，初次菜单saveRequest为0，存档仍为空；见 `handoff-menu.png`。

| 检查 | 实际结果 |
|---|---|
| TypeScript | 通过，strict保持开启，无any逃生门 |
| Vitest | 15个文件、170项通过；原116项及断言未改，新增54项 |
| 生产构建 | 通过，52个模块，无新增运行时依赖 |
| 内容保真 | 连续主线25场、161段可见文本逐段与原JSON及批准的镜头分离/心声括号规则一致 |
| 保护哈希 | 60个保护文件前后SHA-256一致 |
| Git | 工程及父目录未初始化，不自行初始化、不提交或推送 |

保护范围包括四份source、三份剧情JSON、全部导出器、既有测试与辅助文件、战斗规则/AI、两份战斗配置、依赖配置、内容types/overrides/audio-map及自动问题清单。具体SHA-256见 `verification/m4/protected-hashes.json`。未重新导出、未补写剧情、未新增媒体。

## 浏览器方式与地址

- 用户正常预览地址保留 `http://127.0.0.1:5173/`；本轮验收不在该origin写入进度。
- 刷新、重试、多窗口验收使用 `http://127.0.0.1:5174/?seed=0`。
- 全新空档的连续主线，以及最终代码上携带历史通关flag的连续重玩，使用 `http://127.0.0.1:5175/?seed=0`。
- M2实际回归使用 `http://127.0.0.1:5175/?debug=battle&seed=42`。

所有主线操作均通过真实按钮、空格和棋格点击。没有在浏览器注入GameState、跳场景、改血量、一键胜利或调用私有规则。规则单测与浏览器实测分开记录。中途因用户中断关闭过早期验收标签页，恢复后继续做专项检查；随后另从空档完整连续完成25场，并在最终代码上再次连续重玩，未将中断前后片段冒称连续流程。

## 最终六步验收

| 任务书步骤 | 实测结果 |
|---|---|
| 1. 启动主菜单，无档继续置灰 | 通过；版本v0.0.0来自package，打开菜单零写入 |
| 2. 开始进入选关，只有序幕可点 | 通过；第一幕/第二幕真实disabled，卡片240×320，实际悬停尺寸254.4×339.2即1.06倍 |
| 3. 序幕九场、真实教学战与回流 | 通过；完整经过p001–p009，胜利只回流一次，甲乙退场，p006原SET/CHECK语义保留 |
| 4. 序幕结束返回选关，第一幕解锁 | 通过；只有p009 END解锁，刷新后仍保留，单独战斗胜利不提前解锁 |
| 5. 第一幕选择、真实战斗与结束 | 通过；A007只有主播可选，A010回班说明后回选择，A012不被幻象CALL/CG卡住，A014战后完整，再自然进入a015/a016 |
| 6. 第二幕完成提示仍锁，刷新继续 | 通过；返回选关显示锁与「已完成垂直切片」，刷新回菜单、继续到a016第一条文本，未直接进入END或跳过场景 |

证据：`full-route-browser.json`、`replay-browser.json`、`main-menu.png`、`initial-levels.png`、`full-route-complete.png`、`continue-menu.png`。两次连续主线均为25场、161段，正文序列完全一致。

## 两场战斗与M2回归

| 实测 | seed与合法操作 | 结果 |
|---|---|---|
| 序幕失败 | seed0，保留激励、每回合结束，死亡豁免也保留 | 第5轮死亡，27次骰子；失败不新增胜利/通关，只有本场重试及外层返回菜单 |
| 序幕重试胜利 | seed0，按M3 inspiration0原步骤；实际重掷首次伤害骰 | 第3轮胜利、男高1HP、20次骰子，完整日志与M3一致 |
| 黑色人形失败 | seed0，每回合结束 | 第5轮死亡，17次骰子，未提前标记切片完成 |
| 黑色人形重试胜利 | seed0，移动至(2,2)，大师之剑动作和徒手附赠 | 第3轮胜利、男高5HP、16次骰子，完整日志与M3一致 |
| 连续主线及最终重玩 | 与上述两场胜利相同步骤 | 两次均相同胜利结果及完整日志；历史两个胜利flag不能跳CALL |
| M2独立场 | seed42，原10条玩家命令 | 第3轮胜利、男高10HP、17次骰子；完整日志与原M2一致，0 error/0 warning/0音频，正式存档字符串完全未变 |

重试实际双击仍只创建一个新尝试：序幕恢复HP10/激励1/原初始骰序，第一幕恢复HP10/临时HP5/大师之剑，没有临时HP叠加。胜利双击「继续剧情」只解除原等待，p007及a014均先停在第一条原文；a014四段战后正文和两个SET全部保留。第一幕没有继承序幕残血或激励。

具体点击对应的命令、DOM状态与显示日志保存在 `progress-browser.json`、`full-route-browser.json`、`replay-browser.json`、`m2-browser.json`。截图包括两场失败/胜利与M2结算。

## 存档恢复与多窗口

- 普通剧情：在p003正文中刷新，菜单继续回p003首节点；可见立绘和BGM id与正常进入时一致，只有一个stage与一个audio。
- A007：四项中仅第二项enabled，选择后立即进入a008，刷新后恢复a008开头；老师、怪盗、反派已退场，主播仍在right。
- A010：回班选项执行原SET、实际显示批准的原说明，继续后回同一选择；在说明中刷新也回a010选择，返回记录保留，不执行原JUMP a016。恢复前后可见演员与BGM id一致。
- p006：移动到(4,3)并发起攻击后，先实际返回菜单继续，再另外实际刷新；均重播p006开头，重新进入原战斗初值，不恢复移动或待决定攻击。
- a014：移动与攻击后刷新，继续先重播「战斗界面切入。」再重新进入黑色人形战；HP10、临时HP5、主剑及原出生位置恢复。
- a016：完成后刷新继续回第一句；重玩序幕/第一幕从幕头开始，累计16个已获得flag及解锁保留。
- 两个真实同源窗口：一窗从a016继续，另一窗重玩p001后，两窗存档摘要更新为p001但前窗剧情仍在a016；前窗随后结束a016并保存，两窗摘要更新为a016，另一窗再继续进入最新a016。累计通关与解锁没有倒退。
- 实测双击开始、卡片、继续、返回、重试及胜利回流，没有重复stage/audio、越过第一条文本或重复结算。

25个主场景的素材、位置、姿态、表情、可见性、背景和BGM另有完整纯规则入口对照测试；静默恢复不执行过去SET/选择/音效/战斗。异步存储锁等待、旧会话响应、外部通知期间待保存请求转交，由可替换IO和纯reducer回归测试验证，未声称浏览器穷举所有竞态。

## 坏档及存储故障

使用开发服务器 `/tests/save-storage.html` 与真实控制器/UI，替换的假存储只在页面内存中工作，不改真实localStorage。结果见 `storage-fault-browser.json`：

- corrupt：菜单继续置灰；开始游玩后原始坏值保留、成功写入0次。点击替换后先显示确认，取消仍0次；明确确认并双击后成功写入恰好1次，内容只有五字段。
- read-failure：替换IO抛读取异常，界面提示无法读取，仍正常推进到p002，成功写入0次。
- write-failure：替换IO抛配额异常，界面明确显示保存失败，仍正常推进到p002，成功写入0次，没有假装已保存。

损坏JSON、字段不符、未知幕/场景、三条未开放路线、非法flag/时间/解锁关系、原坏档在确认期间变化、另一窗口修复、锁不可用和过期写入等边界另有单测。真实浏览器未强行禁用存储或制造配额满载，故障实测明确属于替换IO验收。

## 控制台与遗留

空档连续主线及最终代码连续重玩各为0 error、51条warning、51个不同消息。警告均为既有缺背景/立绘/音频及未制作的幻象调用；没有M4新增内容缺口或重复刷屏。M2回归无warning；故障反馈由界面展示，没有未处理异常。

四份source和三份剧情JSON保持不变，M0的158条内容诊断继续保留。缺立绘/表情差分、背景、音频、幻象动画/CG与未完成路线未补写或找替代素材。没有第二幕、多档、设置页或手机适配。未指定seed的跨刷新会重新随机，游戏内重试不换骰；这是用户已确认行为。

所有M4要求的正常路径与刷新/重试操作均已实测。极端调度竞态、校验排列及罕见骰子分支通过单测，未逐一在浏览器穷举。实际结果汇总见 `verification/m4/checks.json`；完整逐文件清单见 `verification/m4/file-changes.json` 及下方列表。



<!-- m4-file-list -->

## 本轮逐文件变更

以下为最终工程文件差异，不含node_modules与忽略的临时缓存；dist旧散列产物由Vite构建自动替换。临时5174/5175验收服务器已停止，5173正常预览保留。

### 新增（43）

- `dist/assets/index-CDtA3F3g.js`
- `dist/assets/index-plUyBU3W.css`
- `docs/m4-verification.md`
- `docs/verification/m4/a007-choice.png`
- `docs/verification/m4/a010-return-note.png`
- `docs/verification/m4/act1-end.png`
- `docs/verification/m4/act1-unlocked.png`
- `docs/verification/m4/checks.json`
- `docs/verification/m4/commands.txt`
- `docs/verification/m4/continue-menu.png`
- `docs/verification/m4/corrupt-save-confirm.png`
- `docs/verification/m4/file-changes.json`
- `docs/verification/m4/full-route-browser.json`
- `docs/verification/m4/full-route-complete.png`
- `docs/verification/m4/handoff-menu.png`
- `docs/verification/m4/initial-levels.png`
- `docs/verification/m4/m2-browser.json`
- `docs/verification/m4/m2-seed42.png`
- `docs/verification/m4/main-menu.png`
- `docs/verification/m4/multi-window-browser.json`
- `docs/verification/m4/progress-browser.json`
- `docs/verification/m4/prologue-failure.png`
- `docs/verification/m4/prologue-victory.png`
- `docs/verification/m4/protected-hashes.json`
- `docs/verification/m4/replay-browser.json`
- `docs/verification/m4/shadow-failure.png`
- `docs/verification/m4/shadow-victory.png`
- `docs/verification/m4/slice-complete.png`
- `docs/verification/m4/storage-fault-browser.json`
- `src/game/router.ts`
- `src/game/save-format.ts`
- `src/game/save-storage.ts`
- `src/game/story/restore.ts`
- `src/game/ui/app-chrome.ts`
- `src/game/ui/menu-view.ts`
- `src/styles/menu.css`
- `src/tests/fixtures/save-browser.ts`
- `src/tests/m4-helpers.ts`
- `src/tests/restore.test.ts`
- `src/tests/router.test.ts`
- `src/tests/save-format.test.ts`
- `src/tests/save-storage.test.ts`
- `tests/save-storage.html`

### 修改（13）

- `README.md`
- `dist/index.html`
- `docs/01-任务书.md`
- `docs/decisions.md`
- `src/game/audio.ts`
- `src/game/campaign.ts`
- `src/game/controller.ts`
- `src/game/state.ts`
- `src/game/story/player.ts`
- `src/game/story/presentation.ts`
- `src/game/ui/dev-overlay.ts`
- `src/game/ui/player-view.ts`
- `src/main.ts`

### 删除（2）

- `dist/assets/index-BmoMiMBL.js`
- `dist/assets/index-DDHln36z.css`
