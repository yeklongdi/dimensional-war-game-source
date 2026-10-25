import { describe, expect, it } from 'vitest';
import { ImageCache } from '../game/visual/image-cache.js';
import { BackgroundLoader } from '../game/visual/background-loading.js';
import type { BackgroundFrame, BackgroundInput } from '../game/visual/background-loading.js';
import { sceneImageUrls, StoryImageWarmup } from '../game/visual/story-images.js';
import { emptyState } from '../game/state.js';
import { storyLibrary } from '../game/story/library.js';
import { resumeScene } from '../game/story/restore.js';
import { heroRecipes } from '../game/visual/hero.js';
import { backgroundBindings } from '../game/story/backgrounds.js';

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let index = 0; index < 16; ++index) await Promise.resolve(); };
const input = (id: string, sceneId = 'p001', run = 1): BackgroundInput => ({ run, actId: 'prologue', sceneId, id, url: id });

describe('快速推进的图片缓存与同步交付', () => {
  it('同图从在途到已解码均共享，视图重建可立即读取，不因连点重新解码', async () => {
    const pending = deferred<string>(), calls: string[] = [];
    const cache = new ImageCache(url => { calls.push(url); return pending.promise; });
    const first = cache.load('house');
    for (let i = 0; i < 30; ++i) expect(cache.load('house')).toBe(first);
    expect(cache.peek('house')).toBeUndefined(); pending.resolve('decoded'); await first;
    expect(cache.peek('house')).toBe('decoded'); expect(calls).toEqual(['house']);
    const frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(cache.load, frame => frames.push(frame), cache.peek);
    loader.update(input('house', 'p001', 8));
    expect(frames).toEqual([{ status: 'ready', id: 'house', image: 'decoded' }]);
  });
  it('失败结果可重试；缓存淘汰不妨碍正在加载的图片最终交付', async () => {
    let fail = true;
    const cache = new ImageCache(async (url: string) => { if (fail) throw new Error('404'); return url; }, 2);
    await expect(cache.load('bad')).rejects.toThrow('404');
    fail = false; await expect(cache.load('bad')).resolves.toBe('bad');
    await cache.load('next'); cache.peek('bad'); await cache.load('third');
    expect(cache.peek('next')).toBeUndefined(); expect(cache.peek('bad')).toBe('bad');
  });
  it('释放缓存不交付旧画面，也不能再发新请求', async () => {
    const pending = deferred<string>(), cache = new ImageCache(() => pending.promise);
    const request = cache.load('old'); cache.dispose(); pending.resolve('late'); await request;
    expect(cache.peek('old')).toBeUndefined(); await expect(cache.load('new')).rejects.toThrow('已释放');
  });
  it('同背景跨场景不发loading、不清屏；仍在途时接受最新同图等待', async () => {
    const pending = deferred<string>(), frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(() => pending.promise, frame => frames.push(frame));
    loader.update(input('same')); loader.update(input('same', 'p002'));
    expect(frames).toEqual([{ status: 'loading', id: 'same' }]);
    pending.resolve('decoded'); await flush();
    loader.update(input('same', 'p003'));
    expect(frames).toEqual([{ status: 'loading', id: 'same' }, { status: 'ready', id: 'same', image: 'decoded' }]);
  });
  it('往返到缓存图立即交付，晚到的新地点不能覆盖；释放后成功失败都无效', async () => {
    const pending = deferred<string>(), frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(url => url === 'slow' ? pending.promise : Promise.resolve(url), frame => frames.push(frame));
    loader.update(input('home')); await flush(); loader.update(input('slow'));
    loader.update(input('home', 'p002'));
    expect(frames.at(-1)).toEqual({ status: 'ready', id: 'home', image: 'home' });
    pending.resolve('outdated'); await flush();
    expect(frames.at(-1)).toEqual({ status: 'ready', id: 'home', image: 'home' });
    loader.dispose(); loader.update(input('other')); expect(frames.at(-1)?.id).toBe('home');
  });
});

describe('只读场景图片预热', () => {
  it('P001预热真实背景、完整行李图层和下一场背景，不改变任何剧情状态', () => {
    const state = resumeScene(emptyState(), storyLibrary, 'prologue', 'p001', 2).state;
    const before = JSON.stringify(state), urls = sceneImageUrls(state, storyLibrary);
    expect(urls).toContain(backgroundBindings.bg_grandmother_house_dusk);
    expect(urls).toContain(backgroundBindings.bg_grandmother_house_entrance);
    for (const layer of heroRecipes[2]!.layers) for (const url of layer.frames) expect(urls).toContain(url);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('菜单可预热首场，逐字变化不重预热；预取失败不阻断游戏或写入状态', async () => {
    const state = emptyState(); state.screen = 'menu'; const before = JSON.stringify(state);
    const urls: string[] = [], warmup = new StoryImageWarmup(async (url: string) => { urls.push(url); throw new Error('预取失败'); });
    warmup.update(state, storyLibrary); const count = urls.length;
    warmup.update({ ...state, sequence: 20 }, storyLibrary); await flush();
    expect(count).toBeGreaterThan(0); expect(urls).toHaveLength(count);
    expect(JSON.stringify(state)).toBe(before);
  });
});
