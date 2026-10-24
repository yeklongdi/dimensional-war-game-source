import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// 开发验收页与测试读取说明区证据；不开放仓库根部的本机编辑器配置。
export default defineConfig({
  server: {
    fs: {
      allow: [fileURLToPath(new URL('.', import.meta.url)), fileURLToPath(new URL('../游戏说明', import.meta.url))],
    },
  },
});
