# 男高五组合与现有工程的GitHub同步

日期：2026-10-23，Asia/Shanghai。

维护者在本地交付后明确授权更新GitHub、确保当前工程全部为最新版本。本次同步此前保留的分层框架修订、v3五个样板、美术母版、测试与验收资料；此前只本地交付的历史记录保留。

## 仓库与发布目标

- 仓库：[yeklongdi/dimensional-war-game-source](https://github.com/yeklongdi/dimensional-war-game-source)，既有公开仓库，未变更可见性。
- 分支：main。开工本地与origin/main均为cd9613a，无分叉。
- Pages：[正式游戏](https://yeklongdi.github.io/dimensional-war-game-source/)，复用现有Actions工作流，不创建或更新Sites。
- 发布内容仅为dist；source、文档、母版和测试在工程仓库中，不进入网站静态目录。

## 发布前检查

- GitHub CLI已登录现有账号，仓库管理权限与workflow发布源有效。
- 待同步582份有效工程文件共101,868,783字节；凭据特征及路径检查无命中，无单文件超过50MB。node_modules、dist、.env、密钥和历史发布工作目录均排除。
- 重新运行npm run typecheck、npm test、npm run build -- --base /dimensional-war-game-source/，全部通过，实际27个测试文件409项。
- 生产构建73模块；项目路径JS159.94kB、CSS18.06kB，Vite输出口径。
- 发布前文件清单与SHA位于verification/hero-samples-release/before.json，检查原始输出为同目录checks.log。原文、剧情JSON、导出器、战斗、地图和存档本次不改。

## 实际发布结果

- 功能提交：`da67aef77602d92a75fcc45eafaab994da484785`，正常推送main，无force push。该笔新增208份、修改15份、删除0份，包含上轮未提交框架及本轮样板、测试、母版与验收；与只统计五组合阶段的179新增／12修改是不同基准。
- 对应[Actions 39903115088](https://github.com/yeklongdi/dimensional-war-game-source/actions/runs/39903115088)实际completed／success，build与deploy两作业均success。GitHub的npm ci、类型检查、409项测试与生产构建均通过。完整结果为verification/hero-samples-release/actions-run.json及actions.log。
- 正式地址HTTPS匿名请求为200，无登录跳转；JS为`index-IDeKdHp1.js`，CSS为`index-Bpyc_DaU.css`，线上字节SHA均与本地dist一致。
- 33张v3运行PNG全部HTTP200、image/png，逐项SHA与本地登记一致；地图、原男高／怪盗PNG及两首WAV的HEAD均200。明细为online-assets.json。
- 实际浏览器刷新正式地址，脚本从旧`index-D0U3i-j7.js`切换为新`index-IDeKdHp1.js`，主菜单正常，无console error。原有P006检查点及保存时间提示前后相同，没有清档；截图live-menu.jpg，记录browser-live.json。
- 本次没有在线重新游玩七关／两战，也没有覆盖原正式存档来强行展示P001。五样板视觉与正常剧情本地证据继续见hero-visual-samples-verification.md，不能把HTTP检查当作线上全流程实测。
- 相对同步前582份有效文件，本次579份内容SHA一致，仅README、任务书及决策新增同步说明；核对结果为content-protection.json。剧情、规则、配置、素材和依赖没有在发布时二次修改。

本记录及发布回执随后以单独文档提交正常推送；该提交不改运行代码，仍触发并检查同一Actions工作流。最终本地HEAD、origin/main和GitHub默认分支的逐文件一致性在交付前再核对。

## 维护与范围

后续仍在同一工程正常提交并推送main；既有工作流执行npm ci、类型检查、测试、项目路径构建和Pages发布。检查对应提交的Actions成功后再验证正式地址。不得force push或用旧版本覆盖远端历史。

本次系统Git凭据管理器没有完成认证，第一笔上传未改变远端；随后使用已登录GitHub CLI的官方凭据helper成功推送，没有将密钥写入工程或日志。需要复用时可运行`git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main`，无需在聊天或源码中提供令牌。

本次发布准备新增本文件及verification/hero-samples-release证据目录，修改README、任务书及决策日志，删除0。保留之前所有未提交的工程成果并已随功能提交上传；工程外策划说明没有移动到仓库，也没有上传目录外笔记。

本轮不清理任何正式站存档。已完成关仍不可重玩；要查看新P001素材可使用另一浏览器资料或无已有档的浏览器窗口。localhost和正式站是不同origin，存档不自动迁移或跨设备同步。本次不增加云存档。

没有为同步重做剧情或游戏规则，工程外策划说明保留在笔记库原位置；不上传整个笔记库。此前独立验收里的七关／两战范围不扩大为本轮线上实测。
