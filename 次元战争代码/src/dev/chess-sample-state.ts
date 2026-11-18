import { createBattle } from '../game/battle/battle.js';
import { combatants } from '../game/battle/definitions.js';
import { sequence } from '../game/battle/dice.js';
import { assembleHero } from '../game/loop/characters.js';
import { startLoop } from '../game/loop/progress.js';
import { emptyState } from '../game/state.js';
import type { BattleDefinition } from '../game/battle/types.js';

export type ChessScenario = 'melee' | 'cast' | 'area' | 'down';
export const scenarioNames: Record<ChessScenario, string> = { melee: '徒手交战', cast: '法术演出', area: '范围反馈', down: '倒地反馈' };

/** 仅用于样例的临时编排，正式数值与关卡不受影响，存档接口不参与。 */
export function chessSampleGame(scenario: ChessScenario, run: number) {
  const loop = startLoop(0), caster = scenario === 'cast' || scenario === 'area';
  loop.hero.classId = caster ? 'wizard' : 'monk'; loop.hero.hp = caster ? 7 : 10;
  loop.hero.wizard.cantrips = ['fire_bolt', 'acid_splash', 'shocking_grasp'];
  loop.items = { healing_potion: 2, missile_scroll: 1, acid: 1 };
  const enemies = structuredClone(combatants.filter(unit => unit.id === 'black_a' || unit.id === 'black_b'));
  if (scenario === 'down') enemies[0]!.maxHp = 1;
  const definition: BattleDefinition = { id: 'battle_chess_sample', title: '棋子交战样例',
    map: ['.......', '.......', '..HEE..', '.......', '.......'], spawnOrder: ['hero', 'black_a', 'black_b'] };
  // 演出样例采用固定合法骰序，使首次近战命中、范围反馈可重复审阅。
  const dice = caster ? [20, 1, 1, ...Array(200).fill(1)] : [20, 1, 1, 18, 3, 18, 2, 18, 2, ...Array(200).fill(1)];
  const battle = createBattle(definition, [assembleHero(loop.hero), ...enemies], sequence(dice), run, undefined,
    { hero: loop.hero, items: loop.items, divineAid: loop.divineAid, sync: loop.sync });
  return { ...emptyState(run), screen: 'battle-debug' as const, battleMode: 'idle' as const, battle };
}
