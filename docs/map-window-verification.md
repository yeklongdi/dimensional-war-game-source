# 地图铺满窗口与地点选关浮窗 · 验收

日期：2026-10-22。实施基线：`a8d513414b1aa5bca274928f02830a442400f7f4`，main，开工工作区干净，353个受控文件已记录SHA-256。本记录独立于历史M0–M4、地图分关、移动规划和分层立绘验收。

## 实现结果

地图单独铺满浏览器内容区，底图等比铺满，标题／进度、操作和保存反馈浮在上面。常驻右栏移除；点地点打开旁边非模态浮窗，整张关卡卡片开始／继续。初次进入、返回和定位均不自动打开；浮窗跟随拖缩、靠边避让、内部滚动、锚点离屏关闭。支持关闭按钮／Esc／空白、键盘激活和焦点恢复。

相机函数使用实际视口；窗口变化保持视野中心世界点和相对倍率。相机、视口和浮窗集中在GameState.map，不序列化、不保存、不改flag／RNG。七关、不可重玩、检查点、v1只读迁移、两战、剧情、素材和依赖保持原约定。

## 工程检查

2026-10-22 19:29按顺序执行，原始输出见[commands.log](verification/map-window/commands.log)：

| 命令 | 实际结果 |
|---|---|
| npm run typecheck | 通过，strict，无any规避 |
| npm test | 24个文件、356项通过，原330项断言保留，新增26项 |
| npm run build | 通过，73模块；CSS 18.06kB，JS 159.27kB |

新增测试涵盖浮窗状态、重复／旧输入、当前关与完成关、零保存副作用、实际视口铺满、锚点缩放、窗口中心保持、离屏关闭及浮窗避让。原map-flow仍逐段校验25场／161段正文及战后SET，两战、存档与恢复回归继续执行。旧测试辅助仅扩展导航类型排除带尺寸参数的动作，没有删除或削弱原断言。

## 浏览器实测

使用原生浏览器自动化与真实按钮／键盘／拖动，在独立origin `http://127.0.0.1:43852/`进行；没有清理用户其他origin进度，没有注入GameState、跳场景、改HP或一键胜利。

| 项目 | 实际范围与结果 |
|---|---|
| 新档地图 | 仅奶奶家显现，初始浮窗关闭；地图边界与浏览器内容区完全一致 |
| 窗口尺寸 | 1280×720、1920×900、800×600均铺满；临时尺寸覆盖已恢复 |
| 鼠标流程 | 地点打开旁边浮窗，卡片进入p001；关闭按钮／空白有效 |
| 键盘 | Enter、空格打开，焦点移入可进入卡；Esc／关闭回地点，离屏节点可通过键盘定位 |
| 拖缩 | 地图拖100px时浮窗同步移动100px；滚轮缩放、定位正常；地点离屏关闭，拖动松手不误开 |
| 实际首关 | 正常按键完成p001、p002、p003、p004，24段正文，47次推进；返回地图后浮窗关闭，显示第二关 |
| 恢复 | p001中途返回保留关内检查点；刷新后地图浮窗显示继续关卡，可从p001场景头继续 |
| 不可重玩 | 正常完成首关后，其卡片禁用；直接点边缘露出的历史节点可定位并查看 |
| 多关地点 | 既有替换IO页v1-p009：奶奶家显示第1关禁用、第3关可继续，不显示未来关 |
| 完成地图 | 既有替换IO页v1-all-complete：五节点、完成提示，学校第5／7关均禁用，施工区边缘浮窗在窗口内 |
| 长列表 | 800×600学校双关浮窗400px高，内部scrollTop从0到64.8；标题和底部控制均未被盖住 |
| 存档纪律 | 地图、浮窗、拖缩、滚动不增加写盘；受控迁移始终只有1次v2写入，v1原串逐字一致 |
| 控制台 | 本地正式入口及受控完成页均0条error；剧情缺素材沿用既有去重warning |

本地浏览器数据见[browser-local.json](verification/map-window/browser-local.json)、[browser-revisit.json](verification/map-window/browser-revisit.json)、[browser-completed.json](verification/map-window/browser-completed.json)。受控迁移只替换IO，复用原控制器和UI；不等同于本轮在浏览器重新玩完七关。

浏览器发现并修正：小窗口面积加权可能选择遮住地点／底部控制的位置，现先保证地点，再在HUD上下避让并限制列表高度；点击边缘只露出标签的历史地点时，先带回可视区再打开。修复前数据保留作为发现过程，最终结果以带“修复后”条目和最终截图为准。

关键截图：[普通窗口浮窗](verification/map-window/location-popup.jpg)、[宽屏](verification/map-window/wide-popup.jpg)、[首关完成](verification/map-window/first-level-complete.jpg)、[完成关卡](verification/map-window/completed-level-popup.jpg)、[奶奶家双关](verification/map-window/two-level-location.jpg)、[小窗口最终列表](verification/map-window/completed-school-small-final.jpg)。

## 发布与线上验收

正式仓库：[yeklongdi/dimensional-war-game-source](https://github.com/yeklongdi/dimensional-war-game-source)，main，公开。沿用现有Actions工作流，不改部署配置、不创建或更新Sites。

正式网址：[次元战争](https://yeklongdi.github.io/dimensional-war-game-source/)。本节将在本轮实际部署成功及线上检查后补充版本与结果；当前本地验收不能替代线上结果。

## 保护、文件与限制

运行`node tools/check-map-window.mjs`核对开工快照，按本轮明确允许的11个既有文件变更排除后，其余342个受控文件必须SHA-256一致。覆盖source4份、剧情JSON3份、原22个测试文件、导出器、自动问题清单、全部游戏素材、战斗／关卡／AI／存档模块、依赖与历史验收。没有运行剧情导出，没有改工程外设定。

逐项哈希见[before.json](verification/map-window/before.json)和[after.json](verification/map-window/after.json)，实际新增／修改／删除见[完整文件清单](verification/map-window/file-changes.md)。无新增游戏美术和运行时依赖，截图仅为验收证据；所有代码不超过400行。

本轮未在浏览器重玩全部七关和两场战斗，完整正文与战斗属于本次自动回归覆盖；没有将历史实测冒充本轮结果。未做手机专门适配或系统全屏。分层男高视觉样板缺口仍保留，不因地图改造改变其验收结论。

本地体验：在工程目录运行`npm run dev`，打开终端地址；本轮开发入口为`http://127.0.0.1:43852/?seed=0`。不同origin的存档独立；不能为体验新档清除已有正式档。
