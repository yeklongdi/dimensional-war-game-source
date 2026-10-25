# 快速推进与换场景时的图片占位：排查及本地修复

日期：2026-10-26。基线：`858b2a8`，保留开工已有角色卡修改及背景阶段本机日志。本轮用户明确仅测试图片加载相关问题，不重复无关玩法。初次交付仅本地；后续用户明确授权更新GitHub，发布准备见本文末尾。

## 原因与边界

1. 原`BackgroundLoader`把run／幕／场景／背景键一起当作请求标识，每次新标识都先发loading；`BackgroundView.present`收到loading后立即`replaceChildren()`，旧图片因此消失。同图跨场景也会露出渐变。
2. 原立绘实例初次更新先`placeholder()`，所有分层完成解码后才替换；控制器按run／screen重建视图时，该过程重复出现。缓存只在背景视图内，立绘共用图层也没有控制器级解码缓存。
3. 原失败分层会请求`配方键:fallback`，逐字刷新却重新请求主键，存在额外撤销／重启静态回退的路径。
4. 截图中的P001背景键与男高行李／紧张期待均有正式资源绑定；不能仅凭截图断言发生404。以上为静态根因及后续受控验证。奶奶、老师、黑衣人等尚未绑定的占位是既有素材缺口，本轮不补图或伪装成已绘制。

## 实现

- `visual/image-cache.ts`：由单控制器持有32项的有界缓存，共享在途请求与解码结果，失败删除以便后续重试，释放后不留旧结果。不增加全局游玩状态。
- `visual/story-images.ts`：只收集当前演出、SHOW的明确状态及无条件下一场开头的资源URL；菜单预热P001或当前检查点。读取配置而不调用剧情驱动，不运行SET、CALL、选项、音频或存档。沿用assetUrl／BASE_URL。
- `visual/background-loading.ts`：同会话同图跨场景不重新发loading；已解码命中可同步交付，失败后新场景仍可重试，旧请求继续由租期拦截。
- `ui/background.ts`：加载期间保留旧背景，成功后替换，缺图／真实失败才清图并显示当前场景渐变与标题。
- `ui/portraits.ts`：有绑定的首次加载标记loading，不先画色块；保留旧真实画面，稳定失败回退键，准备时停止口型；仅当前展示人物参与就绪判断。
- `ui/player-view.ts`、`controller.ts`、`styles/player.css`：准备状态与一次性图片回调由视图管理；暂停正文计时和普通推进，完成后恢复原等待，准备期间的点击不排队；系统菜单保留。离开仍释放视图及旧回调，控制器最终释放图片缓存。

背景、立绘文件、SHOW／HIDE、三人排位、剧情原文、JSON、九关、战斗、音频、快进规则及v4格式没有更改。

## 本轮检查

| 检查 | 实际结果 |
|---|---|
| `npm run typecheck` | 通过 |
| `npm test -- src/tests/scene-image-loading.test.ts src/tests/backgrounds.test.ts src/tests/visual-loading.test.ts` | 3文件、37项通过，0失败；新增7项，原相关断言未删改 |
| 全量测试、生产构建、全九关、战斗实打 | 未运行，不属于本次相关验证 |

最终命令输出：[checks.txt](verification/scene-image-loading/checks.txt)。新用例覆盖共享解码／重建、失败重试／缓存淘汰、释放、同图跨场景、缓存往返与旧请求、预热无剧情副作用。

## 真实浏览器相关验证

正常游戏使用隔离origin `http://127.0.0.1:44026/`，正式子路径开发预览为`http://127.0.0.1:44027/dimensional-war-game-source/`。没有操作维护者正式站存档，没有注入GameState或更改血量。受控页面为现有`/tests/backgrounds.html`与`/tests/portrait-presentation.html`，只替换图片IO，不冒称正式新档通关。

| 场景 | 观察与证据 |
|---|---|
| 正常新游戏P001 | 背景ready、1664宽真实图；男高hero_luggage_nervous分层，未见原色块。[01截图](verification/scene-image-loading/01-p001-ready.png) |
| 12次快速空格推进P001→P002 | 每次采样均为1张背景，男高layered；P002按原顺序继承姿态并更新。[02截图](verification/scene-image-loading/02-p002-after-rapid.png) |
| 背景人工延迟 | 切到P003仍保留P001已解码背景，准备提示显示；点击前后等待token均为102:1，未推进。[03截图](verification/scene-image-loading/03-delay-keeps-previous.png) |
| 旧请求晚到 | 新P004卧室ready后才释放旧P003请求，最后仍为P004卧室，旧图不覆盖。[04截图](verification/scene-image-loading/04-late-result-rejected.png) |
| 真实404／解码失败 | 不存在路径与非图片文件分别触发failed、准备状态结束、显示当前渐变；正常重访P005可恢复真实图。[05截图](verification/scene-image-loading/05-real-decode-failure-fallback.png) |
| 立绘人工延迟／快速更新 | 原平静分层保留，色块数0；点击不改lab:2。连续选行李、得意、准备，最终只显示hero_prepare_puzzled。[06等待](verification/scene-image-loading/06-portrait-delay-keeps-figure.png)、[07最终](verification/scene-image-loading/07-portrait-latest-ready.png) |
| 刷新→读取自动档→确认 | 恢复P002场景头，男高继承行李／紧张期待、layered，背景ready。[08截图](verification/scene-image-loading/08-p002-refresh-load.png) |
| 交替点击／空格跨场景 | 从P002经P003、P004到P005；重观状态为prologue_02/p005、完成前缀仅第一关、背景ready、男高静态回退。批量工具调用曾超时，因此不声称保存了这段完整逐帧数据，仅保留重观的P005状态与截图。[09截图](verification/scene-image-loading/09-rapid-multiscene.png) |
| 全新立绘慢加载 | loading=true、visual=loading、色块0；不将请求中误标为缺图。[10截图](verification/scene-image-loading/10-cold-portrait-loading.png) |
| 单层失败→静态回退 | 静态回退完成后，连续5次逐字状态更新，完成加载数56→56、pending=0、loading=false，没有重复请求回退。[11截图](verification/scene-image-loading/11-layer-failure-static.png) |
| 正式子路径开发预览 | P001背景及9张实际动态图层URL均带`/dimensional-war-game-source/`，背景ready、男高layered。[12截图](verification/scene-image-loading/12-project-base-p001.png) |

控制台读取：正常、子路径、立绘故障、背景故障四页均未记录console error；背景故障页主动制造不存在图片及非图片请求，与正常资源分开。原始浏览器摘要及实际URL见[browser-checks.json](verification/scene-image-loading/browser-checks.json)。这不等于完整网络审计或线上正式版本验收。

未验证：全九关、两战、全部存档／多窗口、真实弱网设备、生产构建、正式网站；这些未被本轮扩大测试。未新增场景美术，原无图演员和真正失败时仍会明确回退。

## 实际文件变更

新增程序／测试3份：`src/game/visual/image-cache.ts`、`src/game/visual/story-images.ts`、`src/tests/scene-image-loading.test.ts`。

修改程序／样式6份：`src/game/controller.ts`、`src/game/visual/background-loading.ts`、`src/game/ui/background.ts`、`src/game/ui/portraits.ts`、`src/game/ui/player-view.ts`、`src/styles/player.css`。

新增本记录及`verification/scene-image-loading/`内12张截图、`browser-checks.json`、`checks.txt`；修改当前工程README、任务书§20、对话立绘规格与既有decisions。没有移动或删除文件，不覆盖历史验收；开工角色卡修改与本机日志保持原状。保护核对采用Git静态差异：source、剧情JSON、tools、public、art、依赖配置及旧测试无本轮差异，未运行剧情导出。

首次交付只本地修复与定向验证，未提交、推送或触发网站部署；后续授权按下节执行，不改写首次交付事实。

## 后续授权：同步现有GitHub与Pages

维护者明确要求“更新上github”，授权正常提交、推送现有`yeklongdi/dimensional-war-game-source`的main并确认Pages更新。发布前远端与本地均为858b2a8，无分叉；账号具有维护权限，复用现有公开仓库及Actions发布源，不更改可见性、域名、依赖或工作流。

发布准备再次实际执行：`npm run typecheck`通过；上述3文件37项定向测试通过；`npm run build -- --base /dimensional-war-game-source/`通过（99模块，生成`index-CXVWY4HF.js`与`index-rAwfJZxh.css`）。本地不追加全量测试或无关玩法，既有Actions仍按原配置检查并发布dist。dist、依赖、部署缓存、背景本机日志和其他窗口的角色卡修改／重命名不提交。

正式地址保持为https://yeklongdi.github.io/dimensional-war-game-source/。提交号、Actions实际运行与线上产物核验只按本次发布完成后的真实回执报告，不用本地预览替代线上成功。
