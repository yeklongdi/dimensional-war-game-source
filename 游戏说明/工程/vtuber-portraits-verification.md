# 虚拟主播12张立绘接入验收

2026-11-16，用户批准首批9张图写入游戏并上传GitHub，随后要求补画缺少的趴伏、昏迷与病床苏醒。本轮补画3张，合计12张透明静态立绘。

## 实际接入

- 资源键仍为 `char_virtual_streamer_shy`。序幕（二）与羁绊一共用同一外观和静态解析器。
- 只匹配原脚本的明确姿态和表情；专用姿态先于表情，不修改对白、剧情JSON、只读source、SHOW/HIDE或保存状态。
- V101依次使用操作电脑、护住电脑、双手递书、抬手提醒。抱电脑期间的点头等过程定格在护住电脑图，不伪称已有逐帧动画。
- A013使用趴伏图；A014与A015使用昏迷侧躺图；A015_RECOVERY使用枕头与棉被的苏醒图。
- 三张横向图原画布1536×1024，独立度量，头顶逻辑y=330。其他图保持1024×1536、头顶y=210。头高约139～141px；一／二／三人不改变尺度，轮廓宽度≤340px。
- 缺图或解码失败沿原机制显示明确占位。线上皮套、完整行走与两人横抱联合动作尚未制作。

## 本地验证

1. `npm run typecheck`通过。
2. `npm test -- src/tests/vtuber-portraits.test.ts`：25项通过，0项失败，覆盖12张度量、真实剧情姿态、显式表情、继承优先级、原状态保护、预热与缺图。
3. `npm test -- src/tests/prologue-portraits.test.ts src/tests/portrait-metrics.test.ts -t "vtuber-|所有新静态映射"`：9项通过，24项无关测试跳过。
4. `python tools/check-vtuber-portraits.py`：隔离无头Chrome中的实际PlayerView显示12张，V101原文节点推进切换4张动作，验证一至三人尺度及缺图占位；正常路径控制台错误0。未使用、写入或清理玩家存档。
5. `npm run build`与`npm run build -- --base /dimensional-war-game-source/`均通过。
6. [12张素材检查](verification/vtuber-v1/asset-checks-all.json)：RGBA、实际尺寸、PNG解码、透明度、登记SHA及与生成原件字节一致性全部通过。

检查只覆盖本次立绘接入，没有重新运行无关玩法测试。GitHub现有工作流在推送后自动执行其检查和Pages部署；发布结果以对应提交的Actions状态为准。

## 图像证据

- [新增三姿态预览](verification/vtuber-v1/supplement-preview.png)
- [图书馆操作电脑](verification/vtuber-v1/runtime/v101-vtuber-laptop-focus.png)、[护住电脑](verification/vtuber-v1/runtime/v101-vtuber-laptop-guard.png)、[递书](verification/vtuber-v1/runtime/v101-vtuber-book-offer.png)、[提醒](verification/vtuber-v1/runtime/v101-vtuber-reminder.png)
- [趴伏](verification/vtuber-v1/runtime/pit-collapse.png)、[昏迷](verification/vtuber-v1/runtime/unconscious.png)、[苏醒](verification/vtuber-v1/runtime/bed-awake.png)
- [三人同屏](verification/vtuber-v1/runtime/three-people.png)、[日常单人](verification/vtuber-v1/runtime/shy.png)、[缺图占位](verification/vtuber-v1/runtime/missing-image-placeholder.png)
- [浏览器检查结果](verification/vtuber-v1/runtime/browser-checks.json)

这些是实际游戏播放器的受控画面检查，专用姿态图的检查背景统一使用图书馆；不是从新档通关获得的剧情截图。

## 文件变动

- 新增3张补图：`vtuber-pit-collapse.png`、`vtuber-unconscious.png`、`vtuber-bed-awake.png`；前批9张原字节保留并随本次提交上传。目录为代码区`public/assets/portraits/vtuber-v1/`。
- 新增解析程序`src/game/visual/vtuber-portraits.ts`、测试`src/tests/vtuber-portraits.test.ts`及验收脚本`tools/check-vtuber-portraits.py`。
- 修改`src/game/visual/static-portraits.ts`、`portrait-metrics.ts`及两份直接相关的旧断言`src/tests/prologue-portraits.test.ts`、`portrait-metrics.test.ts`。
- 更新代码区`AGENTS.md`、`art/vtuber-v1/prompts.json`、`registration.json`与说明区`素材制作/虚拟主播立绘使用说明.md`。
- 新增本说明、`asset-checks-all.json`、`supplement-preview.png`及`verification/vtuber-v1/runtime/`下10张截图和1份JSON。首批4张参考副本与首批3份检查资料一并上传，保留原件。
- 无文件移动或删除；不提交其他角色卡、其他路线原稿、Excalidraw或本机日志的现有变动。
