import type { LocationId } from './map-locations.js';

export type LevelId = 'prologue_01' | 'prologue_02' | 'prologue_03' | 'act1_01' | 'act1_02' | 'act1_03' | 'act1_04';
export type LevelDefinition = {
  id: LevelId; name: string; actId: 'prologue' | 'act1'; locationId: LocationId;
  sceneIds: readonly string[]; prerequisiteLevelId?: LevelId;
};
export const levels: readonly LevelDefinition[] = [
  { id: 'prologue_01', name: '搬入奶奶家', actId: 'prologue', locationId: 'grandma_home', sceneIds: ['p001', 'p002', 'p003', 'p004'] },
  { id: 'prologue_02', name: '仓库区事件', actId: 'prologue', locationId: 'old_warehouse', sceneIds: ['p005', 'p006', 'p007'], prerequisiteLevelId: 'prologue_01' },
  { id: 'prologue_03', name: '回家与睡前', actId: 'prologue', locationId: 'grandma_home', sceneIds: ['p008', 'p009'], prerequisiteLevelId: 'prologue_02' },
  { id: 'act1_01', name: '上学途中与校门', actId: 'act1', locationId: 'school_road', sceneIds: ['a001', 'a002', 'a003'], prerequisiteLevelId: 'prologue_03' },
  { id: 'act1_02', name: '教室与校园导览', actId: 'act1', locationId: 'high_school', sceneIds: ['a004', 'a005', 'a006', 'a007', 'a008'], prerequisiteLevelId: 'act1_01' },
  { id: 'act1_03', name: '施工区事件', actId: 'act1', locationId: 'construction_site', sceneIds: ['a009', 'a010', 'a011', 'a012', 'a013', 'a014'], prerequisiteLevelId: 'act1_02' },
  { id: 'act1_04', name: '返回学校与幕结束', actId: 'act1', locationId: 'high_school', sceneIds: ['a015', 'a016'], prerequisiteLevelId: 'act1_03' },
];
export const levelIds = levels.map(level => level.id);
export const levelById = (id: string) => levels.find(level => level.id === id);
export const levelForScene = (actId: string, sceneId: string) => levels.find(level => level.actId === actId && level.sceneIds.includes(sceneId));
export const currentLevel = (completed: readonly LevelId[]) => levels[completed.length];
export const visibleLevels = (completed: readonly LevelId[]) => levels.slice(0, Math.min(levels.length, completed.length + 1));
export type MapEdge = { from: LocationId; to: LocationId; latest: boolean };
export function progressEdges(completed: readonly LevelId[]): MapEdge[] {
  const edges = new Map<string, MapEdge>();
  const count = Math.min(completed.length, levels.length - 1);
  for (let index = 0; index < count; index++) {
    const from = levels[index]!.locationId, to = levels[index + 1]!.locationId;
    const key = [from, to].sort().join(':');
    for (const edge of edges.values()) edge.latest = false;
    edges.set(key, { from, to, latest: index === count - 1 });
  }
  return [...edges.values()];
}
export const levelExits: Readonly<Record<LevelId, { sceneId: string; target?: string }>> = {
  prologue_01: { sceneId: 'p004', target: 'p005' }, prologue_02: { sceneId: 'p007', target: 'p008' },
  prologue_03: { sceneId: 'p009' }, act1_01: { sceneId: 'a003', target: 'a004' },
  act1_02: { sceneId: 'a008', target: 'a009' }, act1_03: { sceneId: 'a014', target: 'a015' }, act1_04: { sceneId: 'a016' },
};
