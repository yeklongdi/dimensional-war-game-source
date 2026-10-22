# 贡献说明

本仓库包含《次元战争》的完整 Web 垂直切片工程。开发环境使用 Node.js 24 与 npm。

提交程序修改前执行：

```sh
npm ci
npm run typecheck
npm test
npm run build -- --base /dimensional-war-game-source/
```

保持 TypeScript strict、规则与界面分离，不引入运行时依赖，不削弱现有测试。`source/` 是原始剧本和资料的只读副本；剧情与设定改动需先由维护者确认，不凭程序实现需要补写内容。

请在 Pull Request 中说明问题、修改后的行为及实际验证结果。图片、音乐、字体和第三方代码须保留来源、许可及所需署名。程序使用 MIT，正式内容和资源的范围见 `THIRD_PARTY_NOTICES.md`；请勿把公开仓库中的所有文件都视为 MIT 素材。

不要提交密码、令牌、Cookie、私钥、依赖目录、临时部署目录或其他项目的个人资料。
