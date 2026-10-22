# 第三方代码与资源说明

本仓库不 vendoring 第三方运行时代码，也不分发第三方图片、音乐或字体。依赖仅由 package.json / package-lock.json 声明并通过 npm 安装；每个 npm 包继续适用其上游许可证，未被本仓库的 MIT 声明重新许可。

GitHub Actions 工作流调用 GitHub 官方维护的 checkout 与 setup-node actions，并以完整提交 SHA 固定版本；它们的源代码及许可证仍归各自上游项目。本仓库没有复制这些 action 的实现代码。