import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSettingsStore, defaults, readSettings, settingsKey } from '../game/settings.js';
import { memory } from './map-save-helpers.js';
import { AudioController } from '../game/audio.js';

vi.mock('../game/story/config.js', () => ({ bgmBindings: { one: '/one.wav', two: '/two.wav' }, sfxBindings: { effect: '/effect.wav' } }));
describe('设置独立校验与故障', () => {
  it('默认五档基准，不因查看而写盘', () => {
    const m = memory('旧v2', '旧v1'), store = createSettingsStore(m.storage);
    expect(store.read()).toEqual({ data: defaults, message: '' }); expect(m.writes).toEqual([]);
  });
  it.each([null, {}, { ...defaults, version: 2 }, { ...defaults, bgm: 101 }, { ...defaults, bgm: -1 }, { ...defaults, sfx: 3.5 }, { ...defaults, textMs: 5 }, { ...defaults, extra: true }])('损坏值%j采用默认并提示', value => {
    expect(readSettings(JSON.stringify(value))).toMatchObject({ data: defaults }); expect(readSettings(JSON.stringify(value)).message).toContain('损坏');
  });
  it('设置读写失败准确提示，不接触游戏档', () => {
    const m = memory('旧v2', '旧v1'), original = new Map(m.values);
    const store = createSettingsStore({ getItem() { throw new Error('拒绝'); }, setItem() { throw new Error('满'); } });
    expect(store.read().message).toContain('无法读取'); expect(store.write({ ...defaults, bgm: 0 })).toContain('未持久保存'); expect(m.values).toEqual(original);
  });
  it('设置成功仅写独立键，刷新读取值保持', () => {
    const m = memory('原v2', '原v1'), store = createSettingsStore(m.storage), data = { ...defaults, bgm: 0, sfx: 23, textMs: 100 };
    expect(store.write(data)).toBe(''); expect(m.writes).toEqual([settingsKey]); expect(createSettingsStore(m.storage).read().data).toEqual(data);
  });
});

class FakeAudio {
  paused = true; volume = 0; src = ''; loop = false; preload = ''; onerror: (() => void) | null = null;
  dataset: Record<string, string> = {};
  getAttribute(name: string) { return name === 'src' ? this.src || null : null; }
  removeAttribute(name: string) { if (name === 'src') this.src = ''; }
  load() {} remove() {} addEventListener() {}
  pause() { this.paused = true; }
  async play() { this.paused = false; }
}
describe('用户音量和淡入淡出包络分离', () => {
  let bgm: FakeAudio, sounds: FakeAudio[], frames: FrameRequestCallback[], time: number;
  beforeEach(() => {
    bgm = new FakeAudio(); sounds = []; frames = []; time = 0;
    vi.stubGlobal('document', { createElement: () => bgm });
    vi.stubGlobal('Audio', class extends FakeAudio { constructor() { super(); sounds.push(this); } });
    vi.stubGlobal('performance', { now: () => time });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
  });
  afterEach(() => vi.unstubAllGlobals());
  async function tick(now: number) { for (let i = 0; i < 5; i++) await Promise.resolve(); time = now;
    for (const callback of frames.splice(0)) callback(time); for (let i = 0; i < 5; i++) await Promise.resolve(); }
  it('调整当前音量后换曲不恢复硬编码65%', async () => {
    const audio = new AudioController(() => {}); audio.unlock(); audio.setBgm('one'); await tick(500); expect(bgm.volume).toBeCloseTo(.65);
    audio.setSettings({ ...defaults, bgm: 20 }); expect(bgm.volume).toBeCloseTo(.2);
    audio.setBgm('two'); await tick(1000); await tick(1500); expect(bgm.src).toBe('/two.wav'); expect(bgm.volume).toBeCloseTo(.2);
  });
  it('淡入中静音，换曲和会话重建后仍为0，恢复音量采用当前包络', async () => {
    const audio = new AudioController(() => {}); audio.unlock(); audio.setBgm('one'); audio.setSettings({ ...defaults, bgm: 0 });
    await tick(250); await tick(750); expect(bgm.volume).toBe(0);
    audio.resetSession(); audio.setBgm('two'); await tick(1250); expect(bgm.volume).toBe(0);
    audio.setSettings({ ...defaults, bgm: 45 }); expect(bgm.volume).toBeCloseTo(.45);
  });
  it('音效音量作用于当前和后续实例，缺绑定不会创建声音', () => {
    const audio = new AudioController(() => {}); audio.unlock(); audio.playSfx('effect'); expect(sounds).toHaveLength(1); expect(sounds[0]!.volume).toBe(1);
    audio.setSettings({ ...defaults, sfx: 30 }); expect(sounds[0]!.volume).toBe(.3); audio.playSfx('effect'); expect(sounds[1]!.volume).toBe(.3);
    audio.playSfx('missing'); expect(sounds).toHaveLength(2); audio.dispose(); expect(sounds.every(s => s.paused)).toBe(true);
  });
  it('释放后旧淡入回调不恢复音频', async () => {
    const audio = new AudioController(() => {}); audio.unlock(); audio.setBgm('one'); await tick(200); audio.dispose(); await tick(1000);
    expect(bgm.paused).toBe(true); expect(bgm.src).toBe('');
  });
});
