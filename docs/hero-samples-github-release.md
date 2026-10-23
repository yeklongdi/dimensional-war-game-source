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

代码已完成本地检查，提交、Actions和线上结果将在实际完成后补齐；不以预期地址代替成功状态。

## 维护与范围

后续仍在同一工程正常提交并推送main；既有工作流执行npm ci、类型检查、测试、项目路径构建和Pages发布。检查对应提交的Actions成功后再验证正式地址。不得force push或用旧版本覆盖远端历史。

本轮不清理任何正式站存档。已完成关仍不可重玩；要查看新P001素材可使用另一浏览器资料或无已有档的浏览器窗口。localhost和正式站是不同origin，存档不自动迁移或跨设备同步。本次不增加云存档。

没有为同步重做剧情或游戏规则，工程外策划说明保留在笔记库原位置；不上传整个笔记库。此前独立验收里的七关／两战范围不扩大为本轮线上实测。
