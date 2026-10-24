import type { Action, GameState, StoryLibrary, Transition } from './state.js';
import type { BattleAction } from './battle/actions.js';
import { assembleCombatants, getBattleDefinition } from './battle/definitions.js';
import { createBattle, reduceBattle } from './battle/battle.js';
import { seeded } from './battle/dice.js';
import { active, battleToken, currentUnit } from './battle/state-helpers.js';
import { reduceGame, startGame } from './story/player.js';
import { reducePlanning, setBattleMode } from './battle/planning.js';
import { warning } from './state.js';
import { skippedFlag } from './story/skip-policy.js';

export type CampaignAction = Action | BattleAction | { type: 'skip-battle'; token: string };
export type CampaignTransition = Transition & { rejectedReason?: string };
export const victoryFlags: Readonly<Record<string, string>> = {
  battle_prologue_tutorial: 'flag_battle_prologue_tutorial_won',
  battle_black_humanoid: 'flag_battle_black_humanoid_won',
};

export function connectCall(transition: Transition): CampaignTransition {
  const state = transition.state, wait = state.waiting;
  if (state.screen !== 'story' || wait?.kind !== 'battle') return transition;
  const definition = structuredClone(getBattleDefinition(wait.battleId));
  const combatants = assembleCombatants(definition);
  const initialRng = seeded(state.campaignSeed!);
  const attempt = (state.battleSerial ?? 0) + 1;
  return { ...transition, state: { ...state, screen: 'battle', battleMode: 'idle', movementDraft: undefined, battleSerial: attempt,
    battle: createBattle(definition, combatants, initialRng, attempt),
    battleReturn: { battleId: wait.battleId, waitToken: wait.token, actId: state.actId, sceneId: state.sceneId,
      nodeIndex: state.nodeIndex, branch: structuredClone(state.branch), attempt, definition, combatants, initialRng } } };
}

export function startCampaign(library: StoryLibrary, seed: number): CampaignTransition {
  const transition = startGame(library);
  return connectCall({ ...transition, state: { ...transition.state, campaignSeed: seed >>> 0, battleSerial: 0 } });
}

export function reduceCampaign(previous: GameState, action: CampaignAction, library: StoryLibrary): CampaignTransition {
  const reject = (rejectedReason: string): CampaignTransition => ({ state: previous, effects: [], rejectedReason });
  if (previous.system && (previous.system.panel || previous.system.stale || previous.system.pending)
    && action.type !== 'warning' && action.type !== 'asset-failed') return reject('系统菜单已暂停底层操作');
  if (previous.screen === 'story') {
    if (['command', 'mode', 'plan', 'continue-story', 'skip-battle', 'complete-battle'].includes(action.type)) return reject('当前没有可接收的正式战斗操作');
    const transition = reduceGame(previous, action as Action, library);
    if (transition.state === previous) return transition;
    return connectCall({ ...transition, state: { ...transition.state, campaignSeed: previous.campaignSeed, battleSerial: previous.battleSerial } });
  }
  const battle = previous.battle, context = previous.battleReturn;
  if (previous.screen !== 'battle' || !battle || !context) return reject('当前没有正式战斗');
  if (action.type === 'plan') return { ...reducePlanning(previous, action), effects: [] };
  if (action.type === 'warning' || action.type === 'asset-failed') {
    const transition = reduceGame({ ...previous, screen: 'story' }, action, library);
    return { ...transition, state: { ...transition.state, screen: 'battle' } };
  }
  if (action.type === 'command') {
    const result = reduceBattle(battle, action.envelope);
    if (result.state === battle) return reject(result.rejectedReason ?? '操作未改变战斗');
    const keepMode = ['step', 'react', 'inspire', 'advance-turn', 'finish-opening'].includes(action.envelope.command.kind);
    return { effects: [], state: { ...previous, battle: result.state, movementDraft: undefined, battleMode: keepMode ? previous.battleMode : 'idle' } };
  }
  if (action.type !== 'mode' && action.type !== 'restart' && action.type !== 'continue-story' && action.type !== 'skip-battle') return reject('战斗中不接受剧情输入');
  if (action.token !== battleToken(battle)) return reject('战斗操作已过期');
  if (action.type === 'restart') {
    if (battle.result?.outcome !== 'lose') return reject('只有失败后可以重试本场');
    const attempt = (previous.battleSerial ?? 0) + 1;
    return { effects: [], state: { ...previous, battleSerial: attempt, battleMode: 'idle', movementDraft: undefined, battleReturn: { ...context, attempt },
      battle: createBattle(context.definition, context.combatants, structuredClone(context.initialRng), attempt) } };
  }
  if (action.type === 'continue-story' || action.type === 'skip-battle') {
    const wait = previous.waiting;
    const skipped = action.type === 'skip-battle' && battle.result?.outcome !== 'win';
    if ((!skipped && battle.result?.outcome !== 'win') || wait?.kind !== 'battle' || wait.token !== context.waitToken || wait.battleId !== battle.id || context.battleId !== battle.id
      || context.attempt !== battle.session || context.actId !== previous.actId || context.sceneId !== previous.sceneId || context.nodeIndex !== previous.nodeIndex
      || JSON.stringify(context.branch) !== JSON.stringify(previous.branch)) return reject('胜利或剧情返回上下文不匹配');
    const flag = victoryFlags[battle.id];
    if (!flag) return reject('未配置正式胜利标志');
    const restored: GameState = { ...previous, screen: 'story', battle: undefined, battleReturn: undefined, battleMode: undefined, movementDraft: undefined,
      flags: { ...previous.flags, [flag]: true }, warnings: { ...previous.warnings } };
    const effects: Transition['effects'] = [];
    if (skipped) {
      restored.flags[skippedFlag(battle.id)!] = true;
      warning(restored, effects, `skip:${battle.id}`, `已主动跳过战斗 ${battle.id}，按胜利返回原剧情。`);
    }
    // CALL 停等前已推进光标。只解除原等待，不增加光标，不硬跳下一场。
    const returned = connectCall(reduceGame(restored, { type: 'complete-battle', token: context.waitToken }, library));
    return { ...returned, effects: [...effects, ...returned.effects] };
  }
  if (action.type !== 'mode') return reject('当前不接受此输入');
  if (battle.result || battle.pendingMove || battle.pendingReaction || battle.pendingRoll || battle.opening || !active(currentUnit(battle)) || currentUnit(battle).team !== 'player') return reject('当前不能切换操作模式');
  if (action.mode === previous.battleMode) return { state: previous, effects: [] };
  return { state: setBattleMode(previous, action.mode), effects: [] };
}
