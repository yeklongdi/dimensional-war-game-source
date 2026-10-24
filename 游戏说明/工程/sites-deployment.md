# Sites 部署记录

日期：2026-10-21（Asia/Shanghai）。

**发布状态：Sites 正式部署成功，访问范围配置为 public；本机浏览器及无登录信息的 HTTP 客户端访问正式域名均被 Cloudflare 403 阻挡。尚未完成“匿名直接打开游戏”的验收，不能把本次结果视为公开游玩验收通过。**

## 1. 正式站点与版本

| 项目 | 实际结果 |
| --- | --- |
| 标题 | 次元战争 · Web 垂直切片 |
| 正式 URL | https://dimensional-war-game.keeferkeelan.chatgpt.site |
| slug | dimensional-war-game（未发生名称占用） |
| project_id | `appgprj_6ad8b701667c8191bfa54bfe0a753bc7` |
| 访问配置 | `public`，access policy revision `2` |
| 站点状态 | `active`，`disabled_by: null` |
| 版本号 | 1 |
| version_id | `appgprj_6ad8b701667c8191bfa54bfe0a753bc7~appgver_a67a803abe1081918f8d6c9ec5e1a7cc` |
| deployment_id | `appgdep_6ad8b8b946648191912a06a3e3cc7f8c` |
| 部署类型及结果 | `publish` / `succeeded`，failure_message 为 null |
| 平台部署完成时间 | 2026-10-21 13:06:30 UTC / 21:06:30 北京时间 |
| 发布提交 | `008f862686373c3367e478522b1cf4db3f4b8214` |

正式 URL 来自成功部署响应，并与后续 `get_site.current_live_url` 一致，没有用 expected_url 或 localhost 代替正式成功结果。只创建了本项目这一个新站点，未修改账号内其他站点。

无数据库、R2、服务端 API、云存档、登录系统、插件集成或运行时密钥。站点 public 设置已由接口核实；Cloudflare 阻挡使“无需登录直接游玩”仍未验证。

安全摘要与平台响应见 [publication.json](../../次元战争代码/.sites-deploy/records/publication.json) 和 [diagnostics.json](../../次元战争代码/.sites-deploy/records/diagnostics.json)。源码写入凭据只经官方 helper 隐藏 stdin 输入，不保存在工程或这些记录中。

## 2. 原工程与独立发布目录

- 原工程：`E:\笔记\次元战争设定\游戏文件`。
- 独立发布 checkout：`E:\笔记\次元战争设定\游戏文件\.sites-deploy\dimensional-war-game`。
- 发布配置：该 checkout 的 `.openai/hosting.json`。
- 静态目录：该 checkout 的 `dist`。
- 归档：`.sites-deploy/archives/dimensional-war-game-v1.tar.gz`。
- 检查与本地证据：`.sites-deploy/records/`，在发布 checkout 外，不会随源码或静态归档上传。

保留原 Vite 工程；没有套用 Sites 模板，没有安装 Vinext、React 或新依赖。官方 `site-workflow.mjs` 仅在独立发布 checkout 内初始化 Git、提交并推送。原工程根与笔记库根均未初始化 Git。

配置如下：

```json
{
  "project_id": "appgprj_6ad8b701667c8191bfa54bfe0a753bc7",
  "static": {
    "directory": "dist",
    "not_found_handling": "none"
  }
}
```

游戏只使用根页面和 query 参数，不依赖路径路由，因此不增加 SPA 回退来掩盖缺失资源。`/assets/...` 指向同源根目录。

官方工作流：原工程检查与构建 → 复制静态文件 → 本地发布包预览 → helper 推送准确快照并打包（`commands: []`）→ `save_site_version` → `deploy_site_version`。没有通过线上临时发布来冒充隔离预览。

## 3. 本次构建与包检查

在原工程顺序执行，前一项成功后再执行下一项：

| 命令 | 本次结果 | 记录 |
| --- | --- | --- |
| `npm run typecheck` | 通过 | [typecheck.txt](../../次元战争代码/.sites-deploy/records/typecheck.txt) |
| `npm test` | 19 个文件、285 项通过 | [tests.txt](../../次元战争代码/.sites-deploy/records/tests.txt) |
| `npm run build` | 通过，Vite 8.3.4，63 个模块 | [build.txt](../../次元战争代码/.sites-deploy/records/build.txt) |

以下 8 个运行文件从原 `dist` 原字节复制，原构建与发布副本 SHA-256 全部一致：

| dist 相对路径 | 字节数 |
| --- | ---: |
| `index.html` | 437 |
| `assets/index-APozp3Fs.css` | 15,958 |
| `assets/index-NGcg1r9H.js` | 144,207 |
| `assets/audio/homecoming.wav` | 11,369,352 |
| `assets/audio/liuxie.wav` | 19,737,328 |
| `assets/maps/sun-city-painted-v1.png` | 3,836,748 |
| `assets/portraits/hero.png` | 2,774,655 |
| `assets/portraits/thief.png` | 1,405,360 |

合计 39,284,045 字节（约 39.3 MB），最大单文件 19,737,328 字节。完整逐文件 SHA-256 见 [artifacts.json](../../次元战争代码/.sites-deploy/records/artifacts.json)。

本地 tar.gz 为 35,741,016 字节，SHA-256：

```text
cb64eac708651f89c13b84c7e27af89708448aacfbe1c313e30b7a272638dc59
```

平台接受的 archive_storage 记录为 tar、39,301,120 字节、9 个文件；包括上述 8 个运行文件与 helper 生成的 hosting 元数据。平台归档内容 hash 为 `sha256:6b92994a006240f0efcb4eea65a4fe8a6cbce84aa579252a4a1deb78700851b6`，与本地压缩文件 hash 的对象不同。

已核对归档列表：无原始笔记、`source/` Markdown、测试入口、验收证据、原工程源码、`.git/` 或凭据。源码同步仅包含发布 checkout 的静态快照与必要配置/说明。

生产 HTML/JS 未引用本地磁盘绝对路径、localhost、开发服务器、`/src`、`/tests`、`@vite/client` 或 sourcemap。图片与音频保留既有素材，未新增或改写。

## 4. 本地发布包浏览器检查

使用独立 origin `http://127.0.0.1:43845/`，由 Vite preview 直接提供发布目录中的 dist。该临时服务器在本轮结束时关闭；没有触碰用户原有开发服务器或其存档。

| 检查 | 结果 |
| --- | --- |
| 8 个运行文件 HTTP | 全部 200，MIME 与大小正确，见 [local-http.json](../../次元战争代码/.sites-deploy/records/local-http.json) |
| 主菜单 → 大地图 → 奶奶家面板 → 开始第一关 | 通过，真实按钮操作 |
| 彩绘地图、首场景文字、男高立绘 | 正常；立绘 naturalWidth 1024 |
| BGM | `homecoming.wav` readyState 4、paused false、audioState playing、无 media error；未以人耳听音作为证据 |
| 自动保存 → 刷新 → 继续 | 通过；从 p001 场景头恢复，saveStatus 为 saved |
| 本地 Web Locks / localStorage | 正常保存路径实际执行成功；原实现要求 `navigator.locks.request`，没有无锁写入降级 |
| 独立战斗 seed 42 | 真实进入调试场；点击移动、选 `(1,2)` 和 `(2,2)` 两个必经点，再点击确认 |
| 路线预算与执行 | 规划时角色仍在 `(0,2)`、移动力 30 尺、骰子 5 次；确认后逐步到 `(2,2)`、剩余 20 尺、骰子仍 5 次 |
| 路线与终点虚影 | 本地 Canvas 正常显示，见规划截图 |
| 本地控制台 | 本次菜单/首场景/调试移动未捕获 error；首场景背景缺绑定为原有占位 warning |

证据：[本地地图](../../次元战争代码/.sites-deploy/records/local-map.jpg)、[首场景](../../次元战争代码/.sites-deploy/records/local-story.jpg)、[移动规划](../../次元战争代码/.sites-deploy/records/local-movement-planning.jpg)、[实际路径与预算](../../次元战争代码/.sites-deploy/records/local-movement.json)、[刷新恢复与音频状态](../../次元战争代码/.sites-deploy/records/local-resume.json)、[剧情控制台](../../次元战争代码/.sites-deploy/records/local-console.json)、[调试场控制台](../../次元战争代码/.sites-deploy/records/local-debug-console.json)。

本轮没有在本地重新完整走完七关、161 段正文或两场战斗，未把历史验收当作本次浏览器验收。对应代码与测试原样保留，285 项回归检查已通过。

## 5. 正式域名验收与阻挡

部署后执行了真实 HTTPS 检查：

- 不附带 Cookie 或 Authorization 的独立 HTTP 客户端请求根页/入口和 8 个运行文件，均收到 403。
- 浏览器打开正式 URL，显示 `Attention Required! | Cloudflare`、`Sorry, you have been blocked`，未出现游戏页面。
- HTTP 检查 Ray ID：`a4e07ca51d4003ad-HKG`（2026-10-21 13:07:43 UTC）。
- 浏览器 Ray ID：`a4e07bd26bf061ec`。
- 后续 `get_site` 仍返回 active、public、版本 1、真实 current_live_url；站点未被标记 disabled。
- 近 30 分钟的生产 Worker 错误日志查询返回空数组，没有提供导致边缘封禁的规则信息。

证据：[匿名 HTTP 结果](../../次元战争代码/.sites-deploy/records/anonymous-http.json)、[响应摘要](../../次元战争代码/.sites-deploy/records/blocked-response.json)、[浏览器可见文字](../../次元战争代码/.sites-deploy/records/production-browser.txt)、[403 截图](../../次元战争代码/.sites-deploy/records/production-cloudflare-403.jpg)。响应 Cookie 不保存，HTML 中 IP 已隐去。

**这只能证明本次验证环境被 Cloudflare 拦截，不能据此断言所有网络都会失败，也不能断言其他访客已经可以玩。** 现有 Sites 工具没有解除该边缘封禁的操作。没有重建站点、重复发布相同版本、修改游戏代码、使用鉴权绕过令牌或降低安全设置来掩盖问题。

以下线上项目均为 **未验证**：

- 匿名直接进入游戏且无需 ChatGPT 登录。
- 正式域名主菜单、大地图、地点面板、剧情文字、立绘及音频。
- 正式战斗进入、路线/必经点/确认/虚影、战后 CALL 回流。
- 正式域名自动保存、刷新继续、HTTPS Web Locks 与 localStorage。
- 线上七关、25 个主场景、161 段正文和两场完整战斗。
- 游戏运行时控制台无新增未处理错误及资源无新增 404；边缘层 403 使这些检查无法开展。

需要由 Sites 平台侧诊断访问限制。向平台反馈时使用上面的正式域名、站点/版本/部署 ID、UTC 时间与 Ray ID，不提供源码写入凭据。边缘访问恢复后应沿用此站点和版本重新验收，无需重建游戏或创建新站点。

## 6. 配额与费用

本次归档上传、保存版本、public 设置及正式部署均被接受，没有出现额外付款或购买域名的步骤，也没有新增付费服务。工具未返回可核实的账户剩余配额、流量额度或收费金额，因此不猜测这些数值，不承诺无限或永久免费。

## 7. 更新同一站点

1. 在原游戏工程做需要的后续更改，并重新顺序通过 typecheck、test、build；本次部署不改变游戏代码。
2. 核对 `.sites-deploy/dimensional-war-game/.openai/hosting.json`，继续使用本记录的 project_id。不要重新创建站点，也不要在笔记库或原工程根初始化 Git。
3. 将新构建的完整 dist 同步到专用发布 checkout 的 dist，清除该副本内旧构建遗留文件前先核对目标绝对路径；保留 hosting 配置。
4. 使用 Sites 插件读取同一站点的访问范围，获取新的短期源码写入凭据。凭据仅保留在会话内存并经 helper 隐藏 stdin 传入。
5. 在发布 checkout 中运行官方 `scripts/site-workflow.mjs --project-id <上述真实 project_id>`。预构建产物检查已完成时传 `commands: []`，归档使用 `.sites-deploy/archives/` 下新的绝对路径；helper 管理提交与推送。
6. 将 helper 返回的真实 project_id、commit_sha、archive 原样用于 `save_site_version`，然后使用实际 version_id 调用 `deploy_site_version`。保持 public，不影响其他站点。
7. 只在 pending/building/publishing 时查询状态；终态 succeeded 后使用返回的真实 URL 验收并更新本记录。失败时查实际日志、复用同一站点和已保存版本。

可以直接在后续对话中要求：“使用 Sites 更新 `.sites-deploy/dimensional-war-game` 对应的现有站点，保留 public。”不需要手工保存任何令牌。

## 8. 回退

当前只有版本 1。本次以后需要回退时：

1. 使用本记录 project_id 调用 `list_site_versions`，从真实列表选择之前已验证且含归档的版本，并用 `get_site_version` 核对提交与产物。
2. 确认仍为本项目 public 站点后，将列表返回的准确 version_id 传给 `deploy_site_version`；不创建新站点，不伪造 ID，不重新上传与该提交不匹配的归档。
3. 等待明确成功后复验同一正式 URL，记录新的 deployment_id。回退到本次版本时使用本记录完整的 version_id。
4. 如未来存档格式发生变化，应先检查旧版本兼容性；部署回退本身不迁移或清除访客浏览器存档。

本地首发归档与准确提交均已保留，可用于核对，不应把其他源码状态打包后冒充此版本。

## 9. 存档范围

游戏继续使用浏览器本地 v1/v2 机制，本次没有增加云同步、导入或导出。

localhost、`127.0.0.1`、不同端口、平台正式域名及未来自定义域名分别拥有独立的浏览器存储。同一正式 origin 的后续部署继续使用该浏览器已有存档，不会因为代码部署而自动清空。本轮未清除用户开发域名或正式域名的存档；正式页面被阻挡，未加载游戏也未产生正式游戏保存。

## 10. 文件保护与实际变更

开工 SHA-256 快照覆盖原工程 283 个文件（排除依赖、构建目录、发布目录和 Git 内部数据）。复核结果：**283 个全部一致，修改 0、删除 0**。原文、三份剧情 JSON、导出器、自动问题清单、游戏代码、数值/地图/AI、存档格式、依赖配置及历史验收均未改写。未运行剧情导出命令。

见 [开工快照](../../次元战争代码/.sites-deploy/records/source-before.json)、[保护复核](../../次元战争代码/.sites-deploy/records/protection.json) 和 [逐文件变更清单](../../次元战争代码/.sites-deploy/records/file-changes.json)。

新增：

- 本文件 `docs/sites-deployment.md`。
- `.sites-deploy/dimensional-war-game/.openai/hosting.json`、`.gitignore`、`README.md`。
- `.sites-deploy/dimensional-war-game/dist/` 中上表 8 个运行文件的发布副本；没有新美术或音频。
- `.sites-deploy/dimensional-war-game/.git/`：官方 helper 创建的独立部署仓库内部数据，仅本地/源码服务使用，不进入静态归档。
- `.sites-deploy/archives/dimensional-war-game-v1.tar.gz`。
- `.sites-deploy/records/` 中检查日志、哈希、发布元数据、诊断、截图和逐文件清单。这里的文件均不上传到网站。

原工程 `dist/` 的 8 个文件由正常 build 重新生成；与发布副本逐一哈希匹配。未修改原工程 README、任务书或任何现有程序/脚本，未删除已有文件。
