import { describe, expect, it } from 'vitest';
import { readSeed } from '../game/battle/controller.js';

describe('调试入口 seed 解析', () => {
  it.each(['0', '42', '4294967295'])('合法 seed %s 不调用随机生成器', text => {
    const result = readSeed(text, () => { throw new Error('不应生成新 seed'); });
    expect(result).toEqual({ seed: Number(text) });
  });
  it.each(['', '-1', '1.2', 'NaN', '4294967296'])('非法 seed %s 生成并明确提示可复现值', text => {
    expect(readSeed(text, () => 123)).toEqual({ seed: 123, warning: `无效 seed ${text}；已生成可复现 seed=123` });
  });
  it('省略 seed 只在 IO 生成一次，仍返回可复现值', () => {
    let calls = 0;
    expect(readSeed(null, () => { calls++; return 42; })).toEqual({ seed: 42 });
    expect(calls).toBe(1);
  });
});
