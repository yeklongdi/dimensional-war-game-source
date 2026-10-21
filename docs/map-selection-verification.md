# 太阳市大地图分关选关 · 验收记录

日期：2026-10-21。工程：`E:\笔记\次元战争设定\游戏文件`。

已完成彩绘大地图、五地点七关、不可重玩、关卡边界、v2自动保存与v1只读迁移。没有扩展第二幕、未完成路线、剧情文本或战斗规则。M0–M4历史验收保持原样。

## 命令与当前版本

按顺序实际执行 `npm run typecheck`、`npm test`、`npm run build`，全部退出码0。终端完整结果见 [commands.txt](verification/map-selection/commands.txt)。

| 检查 | 实际结果 |
|---|---|
| TypeScript | 通过；strict开启，无any逃生门 |
| Vitest | 17个测试文件、242项通过；原170项基线增加及更新为七关语义，净增72项 |
| 生产构建 | 通过；58模块，无新增运行时依赖，三个开发依赖版本不变 |
| 文件长度 | 所有TS/MJS代码文件不超过400行 |
| Git | 工程未初始化Git；未初始化、提交或推送 |

仍适用的M0–M3原测试和内容断言保留。M4的router/save-storage/restore及辅助用例更新了三卡、幕头重玩、v1唯一格式、旧窗口回到已完成关等冲突断言；v1五字段解码测试仍保留为迁移兼容回归。新增分关／相机、v2／迁移及故障回归，不据旧测试保留错误重玩行为。

## 浏览器地址与方法

- 最终连续主线：`http://127.0.0.1:43627/?seed=0`，进入前实际确认无档、继续禁用。使用生产构建，正常按钮、空格、回车及棋格完成七关。
- 第一轮连续主线：`http://localhost:5178/?seed=0`，同样25场、161段及两战完整日志一致。
- 正常恢复与同源多窗口：上述第一轮origin及`http://127.0.0.1:5178/?seed=0`；后者用于旧p007窗口在另一窗口完成前三关后继续结算的真实竞争检查。
- 迁移和故障：开发服务器`http://127.0.0.1:5176/tests/save-storage.html?case=…`，使用替换IO，不读写真实localStorage，不进入生产构建。
- M2回归：`http://localhost:5178/?debug=battle&seed=42`。

主线未注入GameState、跳场景、改血量、一键胜利或调用私有规则。预存受控数据仅用于迁移／故障专项，不能替代真实主线。

早期开发验收被用户中断，另遇开发连接重建和一次自动化超时，相关分段证据单独保留，未计为连续主线。之后两次独立完整连续主线均完成；最终连续记录为`final-route-browser.json`。最后只对地图容器做`overflow: clip`修正，防止键盘焦点引发额外DOM滚动；剧情及规则源码未再改动，随后三个命令全绿并通过高倍键盘／统一相机专项。

候选5180地址发现已有旧全通关v1，因此未当空档或清空；程序按正常规则迁移并显示完成地图，原时间保留。该地址的观察独立保存在`existing-5180-origin.json`，最终空档主线改用43627。

## 七关、25场与161段

| 关卡 | 实际场景 | 完成边界与浏览器结果 |
|---|---|---|
| 搬入奶奶家 | p001–p004，4场 | p004 JUMP p005前返回地图，只显现仓库作为下一目标 |
| 仓库区事件 | p005–p007，3场 | 真实教学战胜利回CALL后，p006后续与p007全部播放；JUMP p008前完成 |
| 回家与睡前 | p008–p009，2场 | p009 END才记录序幕完成，回地图定位路口 |
| 上学途中与校门 | a001–a003，3场 | a003 JUMP a004前完成，学校显现 |
| 教室与校园导览 | a004–a008，5场 | A007四项仅主播启用，a008全文后完成；未提前执行a009 |
| 施工区事件 | a009–a014，6场 | A010回班说明返回选择；幻象CALL/CG不阻塞；a014战后四段和两个SET之后才完成 |
| 返回学校与幕结束 | a015–a016，2场 | 从新关入口执行a015剑退场，a016 END记录第一幕完成并保留完成地图 |

两次连续主线的场景顺序均与M4历史25场一致；可见正文按场景、节点、完整文字逐段比较，161段全部相同。该161段包含一次A010原批准的回班说明；正文不新增、删减或改写。七次完成均直接回地图，没有额外空白页或通关确认页。

最后一句补全不会通关，随后有效推进才执行剩余自动节点；未配置越界会拒绝并诊断，下一关文本、SET、背景、音效不提前执行。这些边界另有真实脚本及小型格式样例的纯规则测试。

证据：[final-route-browser.json](verification/map-selection/final-route-browser.json)、[full-route-browser.json](verification/map-selection/full-route-browser.json)。两份均有25场／161段逐段比较结果、七次地图状态及两场完整日志。

## 地图素材与交互

底图由内置imagegen生成，1536×1024，正式文件为`public/assets/maps/sun-city-painted-v1.png`。最终提示词见`image-prompt.txt`。实际检查北朝上、西侧老住宅、东侧路口、路口南向仓库、东偏北校园及校园东北角围墙内施工区；未烘焙文字、节点或进度箭头，未新增路名、正式距离或剧情。

- 新档只有奶奶家节点和第一关；逐关显现五个复用地点。
- 六次推进实际合并为四条SVG历史线；仓库→奶奶家、施工区→学校为最近方向。完成后实际DOM为5节点、4条线。
- 背景拖动从奶奶家节点起手后松开，选中仍为仓库，未误打开奶奶家面板。相机坐标有变化，保存请求数不变。
- 滚轮按指针位置缩放，放大、缩小、定位按钮均实际操作；原始相机前后值保存。精确锚点不变与平移边界另由纯函数测试覆盖。
- 高倍视图以真实Tab／回车依次激活五节点，五个焦点均可见；容器scrollLeft/scrollTop始终0，由GameState相机负责定位，面板未提前启动关卡，保存请求数不变。
- 节点和面板可查看已完成关，按钮真正disabled。所有正式入口及旧token拒绝重玩；全通关继续只打开完成地图。
- 刷新、重新打开地图及迁移后无旧解锁动画；第七关完成没有重复绘制／播放历史推进。
- 快速双击菜单开始只得到一个地图、一个stage和一个audio，无额外进度写入。

交互原始数据见`development-progress.json`、`final-map-interaction.json`、`final-keyboard-clip.json`。截图为原始浏览器截图，JPEG按实际格式保存，没有生成或改绘验收画面。

## 两场战斗与M2

| 实际操作 | 结果 |
|---|---|
| 序幕seed0只结束回合并保留激励 | 第5轮死亡、27次骰子；失败不新增胜利／通关 |
| 序幕失败后本场重试，再按M3激励操作 | 恢复HP10、激励1和原初始骰序；第3轮胜利、HP1、20次骰子 |
| 连续主线序幕胜利 | 两次均第3轮HP1／20次骰子，完整显示日志与M4一致 |
| 黑色人形seed0只结束回合 | 第5轮死亡、17次骰子；失败不新增胜利／第一幕完成 |
| 黑色人形失败后重试 | HP10、临时HP5、主手大师之剑及出生位置恢复，不叠加临时HP |
| 连续主线黑色人形胜利 | 两次均第3轮HP5／16次骰子，完整显示日志与M4一致 |
| M2独立seed42原10条操作 | 第3轮胜利、男高10HP、17次骰子，完整日志一致，正式存档字符串不变，0error／0warning |

两场胜利均通过真实「继续剧情」解除原CALL等待。序幕不跳过p007，第六关不跳过a014四段战后原文和两个SET。开场剑痕、主剑、5点临时HP、教学及英雄激励仍有效，未改战斗配置或规则。

证据：`retry-victory.json`、`prologue-call-return.json`、`shadow-failure-browser.json`、两份连续主线文件及`m2-browser.json`。

## 退出、刷新与多窗口

- 普通剧情p004刷新后继续，从该场景首句开始，未接续旧打字光标。
- A007选择后刷新到a008首句，主播right位置及素材继承一致；A010说明中刷新回同一选择，返回SET保留，不执行原JUMP a016。
- p006移动后返回地图，继续重播场景；再次刷新同样从场景首句进入新战斗，恢复HP10及原出生位置。
- a014移动后刷新，先重播本场景首句，再以大师之剑、HP10、临时HP5、原出生位置开战。
- 战后p007档由新窗口继续回p007场景头；a015入口收起大师之剑和敌人。全部25场入口演出与正常流程另有完整规则对照。
- 完成地图刷新、返回菜单后继续、开始游戏均保持完成进度，不重开旧关、不清档。
- 同源旧窗口停在a014战斗，另一窗完成第六关后，旧窗未被强制跳转；返回地图只能进入第七关，施工关显示完成且禁用。
- 另一组真实同源窗口：一窗保留p007，另一窗完成第二／三关；旧窗仍在p007，随后完成旧关时写入仍为前三关完成，序幕完成flag保留，没有回退或多完成第四关。

证据：`recovery-before-interruption.json`、`recovery-browser.json`、`multi-window-browser.json`、`multi-window-stale-completion.json`。

## v1迁移与故障

替换IO复用正式GameState、存储逻辑、控制器及UI，页面公开原v1字符串、当前v2及成功写入次数，避免读取或破坏正式档。14组迁移浏览器专项均保留v1原始串：

- 覆盖七关代表场景p001、p006、p008、a001、a007、a014、a016，迁移后分别保留本关场景头。
- p009序幕完成→前三关、地图定位第四关；序幕完成后重玩p003取消旧检查点；旧第一幕完成→七关完成地图。
- 迁移竞争已有有效v2时采用该档且不写旧快照；竞争v2损坏则保护；损坏v2即使有有效v1也不回退覆盖。
- 迁移写失败为0次成功写入，不宣告成功；仍可按旧进度在内存进入p006，持续提示未保存。
- v1所有25场映射、v1等待锁期间变化、过期迁移、非法格式等另有单测，不声称逐一浏览器穷举。

坏v1／坏v2实际先游玩、确认取消时均0次写入；明确确认后只写v2一次，v1原串一致。延迟IO用验收按钮释放：确认后返回地图仍为saving，新会话接管请求；释放后只成功保存一次，旧请求失效。

读失败、写失败均实际推进至p003，再返回地图／继续；提示持续存在，恢复本次内存场景头，成功写入始终0次，没有虚假的保存成功。

证据：`migration-browser.json`、`corrupt-save-browser.json`、`storage-fault-browser.json`。真实浏览器未制造配额满载或禁用权限，故障属于可替换IO实测；原生锁的正常双窗口另有实测，极端调度排列通过单测。

## 保护、控制台与边界

106份开工保护文件前后SHA-256一致，包括source、三份剧情JSON、导出器、自动问题清单、战斗源码／配置、依赖、M0–M4历史记录和三份正式地理／策划文件。完整结果见`protected-after.json`。原M4的60份历史保护基线亦一致。

原Excalidraw通过只读检索确认在工程外`游戏机制/关卡选择.md`，最后修改时间为2026-08-10；补充哈希见`protected-sketch.json`。它未纳入最初106份清单，因此该补充记录不冒称开工前哈希；本轮未向该文件写入，收尾再次只读核对。

最终连续主线0个console error、51条warning且51个不同消息，均为既有缺立绘／背景／音频及未制作幻象调用，没有新增地图素材读取错误或重复刷屏。M2为0error／0warning。source与三份剧情JSON无变化，原158条内容诊断保留。

尚有原项目素材／表情差分、幻象动画／CG和三个未完成路线内容缺口，本轮不补写。没有第二幕、重玩、存档导入导出或其他新增功能。浏览器没有穷举所有场景的每个节点刷新、所有锁调度与罕见骰子分支；这些范围由场景演出对照、存档／并发规则及原战斗单测覆盖，未以单测冒称浏览器实测。

## 启动与复核

在工程目录执行`npm run dev`或`npm run build`后执行`npm run preview`，使用终端地址。现有全通关v1迁移后只显示完成地图是已确认规则；「开始游戏」不清档，也不会提供重玩。

本轮`http://127.0.0.1:43627/?seed=0`验收origin已七关完成，适合检查完成地图。另实际确认并保留`http://localhost:43627/?seed=0`为空档菜单、继续禁用、saveRequest为0，用户可从第一关体验；见`launch-origin.json`与`launch-menu.jpg`。两者为独立origin，不删除任何原项目键。临时5176／5178／5180验收服务器收尾停止，仅保留43627预览。

## 逐文件变更

以下清单由开工190份文件清单与最终文件逐项SHA-256比较生成。构建产物单独标明；node_modules和临时缓存不计入。

<!-- map-file-list -->

### 新增（56）

- `dist/assets/index-17J6JdKi.js`
- `dist/assets/index-EByUvI7l.css`
- `dist/assets/maps/sun-city-painted-v1.png`
- `docs/map-selection-verification.md`
- `docs/verification/map-selection/a010-choice-return.jpg`
- `docs/verification/map-selection/before-files.json`
- `docs/verification/map-selection/checks.json`
- `docs/verification/map-selection/commands.txt`
- `docs/verification/map-selection/completed-map.jpg`
- `docs/verification/map-selection/corrupt-replaced-map.jpg`
- `docs/verification/map-selection/corrupt-save-browser.json`
- `docs/verification/map-selection/development-progress.json`
- `docs/verification/map-selection/existing-5180-origin.json`
- `docs/verification/map-selection/file-changes.json`
- `docs/verification/map-selection/final-completed-map.jpg`
- `docs/verification/map-selection/final-initial-map.jpg`
- `docs/verification/map-selection/final-keyboard-clip.json`
- `docs/verification/map-selection/final-map-interaction.json`
- `docs/verification/map-selection/final-route-browser.json`
- `docs/verification/map-selection/full-prologue-victory.jpg`
- `docs/verification/map-selection/full-route-browser.json`
- `docs/verification/map-selection/image-prompt.txt`
- `docs/verification/map-selection/initial-map.jpg`
- `docs/verification/map-selection/interrupted-route.json`
- `docs/verification/map-selection/launch-menu.jpg`
- `docs/verification/map-selection/launch-origin.json`
- `docs/verification/map-selection/m2-browser.json`
- `docs/verification/map-selection/m2-seed42.jpg`
- `docs/verification/map-selection/migration-browser.json`
- `docs/verification/map-selection/multi-window-browser.json`
- `docs/verification/map-selection/multi-window-stale-completion.json`
- `docs/verification/map-selection/prologue-call-return.json`
- `docs/verification/map-selection/prologue-complete-map.jpg`
- `docs/verification/map-selection/prologue-failure.jpg`
- `docs/verification/map-selection/prologue-victory.jpg`
- `docs/verification/map-selection/protected-after.json`
- `docs/verification/map-selection/protected-before.json`
- `docs/verification/map-selection/protected-sketch.json`
- `docs/verification/map-selection/recovery-before-interruption.json`
- `docs/verification/map-selection/recovery-browser.json`
- `docs/verification/map-selection/retry-victory.json`
- `docs/verification/map-selection/shadow-failure-browser.json`
- `docs/verification/map-selection/shadow-failure.jpg`
- `docs/verification/map-selection/shadow-victory.jpg`
- `docs/verification/map-selection/six-levels-complete.jpg`
- `docs/verification/map-selection/storage-fault-browser.json`
- `public/assets/maps/sun-city-painted-v1.png`
- `src/content/levels.ts`
- `src/content/map-locations.ts`
- `src/game/map-camera.ts`
- `src/game/save-v2.ts`
- `src/game/ui/map-view.ts`
- `src/styles/map.css`
- `src/tests/map-flow.test.ts`
- `src/tests/map-save-helpers.ts`
- `src/tests/map-save-v2.test.ts`

### 修改（24）

- `dist/index.html`
- `docs/01-任务书.md`
- `docs/decisions-map-selection.md`
- `docs/decisions.md`
- `docs/map-selection-spec.md`
- `README.md`
- `src/game/controller.ts`
- `src/game/router.ts`
- `src/game/save-format.ts`
- `src/game/save-storage.ts`
- `src/game/state.ts`
- `src/game/story/player.ts`
- `src/game/story/restore.ts`
- `src/game/ui/app-chrome.ts`
- `src/game/ui/menu-view.ts`
- `src/game/ui/player-view.ts`
- `src/main.ts`
- `src/styles/menu.css`
- `src/tests/fixtures/save-browser.ts`
- `src/tests/m4-helpers.ts`
- `src/tests/restore.test.ts`
- `src/tests/router.test.ts`
- `src/tests/save-storage.test.ts`
- `tests/save-storage.html`

### 删除（2）

- `dist/assets/index-CDtA3F3g.js`
- `dist/assets/index-plUyBU3W.css`

