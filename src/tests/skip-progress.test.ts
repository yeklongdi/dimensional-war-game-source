import { describe, expect, it } from 'vitest';
import { skipSave, skipHarness, forward, ticks } from './skip-helpers.js';
import { currentForwardAction } from '../game/fast-forward.js';
import { decodeV2 } from '../game/save-v2.js';
import { storyLibrary } from '../game/story/library.js';
import { encounterSkipped, patrolSkipped, skippedFlag } from '../game/story/skip-policy.js';
import { allowedFlags } from '../game/save-format.js';
import { createStoryVaultStore, encodeV4, saveKeyV4, storyContentVersion } from '../game/save-v4.js';
import { newVault, saveKeyV3 } from '../game/save-v3.js';
import { memory, serialLock } from './map-save-helpers.js';
import { navigationToken } from '../game/router.js';
import { sceneEntryError } from '../game/story/chapter-policy.js';

describe('未接战斗明确跳过与第九关完成', () => {
  it('两个CALL各自停等、各自手动跳过，战后正文保留，C013 END后才九关完成', async () => {
    const h = await skipHarness('c003'); await forward(h); await ticks(h, s => s.waiting?.kind === 'blocked-call');
    expect(h.state.flags[patrolSkipped]).toBeUndefined(); await h.system('open'); await h.system('skip');
    expect(h.state.sceneId).toBe('c003'); expect(h.state.waiting?.kind).toBe('text');
    expect(h.state.flags[patrolSkipped]).toBe(true); expect(h.state.flags[encounterSkipped]).toBeUndefined();
    expect(h.state.fastForward).toBeUndefined(); expect(h.state.progress!.completedLevelIds).toHaveLength(8);
    await forward(h); const postPatrol: string[] = [];
    for (let i = 0; i < 150 && h.state.fastForward; i++) {
      if (h.state.waiting?.kind === 'text') postPatrol.push(h.state.sceneId);
      await h.action(currentForwardAction(h.state, 'tick')!);
    }
    expect(postPatrol).toContain('c003'); expect(postPatrol).toContain('c004');
    expect(h.state.waiting).toMatchObject({ kind: 'blocked-call', callId: 'battle_prologue4_deoxys_encounter' });
    expect(h.state.fastForward).toBeUndefined(); expect(h.state.flags.prologue_4_complete).toBeUndefined();
    await h.system('open'); await h.system('skip'); expect(h.state.waiting?.kind).toBe('text'); expect(h.state.flags[encounterSkipped]).toBe(true);
    await forward(h); await ticks(h, s => s.screen === 'map');
    expect(h.state.progress!.completedLevelIds).toHaveLength(9); expect(h.state.flags.prologue_4_complete).toBe(true);
    expect(decodeV2(JSON.stringify(h.state.progress!.checkpoint), storyLibrary).kind).toBe('valid');
    for (const flag of ['thief_identity_known', 'holy_grail_rules_known', 'saber_class_known', 'temporary_cooperation']) expect(h.state.flags[flag]).toBe(true);
    expect(Object.keys(h.state.flags).filter(f => f.endsWith('_won'))).toEqual([]); // 未制作CALL不伪造真实战斗胜利。
  });
  it.each(['c003', 'c005'])('%s读档有历史标记仍停在CALL，不能自动跳过', async scene => {
    const h = await skipHarness(scene, { [patrolSkipped]: true, [encounterSkipped]: true });
    expect(h.state.waiting?.kind).toBe('text'); await forward(h); await ticks(h, s => s.waiting?.kind === 'blocked-call');
    expect(h.state.sceneId).toBe(scene); expect(h.state.progress!.completedLevelIds).toHaveLength(8); expect(h.state.fastForward).toBeUndefined();
  });
  it('未来入口和第九关越权仍拒绝，完成关不可重玩', async () => {
    expect(sceneEntryError('prologue_4', 'c004', {})).toContain('巡逻队');
    expect(sceneEntryError('prologue_4', 'c006', { [patrolSkipped]: true })).toContain('遭遇战');
    const h = await skipHarness('c013', { [patrolSkipped]: true, [encounterSkipped]: true }); await forward(h); await ticks(h, s => s.screen === 'map');
    const before = h.state; await h.action({ type: 'enter-level', token: navigationToken(h.state), levelId: 'prologue4_01' }); expect(h.state).toBe(before);
  });
});
describe('v4格式不变，跳过记录与恢复门槛一致', () => {
  it.each([
    ['c003', {}, 'valid'], ['c004', {}, 'invalid'], ['c004', { [patrolSkipped]: true }, 'valid'],
    ['c005', { [patrolSkipped]: true }, 'valid'], ['c006', { [patrolSkipped]: true }, 'invalid'],
    ['c006', { [patrolSkipped]: true, [encounterSkipped]: true }, 'valid'],
    ['c013', { [patrolSkipped]: true, [encounterSkipped]: true }, 'valid'],
  ] as const)('%s依赖准确的跳过记录 %j', (scene, flags, expected) => {
    expect(decodeV2(JSON.stringify(skipSave(scene, flags)), storyLibrary).kind).toBe(expected);
  });
  it('九关完成必须同时有两处跳过和原文完成SET，未知跳过flag拒绝', () => {
    const data = skipSave('c013', { [patrolSkipped]: true, [encounterSkipped]: true });
    data.completedLevelIds.push('prologue4_01'); data.checkpoint = { kind: 'map' };
    expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('invalid');
    data.flags.prologue_4_complete = true; expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('valid');
    delete data.flags[patrolSkipped]; expect(decodeV2(JSON.stringify(data), storyLibrary).kind).toBe('invalid');
    const bad = skipSave('c003', { flag_battle_future_skipped: true }); expect(decodeV2(JSON.stringify(bad), storyLibrary).kind).toBe('invalid');
    expect(skippedFlag('battle_future')).toBeUndefined(); expect(allowedFlags(storyLibrary).has(encounterSkipped)).toBe(true);
  });
  it('旧合法v4及新进度均可读取，版本与内容版本不改，旧v3原串不写', async () => {
    const m = memory(), store = createStoryVaultStore(m.storage, serialLock(), storyLibrary);
    const initial = newVault('skip-test-active-run', skipSave('c003')); m.values.set(saveKeyV4, encodeV4(initial));
    m.values.set(saveKeyV3, '  旧原件\n'); expect(store.read().kind).toBe('valid');
    const data = skipSave('c006', { [patrolSkipped]: true, [encounterSkipped]: true });
    const result = await store.write({ kind: 'auto', id: 'skip-auto-1', runId: initial.activeRunId, session: 1, revision: 1, data }, () => true);
    expect(result.kind).toBe('ok'); expect(m.values.get(saveKeyV3)).toBe('  旧原件\n');
    const disk = JSON.parse(m.values.get(saveKeyV4)!); expect(disk).toMatchObject({ version: 4, contentVersion: storyContentVersion });
    expect(Object.keys(disk).sort()).toEqual(['activeRunId', 'auto', 'contentVersion', 'manual', 'revision', 'version']);
    expect(JSON.stringify(disk)).not.toMatch(/fastForward|nodeIndex|pendingRoll|movementDraft/);
    expect(store.read().kind).toBe('valid');
  });
});
