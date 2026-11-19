import { createBattle } from '../battle/battle.js';
import { getUnit } from '../battle/state-helpers.js';
import type { Attack, BattleDefinition, BattleMapId, Combatant, Point } from '../battle/types.js';
import type { GameState } from '../state.js';
import { assembleHero } from './characters.js';
import { encounterNames } from './config.js';
import { winEncounter } from './progress.js';
import type { EncounterId, LoopCheckpoint } from './types.js';

const sword: Attack = { id: 'flying_sword', name: '凌空剑', kind: 'melee', bonus: 15, reach: 2, damage: '4d6+8', damageType: 'slashing',
  magical: true, extraDamage: { damage: '8d8', damageType: 'radiant' } };
export const link: Combatant = {
  id: 'link', name: '金发青年', team: 'player', abilities: { str: 26, dex: 22, con: 26, int: 25, wis: 25, cha: 30 },
  ac: 21, maxHp: 297, initiativeBonus: 20, speed: 50, flightSpeed: 150,
  features: ['loop_bonus', 'magic_resistance'],
  attacks: [sword, { ...sword, id: 'flying_sword_ranged', kind: 'ranged', reach: undefined, range: { normal: 24, max: 24 } }],
  resistances: [], immunities: ['poison', 'radiant'], vulnerabilities: [],
};
type Encounter = { mapAsset: BattleMapId; map: string[]; linkPos: Point; hp: number; ac: number; bonus: number; damage: string; ranged?: true };

const facilityBase = [
  '.#.XX#####XX.X',
  '.#...#.####X.X',
  '.#............',
  '.#X...........',
  '.#...#....#..X',
  '.#.XX#....#...',
  '.#####....#XX#',
  '......#..#####',
  '......#.......',
  '......#.......',
];

const labBase = [
  'X.X..X.##...##',
  'X.X..X.......#',
  '............##',
  '........X...##',
  '........X...##',
  'X...........##',
  'X...........##',
  '..X..X........',
  '#########.....',
  '#########.....',
];

const withSpawns = (rows: readonly string[], hero: Point, enemy: Point) => rows.map((row, r) =>
  Array.from(row).map((ch, c) => (c === hero.col && r === hero.row ? 'H' : c === enemy.col && r === enemy.row ? 'E' : ch)).join(''));

/** 演示暂定配置。棋子和关卡标题为玩法占位；场地与遮挡贴合 4K 动态地图。 */
const encounters: Record<EncounterId, Encounter> = {
  patrol: { mapAsset: 'facility', map: withSpawns(facilityBase, { col: 5, row: 3 }, { col: 9, row: 3 }), linkPos: { col: 5, row: 2 }, hp: 5, ac: 11, bonus: 2, damage: '1d4' },
  first: { mapAsset: 'facility', map: withSpawns(facilityBase, { col: 4, row: 3 }, { col: 9, row: 3 }), linkPos: { col: 5, row: 2 }, hp: 8, ac: 11, bonus: 2, damage: '1d4' },
  second: { mapAsset: 'lab', map: withSpawns(labBase, { col: 4, row: 4 }, { col: 9, row: 4 }), linkPos: { col: 4, row: 3 }, hp: 7, ac: 11, bonus: 2, damage: '1d4', ranged: true },
  boss: { mapAsset: 'lab', map: withSpawns(labBase, { col: 4, row: 2 }, { col: 9, row: 2 }), linkPos: { col: 4, row: 3 }, hp: 16, ac: 12, bonus: 3, damage: '1d6' },
};

export function loopBattleTitle(id: EncounterId) { return encounterNames[id] + '（演示）'; }
export function openEncounter(loop: LoopCheckpoint, encounter: EncounterId, withLink: boolean, session: number) {
  const config = encounters[encounter], id = 'demo_enemy';
  const melee: Attack = { id: 'drill_strike', name: '演示近战', kind: 'melee', reach: 1, bonus: config.bonus,
    damage: config.damage, damageType: 'bludgeoning' };
  const enemy: Combatant = {
    id, name: '演示敌人', team: 'enemy', abilities: { str: 10, dex: config.ranged ? 12 : 10, con: 10, int: 10, wis: 10, cha: 10 },
    ac: config.ac, maxHp: config.hp, speed: 25, attacks: [melee],
    features: config.ranged ? ['prefer_ranged'] : [], resistances: [], immunities: [], vulnerabilities: [],
  };
  if (config.ranged) enemy.attacks.push({ ...melee, id: 'drill_shot', name: '演示远程', kind: 'ranged', range: { normal: 4, max: 12 }, damageType: 'piercing' });
  const definition: BattleDefinition = {
    id: 'battle_loop_' + encounter, title: loopBattleTitle(encounter), map: config.map, mapAsset: config.mapAsset,
    spawnOrder: withLink ? ['hero', id, 'link'] : ['hero', id],
  };
  const positions: Readonly<Record<string, Point>> | undefined = withLink ? { link: config.linkPos } : undefined;
  return createBattle(definition, withLink ? [assembleHero(loop.hero), enemy, link] : [assembleHero(loop.hero), enemy], loop.rng, session, positions,
    { hero: loop.hero, items: loop.items, divineAid: loop.divineAid, sync: loop.sync });
}

export function settleEncounter(state: GameState): LoopCheckpoint | undefined {
  const { postPrologue: loop, battle, postBattle } = state;
  if (!loop || loop.phase.kind !== 'deploy' || !battle?.loop || battle.result?.outcome !== 'win'
    || !postBattle || battle.session !== postBattle.session || battle.rng.kind !== 'seeded') return undefined;
  const hero = getUnit(battle, 'hero')!;
  return winEncounter({ ...loop, rng: battle.rng, items: battle.loop.items, divineAid: battle.loop.divineAid,
    linkUses: loop.linkUses - Number(postBattle.withLink),
    hero: { ...battle.loop.hero, hp: Math.max(1, hero.hp), tempHp: hero.tempHp } }, loop.phase.encounter);
}
