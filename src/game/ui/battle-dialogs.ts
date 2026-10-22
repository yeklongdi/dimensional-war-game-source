import type { GameState } from '../state.js';
import type { Command } from '../battle/types.js';
import type { BattleAction } from '../battle/actions.js';
import { battleToken } from '../battle/state-helpers.js';
import { getBattleDefinition } from '../battle/definitions.js';
import { button, element } from './elements.js';

export function renderBattleDialog(root: HTMLElement, game: GameState, send: (command: Command) => void, dispatch: (action: BattleAction) => void) {
  const state = game.battle!, pending = state.pendingRoll, token = battleToken(state);
  root.replaceChildren(); root.hidden = !state.pendingReaction && !state.result && !pending;
  if (root.hidden) return;
  const panel = element('section', 'battle-dialog');
  if (pending) {
    const purpose = { initiative: '先攻', attack: '攻击', damage: '伤害', 'death-save': '死亡豁免' }[pending.kind];
    const sides = pending.kind === 'damage' ? pending.roll.sides : 20;
    const mode = pending.kind !== 'damage' && pending.roll.mode !== 'normal' ? pending.roll.mode === 'advantage' ? '，优势取高' : '，劣势取低' : '';
    panel.dataset.testid = 'inspiration-dialog';
    panel.append(element('h2', '', `英雄激励 · ${purpose}`), element('p', '', `原骰 d${sides}：${pending.roll.dice.join('、')}${mode}。可重掷其中一颗，必须采用新骰；当前判定尚未生效。`));
    pending.roll.dice.forEach((value, index) => panel.append(button(`重掷第${index + 1}颗（${value}）`, `inspiration-die-${index}`, () => send({ kind: 'inspire', dieIndex: index }))));
    panel.append(button('保留激励，采用原骰', 'inspiration-decline', () => send({ kind: 'inspire', dieIndex: null })));
  } else if (state.pendingReaction) {
    panel.append(element('h2', '', 'Player unit · reaction'), element('p', '', `${state.units.find(unit => unit.id === state.pendingReaction!.moving)!.name}将离开近战触及。选择攻击会消耗一次反应。`),
      button('借机攻击', 'reaction-attack', () => send({ kind: 'react', take: true })), button('放弃', 'reaction-decline', () => send({ kind: 'react', take: false })));
  } else if (state.result) {
    const formal = game.screen === 'battle', won = state.result.outcome === 'win';
    panel.append(element('h2', '', won ? '战斗胜利' : '战斗失败'), element('p', '', state.result.reason === 'stable' ? 'Player unit is stable but unable to continue.' : state.result.reason === 'dead' ? 'Player unit is defeated.' : getBattleDefinition(state.id).victoryText ?? 'All sample targets were defeated.'));
    panel.append(formal && won ? button('继续剧情', 'battle-continue-story', () => dispatch({ type: 'continue-story', token }))
      : button(formal ? '重试' : '重新开始', formal ? 'battle-retry' : 'battle-result-restart', () => dispatch({ type: 'restart', token })));
  }
  root.append(panel);
}
