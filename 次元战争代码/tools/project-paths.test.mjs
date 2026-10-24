import { describe, it, expect } from 'vitest';
import nativePath from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { codeRoot, repositoryRoot, documentationRoot, resolve } from './project-paths.mjs';

describe('工程与说明分区的路径兼容', () => {
  it('旧工程文档和验收证据解析到说明区，源码仍在代码区', () => {
    expect(resolve(codeRoot, 'docs/open-questions.md')).toBe(nativePath.join(documentationRoot, 'open-questions.md'));
    expect(resolve(repositoryRoot, '游戏文件/docs/01-任务书.md')).toBe(nativePath.join(documentationRoot, '01-任务书.md'));
    expect(resolve(codeRoot, 'src/content/prologue-v2/prologue.json')).toBe(nativePath.join(codeRoot, 'src/content/prologue-v2/prologue.json'));
    expect(existsSync(resolve(codeRoot, 'docs/verification/m2/rule-replays.json'))).toBe(true);
  });
  it('不重定向项目外部文件，正文和原始媒体使用新的唯一位置', () => {
    const outside = nativePath.resolve(repositoryRoot, '..', '外部文件.md');
    expect(resolve(outside)).toBe(outside);
    expect(resolve(repositoryRoot, '剧情/序幕')).toBe(nativePath.join(repositoryRoot, '游戏说明/剧情/序幕'));
    expect(resolve(repositoryRoot, '地图')).toBe(nativePath.join(codeRoot, '素材原件/地图'));
  });
  it('四份可移植来源路径可读取，正式副本保持原SHA而不自动覆盖原稿', () => {
    const manifest = JSON.parse(readFileSync(nativePath.join(codeRoot, 'source/story/prologue-v2/manifest.json'), 'utf8'));
    expect(manifest.files).toHaveLength(4);
    for (const file of manifest.files) {
      const original = readFileSync(resolve(codeRoot, file.from));
      const snapshot = readFileSync(resolve(codeRoot, file.sourceFile));
      expect(nativePath.relative(repositoryRoot, resolve(codeRoot, file.from)).replaceAll('\\', '/').startsWith('游戏说明/剧情/')).toBe(true);
      expect(original.length).toBeGreaterThan(0);
      expect(createHash('sha256').update(snapshot).digest('hex')).toBe(file.sha256);
    }
  });
});
