import { describe, expect, it } from 'vitest';
import { storyLibrary } from '../game/story/library.js';
import { emptyState } from '../game/state.js';
import { resumeScene } from '../game/story/restore.js';
import { reduceGame, startGame } from '../game/story/player.js';
import { startApp, reduceApp, navigationToken } from '../game/router.js';
import { decodeV2 } from '../game/save-v2.js';
import { levelIds, levels } from '../content/levels.js';
import { next, fixture } from './player-helpers.js';
import { appStep, freshApp, sampleV2 } from './m4-helpers.js';

describe('新版剧情入口、身份与未开放战斗', () => {
  it('显式布尔SET保留正式变量名与false，meta不阻止记录用途', () => {
    const result = startGame(fixture([{ kind: 'set', flag: 'has_master_sword', value: true, note: '原句', meta: true },
      { kind: 'set', flag: 'other_event', value: false, note: '原句' }, { kind: 'narration', text: '可见正文' }]));
    expect(result.state.flags).toEqual({ has_master_sword: true, other_event: false });
    expect(result.state.waiting).toMatchObject({ kind: 'text', text: '可见正文' });
  });
  it.each([['act1_04', 7, 'has_master_sword'], ['prologue3_01', 8, 'link_summoned']] as const)('%s完成前后的入口约束由规则层校验', (_id, count, missing) => {
    const data = sampleV2('act1'); data.completedLevelIds = levelIds.slice(0, count);
    Object.assign(data.flags, { flag_act1_completed: true, has_master_sword: true, link_summoned: true, prologue_3_complete: true }); data.checkpoint = { kind: 'map' };
    delete data.flags[missing];
    const menu = startApp(0, { kind: 'valid', data }).state;
    const map = reduceApp(menu, { type: 'open-map', token: navigationToken(menu) }, storyLibrary, 1).state;
    const target = levels[count]!;
    expect(reduceApp(map, { type: 'enter-level', token: navigationToken(map), levelId: target.id }, storyLibrary, 2).state).toBe(map);
    expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('invalid');
  });
  it.each([['c003', 'battle_prologue4_patrol'], ['c005', 'battle_prologue4_deoxys_encounter']] as const)('%s的调用暂停，不接受advance/complete-battle或执行后续SET', (scene, call) => {
    const base = emptyState(); base.flags = { has_master_sword: true, link_summoned: true, prologue_3_complete: true };
    let state = resumeScene(base, storyLibrary, 'prologue_4', scene, 10).state;
    for (let i = 0; i < 60 && state.waiting?.kind === 'text'; i++) state = next(state);
    expect(state.waiting).toMatchObject({ kind: 'blocked-call', callId: call });
    expect(state.flags.prologue_4_complete).toBeUndefined(); expect(state.flags.thief_identity_known).toBeUndefined();
    for (const type of ['advance', 'complete-battle', 'restart', 'reselect'] as const)
      expect(reduceGame(state, { type, token: state.waiting!.token }, storyLibrary).state).toBe(state);
  });
  it('正式保存不能把检查点放在C003之后，也不接受伪造第九关完成', () => {
    const data = sampleV2(); data.completedLevelIds = levelIds.slice(0, 8);
    data.flags = { flag_prologue_completed: true, flag_act1_completed: true, has_master_sword: true, link_summoned: true, prologue_3_complete: true };
    data.checkpoint = { kind: 'level', levelId: 'prologue4_01', sceneId: 'c005' };
    expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('invalid');
    data.checkpoint.sceneId = 'c003'; expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('valid');
    data.completedLevelIds.push('prologue4_01'); data.flags.prologue_4_complete = true; data.checkpoint = { kind: 'map' };
    expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('invalid');
  });
  it('完整可玩主线到C003后返回地图和刷新，继续仍重播C003并在原CALL暂停', () => {
    let state = freshApp();
    for (let i = 0; i < 2600 && state.waiting?.kind !== 'blocked-call'; i++) state = appStep(state);
    expect(state.sceneId).toBe('c003'); expect(state.progress!.completedLevelIds).toHaveLength(8);
    const data = state.progress!.checkpoint!;
    expect(data.checkpoint).toEqual({ kind: 'level', levelId: 'prologue4_01', sceneId: 'c003' });
    expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('valid');
    const menu = startApp(0, { kind: 'valid', data }).state;
    let restored = reduceApp(menu, { type: 'resume', token: navigationToken(menu) }, storyLibrary, 200).state;
    expect(restored.waiting?.kind).toBe('text');
    for (let i = 0; i < 60 && restored.waiting?.kind === 'text'; i++) restored = next(restored);
    expect(restored.waiting).toMatchObject({ kind: 'blocked-call', callId: 'battle_prologue4_patrol' });
  });
});
