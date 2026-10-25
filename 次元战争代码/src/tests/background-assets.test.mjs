import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { rawBackgroundBindings } from '../game/story/backgrounds.js';

describe('背景运行文件和批准原件', () => {
  it('运行WebP真实存在且单张小于1MiB', () => {
    for (const url of new Set(Object.values(rawBackgroundBindings))) {
      const path = new URL(`../../public${url}`, import.meta.url);
      expect(existsSync(path)).toBe(true);
      const bytes = readFileSync(path);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
      expect(bytes.length).toBeLessThan(1048576);
    }
  });
  it('三张用户批准裁切图原字节保持不变', () => {
    const expected = {
      bg_grandmother_house_dusk: '4dd2c32e0d881a9fab24c73ce77f52af3724df4ffd49f2d6fd4b3d7fd2d5a7f1',
      bg_school_classroom_day: '4666839be50ea1196d56af8c8b0682d5115fa0329d6d22093141ff85f8f80391',
      bg_old_district_quiet_alley_night: 'ae475000b9f7c1fcd38c6b74e074bc009afaf026b404867c9bffcea6692b65de',
    };
    for (const [key, sha] of Object.entries(expected)) {
      const path = new URL(`../../art/backgrounds/galgame-v1/${key}_candidate_v001_16x9.png`, import.meta.url);
      expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(sha);
    }
  });
});
