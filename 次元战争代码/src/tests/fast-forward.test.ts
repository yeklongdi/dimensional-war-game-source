import { describe, expect, it } from 'vitest';
import { currentForwardAction, fastForwardDelay, skipReason, textClockPlan } from '../game/fast-forward.js';
import { reduceRuntime, systemToken } from '../game/runtime.js';
import { storyLibrary } from '../game/story/library.js';
import { skipHarness, forward, ticks } from './skip-helpers.js';
import { saveKeyV3 } from '../game/save-v3.js';
import { navigationToken } from '../game/router.js';

describe('高速逐句的计时计划与停止', () => {
  it('300ms整句显示，普通文字设置不变；开始和每句停留不写档', async () => {
    const h = await skipHarness(), before = h.m.values.get(saveKeyV3), settings = h.state.settings;
    await forward(h); const wait = h.state.waiting;
    expect(wait?.kind === 'text' && wait.revealed).toBe(wait?.kind === 'text' ? Array.from(wait.text).length : -1);
    expect(textClockPlan(h.state)).toMatchObject({ delay: fastForwardDelay, revision: 1 });
    expect(h.state.settings).toBe(settings); expect(h.m.values.get(saveKeyV3)).toBe(before);
    const token = wait!.token; await h.action(currentForwardAction(h.state, 'tick')!);
    expect(h.state.waiting!.token).not.toBe(token); expect(h.m.values.get(saveKeyV3)).toBe(before);
    expect(h.state.waiting?.kind === 'text' && h.state.waiting.revealed).toBe(h.state.waiting?.kind === 'text' ? Array.from(h.state.waiting.text).length : -1);
  });
  it.each(['button', 'advance'] as const)('%s停止不多跳一句，旧tick和同句旧修订均拒绝', async how => {
    const h = await skipHarness(); await forward(h); const old = currentForwardAction(h.state, 'tick')!, wait = h.state.waiting;
    await h.action(how === 'button' ? currentForwardAction(h.state, 'stop')! : { type: 'play', run: h.state.run, action: { type: 'advance', token: wait!.token } });
    expect(h.state.fastForward).toBeUndefined(); expect(h.state.waiting).toBe(wait);
    const stopped = h.state; await h.action(old); expect(h.state).toBe(stopped);
    await forward(h); expect(h.state.fastForward!.revision).toBeGreaterThan(old.revision);
    const restarted = h.state; await h.action(old); expect(h.state).toBe(restarted);
  });
  it('打开菜单停止快进、关闭不重启；旧会话tick不推进新游戏', async () => {
    const h = await skipHarness(); await forward(h); const old = currentForwardAction(h.state, 'tick')!;
    await h.system('open'); const wait = h.state.waiting;
    expect(h.state.fastForward).toBeUndefined(); expect(textClockPlan(h.state)).toBeUndefined();
    await h.system('back'); expect(h.state.fastForward).toBeUndefined(); expect(h.state.waiting).toBe(wait);
    await h.system('open'); await h.system('go-menu'); await h.system('new'); await h.system('confirm');
    const fresh = h.state; await h.action(old); expect(h.state).toBe(fresh);
  });
  it('跨窗口切换立即停止，外部旧输入不能重启；布局不存入快进', async () => {
    const h = await skipHarness(); await forward(h); const state = h.state, read = state.system!.read;
    if (read.kind !== 'valid') throw new Error('需要存档');
    const changed = reduceRuntime(state, { type: 'vault-external', read: { kind: 'valid', data: { ...read.data, activeRunId: 'foreign-active-identity' } } }, storyLibrary, 200);
    expect(changed.state.fastForward).toBeUndefined(); expect(changed.state.system!.stale).toBe(true);
    expect(JSON.stringify(JSON.parse(h.m.values.get(saveKeyV3)!))).not.toContain('fastForward');
  });
});
describe('真实脚本的快进停点与执行顺序', () => {
  it('跨场景按顺序处理演出和SET，meta隐藏；关末转入下一内部关并在P005正常停等', async () => {
    const h = await skipHarness(); await forward(h); const scenes = new Set<string>(), text: string[] = [];
    for (let i = 0; i < 150 && h.state.fastForward; i++) {
      scenes.add(h.state.sceneId); if (h.state.waiting?.kind === 'text') text.push(h.state.waiting.text);
      await h.action(currentForwardAction(h.state, 'tick')!);
    }
    expect([...scenes]).toEqual(['p001', 'p002', 'p003', 'p004']);
    expect(text.join('')).not.toMatch(/【待确认】|【不可执行】|CHECK:/);
    expect(h.state.screen).toBe('story'); expect(h.state.progress!.completedLevelIds).toEqual(['prologue_01']);
    expect(h.state.sceneId).toBe('p005'); expect(h.state.activeLevelId).toBe('prologue_02');
    expect(h.state.fastForward).toBeUndefined(); expect(h.state.waiting).toMatchObject({ kind: 'text', revealed: 0 });
  });
  it('A007选择不自动决定，只有主播启用；选完后不自动续快进', async () => {
    const h = await skipHarness('a006'); await forward(h); await ticks(h, s => s.waiting?.kind === 'choice');
    expect(h.state.sceneId).toBe('a007'); expect(h.state.fastForward).toBeUndefined();
    if (h.state.waiting?.kind !== 'choice') throw new Error('必须停在选择');
    expect(h.state.waiting.options.map(o => o.enabled)).toEqual([false, true, false, false]);
    const wait = h.state.waiting, before = h.state; await h.system('open'); await h.system('skip');
    expect(h.state.waiting).toBe(wait); expect(h.state.fastForward).toBeUndefined(); await h.system('back');
    await h.action({ type: 'play', run: h.state.run, action: { type: 'choose', token: wait.token, index: 2 } });
    expect(h.state.sceneId).toBe('a008'); expect(h.state.fastForward).toBeUndefined(); expect(before.flags).not.toBe(h.state.flags);
  });
  it.each(['p006', 'a014'])('%s快进停在真实战斗，不能自动获胜', async scene => {
    const h = await skipHarness(scene); await forward(h); await ticks(h, s => s.screen === 'battle');
    expect(h.state.fastForward).toBeUndefined(); expect(h.state.battle?.result).toBeUndefined();
    expect(Object.keys(h.state.flags).some(f => f.endsWith('_skipped'))).toBe(false);
  });
  it('C003快进仍在未制作CALL暂停；未知调用与未完成分支没有跳过入口', async () => {
    const h = await skipHarness('c003'); await forward(h); await ticks(h, s => s.waiting?.kind === 'blocked-call');
    expect(h.state.fastForward).toBeUndefined(); expect(h.state.flags.prologue_4_complete).toBeUndefined();
    const before = h.state;
    const map = reduceRuntime(before, { type: 'open-map', token: navigationToken(before) }, storyLibrary, 300).state;
    expect(map.progress!.checkpoint?.checkpoint).toMatchObject({ kind: 'level', sceneId: 'c003' });
    const badToken = reduceRuntime(before, { type: 'system', intent: 'skip', token: systemToken(before) }, storyLibrary, 301);
    expect(badToken.state).toBe(before); // 必须先打开系统菜单。
    for (const waiting of [{ ...before.waiting!, kind: 'blocked-call' as const, callId: 'battle_unknown', message: '' },
      { kind: 'unfinished' as const, token: 'test', origin: { nodeIndex: 0 }, message: '' },
      { kind: 'error' as const, token: 'test', origin: { nodeIndex: 0 }, message: '' }]) {
      expect(skipReason({ ...before, waiting })).not.toBe('');
    }
  });
});
