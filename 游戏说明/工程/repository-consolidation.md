# 单仓库工程与网站部署

日期：2026-10-22，Asia/Shanghai。

## 当前维护位置

- 唯一主仓库：<https://github.com/yeklongdi/dimensional-war-game-source>。
- 正式网站：<https://yeklongdi.github.io/dimensional-war-game-source/>。
- 本地正式工程：`E:\笔记\次元战争设定\游戏文件`。

维护者要求将完整正式工程统一到原公开源码仓库，按本地当前文件上传与部署，并在验证成功后删除 `dimensional-war-game` 和 `dimensional-war-game-pages`。本次按后续要求不创建本地备份。

## 文件基准与范围

迁移以本地当前正式工程为准，包含尚未提交的对话窗口、分层立绘程序、候选素材及其测试和验收资料。没有用旧线上版本或中性示例覆盖正式工程。原公开示例快照保留在既有 Git 提交历史中，默认分支切换为完整正式游戏。

迁移前正式工程共有349个受版本控制或待提交的有效文件，合计59,492,282字节。排除 `.git`、`node_modules`、`dist`、本地临时部署目录与已忽略的缓存或凭据。迁移不改写 `source/`、剧情 JSON、游戏程序、数值、测试或媒体；只修改当前仓库说明和部署工作流，并补充贡献、许可和本说明。

四份原文、正式内容和当前程序按 SHA-256 比对迁移前后的字节；上传后再比对 Git 提交树与本地文件。分层男高视觉样板仍未通过，正式剧情继续沿用原静态回退。原验收记录中的阶段性事实不改写。

本地验证结果：类型检查通过，22个测试文件、330项测试全部通过；按新项目路径生产构建通过，70个模块。迁移前349个文件中，347个SHA-256不变，仅更新 `README.md` 和 `.github/workflows/build-game.yml`；新增 `LICENSE`、`CONTRIBUTING.md`、`THIRD_PARTY_NOTICES.md` 和本文件，最终工程353个文件。没有删除既有本地工程文件，没有创建本地备份。当前文件与既有提交的凭据特征检查没有命中。

## 后续发布

1. 在正式工程修改并提交代码，正常推送 `main` 到本仓库。
2. `.github/workflows/build-game.yml` 安装锁定依赖、执行类型检查和全部测试，再以 `/dimensional-war-game-source/` 为 base 构建。
3. 工作流只上传 `dist/` 作为 Pages artifact，检查成功后由 deploy 作业发布同一个网站。工程原文和文档存在 GitHub 仓库中，不进入网站静态目录。
4. Pull Request 执行相同检查和构建，不部署。无需旧仓库或跨仓库凭据，也不依赖旧 `PUBLIC_PAGES_BASE_PATH` 变量。

本地复现：

```sh
npm ci
npm run typecheck
npm test
npm run build -- --base /dimensional-war-game-source/
```

`npm run dev` 继续使用根路径，无需新增 Vite 配置。旧 Pages 地址在旧仓库删除后不再使用；更新收藏为本页正式网站链接。新旧页面同属 `https://yeklongdi.github.io`，当前存档键和格式保持原样，迁移不清理浏览器存档。

程序许可与游戏资源许可分别见 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`。源码公开不会自动改变素材许可。
