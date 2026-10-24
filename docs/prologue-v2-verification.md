# 四段序幕与重要人物立绘验收

2026-10-24。开工基线`3fcd64b659047c944241ac96432380e9525eebd3`，工作区干净；基线30个测试文件465项。本轮按用户实施计划及后续人工美术修正执行，未重做战斗或地图界面。

## 内容结果

| 章节 | 主线 | 未完成 | 合计 |
|---|---:|---:|---:|
| 序幕（一） | 9 | 0 | 9 |
| 序幕（二） | 18 | 4 | 22 |
| 序幕（三） | 8 | 0 | 8 |
| 序幕（四） | 13 | 0 | 13 |

52场均导入、48主线归入九关。A007四项，仅选项2启用；A009提示归入A010，回班走A010_RETURN_CLASS并停在未完成分支。回班不结算、不解锁后章，重选重建A010，检查点也归回A010。

第7关实际播放A015、照顾交接、放学取剑和A016；第8关播放B001–B008；第9关正式只可到C003。已确认SET如`has_master_sword`、`link_summoned`、`nightmare_encountered`及章节完成真实记录。制作备注、CHECK和作者资料不进玩家正文；C005作者标题在显示层改称“金发青年”，原JSON标题不改。

六种CALL完整保留。两个旧battle正常执行并返回CALL后原文，两场序幕四battle分别在C003／C005阻断，不写胜利、不执行其后正文和SET、不完成第九关。正式存档拒绝C004后检查点及第九关完成前缀。**本轮没有做到四段完整通关，正式最大为8／9、C003待开放。**

导出诊断297条，同一原文位置合并计数；包含已有处理依据的制作备注，不等于297个运行错误。自动问题清单已同步本轮立绘范围和新版分支决定。

## 自动检查与保护

以下均通过：

```powershell
node tools/verify-prologue.mjs
npm run typecheck
npm test -- --reporter=json --outputFile=docs/verification/prologue-v2/tests.json
npm run build
npm run build -- --base /dimensional-war-game-source/
```

最终为**33个测试文件、490项通过、0失败**，JSON报告见[tests.json](verification/prologue-v2/tests.json)。追加半身前为488项，中途485项报告`tests-draft.json`仅保留过程记录，最终结果以前者为准。新增回归覆盖四段、入口、两处阻断、旧档只读、六槽、故障与竞争、身份及全部已定形象映射；旧25场／161段用作历史数据断言，不用于删减新稿。

[checks.json](verification/prologue-v2/checks.json)记录65份开工保护文件（含vault原文、角色卡、旧source及已批准男高图层）零变化；四份新快照与来源SHA相等，三份历史剧情JSON零变化。连续两次实际执行导出，六份产物哈希与warning完全一致。代码文件均不超过400行，依赖及TS strict未改，战斗规则／AI／数值没有差异。

普通与正式base构建通过。dist只有正式入口及资源，未包含dev-prologue.html。生产预览须匹配构建base：`npm run preview -- --host 127.0.0.1 --port 5195 --strictPort --base /dimensional-war-game-source/`；初次未带base的预览会把资源路由回HTML，已纠正启动参数后验证，不改游戏代码绕过。

## 真实浏览器流程

使用独立origin`127.0.0.1:5194`和固定seed0，通过真实DOM按钮／键盘操作，从空档新游戏完整走到C003。没有注入游戏state、RNG或伪造战斗结果；全程记录见[full-route-browser.json](verification/prologue-v2/full-route-browser.json)。

- 经过38个正式可达主场景，另外进入回班分支并重选；记录286段正文显示（含重选重复），8次关卡完成返回地图。后续10个主场景不冒充正式可玩。
- 教学战实打胜利：第3轮，男高HP3；黑色人形战实打胜利：第3轮，男高HP5。两战后原文与SET继续，未打赢即跳地图。[教学胜利](verification/prologue-v2/screenshots/tutorial-win.png)、[黑色人形胜利](verification/prologue-v2/screenshots/black-humanoid-win.png)。
- A010回班停在未完成面板，重选恢复两个启用选项；完成记录仍停在第六关之前。[分支截图](verification/prologue-v2/screenshots/a010-return-branch.png)。
- 取剑、序幕三和召唤实际通过后进入第九关；C003阻断无继续／假胜入口。刷新再读自动档从C003开头恢复，重新推进仍在同一CALL阻断。[阻断截图](verification/prologue-v2/screenshots/c003-blocked.png)。
- 六手动槽独立保存并刷新保留：槽1早期P001、槽2战斗A014、槽3–6为C003。读取槽2先重播A014，再以初始HP、5临时HP与第1轮重新开战，不恢复旧回合。
- 第二窗口读槽1实际回到P001，flags与完成前缀回退；第一窗口立即暂停推进和保存。[过期窗口](verification/prologue-v2/screenshots/stale-window.png)。随后新开游戏，六手动槽和BGM0／文字10毫秒设置保留；再读槽6回到8／9的C003，设置保持。
- 900×620、1920×900使用浏览器真实视口覆盖，DOM尺寸确认生效；七槽和返回按钮均在可用面板范围内。记录见[layout-browser.json](verification/prologue-v2/layout-browser.json)，[小视口](verification/prologue-v2/screenshots/slots-900.png)、[大视口](verification/prologue-v2/screenshots/slots-1920.png)。完成后已清除临时视口覆盖。

v1／v2／v3原串不变、坏旧档区分、v4内容版本拒绝、锁内旧请求、不同槽竞争和写失败不覆盖，由替换IO自动测试验证；不以这些测试冒充维护者正式站存档操作。实际双窗口行为另外按上段验证。

## 素材与独立预览

新增28张RGBA立绘：怪盗6、金发青年3、女剑士3、不明生物2、男高14（坐姿／持剑4＋新增半身／躺靠10）。28张在浏览器均成功加载，深浅底检查、固定画布和SHA通过。原男高五个动态组合保留，并在正式base生产首关实际加载。[首批素材](../art/prologue-v2/README.md)、[追加半身](../art/hero-half-v1/README.md)、[28图加载记录](verification/prologue-v2/portrait-browser.json)。

用户看到A008旧全身图后追加半身要求，又明确“占位不用改，只修改已经确定形象那几个”。已逐项通过真实下拉操作检查84组已定形象状态，未出现缺图占位、未加载图片或旧hero.png；详见[84组浏览器记录](verification/prologue-v2/known-portrait-states-browser.json)。男高50组状态的44种原文表情均显式登记，不猜对白；原五动态和专用坐姿／持剑优先，其余使用透明半身表情，A001另有躺靠差分。动态素材失败后备也不回旧全身图。

用户截图对应的[A008修正](verification/prologue-v2/screenshots/a008-half-fixed.png)、[A001躺靠与间距](verification/prologue-v2/screenshots/a001-half-bed.png)、[愤怒](verification/prologue-v2/screenshots/b005-half-angry.png)、[痛苦](verification/prologue-v2/screenshots/b006-half-pained.png)、[三人同场](verification/prologue-v2/screenshots/c011-half-final.png)及[浅色底](verification/prologue-v2/screenshots/hero-half-light.png)单独存证。窄占位原图不改；同槽脸部间距从旧占位布局扩大，避免其遮住宽半身的脸，不改剧情位置或存档。

实际检查P003坐姿、B008青年与男高、C006双形态、C009摘面罩前后、C011别名和C013包剑。怪盗白行动服按用户现图保留，日常三表情使用其已批准的浅衬衫／深蓝外套；夜间露脸仍是行动服。没有为无图人物另造外貌。

DEV页默认在C005第二个新CALL阻断，截图见[c005-blocked-dev.png](verification/prologue-v2/screenshots/c005-blocked-dev.png)。另开明确的“略过CALL”内存预览，查看C004–C013后文；它没有正式存档IO、战斗胜利或玩家入口。C011–C013尾部及结束记录见[尾部](verification/prologue-v2/dev-tail-browser.json)和[DEV结束](verification/prologue-v2/dev-end-browser.json)，中间场景截图保存在同目录。该浏览器长批次曾超时，后续恢复工具并继续核对，不将未持久化的前段文本日志说成完整逐段报告。

完整身体动作没有全部画完：跑步、抱扶、取剑包裹、挣扎、退避等使用对应透明半身表情代演，仍有动作缺口诊断；不再出现旧背景矩形。坐姿未绘出每场床被／家具，其他占位角色按用户再次确认不改；背景、音效、幻象CG仍有占位。它们不计作完整动作或所有NPC美术完成。首次完整新档流程的截图早于追加半身，最终视觉以本节新证据为准；后续保留全量规则回归并复核84组显示。

## 生产预览、发布与文件

正式子路径预览已从新游戏进入首关，原动态图层全部加载，保存反馈成功，无error日志。[首关](verification/prologue-v2/screenshots/production-p001.png)。[资源核对](verification/prologue-v2/local-resources.json)验证入口、JS／CSS、v4／四段标记，以及28张PNG的HTTP类型与逐文件SHA。

发布在本地检查通过后按用户已有授权执行，沿用`yeklongdi/dimensional-war-game-source` main与Pages；实际提交、Actions、线上资源及只读存档核对在本节后续补记。不会在维护者正式站演示新游戏或覆盖既有进度。

完整新增／修改／删除见[实际文件清单](prologue-v2-file-changes.md)，不包含忽略的dist、node_modules及工程外生成缓存。没有修改vault原件、历史验收、旧source或旧剧情JSON。

## 下阶段仍需确认

1. C003搜捕队战：敌方组成与初始站位、男高与金发青年的可用规则、胜利／失败条件及失败重试语义。
2. C005不明生物战：两形态与干部增援的分阶段边界、目标与退出条件、数值及AI；是否由战斗还是原剧情承担C006后的转折，不能自行补全。
3. 幻象CG／音效与旧调查flag归并、未完成路线的后续创作另行确认；本轮继续占位，未扩写。
