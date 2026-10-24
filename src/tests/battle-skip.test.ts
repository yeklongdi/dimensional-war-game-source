import { describe, expect, it } from 'vitest';
import { skipHarness, forward, ticks } from './skip-helpers.js';
import { reduceCampaign } from '../game/campaign.js';
import { battleToken } from '../game/battle/state-helpers.js';
import { storyLibrary } from '../game/story/library.js';
import type { GameState } from '../game/state.js';
import { skippedFlag } from '../game/story/skip-policy.js';
import { reduceRuntime, systemToken } from '../game/runtime.js';

async function battleScene(scene: string) { const h = await skipHarness(scene); await forward(h); await ticks(h, s => s.screen === 'battle'); return h; }
describe('真实战斗跳过的统一CALL返回', () => {
  it.each(['p006', 'a014'])('%s从原光标恢复第一段战后原文，不加骰、不伪造日志、没有直接通关', async scene => {
    const h = await battleScene(scene), previous = h.state, battle = previous.battle!, copy = structuredClone(previous);
    const normal = reduceCampaign({ ...copy, system: undefined, battle: { ...copy.battle!, result: { outcome: 'win', reason: 'eliminated' } } },
      { type: 'continue-story', token: battleToken(battle) }, storyLibrary).state;
    await h.system('open'); await h.system('skip');
    expect(h.state.screen).toBe('story'); expect(h.state.sceneId).toBe(scene === 'p006' ? 'p007' : 'a014'); expect(h.state.fastForward).toBeUndefined();
    expect(h.state.battle).toBeUndefined(); expect(h.state.movementDraft).toBeUndefined();
    expect(h.state.waiting).toEqual(normal.waiting); expect(h.state.nodeIndex).toBe(normal.nodeIndex);
    expect(h.state.actors).toEqual(normal.actors); // 包括CALL后自动退场和演出，不硬跳场景。
    expect(h.state.flags[`flag_${battle.id}_won`]).toBe(true); expect(h.state.flags[skippedFlag(battle.id)!]).toBe(true);
    expect(previous).toEqual(copy); expect(battle.rng).toEqual(copy.battle!.rng); expect(battle.log).toEqual(copy.battle!.log);
    expect(h.state.progress!.completedLevelIds).toEqual(copy.progress!.completedLevelIds);
    const after = h.state; await h.action({ type: 'play', run: previous.run, action: { type: 'skip-battle', token: battleToken(battle) } }); expect(h.state).toBe(after);
  });
  it.each(['pendingRoll', 'pendingMove', 'pendingReaction', 'unconscious', 'failure'] as const)('%s状态可跳过，输入不变且全部原等待被清理', async phase => {
    const h = await battleScene('p006'), base = structuredClone(h.state); base.system = undefined;
    const battle = base.battle!, hero = battle.units[0]!;
    if (phase !== 'pendingRoll') battle.pendingRoll = undefined;
    if (phase === 'pendingMove') battle.pendingMove = { actor: hero.id, path: [{ col: 1, row: 2 }], index: 0, reactors: null };
    if (phase === 'pendingReaction') battle.pendingReaction = { reactor: hero.id, moving: battle.units[1]!.id };
    if (phase === 'unconscious' || phase === 'failure') { hero.hp = 0; hero.status = 'unconscious'; }
    if (phase === 'failure') battle.result = { outcome: 'lose', reason: 'dead' };
    const before = structuredClone(base), result = reduceCampaign(base, { type: 'skip-battle', token: battleToken(battle) }, storyLibrary);
    expect(result.state.screen).toBe('story'); expect(result.state.battle).toBeUndefined(); expect(base).toEqual(before);
    expect(result.state.flags.flag_battle_prologue_tutorial_skipped).toBe(true);
  });
  it('已正常获胜复用继续，不补记跳过；旧token/被破坏的CALL上下文均拒绝', async () => {
    const h = await battleScene('a014'), base = structuredClone(h.state); base.system = undefined;
    base.battle!.result = { outcome: 'win', reason: 'eliminated' };
    const result = reduceCampaign(base, { type: 'skip-battle', token: battleToken(base.battle!) }, storyLibrary);
    expect(result.state.flags.flag_battle_black_humanoid_won).toBe(true); expect(result.state.flags.flag_battle_black_humanoid_skipped).toBeUndefined();
    expect(reduceCampaign(base, { type: 'skip-battle', token: 'old' }, storyLibrary).state).toBe(base);
    const broken: GameState = { ...base, nodeIndex: base.nodeIndex + 1 };
    expect(reduceCampaign(broken, { type: 'skip-battle', token: battleToken(base.battle!) }, storyLibrary).state).toBe(broken);
  });
  it('菜单跳过只接受一次；不在系统页、旧会话或旧菜单token均无效', async () => {
    const h = await battleScene('p006'); await h.system('open'); const token = systemToken(h.state);
    await h.system('skip'); const after = h.state;
    expect(reduceRuntime(after, { type: 'system', intent: 'skip', token }, storyLibrary, 300).state).toBe(after);
    await h.system('open'); await h.system('settings'); const settings = h.state;
    await h.system('skip'); expect(h.state).toBe(settings);
  });
  it('A014四段战后正文与两个SET仍依次执行，直到边界才完成第六关', async () => {
    const h = await battleScene('a014'); await h.system('open'); await h.system('skip');
    const seen: string[] = [];
    for (let i = 0; i < 30 && h.state.screen === 'story'; i++) {
      const wait = h.state.waiting!;
      if (wait.kind === 'text' && !seen.includes(wait.text)) seen.push(wait.text);
      await h.action({ type: 'play', run: h.state.run, action: { type: 'advance', token: wait.token } });
    }
    expect(seen).toHaveLength(4); expect(h.state.screen).toBe('map'); expect(h.state.progress!.completedLevelIds).toHaveLength(6);
    for (const node of storyLibrary.act1!.scenes.find(s => s.id === 'a014')!.nodes) if (node.kind === 'set') expect(h.state.flags[node.flag]).toBe(node.value ?? true);
  });
});
