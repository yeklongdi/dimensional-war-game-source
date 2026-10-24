import type { GameState } from '../game/state.js';
import type { Command, Envelope } from '../game/battle/types.js';
import type { CampaignAction } from '../game/campaign.js';
import { reduceCampaign, startCampaign } from '../game/campaign.js';
import { storyLibrary } from '../game/story/library.js';
import { battleToken, currentUnit } from '../game/battle/state-helpers.js';
import { attackContext } from '../game/battle/rules.js';
import { pathsFrom } from '../game/battle/grid.js';
import { chooseAi } from '../game/battle/ai.js';

export function campaignAction(state: GameState, action: CampaignAction): GameState {
  const result = reduceCampaign(state, action, storyLibrary);
  if (result.rejectedReason) throw new Error(result.rejectedReason);
  return result.state;
}
export function campaignCommand(state: GameState, command: Command, origin: Envelope['origin'] = 'player'): GameState {
  return campaignAction(state, { type: 'command', envelope: { token: battleToken(state.battle!), origin, command } });
}
export function playerAttackPlan(state: NonNullable<GameState['battle']>): Command {
  const hero = currentUnit(state);
  const resource = hero.resources.action ? 'action' : hero.resources.bonus && hero.resources.martialAttack ? 'bonus' : undefined;
  if (resource) {
    const attack = resource === 'bonus' ? hero.attacks.find(item => item.id === 'unarmed')! : hero.attacks[0]!;
    const targets = state.units.filter(unit => unit.team !== hero.team && !['dead', 'defeated'].includes(unit.status)).sort((a, b) => a.hp - b.hp);
    const target = targets.find(unit => attackContext(state, hero, unit, attack).legal);
    if (target) return { kind: 'attack', actor: hero.id, target: target.id, attackId: attack.id, resource };
    let best: { col: number; row: number }[] | undefined;
    for (const path of pathsFrom(state.grid, hero.position, state.units, hero.id).values()) {
      if (!path.length) continue;
      const moved = { ...hero, position: path[path.length - 1]! };
      if (targets.some(unit => attackContext(state, moved, unit, attack).legal) && (!best || path.length < best.length)) best = path;
    }
    const path = best?.slice(0, Math.floor(hero.resources.movement / 5));
    if (path?.length) return { kind: 'move', actor: hero.id, to: path[path.length - 1]! };
  }
  return { kind: 'end', actor: hero.id };
}
export function campaignStep(state: GameState): GameState {
  const battle = state.battle;
  if (state.screen === 'battle' && battle) {
    if (battle.result) {
      if (battle.result.outcome === 'lose') throw new Error(`本场失败 ${battle.id}`);
      return campaignAction(state, { type: 'continue-story', token: battleToken(battle) });
    }
    if (battle.pendingRoll) return campaignCommand(state, { kind: 'inspire', dieIndex: null });
    if (battle.opening) return campaignCommand(state, { kind: 'finish-opening' }, 'system');
    if (battle.pendingReaction) return campaignCommand(state, { kind: 'react', take: true });
    if (battle.pendingMove) return campaignCommand(state, { kind: 'step' }, 'system');
    if (battle.awaitingEnd) return campaignCommand(state, { kind: 'advance-turn' }, 'system');
    const actor = currentUnit(battle);
    return actor.team === 'enemy' ? campaignCommand(state, chooseAi(battle)!, 'ai') : campaignCommand(state, playerAttackPlan(battle));
  }
  const wait = state.waiting;
  if (!wait || wait.kind === 'error') throw new Error(`剧情不能继续 ${JSON.stringify(wait)}`);
  if (wait.kind === 'text') return campaignAction(state, { type: 'advance', token: wait.token });
  if (wait.kind === 'unfinished') return campaignAction(state, { type: 'reselect', token: wait.token });
  if (wait.kind === 'choice') return campaignAction(state, { type: 'choose', token: wait.token, index: state.sceneId === 'a007' ? 2 : 1 });
  if (wait.kind === 'end' && state.actId === 'prologue') return campaignAction(state, { type: 'enter-act1', token: wait.token });
  throw new Error('已经到达第一幕结束');
}
export function reachCampaignBattle(id: string, seed = 0): GameState {
  let state = startCampaign(storyLibrary, seed).state;
  for (let count = 0; count < 1200; count++) {
    if (state.screen === 'battle' && state.battle!.id === id) return state;
    state = campaignStep(state);
  }
  throw new Error(`未到达战斗 ${id}`);
}
export function winCurrentBattle(initial: GameState): GameState {
  let state = initial;
  for (let count = 0; count < 500; count++) {
    if (state.battle?.result) return state;
    state = campaignStep(state);
  }
  throw new Error('战斗超过步数上限');
}
