# 次元战争 · Web 垂直切片

> 2026-10-24目录整理：程序位于`E:\笔记\次元战争设定\次元战争代码`，本文件及原docs已移至说明区。当前路径与旧位置对照见[说明入口](../README.md)；后续终端命令均在代码目录运行。历史阶段结论仍按当时记录理解。

## 2026-11-18：首个十日周期

- **路线**。序幕（三）后的夜战沿用显式跳过入口。序幕（四）C009 至 C012 使用新版蒙面与避战剧本。C013 结束进入 M101、M102，读完来信从第 1 天放学后开始日程。
- **赴约**。第 1～6 天夜晚可在旧街区仓库主动赴约。第 7 天进入夜晚或选择跳过今日时，尚未赴约则先播 M103，再合流到 T101–T103。若同夜待播 V102，先完成赴约，再播直播并进入次日。
- **待制作**。T102 会等玩家在系统菜单明确跳过，保存跳过标记后继续 T103。第 9 天据点战和第 10 天正式剧情、敌阵与结算待补。第 10 天夜末进入原演示副本。
- **存档**。新增场景头随 v5 循环检查点保存。旧 v5 日程档保留原天数和资源。已看过旧版摘面罩的存档保留该知情标记；新版仍以金发青年、前排同学、蒙面怪盗等场合称呼显示。
- **导入**。在代码区执行 `node tools/import-prologue.mjs` 登记已确认来源，再用 `npm run export-story` 生成运行数据。已登记的正文快照按哈希保护。虚拟主播线用 `node tools/export-vtuber.mjs` 单独导出。
- **验收**。用 `python -B tools/check-first-cycle.py --url <试玩地址> --output <截图目录>` 复查两条赴约路线、实验室停等、同夜直播、断点恢复和第十天三战结算。[验收结果](verification/first-cycle/results.json) · [副本结算](verification/first-cycle/05-dungeon-settlement.jpg)

## 2026-11-17：雕塑棋子与棋上像素人物交战样例

用户已确认先制作男高与一种普通黑衣人的样例，审阅材质、比例和打击感后再覆盖当前可上场角色。当前实现位于开发入口`次元战争代码/dev-chess.html`（开发服务打开`/dev-chess.html`）。[离线交互样例](verification/chess-sample/chess-sample.html)内嵌图片与音效，可直接打开；宽窗口保留技能栏、单位资料与战斗日志，窄窗口集中展示棋盘、场景切换和演出速度。正式入口仍沿用原显示方式，没有自动切换为棋子模式；本阶段未提交推送或发布。

男高采用红色珐琅、黑色金属、金边与白领口纹样的定制棋子；黑衣人采用黑曜石／枪灰金属与兜帽形轮廓。底座边缘区分敌我，角色本体配色与棋型固定，不随样例中的武僧／法师构筑变化。普通黑衣人甲、乙共用同一套类型素材，以名字区分个体。角色像素形象与棋子分开绘制，选中单位时显现人物，回合开始自动跟随行动者；点击敌方棋子或用键盘点选单位资料可以查看，不改变行动权。交战者及范围效果的全部受影响者临时同时显现，演出结束后保留最近选中的查看对象。

内置`image_gen.imagegen`生成两枚透明雕塑棋子及两人共48帧动作图集。男高以既有`hero-half-alert.png`为身份参考，保留发型、黑校服、红内衫与吊牌。两人各有显现、待机、攻击、施法／远程、受击、倒地6组动作，每组4帧；不是用一张静态立绘平移冒充动作。原始图集与完整提示词保留在代码区`artwork/battle-chess-v1/`，`prepare-chess-sample.py`仅裁切、缩放、统一画格与透明通道，运行图集为64×64画格。仍需用户审阅美术结果，不视为其他角色或所有技能专属动画已完成。

演出从真实战斗事件生成只读计划：挥击、法术起手、弹道／斩击、命中、后仰、闪白、飘字和音效使用同一虚拟时钟。命中时更新棋盘生命条，免疫保留站立与免疫反馈，范围内的豁免和受击同刻发生。倒地4帧完成后才释放演出锁，棋子逐渐倾倒、变暗并保留状态；再次点选可以看倒地人物。人物始终依附自己的棋子，不改变实际格位。1×／2×／4×可在演出中切换，不重播、不改掷骰或结算；下一次战斗动作在本组演出结束后才接受，音效播放同步采用对应倍率并保留音高。后台时暂停演出时钟，返回后继续。

“徒手／法术／范围／倒地”四种样例使用正式规则reducer及临时内存战斗配置；倒地场景把测试黑衣人耐久设为1以便重复观察，不覆盖正式敌人数据。样例不调用存档或设置Storage接口，原稿、source输入副本、战斗规则数值和资源许可未修改。旧音效与受击反馈的工作区改动保留；正常战斗继续使用原事件调度，仅棋子样例启用新的同步演出方式。

验证：类型检查通过；`npm test -- src/tests/chess-performance.test.ts src/tests/battle-feedback.test.ts`通过2文件34项；`python tools/check-chess-sample.py`通过15个浏览器场景、控制台错误0。覆盖素材延迟解码、点选与键盘查看、重复动作拦截、音效去重、中途改速、真实施法、范围友伤反馈、完整倒地、回合跟随、移动与借机、顶行空间、切换场景清理、Storage零调用、离线728px交互与无外部网络请求，以及旧调试入口显示。普通与Pages子路径构建通过，正式构建不输出开发样例页。未进行无关剧情、完整九关或其他角色的动画验收。

本阶段文件清单：

| 类别 | 文件 |
|---|---|
| 修改 | `次元战争代码/src/game/ui/battle-view.ts`、`battle-fx.ts`、`src/game/battle/render.ts`、`src/game/audio.ts`及本README |
| 新增演出与渲染 | `次元战争代码/src/game/battle/presentation-clock.ts`、`chess-performance.ts`、`chess-assets.ts`、`render-chess.ts`、`src/game/ui/battle-choreography.ts`、`src/styles/battle-chess.css` |
| 新增样例入口 | `次元战争代码/dev-chess.html`、`src/dev/chess-sample.ts`、`src/dev/chess-sample-state.ts` |
| 新增测试与工具 | `次元战争代码/src/tests/chess-performance.test.ts`、`tools/prepare-chess-sample.py`、`tools/build-chess-preview.mjs`、`tools/check-chess-sample.py` |
| 新增原始素材 | `次元战争代码/artwork/battle-chess-v1/pieces-source.png`、`poses-source.png`、`prompts.json`；从默认生图目录复制，默认原图保留 |
| 新增运行素材 | `次元战争代码/public/assets/battle/chess-v1/hero-piece.png`、`black-piece.png`、`hero-poses.png`、`black-poses.png`、`manifest.json` |
| 新增验收证据 | 本节下列13张截图、离线交互`chess-sample.html`、[results.json](verification/chess-sample/results.json) |
| 生成构建产物 | 代码区`dist`由普通与Pages构建重新生成，保持本机；不计入正式源文件变更 |
| 移动／删除正式项目文件 | 无 |

截图位于`游戏说明/工程/verification/chess-sample/`：[01-idle.png](verification/chess-sample/01-idle.png)、[02-impact.png](verification/chess-sample/02-impact.png)、[03-inspect-enemy.png](verification/chess-sample/03-inspect-enemy.png)、[04-speed-four.png](verification/chess-sample/04-speed-four.png)、[05-cast.png](verification/chess-sample/05-cast.png)、[06-area.png](verification/chess-sample/06-area.png)、[07-falling.png](verification/chess-sample/07-falling.png)、[08-fallen-piece.png](verification/chess-sample/08-fallen-piece.png)、[09-inspect-fallen.png](verification/chess-sample/09-inspect-fallen.png)、[10-next-turn.png](verification/chess-sample/10-next-turn.png)、[11-top-row.png](verification/chess-sample/11-top-row.png)、[12-inline-preview.png](verification/chess-sample/12-inline-preview.png)、[13-existing-battle.png](verification/chess-sample/13-existing-battle.png)。

## 2026-11-17：战斗底部技能／法术操作栏

战斗操作从角色脚下的浮动菜单改为固定底栏：左侧显示当前行动者、生命与回合资源，攻击／移动直接可见，结束回合独立显示。右侧按“全部／技能／戏法／一环／道具”排列图标与名称，每页最多14项，支持名称搜索和翻页。零数量、资源耗尽与不满足目标条件的能力保留位置并变暗，仍可点开详情查看原因；确认使用按钮会禁用。图形为本地SVG，没有新增运行时依赖。

悬停／键盘聚焦图标可读效果、动作消耗、射程和剩余次数。点选职业能力、法术或道具后，左侧展示详情与目标；可点目标按钮，也可点棋盘上的金色格。范围／锥形法术通过棋盘选择中心／方向并提示可能波及友方；术法爆发直接展开伤害类型。选项、目标与筛选保存在当前视图，确认前不扣资源、不掷骰；换回合、换角色及离开选择模式时清理未提交目标。正式战斗ESC仍打开系统菜单；关闭详情可取消技能选择，独立调试场支持ESC取消。

数值、命中、伤害和可选条件继续使用现有战斗规则；说明只解释当前已实现效果。本轮没有改写剧情、设定原稿、`source`输入副本、角色构筑、存档格式或资源许可。工作区原有战斗音效与受击反馈改动保留。

专项验证：`npm test -- src/tests/battle-actions.test.ts src/tests/post-prologue-battle.test.ts`通过2文件17项；`python tools/check-battle-actions.py`通过16个场景、控制台错误0。浏览器覆盖分类／搜索／中文输入法、14项分页、法术与卷轴各自扣资源、附赠药水、耗尽原因、棋盘目标／取消、范围方向、术法爆发类型、换角色清理、移动取消，以及1280×720、1920×1080、1024×768三个桌面视口。能力专项使用真实BattleView与规则reducer的隔离夹具；正式入口另用隔离v5测试档验证恢复出战、选法术、系统菜单、取消与确认。多页压力夹具临时组合项目已有能力，不改变正式构筑上限。类型检查、普通及Pages子路径构建通过；按用户范围没有运行全量或无关剧情测试。本轮完成本地实现与验证，尚未提交推送或上线。

本轮实际文件清单（原有未提交改动不计为本轮成果）：

| 类别 | 文件 |
|---|---|
| 修改 | `次元战争代码/src/game/ui/battle-controls.ts`、`battle-abilities.ts`、`battle-view.ts` |
| 修改 | `次元战争代码/src/styles/battle.css`、`loop.css`及本README |
| 新增 | `次元战争代码/src/game/ui/battle-action-icons.ts`、`battle-action-copy.ts`、`battle-action-model.ts` |
| 新增 | `次元战争代码/src/styles/battle-actions.css`、`src/tests/battle-actions.test.ts`、`tools/check-battle-actions.py` |
| 新增验收证据 | [results.json](verification/battle-actionbar/results.json)及下列13张截图 |
| 生成构建产物 | 代码区`dist/index.html`与`dist/assets/index-*.css`、`dist/assets/index-*.js`，按既有规则保持本机 |
| 移动／删除 | 无 |

截图位于`游戏说明/工程/verification/battle-actionbar/`：[01-debug.png](verification/battle-actionbar/01-debug.png)、[02-wizard-all.png](verification/battle-actionbar/02-wizard-all.png)、[03-scroll-tooltip.png](verification/battle-actionbar/03-scroll-tooltip.png)、[04-level-one.png](verification/battle-actionbar/04-level-one.png)、[05-spell-target.png](verification/battle-actionbar/05-spell-target.png)、[06-unavailable.png](verification/battle-actionbar/06-unavailable.png)、[07-burst-damage.png](verification/battle-actionbar/07-burst-damage.png)、[08-area-direction.png](verification/battle-actionbar/08-area-direction.png)、[09-pagination.png](verification/battle-actionbar/09-pagination.png)、[10-monk-return.png](verification/battle-actionbar/10-monk-return.png)、[11-smaller-window.png](verification/battle-actionbar/11-smaller-window.png)、[12-runtime-spell-target.png](verification/battle-actionbar/12-runtime-spell-target.png)、[13-runtime-after-use.png](verification/battle-actionbar/13-runtime-after-use.png)。

## 2026-10-26：快速推进时的图片加载修复与GitHub同步

背景不再因同图换场景或新图仍在解码而主动清屏；图片缓存由单控制器共享，并预热首场、当前场景与明确下一场开头。已绑定立绘首次加载用准备状态，不冒充缺素材占位；准备期间暂停正文推进，避免连点丢句。真实缺图与加载失败仍保留明确回退，旧请求不可覆盖新画面。类型检查及3文件37项加载相关测试通过，正常P001→P002、快速推进至P005、读档、延迟／失败与正式子路径开发预览已检查。初次交付仅本地；用户随后明确要求更新GitHub，发布准备已再次通过类型检查、37项定向测试及正式子路径生产构建（99模块）。沿用现有main、Actions与[Pages网址](https://yeklongdi.github.io/dimensional-war-game-source/)，不纳入其他窗口的角色卡改动，不增加无关玩法实测。具体范围、截图与文件清单见[修复记录](scene-image-loading-fix.md)；提交和部署回执以本次交付及实际Actions为准。

## 已实现、未测试：新游戏直入序幕（一）

2026-10-25用户确认新游戏直接P001，前三内部关连续衔接至P009结尾再回地图；奶奶家当前关标及卡片显示“序幕（二）”，通过原`act1_01`从A001进入，A003之后保留现有分关。内部九关及v4不变，入口目标见任务书§21和[正式规格](new-game-prologue-flow-spec.md)。

按用户当前分工，[主窗](../交接提示词/新游戏直入序幕一-主窗实现.md)已完成正式实现和静态差异审阅，未修改／运行测试、typecheck、build或浏览器验收；[另一窗口](../交接提示词/新游戏直入序幕一-专项验收.md)待锁定当前工作区后，只验证本次入口链路、关标及相关恢复，不跑全量或无关玩法。具体函数、基线和待更新旧断言见[实现记录](new-game-prologue-flow-implementation.md)。当前未提交推送、未发布；不据背景任务的旧授权直接上线新入口。

## 场景背景：36键／34图已制作并绑定

2026-10-25在三张用户批准样张基础上新增31张背景，34张WebP覆盖全部36键；卧室夜景及客厅夜景各有一组异名复用。52场景、63个原BACKGROUND与剧情数据保持原样。已接入真实加载／解码、当前场景渐变回退、一次诊断、过期请求防护及仅背景层平滑采样，顶部克制遮罩改善教室HUD。人物、三人尺寸、文字窗、九关和v4不改。

类型检查、41文件591项测试、根路径及正式子路径构建通过；34张图真实浏览器解码及本地子路径资源核验通过。用户随后要求只验证背景显示，后续不重复玩法通关。来源、限制、实际截图及GitHub／Pages发布回执见[独立验收](backgrounds-v1-verification.md)、[制作记录](../素材制作/场景背景生成记录.md)；历史样张证据不改。A003走廊／地下、A011坑底、关灯等无显式BACKGROUND的镜头继续保留限制。

背景版本`3a3e97d`已推送main，[Actions 40180794337](https://github.com/yeklongdi/dimensional-war-game-source/actions/runs/40180794337)的build／deploy成功；[正式网站](https://yeklongdi.github.io/dimensional-war-game-source/)34张背景及HTML／JS／CSS均与本地产物一致。线上直接图片显示正常，维护者正式自动档未读取或覆盖。

## 已实装：对话立绘小半身与三人显示

2026-10-24用户选定第2张构图示意：人物缩小、轮廓尽量分开，最多同时显示三人；一人、两人保持相同大小。多人场景先固定优先名单，未展示的在场人物发言时换入并接替原槽位，其余人物不动。暂未绘出不改变剧情在场、姿态、表情、方位或身份揭示时机。

2026-10-24实施窗口已完成实际代码调整：按素材头部和窗上轮廓登记外层等比度量，普通头顶约210逻辑像素；一／二／三人中心为640、384／896、256／640／1024。名单与发言次序集中在当前视图，按实际SHOW顺序和场景优先筛选，最多三人；正式对白可换入在场候补，先淡出150ms再原槽淡入。原PNG、内部关节、SHOW／HIDE、剧情与v4不改。五动态、坐姿、持剑、躺靠仍用已批准的原素材。

本轮typecheck、38文件566项测试、根路径及正式子路径build通过；原523项断言保留。实际检查C009–C012、仓库／教室、五组合和特殊姿态、候补停口型、受控延迟／失败、1920×900及900×620真实内容视口。正常新档观察P001→P002；A006→A008及C009→C013使用隔离检查点，分别记证，不冒充新档完整九关或实打两战。前后截图、保护哈希、范围与发布回执见[独立验收](portrait-layout-verification.md)，接口见[规格](portrait-layout-spec.md)，[交接提示词](../交接提示词/立绘构图与三人显示.md)和[参考图](design/portrait-layout/selected-reference.png)保留文档阶段来源。

功能提交`c0d64e8`已推送，[Actions 40083243754](https://github.com/yeklongdi/dimensional-war-game-source/actions/runs/40083243754)的build／deploy均成功。[正式网站](https://yeklongdi.github.io/dimensional-war-game-source/)已实际检查主菜单→地图→首关新构图、ESC及新建验收档的刷新读取；88个线上文件与本地正式base产物SHA一致。不称线上C009–C012或九关已完整实走，细节见本轮验收。

## 本轮：ESC菜单、剧情快进与战斗跳过

剧情／正式战斗按ESC打开系统菜单，首项【跳过】：正文每句完整显示0.3秒，遇选项、战斗或关末停止；停止按钮、正文、空格或回车只停止，ESC停止并开菜单。两场真实战斗及失败后可按胜利返回原CALL后，战后正常阅读，不额外掷骰或伪造击败日志。

序幕四两处未制作战斗默认仍停等，可明确跳过继续C003／C005后原文，C013 END才完成九关。四处独立记跳过flag，v4与内容版本不变，旧档原串不动；不代表两场新战棋已经制作。依据见[规格](skip-forward-spec.md)，实测与发布见[独立验收](skip-forward-verification.md)。下方C003边界为上一阶段事实，由本节替代当前绝对限制。

## 当前版本：四段序幕、九关与v4独立进度

已接入序幕（一）至（四）：**9／22／8／13场景，共48个主场景＋4个未完成分支**。旧“第一幕”现在是序幕（二）。九关复用太阳市五个地点；第七关补入照顾交接与放学取剑，第八关为“床边的勇者”，第九关为“警报下的同行者”。

**正式可玩至C003的未开放战斗。** 两场旧战斗正常执行并返回原CALL后的正文；序幕四两个新battle调用均明确阻断，不伪造胜利、不执行后文、不完成第九关。C003之后原文与素材已完整导入，仅在独立开发页预览，不能称四段已经全通关。

新版必须开始新游戏，存储使用`dw.save.v4`和内容版本`prologue_four_parts_v1`，一自动档＋六手动档；旧`dw.save.v1`／`v2`／`v3`保留原件，不迁移或直接载入新版。设置仍为`dw.settings.v1`。同版本手动档可回退，场景头恢复、战斗重开、多窗口失效和写入失败保护继续有效。

新增28张透明静态立绘：首批18张覆盖怪盗日常三表情／蒙面行动／夜间露脸行动、金发青年、女剑士、不明生物两型及男高坐姿／持剑；后补男高8种半身表情＋2张躺靠差分。已定形象的84组状态都有对应半身显示，男高不再回到带背景的旧全身图；原五个动态组合保留。按用户再次确认，其他占位人物不改。复杂身体动作未全部绘制，使用半身表情代演时明确记录限制。

新版A010回班进入已有未完成分支，可重新选择、返回地图或读取；不沿用旧版自动回到选择循环。A007仍四项且只启用主播。制作备注不进玩家文本框，明确布尔SET保留原变量名。

规格见[四段序幕说明](prologue-v2-spec.md)，决定见[本轮决策](decisions-prologue-v2.md)，素材及限制见[美术记录](../素材制作/prologue-v2/README.md)。自动检查、真实新档至C003、两战、存档与发布结果见[独立验收](prologue-v2-verification.md)。下列旧阶段章节保留历史说明，其中七关、v3升级与A010循环均已由本段及任务书§16替代。

开发服务器可打开`/dev-prologue.html`，预览52场及浅／深背景素材表；本页不读写存档、不进入生产构建。“查看战斗CALL后原文”仅对开发内存副本略过CALL，不生成胜利。内容导出使用`npm run export-story`；本机保护及双导出检查用`node tools/verify-prologue.mjs`。

## 历史版本：主菜单、多存档与设置（v3）

主菜单已改为“开始新游戏／读取／设置”。新游戏确认并成功写入后新开进度，保留六个手动槽与设置；读取较早档真实回退到该档自己的关卡与flags。地图、剧情和正式战斗内统一系统菜单，暂停底层推进后可存档、读取、调音量与文字速度，关闭原处继续。

当前使用`dw.save.v3`一个自动槽与六个手动槽、独立`dw.settings.v1`。无v3时只读升级旧v2／v1，原始串不删不改；坏槽隔离、失败不伪装成功。同源窗口通过锁与持久活动身份协调，不同槽互不覆盖，同槽过期确认须重做；其他窗口新游戏／读档后旧窗口暂停，明确重载才能接受新运行。

本轮类型检查、30文件465项测试、根路径与正式子路径构建通过；保留原409项回归。实际覆盖新档第一关、六槽／旧档回退、真实双窗口竞争、两战暂停及场景头读取、A007／A010、故障存储和设置；没有重新手动通关七关。布局用真实1920×900／900×620嵌入视口检查，浏览器尺寸覆盖接口未生效的限制已如实记录。

完整约定见[实施规格](menu-save-settings-spec.md)、[决策及理由](decisions-menu-save-settings.md)，实测与发布结果见[独立验收记录](menu-save-settings-verification.md)。下方男高及各阶段记录保留其历史事实。主菜单可直接读取旧进度，**不要为了升级而开始新游戏**。

新版本已推送main并通过[本轮Actions](https://github.com/yeklongdi/dimensional-war-game-source/actions/runs/39921309077)，build／deploy均成功；[正式网站](https://yeklongdi.github.io/dimensional-war-game-source/)已复核三按钮、七槽、旧P006升级恢复、系统菜单、移动规划和地图继续卡，未清除旧档。本轮不声称线上完整通关七关。

## 已完成：男高三姿态、五个动态组合

2026-10-23完成五个独立验收的原创样板：普通站姿／默认平静、普通站姿／得意、行李站立／紧张期待、行李站立／放松微笑、准备伸懒腰／疑惑。五项均已通过本轮视觉复核并批准；待维护者查看最终画面。P001、P002、A006和A007按原asset／pose／expression实际启用，P003坐沙发等未覆盖组合继续明确静态回退，不改剧情数据。

本轮交付统一1024×1536画布的33张运行PNG，保留20张母版／编辑参考及全部失败候选。五种表情各有不同眉眼、静止嘴和说话嘴，眨眼保留各自眉形；行李袋、拉杆箱与握持关系完整，准备动作只绕肩部小幅转动整臂。躯干呼吸、顶发轻摆及嘴型沿用原视图时钟，不代表完整身体变形。没有重建已完成的窗口／加载框架。

最终类型检查、27个测试文件409项测试及生产构建通过，正式子路径构建及33张资源字节核对通过。实际浏览器覆盖五组合浅深背景／眨眼／口型、动作三关键帧、P001→P002正常流程、A005→A007受控检查点流程、地图返回、刷新继续、快速更新与故障回退；本轮未重新手动通关七关或两战。逐项结果、截图、19姿态／24表情的剩余清单及保护哈希见[本阶段独立验收](hero-visual-samples-verification.md)。

本地开发：[五组合样板页](http://127.0.0.1:43856/tests/portrait-presentation.html)；正式子路径的本地生产预览：[从菜单游玩](http://127.0.0.1:43857/dimensional-war-game-source/?seed=0)。这两个地址仅在对应服务器运行时有效，重启方法见验收记录。五组合制作阶段按当时要求只本地交付；2026-10-23维护者另行授权同步GitHub，**最新五组合已推送并成功部署到下方正式网站**。[对应Actions](https://github.com/yeklongdi/dimensional-war-game-source/actions/runs/39903115088)与[发布记录](hero-samples-github-release.md)保留实际结果，历史验收不改写。

## 已发布：地图铺满窗口与地点选关浮窗

2026-10-22地图页已改为铺满浏览器内容区。**点击地图地点 → 地点旁出现关卡浮窗 → 点击整张关卡卡片开始／继续。** 移除常驻右栏；标题、进度、地图控制和保存反馈浮在地图上。底图等比铺满，可拖动查看边缘，滚轮以指针为中心缩放，不调用系统全屏。

进入地图、通关返回及定位当前关卡时只定位和高亮，不自动弹窗。浮窗拖缩时跟随地点，地点移出视野则关闭；关闭按钮、Esc或点击空白均可关闭。键盘Enter／空格打开地点，进入浮窗焦点，关闭后返回地点。已完成关不可重玩，未来关继续隐藏，七关和存档格式不变。

本轮新增26项用例，当前24个测试文件、356项通过，原330项断言保留，类型检查与生产构建通过。地图专用相机和浮窗不触发保存；剧情、战斗与主菜单仍使用1280×720等比画面。实测范围、限制、保护哈希、截图和发布状态见[本轮独立验收](map-window-verification.md)。

## 历史接入：对话窗口与原生分层立绘

以下保留首次接入与2026-10-22续作时的事实；其中“未批准”描述指当时的v1／v2候选，当前v3五项状态以本页顶部及新验收为准。

本轮续作以地图发布后的`cd9613a`为基线：配方切换改为保留图层DOM、只替换变化差分；静态回退不因缺口描述变化重复加载；前臂跟随上臂关节，空帧／重复图层在加载前明确拒绝。当前25文件362项通过，原356项断言保留。重新只读核对仍为19种姿态、24种表情、25次更新。

新增的两张双臂修订候选仍有光晕及注册偏差，**没有通过男高视觉样板验收，也未启用正式动态配方**。程序复核与本次实际浏览器范围见[续作验收](dialogue-refresh-verification.md)；本轮按用户明确范围只保留本地改动，不提交、推送或部署，不扩大其他角色。

2026-10-22已接入统一底部180px半透明窗口、稳定演员实例、显式视觉映射、整套图片预解码、过期请求保护和独立眨眼／呼吸／口型／动作通道。四类正文均在底部，取消中心人物放大与金色描边；原剧情、战斗、大地图与存档保持原行为。

**程序接入通过；男高视觉样板尚未通过。** 已用内置imagegen制作普通站姿母版、分层候选和眨眼修订，但手臂注册／接缝、衣摆及其余四个组合仍未交付合格素材。正式剧情的五个配方均未启用，使用原静态回退；不把旧整张PNG或样板占位称作动态样板完成。19种姿态、24种表情、25次更新已完整[盘点并记录原文行号](verification/dialogue-presentation/hero-inventory.md)。

本轮程序新增38项针对性测试，当前22个测试文件、330项通过，原292项断言保留，类型检查和构建通过。2026-10-22按维护者要求，将这一版本的本地正式工程、原始剧本副本、正式数据、素材、测试和文档统一到公开仓库 `yeklongdi/dimensional-war-game-source`，由同仓库工作流构建并部署。详细程序验收、视觉缺口及截图见[独立验收记录](dialogue-presentation-verification.md)，接口见[实施规格](dialogue-presentation-spec.md)，参考证据边界见[研究说明](senrenbanka-presentation-study.md)。历史验收中“仅本地、未部署”的表述保留当时事实，仓库和部署的当前安排见[仓库合并说明](repository-consolidation.md)。

本地运行`npm run dev`后可打开`/tests/portrait-presentation.html`检查候选、固定眨眼／口型时刻、延迟、受控失败及释放。该页只供开发服务器使用，不是正式剧情节点，也不读写正式存档。普通游戏入口及七关顺序不变。

本轮保留的生产预览：[新档入口127.0.0.1:43849](http://127.0.0.1:43849/?seed=0)。开发样板：[分层候选页](http://127.0.0.1:43847/tests/portrait-presentation.html)。端口只在对应服务器运行期间有效；生产预览可用`npm run preview -- --host 127.0.0.1 --port 43849 --strictPort`重启。验收档与这个新入口是不同origin，没有清理用户原存档。

## GitHub Pages 正式体验

正式网站：[直接游玩次元战争](https://yeklongdi.github.io/dimensional-war-game-source/)，无需 GitHub 登录。

源码、正式内容和部署统一在[本仓库](https://github.com/yeklongdi/dimensional-war-game-source)。推送 `main` 后，GitHub Actions 自动执行 `npm ci`、类型检查、全部测试与项目路径构建，再发布 `dist/` 到 GitHub Pages；Pull Request 只做检查与构建。无需跨仓库同步或跨仓库凭据。此前的私有工程仓库和单独网页仓库在迁移验证后删除，旧网页地址不再作为正式入口。

2026-10-21旧站部署检查为20个测试文件、292项通过；其版本与验收证据保留在[历史部署记录](github-pages-deployment.md)，其中旧仓库地址和跨仓库更新步骤已由[单仓库部署流程](repository-consolidation.md)替代。2026-10-22地图浮窗推送后工作流build与deploy均成功，已在正式地址复核1920×900与900×620下的铺满、地点浮窗、进入首关与返回地图，见[当时线上验收](map-window-verification.md#发布与线上验收)。当时工程为24个测试文件356项，v1／v2男高美术未通过；2026-10-23五组合美术阶段为27文件409项，本轮菜单／多档／设置实装后为30文件465项，当前结果见顶部链接。

localhost 与正式网站的存档相互独立，不会自动迁移或跨设备同步。两首 WAV 保留原音质，较大的音乐文件可能使首次加载变慢。

该历史阶段的流程为主菜单→地图→地点浮窗→关卡→返回地图，当时最大进度 8／9。当前入口、九关之后的日程和两处序幕战斗跳过规则见本页顶部。

工程目录：`E:\笔记\次元战争设定\次元战争代码`。任务依据为 `../游戏说明/工程/01-任务书.md` §12 与 `../游戏说明/工程/map-selection-spec.md`；M4 三卡、整幕重玩和 v1 唯一格式已被替代，历史验收不改写。

## 已完成：战棋移动路线规划

己方进入移动模式后，蓝格表示扣除已规划步数后的可达范围；悬停或聚焦格子预览亮青路线、终点虚影和首次借机风险红色感叹号。普通单击逐次添加必经点，最后点“确认移动”；未点击的悬停格不提交。各段沿用原BFS，允许绕路、回头和循环，按实际每步5尺计费。

提供撤回一点、清空路线和取消移动。Enter／空格在格子上只选点，Backspace撤回，Esc取消；离开棋盘只清悬停段。确认后显示真实剩余路线，等待时保留，到达或失能时清除。敌人移动表现不变。

- 玩法说明：[战棋移动规划](../游戏机制/战棋移动规划.md)。
- 上述玩法说明是本地笔记库链接；仓库内可独立阅读的实施规格为 [movement-preview-spec.md](movement-preview-spec.md)。
- 实施依据：[任务书 §13](01-任务书.md#13-已确认待实现战棋移动路线与拐点规划)、[movement-preview-spec.md](movement-preview-spec.md)。
- 最终决定与理由：[decisions-movement-preview.md](decisions-movement-preview.md)。

路线草稿不入档，原战斗数值、AI、地图七关和v1/v2存档约定继续保留。当前通过19个测试文件、285项测试，保留全部原242项断言；调试场、两场正式战斗、七关25场161段正文及刷新恢复均已实测。结果与限制见 [移动规划验收记录](movement-preview-verification.md)。

## 启动与检查

使用现有 Node.js / npm，在工程目录执行：

```powershell
npm ci
npm run dev
```

打开终端输出的地址；默认通常为 `http://localhost:5173/`。正式流程可附加 `?seed=0` 复现战斗。点击、空格、回车推进；文字未显示完时首次操作只补全，下一次才推进。按 `~` 查看开发记录。

移动规划阶段曾使用`localhost:43842`作为体验入口，`127.0.0.1:43842`作为已通关验收origin；这是历史交付地址，只有重启该端口后才有效。当前五组合预览见本页顶部43856／43857入口，不覆盖或清除旧origin进度。

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

移动规划阶段为19个测试文件、285项通过；首次部署阶段为20文件292项；分层程序阶段为22文件330项；地图浮窗版本为24文件356项；分层续作为25文件362项；本轮五组合为27文件409项及生产构建通过。各阶段验收分别保留，不用历史数字替代本轮结果。仅三个固定开发依赖：Vite 8.3.4、TypeScript 5.9.3、Vitest 5.0.5；无运行时依赖。

## 历史地图与七关（新版九关见顶部规格）

地图铺满浏览器内容区，底图等比铺满；标题和控制浮在地图上，剧情与战斗保持1280×720。拖动背景平移，滚轮围绕指针缩放；可用放大、缩小及「定位当前关卡」。地点支持键盘聚焦与激活，点击地点只打开旁边浮窗，点击关卡卡片才进入。底图、节点、标签和进度线共用变换，相机、浮窗和窗口尺寸不保存。

| 关卡 | 场景 | 地点 |
|---|---|---|
| 搬入奶奶家 | p001–p004 | 奶奶家 |
| 仓库区事件 | p005–p007 | 旧街区仓库 |
| 回家与睡前 | p008–p009 | 奶奶家 |
| 上学途中与校门 | a001–a003 | 上学路口 |
| 教室与校园导览 | a004–a008 | 太阳市第一高中 |
| 施工区事件 | a009–a014 | 施工区域 |
| 返回学校与幕结束 | a015–a016 | 太阳市第一高中 |

新档仅显现奶奶家与第一关，之后逐步显现五个复用地点。只能进入第一个未完成关；已完成关只可查看，不能重玩。当前「开始新游戏」会在确认后真正重开；要恢复原进度用「读取」。六次推进最终合并为四条历史连线，箭头按最近方向显示。第七关结束保留完成地图及「垂直切片已完成」，没有第二幕入口。

彩绘底图位于 `public/assets/maps/sun-city-painted-v1.png`，由内置 imagegen 生成并复制入工程。北朝上，奶奶家在西、路口在其东、学校在东偏北、仓库经路口南向支路进入，施工区在校园东北角围墙内。坐标仅为美术布局，不代表正式距离；文字、标记和推进箭头由程序叠加。提示词与检查依据随验收证据保存。

## 历史v3多存档与旧档升级（新版不迁移）

正式键为`dw.save.v3`，含version、activeRunId、revision、auto与六个manual槽。槽内为带修订号的既有地图／场景快照（version、flags、completedLevelIds、checkpoint、savedAt）。初次空档菜单不写入；新游戏成功建立自动档后进入地图。关内返回地图或菜单保留最近场景头检查点，访问地图、查看面板与修改设置均不覆盖该检查点。

继续从保存场景的第一个节点开始，重建之前的立绘、背景和 BGM，不播放过去台词、SET、SFX、选择或战斗。在 p006、a014 战斗中退出或刷新，继续时重播场景并重新开战；游戏内失败「重试」仍只恢复本场原 CALL 等待及初始骰序。

`dw.save.v1`和`dw.save.v2`原始字符串始终只读保留：

- 已有v3优先；坏v3不静默回退。仅无v3时读取v2，无v2时才按原算法读取v1，成功写v3才宣布升级。
- v1序幕已完成映射前三关完成，第一幕已完成映射七关完成；v2沿用其合法前缀及检查点。
- 未完成旧档按场景定位当前关，前面的关视为完成。正在重玩已完成内容的旧检查点取消，回地图定位未完成主线。
- **全通关旧档升级后读取仍为完成地图**。本轮新增的明确新游戏和较早手动档读取可切换到新的／过去的进度；不会自动清档。
- 坏容器先保留，明确确认后仅新建v3；取消不写入，v1／v2即使损坏也不删除。坏槽不清空其他槽。
- 同一活动运行的自动档累计true flag与更长前缀；显式新游戏／读档换身份且不合并旧最远进度。旧窗口随即暂停并拒绝保存，重载当前活动进度后才可继续。
- 六个手动槽只由玩家指定保存，覆盖先确认，读取不改原槽。失败保留原档及页面内状态并准确提示；新游戏／读档必须写入成功才切换。

不同主机、端口或浏览器资料属于不同存储位置，不提供跨设备同步或导入导出。未指定 seed 时每次页面加载生成新 seed；固定 seed 地址可复现，场内重试始终恢复本场初始骰序。

## 历史剧情与调试说明（新版A010行为见顶部）

- A007 四项全部显示，仅导出数据中启用的主播选项可选。A010「回班上」执行原 SET、显示唯一允许的原说明后返回同一选择，不执行原 JUMP a016，也不误判通关。
- SET 即使带 meta 仍记录；CHECK、CAMERA、未知 CG 及制作备注只供开发查看，不解释其中的指令。幻象调用警告一次后继续原文旁白。
- 两战胜利均先回原 CALL 后的光标。p006 后续与 p007、a014 四段战后正文及两个 SET 全部保留，不能打赢即通关。
- 序幕保留三个教学时点及 1 点英雄激励；第一幕保留大师之剑、开场剑痕及 5 点临时 HP。战斗数值、AI、反应和死亡豁免等规则不变。
- 独立调试：`?debug=battle&seed=42`，不读写v1／v2／v3或设置、不启动剧情或音频。M2原seed42日志回归保留。
- 开发服务器的 `/tests/save-storage.html?case=corrupt` 等验收页使用替换存储 IO，不触碰真实 localStorage。迁移、读写故障、竞争及延迟保存可控复现；这些页面不进入生产构建。

## 资料、保护与限制

当前验收见`../游戏说明/工程/movement-preview-verification.md`；地图历史验收见`../游戏说明/工程/map-selection-verification.md`。技术决定见两个主题决策记录及`../游戏说明/工程/decisions.md`；M0–M4历史验收保留。

本轮新增四份只读source快照及独立运行JSON，修改导出器并重新生成自动问题清单；旧source、旧三份JSON、已批准男高图层、战斗规则／数值／AI、依赖配置及工程外设定均未改。没有补写对白或开放A007其他路线。

现有男高五组合、地图和两首BGM继续可用；新立绘映射及缺口见素材记录。四段新稿导出297条诊断，含已明确处理的制作备注，不代表297个运行错误。场景背景、其他角色、音频、幻象动画及CG仍有明确占位。上述“没有新增正式剧情跳过”只描述上一轮范围；逐句快进与战斗跳过已由本轮按用户授权实装，见顶部本轮说明。

## 许可范围

程序源码、构建配置、测试和技术文档沿用 [MIT](../../LICENSE)。正式剧本、角色与关卡内容、图片、音乐、参考截图和其他游戏资源不自动适用程序的 MIT 许可；原有权利和来源说明继续保留，详见[资源与第三方说明](THIRD_PARTY_NOTICES.md)。公开阅读与游玩不代表新增了这些内容的再授权。
