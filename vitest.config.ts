import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['public-tests/**/*.test.ts'],
  },
});