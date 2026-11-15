import { describe, expect, it } from 'vitest';
import { levelIds } from '../content/levels.js';
import { advanceLoop, recover, startLoop } from '../game/loop/progress.js';
import { openEncounter } from '../game/loop/encounters.js';
import { loopToken } from '../game/loop/route.js';
import { battleToken, getUnit } from '../game/battle/state-helpers.js';
import { navigationToken } from '../game/router.js';
import { decodeRunSnapshot } from '../game/save-run.js';
import { storyLibrary } from '../game/story/library.js';
import { encounterSkipped, patrolSkipped } from '../game/story/skip-policy.js';
import { forward, skipSave, ticks } from './skip-helpers.js';
import { loadAuto, menuHarness } from './menu-helpers.js';
import type { LoopCheckpoint, LoopIntent } from '../game/loop/types.js';

const tail = () => skipSave('c013', { [patrolSkipped]: true, [encounterSkipped]: true });
const stored = (postPrologue: LoopCheckpoint) => ({
  ...tail(), flags: { ...tail().flags, prologue_4_complete: true }, completedLevelIds: levelIds, checkpoint: { kind: 'map' as const }, postPrologue,
});
function city() { return advanceLoop(startLoop(0), { kind: 'ack' })!; }

describe('序幕后日程与副本', () => {
  it('C013 真正结束后开场，冻结旧输入，自动档恢复相同日程', async () => {
    const h = menuHarness(tail(), 'v5'); await loadAuto(h);
    expect(h.state.postPrologue).toBeUndefined();
    await forward(h); await ticks(h, state => state.screen === 'loop');
    expect(h.state.flags.prologue_4_complete).toBe(true);
    expect(h.state.progress!.completedLevelIds).toEqual(levelIds);
    expect(h.state.postPrologue).toMatchObject({ day: 1, cycle: 0, phase: { kind: 'intro' } });
    const token = loopToken(h.state);
    const dispatch = (intent: LoopIntent, actionToken = loopToken(h.state)) => h.action({ type: 'loop', token: actionToken, intent });
    await dispatch({ kind: 'ack' });
    await dispatch({ kind: 'skip_day' }, token);
    expect(h.state.postPrologue).toMatchObject({ day: 1, slot: 'after_school', phase: { kind: 'city' } });
    await dispatch({ kind: 'skip_day' });
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'interlude', moment: 'night' });
    await loadAuto(h);
    expect(h.state.postPrologue?.phase).toEqual({ kind: 'interlude', moment: 'night' });
    await dispatch({ kind: 'ack' });
    expect(h.state.postPrologue).toMatchObject({ day: 2, interludes: ['cycle_1_night'], clues: [] });
  });

  it('每天三段按次推进，购入不占段，委托只结算一次，跳过不给收益', () => {
    let state = city();
    expect(advanceLoop(state, { kind: 'event', id: 'school_request' }, 'grandma_home')).toBeUndefined();
    state = advanceLoop(state, { kind: 'event', id: 'school_request' }, 'high_school')!;
    expect(state).toMatchObject({ slot: 'evening', gold: 36 });
    state = advanceLoop(state, { kind: 'buy', id: 'acid' })!;
    expect(state).toMatchObject({ slot: 'evening', gold: 22, items: { acid: 1 } });
    state = advanceLoop(state, { kind: 'event', id: 'job' }, 'school_road')!;
    expect(state).toMatchObject({ slot: 'night', gold: 32 });
    state = advanceLoop(state, { kind: 'skip_day' })!;
    expect(state).toMatchObject({ gold: 32, sync: 0, phase: { kind: 'interlude', moment: 'night' } });
    state = advanceLoop(state, { kind: 'ack' })!;
    expect(advanceLoop(state, { kind: 'event', id: 'school_request' }, 'high_school')).toBeUndefined();
  });

  it('同一天在安全点长休刷新每日能力与职业资源，短休只补相应次数', () => {
    const spent = { ...city(), linkUses: 0, divineAid: 1, hero: { ...city().hero, classId: 'fighter' as const, wind: 0, wizardSlots: 0, innate: 0 } };
    expect(recover(spent, 'short')).toMatchObject({ day: 1, linkUses: 1, divineAid: 1, hero: { wind: 1, wizardSlots: 0, innate: 0 } });
    expect(recover(spent, 'long')).toMatchObject({ day: 1, linkUses: 2, divineAid: 3, hero: { wind: 2, wizardSlots: 2, innate: 2 } });
  });

  it('奶奶家四套一级构筑均可应用，消耗一段并保留已消耗的资源', () => {
    const start = city(), hero = { ...start.hero, wizardSlots: 0 };
    const setup = { ...start, hero };
    const choices = [
      { classId: 'monk' as const }, { classId: 'fighter' as const, build: hero.fighter },
      { classId: 'wizard' as const, build: hero.wizard }, { classId: 'sorcerer' as const, build: hero.sorcerer },
    ];
    for (const choice of choices) {
      const intent = { kind: 'respec' as const, choice };
      expect(advanceLoop(setup, intent, 'high_school')).toBeUndefined();
      const active = advanceLoop(setup, intent, 'grandma_home')!;
      expect(active).toMatchObject({ day: 1, slot: 'evening', hero: { classId: choice.classId, wizardSlots: 0 } });
      expect(getUnit(openEncounter(active, 'patrol', false, 1), 'hero')!.maxHp).toBe({ monk: 10, fighter: 11, wizard: 7, sorcerer: 7 }[choice.classId]);
    }
  });

  it('10 日闭环锁图，两个阵容共享敌阵，胜利结算只扣一次出场', async () => {
    const h = menuHarness(stored({ ...city(), day: 10 }), 'v5'); await loadAuto(h);
    const send = (intent: LoopIntent) => h.action({ type: 'loop', token: loopToken(h.state), intent });
    await send({ kind: 'skip_day' });
    expect(h.state.postPrologue?.phase.kind).toBe('crisis');
    await h.action({ type: 'open-map', token: navigationToken(h.state) });
    expect(h.state.screen).toBe('loop');
    await send({ kind: 'ack' });
    await send({ kind: 'deploy', withLink: true });
    const alternate = openEncounter(h.state.postPrologue!, 'first', false, 7);
    const enemy = getUnit(h.state.battle!, 'demo_enemy')!;
    expect(enemy.maxHp).toBe(getUnit(alternate, 'demo_enemy')!.maxHp);
    expect(getUnit(h.state.battle!, 'link')).toMatchObject({ hp: 297, ac: 21, initiativeBonus: 20, position: { col: 1, row: 2 } });
    const command = { kind: 'ability', actor: 'link', ability: 'slaying_bow', target: 'demo_enemy' } as const;
    // 从首战出生格侧移避开挡住射线的箱子。
    const play = async (command: import('../game/battle/types.js').Command, origin: 'player' | 'system' = 'player') =>
      h.action({ type: 'play', run: h.state.run, action: { type: 'command', envelope: { token: battleToken(h.state.battle!), origin, command } } });
    await play({ kind: 'move', actor: 'link', to: { col: 2, row: 0 } });
    while (h.state.battle?.pendingMove) await play({ kind: 'step' }, 'system');
    await play(command);
    expect(h.state.battle?.result?.outcome).toBe('win');
    const result = { type: 'play', run: h.state.run, action: { type: 'continue-story', token: battleToken(h.state.battle!) } } as const;
    await h.action(result); await h.action(result);
    expect(h.state.postPrologue).toMatchObject({ linkUses: 1, gold: 32, phase: { kind: 'safe', rested: false } });
    await send({ kind: 'rest', rest: 'long' });
    expect(h.state.postPrologue).toMatchObject({ linkUses: 2, phase: { kind: 'safe', rested: true } });
  });

  it('v5 续篇槽拒绝前缀、阶段和资源损坏', () => {
    const good = stored(city());
    expect(decodeRunSnapshot(good, storyLibrary)).toMatchObject({ postPrologue: city() });
    expect(decodeRunSnapshot({ ...good, completedLevelIds: levelIds.slice(0, 8) }, storyLibrary)).toBeUndefined();
    expect(decodeRunSnapshot(stored({ ...city(), linkUses: 99 }), storyLibrary)).toBeUndefined();
    expect(decodeRunSnapshot(stored({ ...city(), phase: { kind: 'safe', rested: false } }), storyLibrary)).toBeUndefined();
  });
});
