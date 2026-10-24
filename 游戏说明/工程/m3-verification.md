# M3 验收记录

范围：两场真实战斗接入现有剧情，保留M1临时幕结束页与M2独立调试场。没有制作M4菜单、关卡选择或存档，没有修改/补写剧情。

## 命令结果与保护

实际执行 `npm run typecheck && npm test && npm run build`，整条命令退出码0。

| 检查 | 结果 |
|---|---|
| TypeScript | 通过，strict保持开启 |
| Vitest | 11个测试文件、116项通过；原90项及其断言未修改，新增26项 |
| 生产构建 | 通过，44个模块；原有媒体继续随public复制，无新增媒体 |
| 依赖 | package.json和lockfile未改，仍只有三个固定开发依赖，无运行时依赖 |
| 代码约束 | 无any、无Math.random，无超过400行的代码文件 |
| 内容保护 | 四份source、三份剧情JSON、导出器、原测试、types.ts、自动问题清单及工程配置哈希一致 |
| 内容统计 | 序幕9场、第一幕19场；其中正常主线共25场，原158条M0诊断保留 |
| 开发验收页 | dist不包含tests页面或内部反应测试入口 |

33个保护文件的前后SHA-256见 `verification/m3/protected-hashes.json`；综合结果见 `checks.json`。未运行导出覆盖问题清单，也未手工修改三份剧情JSON。

## 预览与复现约定

- 正常入口：`http://127.0.0.1:5173/`。
- 本轮正式流程验收：`http://127.0.0.1:5173/?seed=0`。
- M2独立入口：`http://127.0.0.1:5173/?debug=battle&seed=42`。

正式两场各自使用本轮seed独立初始化，重试恢复该场初始RNG，不继承上一场骰子进度。缺失seed时仍由crypto IO生成，seed0只是本轮可复现验收地址，不是强制默认或数值调整。配置与来源说明见 `m3-data-sources.md`。

浏览器使用真实键盘、按钮及棋格点击，从p001逐句推进。纯规则模拟只用于准备合法复现步骤和比较日志；没有在浏览器注入业务状态、改数值、跳场景、一键胜利或调用内部规则函数。

## 实际浏览器：直接胜利

### 序幕教学战

从p001正常走到p006，真实进入 `battle_prologue_tutorial`，没有旧占位卡或绕过按钮。原CALL等待token与已推进光标保留；战斗中按键不会推进剧情。

使用seed0，具体玩家命令保存在 `rule-replays.json` 的 inspiration0：

1. 保留先攻激励；移动到(4,3)，动作和附赠分别攻击甲。
2. 攻击骰选择保留激励；首次伤害骰选择使用激励。
3. 结束回合，下回合用动作/附赠击败甲；再结束。
4. 第3轮移动到(5,3)，动作与附赠击败乙。

实际第3轮胜利，男高1HP，20次骰子，完整显示日志与纯规则重放逐条一致。伤害骰原d4=3、新d4=3，仍真实消耗激励并采用新骰；不是自动取优。双击使用只结算一次，伤害等待期间目标仍为原HP。

教学日志中三条各出现一次。实际看见并截取了「点击蓝色格移动」的单位附近气泡；切换移动模式再取消不会重新触发。攻击/附赠提示的合法时点、未命中解锁和重渲染去重另有单测。

胜利双击「继续剧情」后停在p007第一条可见文本（节点3），没有多跳一句；原p006的SET已记录，CHECK仅进入制作记录。返回后甲乙隐藏，男高和蒙面人保留；只有一个剧情视图和一个音频元素。

### 第一幕黑色人形战

A007选择主播；A010先回班上、显示原说明并返回，再选择进入施工区；A012幻象CALL/CG不阻断。a014真实进入 `battle_black_humanoid`，标题与结算均为本场配置，没有M2调试说明或黑衣人胜利文字。

开场实际捕获到剑痕Canvas，男高HP10/最大HP10、临时HP5，怪物在(3,3)。没有继承序幕的1HP或英雄激励。规则日志第一条是「剑形灼痕共鸣：获得5点临时生命值」。

使用seed0，移动到(2,2)，每回合使用大师之剑动作与独立徒手附赠、再结束回合。第1轮两次失误后，爪击造成10点暗蚀，临时HP5→0，实际HP10→5；没有额外治疗或最大HP15。第3轮胜利，男高5HP，16次骰子，完整日志与shadow0重放一致。主动作日志为大师之剑1d8+2、附赠为徒手1d4+2，最终攻击加值始终+4。

胜利双击继续仍先停在a014节点5、第一条战后原文。之后播放完整战后正文、人物演出及两个原SET，再自然进入a015–a016；没有直接跳a015。

证据：`direct-browser.json`、`prologue-victory.png`、`shadow-opening.png`、`shadow-victory.png`。

## 实际浏览器：两场失败、重试、再次胜利

另一次从p001开始的连续验收完整走过25个主场景，并在两场分别验证失败→重试→胜利；完整记录见 `retry-browser.json`。

| 本场 | 失败的合法操作 | 实际失败结果 | 重试后的胜利 |
|---|---|---|---|
| 序幕，seed0 | 保留激励，每回合仅结束；死亡豁免也保留原骰 | 第5轮死亡，27次骰子；失败面板只有重试 | 采用与直接胜利相同的inspiration0序列，第3轮1HP、20次骰子，日志完全一致 |
| 第一幕，seed0 | 每个可操作回合仅结束 | 第5轮死亡，17次骰子；失败面板只有重试 | 采用与直接胜利相同的shadow0序列，第3轮5HP、16次骰子，日志完全一致 |

- 两次重试的单位初值与进入该场时逐项一致：序幕恢复HP10、激励1点、原先攻前的骰序；第一幕恢复HP10、临时HP5与大师之剑，日志中临时HP仅授予一次。
- 失败及重试期间原剧情等待、返回光标和场景保持不变；尝试token更换，原演出和flag未重放。实际双击重试仍只开始一个新尝试。
- 序幕重试胜利后的flag、人物及p007文本位置与直接胜利一致；两场重试胜利的完整骰子/AI/日志也与直接胜利一致。
- a014全部可见文本与源JSON逐段一致；进一步单独比较CALL之后的四段可见正文，完全一致。最终原12个导出flag及两个正式胜利flag共14个，a014的两个SET均存在。
- 全主线通过A007/A010，A008与A010主播保持right；a015按既有配置隐藏剑，a016保留男高和主播。制作备注、CHECK、镜头说明不进入玩家文本；A010原说明仍是唯一白名单例外。
- 整个连续会话控制台0 error；51条warning、51个不同消息，均为既有素材/制作调用缺口。正常流程只有一个活动stage、一个音频元素，没有战斗/剧情UI残留或重复BGM。

证据还包括 `prologue-failure.png`、`shadow-failure.png`、`tutorial-move.png`、`act1-end.png`。验收中曾有一次页面重载，随后重新从p001完成上述连续验收；没有用重载前后的片段拼接替代连续流程。

## 实际浏览器：M2回归

从独立入口seed42按M2原10条玩家命令实际打完整场，第3轮胜利，男高10HP、17次骰子。显示日志与M2原始验收记录逐条一致；0 error、0 warning、0音频元素，没有英雄激励、教学、剑或临时HP污染。见 `m2-browser.json`。

## 单测覆盖及未做浏览器穷举的部分

新增26项测试覆盖配置按id查找、装备副本、临时HP先于行动、物理抗性不回退、CALL/分支光标与a014原文、失败/重试、胜利一次性回流、错误返回上下文拒绝、旧命令/反应/动画token、教学时点、英雄激励各骰型与单颗替换、非法响应不耗RNG及M2原日志。

英雄激励的先攻使用、优势/劣势中指定替换、重击多伤害骰替换、借机激励、天然20死亡豁免苏醒等少见分支通过单测；浏览器实际使用的是伤害骰激励，并在死亡豁免时实际选择保留。没有宣称上述每个骰子分支都在浏览器逐一触发。稳定失能失败保留M2规则并有回流/重试单测，本轮浏览器实际失败均为死亡。

## 遗留与边界

没有新增剧情缺口或自行补写内容。既有背景、立绘差分、音频、幻象动画/CG和未完成路线仍保留原占位及诊断。M4主菜单、关卡选择和存档未实现；刷新仍从p001开始。随机战斗允许真实失败；同seed、同操作重试会复现相同结果，不能靠重试自动换骰或补满非初始资源。

逐文件变更见下附清单及 `verification/m3/file-changes.json`，包括构建产物替换；不列node_modules依赖或忽略的临时QA转译缓存。

<!-- m3-file-list -->

### 新增（27）

- `dist/assets/index-BmoMiMBL.js`
- `dist/assets/index-DDHln36z.css`
- `docs/m3-data-sources.md`
- `docs/m3-verification.md`
- `docs/verification/m3/act1-end.png`
- `docs/verification/m3/checks.json`
- `docs/verification/m3/direct-browser.json`
- `docs/verification/m3/file-changes.json`
- `docs/verification/m3/m2-browser.json`
- `docs/verification/m3/prologue-failure.png`
- `docs/verification/m3/prologue-victory.png`
- `docs/verification/m3/protected-hashes.json`
- `docs/verification/m3/retry-browser.json`
- `docs/verification/m3/rule-replays.json`
- `docs/verification/m3/shadow-failure.png`
- `docs/verification/m3/shadow-opening.png`
- `docs/verification/m3/shadow-victory.png`
- `docs/verification/m3/tutorial-move.png`
- `src/game/battle/actions.ts`
- `src/game/battle/inspiration.ts`
- `src/game/battle/tutorial.ts`
- `src/game/campaign.ts`
- `src/game/ui/battle-dialogs.ts`
- `src/tests/battle-m3.test.ts`
- `src/tests/campaign-helpers.ts`
- `src/tests/campaign.test.ts`
- `src/tests/inspiration.test.ts`

### 修改（27）

- `README.md`
- `dist/index.html`
- `docs/01-任务书.md`
- `docs/decisions.md`
- `src/content/battles.json`
- `src/content/combatants.json`
- `src/game/audio.ts`
- `src/game/battle/ai.ts`
- `src/game/battle/battle.ts`
- `src/game/battle/combat.ts`
- `src/game/battle/controller.ts`
- `src/game/battle/debug-state.ts`
- `src/game/battle/definitions.ts`
- `src/game/battle/format-log.ts`
- `src/game/battle/grid.ts`
- `src/game/battle/initiative.ts`
- `src/game/battle/rules.ts`
- `src/game/battle/state-helpers.ts`
- `src/game/battle/turn.ts`
- `src/game/battle/types.ts`
- `src/game/controller.ts`
- `src/game/state.ts`
- `src/game/ui/battle-controls.ts`
- `src/game/ui/battle-view.ts`
- `src/game/ui/player-view.ts`
- `src/main.ts`
- `src/styles/battle.css`

### 删除（2）

- `dist/assets/index-BVWBLZhk.js`
- `dist/assets/index-CYzC9fTx.css`
