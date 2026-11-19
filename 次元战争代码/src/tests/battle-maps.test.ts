import { describe, expect, it } from 'vitest';
import { getBattleDefinition } from '../game/battle/definitions.js';
import { hasLineOfEffect, tile } from '../game/battle/grid.js';
import { battleMapMedia } from '../game/battle/map-assets.js';
import { createBattle } from '../game/battle/battle.js';
import { assembleCombatants } from '../game/battle/definitions.js';
import { seeded } from '../game/battle/dice.js';
import { getUnit } from '../game/battle/state-helpers.js';
import { openEncounter } from '../game/loop/encounters.js';
import { startLoop } from '../game/loop/progress.js';

describe('4K 动态战斗地图接入与格位对齐', () => {
  it('四张正式战斗地图均对应有效媒体资源与 14×10 格阵', () => {
    const prologue = createBattle(
      getBattleDefinition('battle_prologue_tutorial'),
      assembleCombatants(getBattleDefinition('battle_prologue_tutorial')),
      seeded(1),
    );
    const act1 = createBattle(
      getBattleDefinition('battle_black_humanoid'),
      assembleCombatants(getBattleDefinition('battle_black_humanoid')),
      seeded(2),
    );
    const loop = startLoop(0);
    const patrol = openEncounter(loop, 'patrol', true, 1);
    const first = openEncounter(loop, 'first', true, 2);
    const second = openEncounter(loop, 'second', true, 3);
    const boss = openEncounter(loop, 'boss', true, 4);

    const cases = [
      [prologue, 'warehouse'],
      [act1, 'alley'],
      [patrol, 'facility'],
      [first, 'facility'],
      [second, 'lab'],
      [boss, 'lab'],
    ] as const;

    for (const [battle, mapId] of cases) {
      expect(battle.mapAsset).toBe(mapId);
      expect(battle.grid.width).toBe(14);
      expect(battle.grid.height).toBe(10);
      expect(battleMapMedia[mapId].video).toMatch(new RegExp(`/assets/battle/maps-v1/${mapId}\\.webm$`));
      expect(battleMapMedia[mapId].poster).toMatch(new RegExp(`/assets/battle/maps-v1/${mapId}\\.webp$`));
      for (const unit of battle.units) {
        expect(tile(battle.grid, unit.position)).toBe('floor');
      }
    }
  });

  it('各遭遇的初始敌我之间与搭档站位均不被墙体阻断视线', () => {
    const loop = startLoop(0);
    for (const id of ['patrol', 'first', 'second', 'boss'] as const) {
      const battle = openEncounter(loop, id, true, 5);
      const hero = getUnit(battle, 'hero')!;
      const link = getUnit(battle, 'link')!;
      const enemy = getUnit(battle, 'demo_enemy')!;
      expect(hasLineOfEffect(battle.grid, hero.position, enemy.position)).toBe(true);
      expect(hasLineOfEffect(battle.grid, link.position, enemy.position)).toBe(true);
    }
  });
});
