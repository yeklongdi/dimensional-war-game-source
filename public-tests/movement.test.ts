import { describe, expect, it } from 'vitest';
import { createBattle } from '../src/game/battle/battle.js';
import { debugBattle, assembleCombatants } from '../src/game/battle/definitions.js';
import { sequence } from '../src/game/battle/dice.js';
import { connectWaypoints, resolveMovePath } from '../src/game/battle/move-path.js';
import { getUnit } from '../src/game/battle/state-helpers.js';

function demoBattle() {
  return createBattle(debugBattle, assembleCombatants(debugBattle), sequence([20, 10, 5]));
}

describe('battle movement preview core', () => {
  it('plans each waypoint with the shared route and counts every step', () => {
    const battle = demoBattle();
    const player = getUnit(battle, 'hero')!;
    const result = connectWaypoints(battle, player, [{ col: 2, row: 0 }, { col: 2, row: 2 }]);
    expect(result.reason).toBe('');
    expect(result.path.length).toBeGreaterThan(2);
    expect(result.path.at(-1)).toEqual({ col: 2, row: 2 });
    expect(resolveMovePath(battle, player, { col: 2, row: 2 }, result.path)).toEqual(result);
  });
  it('rejects a blocked explicit path without silently substituting another route', () => {
    const battle = demoBattle();
    const player = getUnit(battle, 'hero')!;
    const blocked = resolveMovePath(battle, player, { col: 3, row: 2 }, [{ col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 2 }]);
    expect(blocked.reason).not.toBe('');
    expect(blocked.path).toEqual([]);
  });
});