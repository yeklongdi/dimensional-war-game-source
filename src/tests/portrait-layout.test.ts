import { describe, expect, it } from 'vitest';
import { emptyState } from '../game/state.js';
import type { ActorState, TextWait } from '../game/state.js';
import { planPortraits, portraitCenters } from '../game/visual/portrait-layout.js';
import type { PortraitLayoutInput } from '../game/visual/portrait-layout.js';
import { portraitEntries } from '../game/visual/entrances.js';
import { storyLibrary } from '../game/story/library.js';
import { resumeScene } from '../game/story/restore.js';
import { reduceGame } from '../game/story/player.js';
import { DisplayTransition } from '../game/visual/display-transition.js';
import type { DisplaySlot } from '../game/visual/display-transition.js';

const person = (actor: string, position = 'center'): ActorState => ({ actor, position, visible: true });
const wait = (speaker: string, token = 'one', textKind: TextWait['textKind'] = 'dialogue'): TextWait =>
  ({ kind: 'text', token, origin: { nodeIndex: 0 }, textKind, speaker, text: '测试文本', revealed: 1 });
const input = (names = ['甲', '乙', '丙', '丁']): PortraitLayoutInput => ({ run: 1, actId: 'lab', sceneId: 'one',
  actors: names.map(name => person(name)), entries: names, waiting: null });

describe('集中临时展示名单与全局排位', () => {
  it.each([0, 1, 2, 3, 4, 7])('%i人只选最多三人；中心为确认坐标', count => {
    const state = input(Array.from({ length: count }, (_, n) => String(n)));
    const layout = planPortraits(state);
    expect(layout.slots).toHaveLength(Math.min(3, count));
    expect(portraitCenters(layout.slots.length)).toEqual([[], [640], [384, 896], [256, 640, 1024]][Math.min(3, count)]);
  });
  it('先选优先名单，再按原左右语义排位；不按对象枚举或固定五槽定位', () => {
    const state = { ...input(['金发青年', '蒙面人', '男高', '女剑士']), actId: 'prologue_4', sceneId: 'c009' };
    state.actors = [person('金发青年'), person('蒙面人', 'right'), person('男高', 'left'), person('女剑士')];
    expect(planPortraits(state).slots).toEqual(['男高', '女剑士', '蒙面人']);
  });
  it('正式对白换入未展示的在场人，接替最久未发言者，其余槽不动且不会自动换回', () => {
    const state = input(); let layout = planPortraits(state);
    layout = planPortraits({ ...state, waiting: wait('甲') }, layout);
    layout = planPortraits({ ...state, waiting: wait('丙', 'two') }, layout);
    const next = planPortraits({ ...state, waiting: wait('丁', 'three') }, layout);
    expect(next.slots).toEqual(['甲', '丁', '丙']);
    expect(planPortraits({ ...state, waiting: wait('甲', 'four') }, next).slots).toEqual(next.slots);
    expect(planPortraits({ ...state, waiting: null }, next).slots).toEqual(next.slots);
  });
  it('从未发言者先换，再按较低优先级及入场顺序稳定决定，男高无常驻特权', () => {
    const state = { ...input(['男高', '女剑士', '怪盗', '金发青年']), actId: 'prologue_4', sceneId: 'c010' };
    let layout = planPortraits(state);
    layout = planPortraits({ ...state, waiting: wait('金发青年') }, layout);
    expect(layout.slots).toEqual(['男高', '女剑士', '金发青年']);
    layout = planPortraits({ ...state, waiting: wait('女剑士', 'two') }, layout);
    layout = planPortraits({ ...state, waiting: wait('怪盗', 'three') }, layout);
    expect(layout.slots).not.toContain('男高');
  });
  it('逐字与同一正文token只登记一次，表情／方位差量不重排', () => {
    const state = { ...input(), waiting: wait('甲') }, layout = planPortraits(state);
    const next = planPortraits({ ...state, actors: state.actors.map(a => ({ ...a, expression: '疑惑', position: 'right' })),
      waiting: { ...state.waiting, revealed: 4 } }, layout);
    expect(next).toEqual(layout);
  });
  it.each(['inner', 'narration', 'stage'] as const)('%s不强制换人或登记发言', textKind => {
    const state = input(), before = planPortraits(state);
    expect(planPortraits({ ...state, waiting: wait('丁', 'two', textKind) }, before)).toEqual(before);
  });
  it('场外对白与道具不显示，不占名额；原占位参与排位', () => {
    const state = input(); state.actors = [...state.actors, { ...person('剑'), asset: 'prop_sword' }];
    const before = planPortraits(state);
    expect(planPortraits({ ...state, waiting: wait('剑') }, before).slots).toEqual(before.slots);
    expect(planPortraits({ ...state, waiting: wait('场外') }, before).slots).toEqual(before.slots);
    expect(before.slots).toContain('甲');
  });
  it('选择等待保持名单；HIDE有候补在原槽补，无候补才减少并重排', () => {
    const state = input(), layout = planPortraits(state);
    expect(planPortraits({ ...state, actors: state.actors.map(a => a.actor === '乙' ? { ...a, visible: false } : a) }, layout).slots).toEqual(['甲', '丁', '丙']);
    expect(planPortraits({ ...state, actors: state.actors.slice(0, 2) }, layout).slots).toEqual(['甲', '乙']);
    const choice = { kind: 'choice' as const, token: 'choice', origin: { nodeIndex: 0 }, choiceNodeIndex: 0, options: [], prompt: '' };
    expect(planPortraits({ ...state, waiting: choice }, layout).slots).toEqual(layout.slots);
  });
  it('满员时新SHOW不挤人；空位补入；场景／run变更重建发言历史', () => {
    const state = input(), layout = planPortraits(state);
    expect(planPortraits({ ...state, actors: [...state.actors, person('戊')] }, layout).slots).toEqual(layout.slots);
    const two = planPortraits(input(['甲', '乙']));
    expect(planPortraits(state, two).slots).toEqual(['甲', '乙', '丙']);
    const spoken = planPortraits({ ...state, waiting: wait('丁') }, layout);
    for (const changed of [{ run: 2 }, { sceneId: 'other' }]) {
      const next = planPortraits({ ...state, ...changed }, spoken);
      expect(next.slots).toEqual(['甲', '乙', '丙']); expect(next.lastSpoken).toEqual({});
    }
  });
  it('输入及游戏状态不可变、无随机或保存副作用；相同输入输出一致', () => {
    const state = input(), before = JSON.stringify(state);
    state.actors.forEach(Object.freeze); Object.freeze(state.entries); Object.freeze(state.actors); Object.freeze(state);
    expect(planPortraits(state)).toEqual(planPortraits(state));
    expect(JSON.stringify(state)).toBe(before); expect(planPortraits(state)).not.toHaveProperty('flags');
  });
});

describe('真实SHOW顺序与身份揭示', () => {
  it('C009重新SHOW以实际顺序登记，女剑士优先于旧演员对象中的金发青年', () => {
    const state = resumeScene(emptyState(), storyLibrary, 'prologue_4', 'c009', 1, undefined).state;
    const order = portraitEntries(state);
    expect(order.indexOf('男高')).toBeLessThan(order.indexOf('金发青年'));
    expect(order.indexOf('金发青年')).toBeLessThan(order.indexOf('女剑士'));
    expect(planPortraits({ ...state, actors: Object.values(state.actors), entries: order }).slots).toEqual(['男高', '女剑士', '蒙面人']);
  });
  it('SHOW.update不算重新入场，显式HIDE/SHOW才改变当前入场顺序', () => {
    const state = emptyState(); state.actId = 'prologue'; state.sceneId = 'p001'; state.nodeIndex = 4;
    const lib = { prologue: { id: 'prologue', title: '', scenes: [{ id: 'p001', title: '', time: '', meta: { sourceFile: '', line: 1 }, nodes: [
      { kind: 'show' as const, actor: '乙' }, { kind: 'show' as const, actor: '甲' },
      { kind: 'show' as const, actor: '乙', update: true as const }, { kind: 'hide' as const, actor: '甲' }, { kind: 'show' as const, actor: '乙' },
    ] }] } };
    expect(portraitEntries(state, lib)).toEqual(['乙', '甲']);
    expect(portraitEntries({ ...state, nodeIndex: 5 }, lib)).toEqual(['甲', '乙']);
  });
  it('C011严格跟随原HIDE/SHOW由女剑士变Saber，恢复不提前揭示', () => {
    let state = resumeScene(emptyState(), storyLibrary, 'prologue_4', 'c011', 1, undefined).state;
    let layout = planPortraits({ ...state, actors: Object.values(state.actors), entries: portraitEntries(state) });
    expect(layout.slots).toContain('女剑士'); expect(layout.slots).not.toContain('Saber');
    for (let n = 0; n < 30 && !state.actors.Saber?.visible; n++) {
      if (state.waiting?.kind !== 'text') throw new Error('身份节点前不应停等');
      state = reduceGame(state, { type: 'advance', token: state.waiting.token }, storyLibrary).state;
      layout = planPortraits({ ...state, actors: Object.values(state.actors), entries: portraitEntries(state) }, layout);
    }
    expect(layout.slots).toContain('Saber'); expect(layout.slots).not.toContain('女剑士');
    expect(state.actors['女剑士']?.visible).toBe(false);
  });
});

describe('淡出再淡入与取消租期', () => {
  const setup = () => {
    const tasks = new Map<number, () => void>(), cancelled: number[] = [], frames: (readonly DisplaySlot[])[] = [];
    let serial = 0;
    const display = new DisplayTransition({ later(work, ms) { expect(ms).toBe(150); tasks.set(++serial, work); return serial; }, cancel(id) { cancelled.push(id); } }, slots => frames.push(slots));
    return { display, tasks, cancelled, frames };
  };
  const slots = (names: string[]) => names.map((actor, i) => ({ actor, x: portraitCenters(names.length)[i]! }));
  it('同槽先淡出150ms，提交后才出现新角色，其他两人不移动', () => {
    const s = setup(); s.display.update('scope', slots(['甲', '乙', '丙']));
    s.display.update('scope', slots(['甲', '丁', '丙']));
    expect(s.frames.at(-1)!.map(a => a.actor)).toEqual(['甲', '乙', '丙']);
    expect(s.frames.at(-1)![1]!.phase).toBe('out');
    s.tasks.get(1)!(); expect(s.frames.at(-1)).toEqual([
      { actor: '甲', x: 256, phase: 'steady' }, { actor: '丁', x: 640, phase: 'in' }, { actor: '丙', x: 1024, phase: 'steady' },
    ]);
    expect(s.frames.every(frame => frame.length <= 3)).toBe(true);
  });
  it('逐字重复更新不重启计时；新换人使旧回调失效', () => {
    const s = setup(); s.display.update('scope', slots(['甲'])); s.display.update('scope', slots(['乙']));
    s.display.update('scope', slots(['乙'])); expect(s.tasks.size).toBe(1);
    s.display.update('scope', slots(['丙'])); const before = s.frames.length;
    s.tasks.get(1)!(); expect(s.frames).toHaveLength(before);
    s.tasks.get(2)!(); expect(s.frames.at(-1)![0]!.actor).toBe('丙');
  });
  it.each(['快进', '菜单暂停', '恢复'])('%s立即定格，过期回调不能恢复离场人物', () => {
    const s = setup(); s.display.update('scope', slots(['甲'])); s.display.update('scope', slots(['乙']));
    s.display.update('scope', slots(['乙']), true); expect(s.frames.at(-1)![0]!.phase).toBe('steady');
    const before = s.frames.length; s.tasks.get(1)!(); expect(s.frames).toHaveLength(before);
  });
  it('会话切换与释放均失效；旧load/display回调不重新排位', () => {
    const s = setup(); s.display.update('one', slots(['甲'])); s.display.update('one', slots(['乙']));
    s.display.update('two', slots(['丙'])); s.tasks.get(1)!(); expect(s.frames.at(-1)![0]!.actor).toBe('丙');
    s.display.update('two', slots(['丁'])); s.display.dispose(); const before = s.frames.length;
    s.tasks.get(2)!(); s.display.update('three', slots(['戊'])); expect(s.frames).toHaveLength(before);
  });
});
