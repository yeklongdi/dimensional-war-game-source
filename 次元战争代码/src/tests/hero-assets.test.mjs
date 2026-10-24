import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { inspectPng } from '../../tools/inspect-hero-png.mjs';

// 纯Node资源检查采用mjs，不为资产验收新增@types/node或运行时依赖。
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url));
const registration = JSON.parse(read('public/assets/portraits/hero-layered-v3/registration.json'));
describe('实际全画布透明与坐标登记', () => {
  it.each(registration.layers)('$file 全图无半透明光晕，非四角抽查', entry => {
    const bytes = read(entry.file), actual = inspectPng(bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);
    expect([actual.width, actual.height]).toEqual([1024, 1536]);
    expect(actual.nonzero).toBeGreaterThan(0); expect(actual.partial).toBe(0); expect(actual.outsideRgb).toBe(0);
    expect(actual.bounds).toEqual(entry.bounds); expect(entry.cropOffset).toEqual([0, 0]);
  });
});
