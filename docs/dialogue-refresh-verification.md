# 对话窗口与原生分层立绘 · 续作复核

日期：2026-10-22。基线为`cd9613a`（地图浮窗发布验收后），开工工作区干净、382个受控文件。本轮先读了父／工程AGENTS、任务书、README、decisions及三份已有立绘说明；它们已经存在，不能计作本轮新增。地图、战斗、原文和已有工作不回退。

**结论：程序接入及本次补强通过；男高视觉样板仍未通过。** 所有正式分层配方继续`approved: false`，正式剧情明确静态回退。不把控制程序、旧整张PNG或未批准候选说成三姿态五组合完成。

## 1. 实际程序变化

- 保留原1280×720、底部180px半透明窗口、四类文字样式、SHOW/HIDE、五槽与增量继承；不自动因说话换人而移动或上下场。
- 旧演员外壳已稳定，但配方切换仍会销毁整个LayeredFigure。本次改为`updateRecipe`：按layer.id保留容器，按帧位置与URL保留未变化图片；身体、头部、眼层和未变化差分可保留同一个DOM。
- 完整图片预解码与VisualLease修订保护继续使用；等待期间保留旧画面，成功和失败的过期回调无效。不改变加载失败的原静态asset状态。
- 同一静态回退不因姿态／表情缺口诊断文字改变而重新加载。诊断仍保留，未把两个姿态说成同一已完成素材。
- 前臂的肘部坐标跟随上臂pivot旋转，并累计旋转量；恢复未提供动作起点时直接定格。它是程序关节验证，现有美术接缝与准备动作的视觉仍未通过。
- 空图层／空帧／重复图层在图片IO前拒绝；差分显示限制在实际帧索引范围。开发页新增DOM复用自查、场外台词和加载计数，不增加正式游戏功能或存档字段。

动画仍只存在视图，不读取战斗RNG，不增加flags、剧情日志或保存次数；口型只在可见且可用分层角色的台词逐字状态开启。补全、结束、非台词、隐藏和场外说话停止口型。离开剧情释放帧、观察器和异步租期。

## 2. 本轮素材与盘点

重新运行只读盘点，结果仍为**19种姿态、24种表情、25次SHOW／更新**。原文、文件行号、场景／节点、继承后的组合、映射和完成状态见[新盘点](verification/dialogue-refresh/inventory/hero-inventory.md)及同目录JSON；历史盘点不覆盖。普通站姿／默认平静与普通／得意是开发组合，p003坐沙发不以站姿代替。

| 样板组合 | 当前可验证能力 | 素材交付状态 |
|---|---|---|
| 普通站姿／默认平静 | 原有13张在用候选帧可解码、拼合、眨眼／口型／呼吸采样，局部替换通过 | 手臂注册／接缝及衣摆不合格，正式未启用 |
| 普通站姿／得意 | 显式映射与静态回退 | 未交付合格差分；不能代替p003坐姿 |
| 行李站立／紧张期待 | p001真实状态与回退 | 缺行李道具、握持、合格表情与图层 |
| 行李站立／放松微笑 | p002按原顺序继承姿态、更新表情 | 缺合格差分，旧PNG不算完成 |
| 准备伸懒腰／疑惑 | A006/A007继承；关节纯函数与恢复不补动作通过 | 准备姿态、独立衣物和最终动作视觉未通过 |

使用内置imagegen，以本项目原创男高母版／躯干为参考，新增`hero-layered-v2/arms-candidate.png`，并做一次`arms-alpha-review.png`透明轮廓修订。两张均1024×1536 RGBA、四角alpha为0，但仍有明显轮廓光晕，主体包围盒延伸到约y1178，与既有躯干和预期手部位置不一致；整臂也尚未交付为独立上臂／前臂。**两张都未批准、未绑定正式配方。** 原16张v1图和hero.png未改。

完整提示词与结果见[imagegen-prompts.json](verification/dialogue-refresh/imagegen-prompts.json)，透明通道检测见[image-alpha.json](verification/dialogue-refresh/image-alpha.json)。读图检测未修改图片像素；没有使用原作人物、UI、声音或解包资源。没有将未通过的母版批量扩展到其他四组合或其他角色。

## 3. 实际工程检查

2026-10-22 22:33按顺序执行，原始输出见[commands.log](verification/dialogue-refresh/commands.log)：

| 命令 | 结果 |
|---|---|
| npm run typecheck | 通过，strict，无any规避 |
| npm test | 25个测试文件、362项通过；保留原356项，新增6项 |
| npm run build | 通过，73模块，CSS18.06kB，JS160.53kB |
| npm run build -- --base /dimensional-war-game-source/ | 额外通过，同名正式子路径构建，JS160.59kB |

新增6项覆盖同URL静态复用、左右肘部随动、恢复不补动作、空图层／空帧及重复层拒绝。原窗口、口型、加载、19/24盘点、剧情正文／meta／分支、两战、移动、地图和存档规则测试保留。没有为了通过修改旧测试断言。所有代码不超过400行，无新增依赖。

项目路径检查后已重新执行根路径构建，保留常规本地预览可用产物。最终dist共26个文件，不含开发测试入口、验收证据或fixture代码，见production-output.json；命令日志虽被通用gitignore忽略，仍实际保留并列入本轮文件清单。

## 4. 本轮浏览器实测

使用独立origin `http://127.0.0.1:43854/`及项目子路径`http://127.0.0.1:43855/dimensional-war-game-source/`，真实按钮与键盘操作。开发样板和既有存储fixture只作受控验收；没有在浏览器注入GameState、跳场景、改血或一键胜利，也没有清理用户其他origin存档。

| 项目 | 实际结果 |
|---|---|
| DOM复用 | root／body／head／eyes／未变化眼帧均为同一个DOM，10层可见帧，不整批重建 |
| 眨眼与口型 | 半闭1、闭眼2；台词125ms嘴帧1；补全、心声、旁白、舞台说明及场外台词均嘴帧0 |
| 多人 | 男高／同学甲同槽位置572／708px，说话者切换未改变位置或新增场外演员 |
| 延迟与失败 | 旧画面在等待期间保留；旧请求完成后最新配方仍为普通平静；单层受控失败后静态回退 |
| 静态复用 | 得意改为行李紧张时，同一回退图的完成加载计数42→42，仍分别记录缺口 |
| 生命周期 | 动画计数38→74，释放停在183；延迟请求完成后仍183、stage数量0、error为空 |
| 正常p001/p002 | 通过菜单／地图卡片进入；窗口y540、高180；p002在node5之后保持行李姿态并记录放松微笑 |
| 真实检查点 | p002返回地图、刷新、继续后回场景头并恢复人物／背景／BGM；正常顺序再执行表情更新 |
| 受控A007恢复 | 继承准备伸懒腰／疑惑，四项只第2项可选，选择后进入a008 |
| 受控A010恢复 | 第2项原说明使用底部180px窗口，原SET记录并返回选择，不跳a016 |
| 子路径 | 13张在用帧均带正确base并解码为1024×1536；DOM复用自查再次通过 |
| 控制台 | 开发页、根路径剧情、受控选择及子路径页面均0条error；缺素材使用原有诊断，不视为素材完成 |

数据：[程序](verification/dialogue-refresh/browser-program.json)、[剧情恢复](verification/dialogue-refresh/browser-story.json)、[选择](verification/dialogue-refresh/browser-choices.json)、[子路径](verification/dialogue-refresh/browser-base.json)。A007/A010来自既有替换IO页的合法存档继续，不冒充本轮从新档一路玩到该处。

两张新增PNG在同名项目子路径均返回HTTP200、image/png，下载字节的SHA-256与本地原件一致，见[asset-path-checks.json](verification/dialogue-refresh/asset-path-checks.json)。这只证明静态路径可读，不表示它们已绑定正式配方或视觉已通过。

关键截图：[p001正式静态回退](verification/dialogue-refresh/p001-static-fallback.jpg)、[p002更新后的状态](verification/dialogue-refresh/p002-expression-update.jpg)、[A007恢复](verification/dialogue-refresh/a007-restored-choice.jpg)、[A010底部说明](verification/dialogue-refresh/a010-bottom-window.jpg)、[未通过的分层候选](verification/dialogue-refresh/candidate-final-review.jpg)。

未在本轮浏览器重走全部七关、两场战斗、完整161段正文和全部多窗口／迁移故障矩阵；相应规则自动回归通过，历史完整实测不当作本轮新结果。最终三姿态五组合、行李握持、衣摆／头发最终接缝、准备动作美术均未通过。原作内部机制未新增核验。

## 5. 保护、文件与交付

运行`node tools/check-dialogue-refresh.mjs`逐项比对基线：允许12个程序／说明文件变更，其余370个受控文件SHA-256必须一致，包含source4份、剧情JSON3份、导出器、自动问题清单、全部原美术、原24个测试文件、战斗／地图／关卡／存档与历史验收。另只更新了用户指定的工程外策划说明，不碰其他正式设定。

哈希见[before.json](verification/dialogue-refresh/before.json)、[after.json](verification/dialogue-refresh/after.json)。实际新增、修改、删除完整列在[文件清单](verification/dialogue-refresh/file-changes.md)。没有运行剧情导出，没有删除文件，没有更改剧情、玩法、存档格式和依赖。

本轮只保留本地结果，未提交、未推送、未部署。用户最新范围优先于AGENTS常规网站同步要求；现有GitHub/Sites站点不作为本轮新版本验收。

体验入口：[本地开发样板](http://127.0.0.1:43854/tests/portrait-presentation.html)、[正常游戏](http://127.0.0.1:43854/?seed=0)。样板明确标记未通过，不在生产入口中；服务器停止后可在工程运行`npm run dev -- --host 127.0.0.1 --port 43854 --strictPort`。端口及主机不同的浏览器存档独立，不自动同步。
