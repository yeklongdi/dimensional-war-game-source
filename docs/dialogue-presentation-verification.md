# 对话窗口与原生分层动态立绘 · 男高样板验收

日期：2026-10-22。工程：`E:\笔记\次元战争设定\游戏文件`。本轮是本地实装，没有提交、推送或网站部署；原GitHub Pages继续运行旧部署。

## 1. 结论

**程序接入通过，视觉样板未通过，不能称男高动态美术已经完成。**

程序已实现统一180px底窗、稳定演员实例、显式姿态表情映射、预解码后整体替换、请求修订号保护、动态差分与独立时钟、口型门控、回退和释放。正式剧情保留现有静态图；所有五个男高配方`approved=false`。

普通平静候选有10个逻辑层、13张在用差分图片。包含身体／衣物、头部、前后发、眉眼、嘴和四个手臂分段，保留完整1024×1536透明画布。生成并保存了1张母版、13张首轮候选及2张眨眼修订，共16张PNG、10,041,211字节。首轮失败的眨眼图也保留，未改原hero.png。没有机械扩展其余四个组合。

## 2. 三项工程检查

| 检查 | 本轮结果 |
|---|---|
| `npm run typecheck` | 退出0，strict通过 |
| `npm test` | 退出0，22文件330项通过；原20文件292项保留，新增38项 |
| `npm run build` | 退出0，70模块，最终JS约153.59kB、CSS约16.10kB |

[命令摘要](verification/dialogue-presentation/commands.txt)记录实际运行结果，不引用README旧数字。源码／工具单文件≤400行；没有any或新依赖。生产输出只有正式index入口及资源，不包含tests开发HTML、验收证据或工程文档。

新增规则测试覆盖五个显式样板映射、未支持姿态回退、真实A007/A010继承、19/24盘点、不同base路径、台词／非台词／补全口型、固定眼嘴限制、独立时间线、恢复不补动作、输入不变、全套预解码、延迟、单层失败、重复请求、旧成功／失败与释放。浏览器曾发现原生取消帧函数丢失Window绑定，修复为显式包装后增加了专门测试。

## 3. 正式主线实测

使用隔离origin `http://127.0.0.1:43847/?seed=0` 做含失败／重试／刷新与返回地图的首轮，再在项目路径origin `http://127.0.0.1:43848/dimensional-war-game-pages/?seed=0` 以最终版本重走七关。全部是正常按钮、键盘和棋格，没有注入GameState、跳场景、改血或一键胜利；未触碰用户5173或线上存档。

- 七关均正常完成，25个主场景到达，五节点完成地图与不可重玩继续成立；p009、a016的完成记录保持原规则。
- p001/p002使用明确静态回退，p002表情更新不改变其继承姿态；补全文字不触发保存。a006/a007五槽和同槽偏移稳定，返回地图后继续到a007场景头，四项仍只有第二项可选。
- A010回班选项执行SET、在底部旁白窗显示唯一允许的原说明并回原选择；随后选择进入施工区，未被JUMP a016提前截关。A012幻象／CG不阻塞。
- 两场战斗均实际进入，移动仍需规划并确认。序幕英雄激励可用；第一幕大师之剑、开场5临时HP保持。首轮两场均失败、重试后胜利，序幕和第一幕战中刷新都从各自场景头重播并重新进入CALL。
- 胜利准确回原CALL后：p006后续SET及p007正文保留，a014四段战后正文和两个SET均执行，a015剑退场及最终完成地图正常。
- 最终版本seed0序幕第3轮胜利、20次骰子；黑色人形第3轮胜利、16次骰子。除早已由移动规划改过的教学文案外，两场完整可见战斗日志与已有M3记录一致，没有排除任何骰子、AI、移动、伤害日志。
- 原制作备注仍隐藏；正文记录中没有【待确认】、【不可执行】、[变量名待定]、CHECK或镜头备注。A010的【暂无线性后果】按既有例外显示。

正文留痕说明：最终主线自动记录160条，脚本因短台词自然显示完毕与“补全”输入竞态少记a003:6。已另用`http://localhost:43847/?seed=0`新档正常通关前三关、进入第四关，停在该节点等待显示完毕后补录，没有从原文填充记录。160＋1与历史161段逐条一致；25场含没有正文等待的A007选择场。证据：[主线](verification/dialogue-presentation/browser-mainline-final.json)、[补录](verification/dialogue-presentation/browser-a003-supplement.json)、[比较](verification/dialogue-presentation/body-comparison.json)。

首轮记录因工具超时部分丢失，保存的125条及故障／重试证据仅作补充，见browser-mainline.json／browser-first-run.json；不用于冒充最终完整记录。

## 4. 开发页程序实测

在根路径及`/dimensional-war-game-pages/`路径打开真实PlayerView／PortraitsView开发页。13张在用图全部完成加载及decode，实际URL带正确base，未请求未齐备配方的未来素材。

- 固定时间验证开眼／半闭／闭眼、台词口型开合；心声、舞台说明、旁白及补全后回静止嘴型。多人实例不因说话换人重新挂载，位置由可见演员及槽位决定。
- 单层受控失败后使用原hero.png静态回退，没有标坏整个asset；延迟请求期间保留原画面，旧得意请求完成后不能覆盖最新普通平静候选。
- 修复前的生命周期失败保留在browser-lab.json，仅作故障记录；最终新页见[browser-lifecycle-fixed.json](verification/dialogue-presentation/browser-lifecycle-fixed.json)：播放时帧计数增长，心声口型关闭；释放后stage数量0，帧计数停在51，之后旧输入仍为0个stage／51帧，error为空。
- 正式主线与修复后的新开发页均观察到0条未处理error。修复前开发页曾出现Illegal invocation；另一次热更新先于文件复制曾出现候选图404，素材齐备后全新页已复查无此问题。没有把这些开发期失败隐去。

程序实测证据见[browser-lab.json](verification/dialogue-presentation/browser-lab.json)及修复后的生命周期文件。开发页只使用受控fixture，不写正式存档，不属于正式关卡。

## 5. 视觉样板结果与剩余素材

| 组合 | 程序映射 | 美术结果 |
|---|---|---|
| 普通站姿／默认平静 | 有；开发页可看候选 | 透明画布、拼合、眨眼／嘴型接入成立；手臂注册及接缝不合格，未批准 |
| 普通站姿／得意 | 有；静态回退 | 未制作合格差分，仅开发页目标，不能替代p003坐姿 |
| 行李站立／紧张期待 | 有；p001静态回退 | 行李箱／袋、握持及表情差分尚缺 |
| 行李站立／放松微笑 | 有；p002继承后静态回退 | 尚缺合格差分，不将原静态图算完成 |
| 准备伸懒腰／疑惑 | 有；a006/a007静态回退 | 分段手臂关键帧接口及纯采样测试已有，合格动作素材与视觉验收未完成 |

候选头发及身体可独立小幅变换，眨眼第二版改善了注册；但上臂／前臂尺寸仍需美术统一、关节遮挡补绘，独立衣摆尚未交付。16张均为1024×1536 RGBA且有全透明区域，不过eyes-half-v2仍有角落alpha残留，因此也未通过严格透明边缘验收；逐图检测见image-alpha.json。不能只凭把图层缩放／平移到一起就宣称身体动作完成。因此没有扩大其他四组合或全角色美术，也没有在正式剧情里启用不合格分层。

19种姿态、24种表情、原文行号、场景／节点、继承后的25次组合、映射与状态全部见[盘点](verification/dialogue-presentation/hero-inventory.md)及JSON。躺卧、持剑、抱人等明确留待后续。

## 6. 保护与未重做项目

274个开工快照内保护文件SHA-256逐项一致，含4份source、3份剧情JSON、原20个测试文件、既有导出器、自动问题清单、战斗／AI／地图／存档源码及配置、原媒体与依赖配置、历史验收。没有运行剧情导出。详见[protected-after.json](verification/dialogue-presentation/protected-after.json)和before.json。

未验证／未通过：三姿态五组合的最终视觉交付、衣摆／行李／伸懒腰实际图层动作、所有未制作表情、原作内部机制。本轮未重新开展M2 seed42专项浏览器双跑、完整v1/v2迁移故障／多窗口矩阵、不同系统／移动设备；相应原规则测试保留，本轮不声称这些专项重新实测。没有部署到正式网站验证新素材。

## 7. 关键截图与本地体验

- [最终A010底部旁白窗口](verification/dialogue-presentation/final-a010-bottom-narration.jpg)。
- [最终a006多人构图](verification/dialogue-presentation/final-a006-multi-actor.jpg)。
- [a003短台词补录](verification/dialogue-presentation/a003-short-dialogue.jpg)。
- [候选半闭眼](verification/dialogue-presentation/candidate-half-eye.jpg)、[候选闭眼与口型](verification/dialogue-presentation/candidate-closed-eye.jpg)：均为未通过的素材检查图，不是正式视觉交付。

在工程运行`npm run dev`。正常入口为主菜单；`/tests/portrait-presentation.html`只在开发服务器开放。项目base可用`npm run dev -- --base /dimensional-war-game-pages/`验证。新样板页有明确“候选”标识；正式剧情仍使用静态回退。本地origin之间、localhost与127.0.0.1及线上域名的存档互相独立，本轮没有清除或迁移用户正式存档。

本轮最终保留的生产预览为[http://127.0.0.1:43849/?seed=0](http://127.0.0.1:43849/?seed=0)，新档菜单、继续禁用、无存档写入且控制台error为空，见delivered-preview.json及delivered-menu.jpg。可用`npm run preview -- --host 127.0.0.1 --port 43849 --strictPort`重启。根路径开发页仍可在43847端口检查；生产构建不提供样板fixture。

完整提示词使用内置imagegen，见imagegen-prompts.json和imagegen-refinement.json；原始16张PNG均存工程版本目录。所有工作文件的新增／修改／删除见[逐文件清单](verification/dialogue-presentation/file-changes.md)，工程外只新增用户明确授权的`游戏机制/对话与动态立绘.md`。
