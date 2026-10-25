import { describe, expect, it } from 'vitest';
import { rawBackgroundBindings, backgroundBindings } from '../game/story/backgrounds.js';
import { assetBindings } from '../game/asset-url.js';
import { BackgroundLoader } from '../game/visual/background-loading.js';
import type { BackgroundFrame, BackgroundInput } from '../game/visual/background-loading.js';
import { storyLibrary } from '../game/story/library.js';
import { emptyState } from '../game/state.js';
import { resumeScene } from '../game/story/restore.js';
import { reduceGame } from '../game/story/player.js';

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let i = 0; i < 12; ++i) await Promise.resolve(); };
const input = (id: string, sceneId = 'p001', run = 1): BackgroundInput => ({ run, sceneId, actId: 'prologue', id, url: id });

describe('手绘背景覆盖与路径', () => {
  it('36个真实键全部绑定，63条指令及52个场景不删改', () => {
    const acts = Object.values(storyLibrary), scenes = acts.flatMap(a => a.scenes);
    const nodes = scenes.flatMap(s => s.nodes.flatMap(n => n.kind === 'background' ? [n.name] : []));
    expect(scenes).toHaveLength(52); expect(nodes).toHaveLength(63);
    expect(Object.keys(rawBackgroundBindings).sort()).toEqual([...new Set(nodes)].sort());
    expect(Object.keys(rawBackgroundBindings)).toHaveLength(36);
    expect(new Set(Object.values(rawBackgroundBindings)).size).toBe(34);
  });
  it('卧室及客厅夜景仅按明确异名复用，昼夜与梦境仍不同', () => {
    expect(rawBackgroundBindings.bg_grandmother_bedroom_night).toBe(rawBackgroundBindings.bg_grandmother_house_bedroom_night);
    expect(rawBackgroundBindings.bg_grandmother_living_room_night).toBe(rawBackgroundBindings.bg_grandmother_house_living_room_night);
    const distinct = ['bg_grandmother_dining_evening', 'bg_dream_dining_fog', 'bg_dream_house_loop', 'bg_dream_house_fracture',
      'bg_grandmother_house_bedroom', 'bg_grandmother_house_bedroom_night', 'bg_grandmother_house_bedroom_morning'];
    expect(new Set(distinct.map(key => rawBackgroundBindings[key])).size).toBe(distinct.length);
  });
  it('根路径与正式项目子路径都经同一assetBindings处理', () => {
    expect(backgroundBindings).toEqual(assetBindings(rawBackgroundBindings));
    for (const base of ['/', '/dimensional-war-game-source/']) {
      const bound = assetBindings(rawBackgroundBindings, base);
      for (const [id, path] of Object.entries(rawBackgroundBindings)) expect(bound[id]).toBe(base + path.slice(1));
    }
  });
});

describe('真实背景解码接口的租期与回退', () => {
  it('解码前为当前渐变，不提前交付旧地点；成功才交付图像', async () => {
    const pending = deferred<string>(), frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(() => pending.promise, frame => frames.push(frame));
    loader.update(input('house')); expect(frames).toEqual([{ status: 'loading', id: 'house' }]);
    pending.resolve('decoded'); await flush(); expect(frames.at(-1)).toEqual({ status: 'ready', id: 'house', image: 'decoded' });
    loader.update(input('classroom')); expect(frames.at(-1)).toEqual({ status: 'loading', id: 'classroom' });
  });
  it('逐字／菜单刷新不重载；往返切镜复用已解码图片', async () => {
    const calls: string[] = [], frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(async url => { calls.push(url); return url; }, f => frames.push(f));
    for (let i = 0; i < 20; ++i) loader.update(input('bedroom'));
    await flush(); loader.update(input('street')); await flush(); loader.update(input('bedroom')); await flush();
    expect(calls).toEqual(['bedroom', 'street']);
    expect(frames.filter(f => f.status === 'ready').map(f => f.id)).toEqual(['bedroom', 'street', 'bedroom']);
  });
  it.each(['resolve', 'reject'] as const)('快切后旧%s不覆盖新画面或产生过期诊断', async method => {
    const old = deferred<string>(), frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(url => url === 'old' ? old.promise : Promise.resolve(url), f => frames.push(f));
    loader.update(input('old')); await flush(); loader.update(input('current')); await flush();
    old[method]('late'); await flush();
    expect(frames.at(-1)).toEqual({ status: 'ready', id: 'current', image: 'current' });
    expect(frames.filter(f => f.status === 'failed')).toEqual([]);
  });
  it('未绑定的新背景也撤销旧租期，保持当前渐变', async () => {
    const old = deferred<string>(), frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(() => old.promise, f => frames.push(f));
    loader.update(input('old')); await flush(); loader.update({ ...input('missing'), url: undefined });
    old.resolve('late'); await flush(); expect(frames.at(-1)).toEqual({ status: 'missing', id: 'missing' });
  });
  it('404或解码失败只交付当前失败；新场景可重试而非永久封锁', async () => {
    let failing = true; const frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(async url => { if (failing) throw new Error('decode'); return url; }, f => frames.push(f));
    loader.update(input('image')); await flush();
    for (let i = 0; i < 20; ++i) loader.update(input('image'));
    expect(frames.filter(f => f.status === 'failed')).toHaveLength(1);
    failing = false; loader.update(input('image', 'p002')); await flush();
    expect(frames.at(-1)).toEqual({ status: 'ready', id: 'image', image: 'image' });
  });
  it.each(['resolve', 'reject'] as const)('离开／读档新会话后旧%s无效', async method => {
    const pending = deferred<string>(), frames: BackgroundFrame<string>[] = [];
    const loader = new BackgroundLoader(() => pending.promise, f => frames.push(f));
    loader.update(input('image')); await flush(); loader.dispose();
    pending[method]('old'); await flush(); loader.update(input('new', 'p001', 2));
    expect(frames).toEqual([{ status: 'loading', id: 'image' }]);
  });
  it('加载期间不修改输入归属', async () => {
    const request = Object.freeze(input('image')), snapshot = JSON.stringify(request);
    const loader = new BackgroundLoader(async url => url, () => {});
    loader.update(request); await flush();
    expect(JSON.stringify(request)).toBe(snapshot);
  });
  it('真实诊断动作只记录警告，不推进正文或改flags／RNG／检查点', async () => {
    let state = resumeScene(emptyState(), storyLibrary, 'prologue', 'p001', 4).state;
    const before = structuredClone(state);
    const loader = new BackgroundLoader(async () => { throw new Error('bad'); }, frame => {
      if (frame.status === 'failed') state = reduceGame(state, { type: 'warning', key: 'background:bad', message: frame.message }, storyLibrary).state;
    });
    loader.update(input('bad')); await flush();
    expect(state.warnings['background:bad']).toContain('加载或解码失败');
    const { warnings: _warnings, ...after } = state;
    const { warnings: _oldWarnings, ...previous } = before;
    expect(after).toEqual(previous);
  });
});

describe('现有播放器的场内BACKGROUND往返顺序', () => {
  const cases = [
    ['prologue', 'p004', ['bg_grandmother_house_bedroom', 'bg_grandmother_house_kitchen_night']],
    ['prologue', 'p009', ['bg_grandmother_house_bedroom_night', 'bg_school_underground_dark']],
    ['act1', 'a008', ['bg_school_library_day', 'bg_school_cafeteria_day', 'bg_school_gym_day']],
    ['prologue_3', 'b006', ['bg_dream_house_loop', 'bg_grandmother_bedroom_night', 'bg_dream_house_loop']],
    ['prologue_4', 'c001', ['bg_grandmother_bedroom_night', 'bg_old_residential_search_night', 'bg_grandmother_bedroom_night']],
    ['prologue_4', 'c008', ['bg_old_district_battle_street_night', 'bg_old_district_escape_alley_night']],
    ['prologue_4', 'c013', ['bg_grandmother_house_entrance_night', 'bg_grandmother_living_room_night', 'bg_grandmother_bedroom_night']],
  ] as const;
  it.each(cases)('%s/%s恢复及正文推进沿原指令切图', (actId, sceneId, expected) => {
    const base = emptyState(); base.flags = { has_master_sword: true, link_summoned: true, prologue_3_complete: true };
    let state = resumeScene(base, storyLibrary, actId, sceneId, 4).state;
    const observed: string[] = [];
    for (let i = 0; i < 400 && state.sceneId === sceneId; ++i) {
      if (observed.at(-1) !== state.backgroundId) observed.push(state.backgroundId);
      const w = state.waiting;
      if (w?.kind !== 'text') break;
      state = reduceGame(state, { type: 'advance', token: w.token }, storyLibrary).state;
    }
    expect(observed).toEqual(expected);
  });
});
