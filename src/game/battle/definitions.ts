import combatantsJson from '../../content/combatants.json';
import battlesJson from '../../content/battles.json';
import type { BattleDefinition, Combatant } from './types.js';

export const combatants = combatantsJson as Combatant[];
export function getBattleDefinition(id: string): BattleDefinition {
  const definition = (battlesJson as BattleDefinition[]).find(battle => battle.id === id);
  if (!definition) throw new Error(`找不到战斗配置 ${id}`);
  return definition;
}
export const debugBattle = getBattleDefinition('battle_debug_core');

/** 装配模板副本，禁止污染共享男高与其他战斗。 */
export function assembleCombatants(definition: BattleDefinition): Combatant[] {
  return definition.spawnOrder.map(id => {
    const source = combatants.find(unit => unit.id === id);
    if (!source) throw new Error(`找不到单位 ${id}`);
    const unit = structuredClone(source);
    if (unit.team === 'player' && definition.heroLoadout?.primary) unit.attacks.unshift(structuredClone(definition.heroLoadout.primary));
    return unit;
  });
}
