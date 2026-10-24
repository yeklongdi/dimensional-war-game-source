# GitHub Pages 正式部署记录

发布日期：2026-10-21，Asia/Shanghai。

**结果：正式部署成功，匿名访问实测通过。**

- 正式网站：<https://yeklongdi.github.io/dimensional-war-game-pages/>。
- 私有源码仓库：<https://github.com/yeklongdi/dimensional-war-game>，分支 `main`，可见性 **PRIVATE**。
- 公开发布仓库：<https://github.com/yeklongdi/dimensional-war-game-pages>，分支 `main`，可见性 **PUBLIC**。
- Pages 发布源：GitHub Actions（API `build_type: workflow`），HTTPS 已启用，无自定义域名。

## 1. 授权与仓库范围

开工时游戏工程及父笔记库均没有 Git 仓库，项目内没有当前分支、remote 或既有提交。GitHub CLI 已登录 `yeklongdi`，通过系统 keyring 使用现有授权，未要求用户粘贴密码或令牌。

先创建私有源码仓库并正常上传工程。该账号启用私有 Pages 时返回 HTTP 422：`Your current plan does not support GitHub Pages for this repository.` 因此没有修改源码仓库可见性。用户随后明确选择“工程和原始笔记保持私有，另外只公开打包后的游戏”。

公开仓库仅有 10 个受控文件：8 个 `dist/` 运行文件、`.github/workflows/deploy-pages.yml` 和简短 `README.md`。没有原始 Markdown、工程文档、测试、开发源码文件、依赖目录、笔记库或凭据。浏览器运行所需的 JavaScript、剧情文本、图片及音乐本身是公开的。

只在游戏工程内初始化源码 Git，并在忽略的 `.github-pages-deploy/site` 内 clone 公开发布仓库。保留服务器创建的初始 README 提交，全部正常追加提交与推送；没有 reset、强推或改写远端历史。没有在父笔记库初始化 Git，没有创建或修改 Sites 项目。

`.gitignore` 新增排除 `.sites-deploy/`、`.github-pages-deploy/`、`.env`、`.env.*`、私钥扩展名；继续排除 node_modules 与 dist。凭据特征扫描未命中，源码首次提交白名单检查没有禁止路径。公开文件清单见 `.github-pages-deploy/records/public-files.txt`。

## 2. 构建路径与最小代码改动

工程仍没有 `vite.config.*`。由公开仓库 Pages API 取得实际 `html_url` 后，从 URL 提取路径 `/dimensional-war-game-pages/`，再构建：

```powershell
npm run typecheck
npm test
npm run build -- --base /dimensional-war-game-pages/
```

使用现有 build 脚本并传入 Vite CLI base，没有增加框架或依赖。开发模式继续使用 Vite 默认 `/`。

新增 `src/game/asset-url.ts`，仅将运行时 `/assets/...` 地址加上 `import.meta.env.BASE_URL`；音频绑定、立绘绑定和地图显示使用该函数。原 `audio-map.json`、`overrides.json`、素材与剧情 JSON 不改写。已有背景绑定为空，继续按原规则显示场景渐变占位。

新增 7 项测试覆盖根路径、项目页路径、相对 base、尾斜线、非素材 URL 不变、输入映射不变和实际音频/立绘绑定。没有修改或削弱原285项断言。没有改变剧情、关卡、战斗、AI、装备、英雄激励、移动规划或 v1/v2 存档规则。

## 3. 本次检查与发布来源

| 检查 | 本地结果 | 私有 Actions 结果 |
| --- | --- | --- |
| 依赖安装 | 使用既有锁定依赖 | `npm ci` 成功 |
| `npm run typecheck` | 通过 | 通过 |
| `npm test` | 20 文件、292 项通过 | 20 文件、292 项通过 |
| `npm run build -- --base ...` | 通过，64 个模块 | 通过，64 个模块 |

- 源码快照提交：`aeecd26ee53d02d5ca436759456928a7316c460e`。
- 私有构建运行：[39629112396](https://github.com/yeklongdi/dimensional-war-game/actions/runs/39629112396)，结论 **success**。
- 发布提交：`7fb56ca5b0f4556866a502aad8452d58804af929`。
- 公开部署运行：[39629677837](https://github.com/yeklongdi/dimensional-war-game-pages/actions/runs/39629677837)，结论 **success**。
- Pages deployment ID：`7230526453`，状态 **success**，环境 `github-pages`。
- 部署成功时间：2026-10-21 15:53:15 UTC，即北京时间23:53:15。
- 正式 URL 取自 deployment status 的 `environment_url`，不是由本地预期地址冒充成功结果。

公开的成品直接下载自上述私有 CI 的 `github-pages` artifact。解包前检查归档路径，解包后逐一比较：CI 产物、本地正式路径构建和线上响应的 8 份 SHA-256 全部一致。

| 文件 | 字节数 |
| --- | ---: |
| `index.html` | 491 |
| `assets/index-APozp3Fs.css` | 15,958 |
| `assets/index-FWxeviOu.js` | 144,493 |
| `assets/audio/homecoming.wav` | 11,369,352 |
| `assets/audio/liuxie.wav` | 19,737,328 |
| `assets/maps/sun-city-painted-v1.png` | 3,836,748 |
| `assets/portraits/hero.png` | 2,774,655 |
| `assets/portraits/thief.png` | 1,405,360 |

静态文件合计39,284,385字节，约39.3 MB。WAV 原字节、原音质保留，首次音乐加载可能较慢。未新增付费服务、域名或运行时密钥。

## 4. 两个工作流及后续更新

私有源码仓库 `.github/workflows/build-game.yml`：main push 和手动运行均可触发；执行 npm ci、typecheck、test，再按非秘密仓库变量 `PUBLIC_PAGES_BASE_PATH` 构建，上传只含 dist 的私有 artifact。权限仅 `contents: read`。

公开发布仓库 `.github/workflows/deploy-pages.yml`：main push 和手动运行均可触发；只从 dist 打包、上传并部署 Pages。只授予 `contents: read`、`pages: write`、`id-token: write`，不获取私有仓库凭据。官方 Actions 使用已核对的完整提交 SHA。

**源码改动不会自动跨仓库发布。** 这一步刻意由已登录 CLI 同步，避免把跨仓库写入令牌或私有源码访问凭据放入 Actions。流程是“私有 main push 自动构建 → 检查 CI → 同步成品 → 公开 main push 自动部署”。公开仓库无需再次 npm ci 或编译已构建文件。

后续更新同一网站：

1. 在私有工程提交并正常推送 main，等待 `build-game.yml` 明确成功；也可手动触发。
2. 用已登录的 `gh run download <真实运行ID> --repo yeklongdi/dimensional-war-game --name github-pages --dir <独立临时目录>` 下载产物，核对来源提交、tar 路径及文件清单。
3. 将检查通过的完整产物同步到 `.github-pages-deploy/site/dist`。仅清理这个发布副本的过期文件；删除前必须核对绝对目标仍在专用发布目录内。不要复制源码、原文或验收记录。
4. 在公开 checkout 中正常提交并推送 main，等待 `deploy-pages.yml` 成功，再核对真实部署 URL、资源与浏览器。不要强推或创建重复仓库。
5. 本地未登录时使用官方 `gh auth login` 完成授权，不在聊天或仓库中保存密码/令牌。

如需回退，在公开仓库以正常新提交恢复之前已验证的 dist 快照，再推送触发部署；保留历史，不 reset 或 force push。代码回退不会自动迁移、清除访客的浏览器存档。

## 5. 线上实际验收

无 Cookie、无 Authorization 的独立 HTTP 客户端访问根页及全部7份资源均为200，正文和资产与 CI 逐一哈希一致。探测 `source/story/prologue.md`、`src/main.ts`、`docs/01-任务书.md`、`tests/battle-reaction.html`、`.git/config` 均为404；这些是刻意检查未暴露路径，不是游戏资源加载失败。

浏览器通过真实按钮、空格、回车和棋格完成：

- 匿名打开直接看到主菜单，没有 GitHub 登录页。
- 开始游戏 → 彩绘地图 → 地点/关卡面板 → 第一关。地图图片 naturalWidth 1536，男高立绘 naturalWidth 1024。
- 两首音乐在实际剧情中均加载播放；`homecoming.wav` 与 `liuxie.wav` readyState 为4、paused false、无 media error。没有以人耳听音作为证据。
- p001–p004 正常推进，第一关完成后回地图、显现仓库地点并开放第二关。
- 第二关从p005到p006，正常进入序幕真实战斗，显示先攻、英雄激励与原移动教学。
- 保留先攻原骰，点击移动，用 Enter 与 Space 添加 `(1,2)`、`(2,2)` 两点；规划时角色仍在 `(0,2)`、移动力30尺，显示两步路线与终点虚影。
- 独立确认后逐格到 `(2,2)`，剩余20尺，骰子仍为3次；规划与移动不写入场景存档。
- 普通剧情刷新 → 继续回p001场景头；正式战斗中刷新 → 继续回p006场景头正文，不保留战斗中间态。
- 从p006返回地图仍显示“继续关卡”，再返回主菜单保留继续入口。
- 独立 `?debug=battle&seed=42` 正常进入并经过敌方回合；同样规划两点并确认，移动30→20尺，骰子5→5次。
- 已检查的剧情与调试页面控制台 error 为0；没有运行素材404。原背景、其他角色和未绑定音频的去重占位 warning 继续保留，不通过新增素材或剧情掩盖。

HTTPS 下实际保存成功且刷新读回。原 `browserSaveStore` 没有无锁降级，缺少 `navigator.locks` 会拒绝写入，因此保存成功也验证了实际 Web Locks 与 localStorage 路径。本轮没有访问或清空其他 origin 存档；验收浏览器保留第二关p006检查点，其他新访客从新档开始。

**没有在线完整通关七关、25场161段正文或打完两场战斗；未在线重做全部迁移、多窗口、失败重试和少见中断分支。** 原规则测试与历史验收保留，不能用本次构建成功代替这些未完成的线上实测。

证据在不上传的 `.github-pages-deploy/records/`：`anonymous-http.json`、`release-artifacts.json`、`source-actions.json`、`public-actions.json`、`pages-deployment.json`、`online-browser.json`、`online-debug.json`、`online-console.json`、`online-debug-console.json`，以及 `online-menu.jpg`、`online-map.jpg`、`online-story.jpg`、`online-movement-planning.jpg`。

## 6. 存档与限制

存档仍是当前浏览器的本地数据，不是 GitHub 账号数据。localhost、127.0.0.1、不同端口、Sites 域名和 `yeklongdi.github.io` 分属不同 origin，不会自动迁移或跨设备同步。

浏览器按 origin 隔离而不是按路径隔离；未来若在同一 `yeklongdi.github.io` 域名部署其他使用相同存档键的游戏，应先处理键名冲突。本次没有修改既有 v1/v2 格式或键名。

当前唯一发布流程上的限制是跨仓库成品同步为手动 CLI 步骤，未新增长期凭据。私有源码仓库的 Pages 权限问题没有通过公开原文或升级付费方案解决；网站由获用户明确批准的公开成品仓库提供。

## 7. 文件变更与保护

新增：

- `src/game/asset-url.ts`。
- `src/tests/asset-url.test.ts`。
- `.github/workflows/build-game.yml`。
- 本文件 `docs/github-pages-deployment.md`。
- `.github-pages-deploy/site`：公开仓库 checkout、8个 dist 文件、README 与 Pages 工作流。
- `.github-pages-deploy/source-artifact/artifact.tar` 与本轮记录/截图，均被源码 `.gitignore` 排除。
- 原工程 `.git/`：此次上传所需的新 Git 历史与配置，不进入网站产物。

修改：`.gitignore`、`src/game/story/config.ts`、`src/game/ui/map-view.ts`、`README.md`。原工程 dist 经正常 build 重新生成。

移除：此前尚未提交的 `.github/workflows/deploy-pages.yml` 私有 Pages 草稿，改为私有构建工作流和公开部署工作流。没有删除原有游戏文件、历史验收或用户资料。

开工284文件快照与复核见 `.github-pages-deploy/records/before-files.json`、`protection.json`、`file-changes.json`。其中4个是上述明确修改的已有文件，另外280个逐一保持哈希一致，原有文件删除0；source 全部原文、三份剧情 JSON、导出器、自动问题清单、素材、战斗数据/AI、存档规则、依赖与历史验收未改写，未运行导出器。
