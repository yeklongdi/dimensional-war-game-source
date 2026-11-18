import { describe, expect, it } from 'vitest';
import { levelIds } from '../content/levels.js';
import { startLoop } from '../game/loop/progress.js';
import { loopToken } from '../game/loop/route.js';
import type { LoopCheckpoint, LoopIntent } from '../game/loop/types.js';
import { navigationToken } from '../game/router.js';
import type { RunSnapshot } from '../game/save-run.js';
import { skippedFlag, encounterSkipped, patrolSkipped } from '../game/story/skip-policy.js';
import { loadAuto, menuHarness } from './menu-helpers.js';
import { forward, skipSave, ticks } from './skip-helpers.js';

function playCity(day: number, slot: LoopCheckpoint['slot'], flags = {}) {
  const save = skipSave('c013', { [patrolSkipped]: true, [encounterSkipped]: true,
    prologue_4_complete: true, thief_invitation_received: true, ...flags });
  const checkpoint: RunSnapshot = { ...save, completedLevelIds: levelIds, checkpoint: { kind: 'map' },
    postPrologue: { ...startLoop(42), day, slot, phase: { kind: 'city' } } };
  return menuHarness(checkpoint, 'v5');
}
type Harness = ReturnType<typeof menuHarness>;
const navigate = (h: Harness, type: 'return-loop' | 'open-map') =>
  h.action({ type, token: navigationToken(h.state) });
const act = (h: Harness, intent: LoopIntent) => h.action({ type: 'loop', token: loopToken(h.state), intent });

async function investigate(h: Harness, day: number, forced: boolean) {
  await forward(h);
  await ticks(h, state => state.waiting?.kind === 'blocked-call');
  expect(h.state).toMatchObject({ sceneId: 't102', postPrologue: { storyScene: 't102', day, slot: 'night' },
    waiting: { callId: 'battle_thief_bond1_outer_lab' } });
  await navigate(h, 'open-map');
  expect(h.state.sceneId).toBe('t102');
  await loadAuto(h);
  expect(h.state).toMatchObject({ sceneId: 't102', postPrologue: { storyScene: 't102', day } });
  await forward(h);
  expect(h.state.flags[skippedFlag('battle_thief_bond1_outer_lab')!]).toBeUndefined();
  await ticks(h, state => state.waiting?.kind === 'blocked-call');
  await forward(h);
  expect(h.state.flags[skippedFlag('battle_thief_bond1_outer_lab')!]).toBe(true);
  expect(h.state.battle).toBeUndefined();
  await forward(h);
  await ticks(h, state => state.waiting?.kind === 'text' && state.waiting.text.includes('算算日子'));
  if (h.state.waiting?.kind !== 'text') throw new Error('缺少实验室倒计时台词');
  expect(h.state.waiting.text).toContain(`已经是第 ${day} 天了，距离第 10 天满打满算也就只剩 ${10 - day} 天`);
  expect(h.state.waiting.text.includes('明天第 8 天和后天第 9 天')).toBe(forced);
  expect(h.state.waiting.text).not.toContain('【若为');
  await ticks(h, state => state.waiting?.kind === 'end');
  expect(h.state.flags).toMatchObject({ thief_bond_level: 1, aptx4869_model_known: true,
    thief_bond1_complete: true, base_raid_deadline_day: 9, monster_release_day: 10 });
  await navigate(h, 'return-loop');
  expect(h.state.postPrologue?.day).toBe(day + 1);
}

describe('首周期来信与怪盗羁绊', () => {
  it('第 4 夜可主动赴约，战斗停点和读档保持同一夜，完成后只结算一次', async () => {
    const h = playCity(4, 'night'); await loadAuto(h);
    await h.action({ type: 'select-location', token: navigationToken(h.state), locationId: 'old_warehouse' });
    await act(h, { kind: 'event', id: 'thief_bond1' });
    expect(h.state).toMatchObject({ sceneId: 't101', postPrologue: { storyScene: 't101', day: 4, slot: 'night' } });
    await investigate(h, 4, false);
    expect(h.state).toMatchObject({ screen: 'map', postPrologue: { slot: 'after_school', day: 5 } });
    await loadAuto(h);
    expect(h.state.screen).toBe('map');
    expect(h.state.postPrologue?.storyScene).toBeUndefined();
  });

  it('第七日提前结束会先催约，直播排在调查之后，两段都可从场景头恢复', async () => {
    const h = playCity(7, 'after_school', { vtuber_bond1_library_done: true }); await loadAuto(h);
    await act(h, { kind: 'skip_day' });
    expect(h.state).toMatchObject({ sceneId: 'm103', postPrologue: { storyScene: 'm103', day: 7, slot: 'night' } });
    await investigate(h, 7, true);
    expect(h.state).toMatchObject({ sceneId: 'v102', postPrologue: { storyScene: 'v102', day: 8 } });
    await loadAuto(h);
    expect(h.state.sceneId).toBe('v102');
    await forward(h); await ticks(h, state => state.waiting?.kind === 'end');
    await navigate(h, 'return-loop');
    expect(h.state).toMatchObject({ screen: 'map', postPrologue: { day: 8 }, flags: { vtuber_bond1_complete: true } });
  });

  it('第七夜通过常规傍晚行动也会催约', async () => {
    const h = playCity(7, 'evening'); await loadAuto(h);
    await h.action({ type: 'select-location', token: navigationToken(h.state), locationId: 'school_road' });
    await act(h, { kind: 'event', id: 'job' });
    expect(h.state).toMatchObject({ sceneId: 'm103', postPrologue: { day: 7, slot: 'night', gold: 30 } });
  });

  it('普通夜晚洗点也会进入尚待播放的直播，重读不会重复推进日程', async () => {
    const h = playCity(5, 'night', { vtuber_bond1_library_done: true }); await loadAuto(h);
    await h.action({ type: 'select-location', token: navigationToken(h.state), locationId: 'grandma_home' });
    await act(h, { kind: 'respec', choice: { classId: 'monk' } });
    expect(h.state).toMatchObject({ sceneId: 'v102', postPrologue: { storyScene: 'v102', day: 6 } });
    await loadAuto(h);
    expect(h.state).toMatchObject({ sceneId: 'v102', postPrologue: { day: 6 } });
  });
});
