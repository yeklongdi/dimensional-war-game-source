import type { LocationId } from './map-locations.js';

export type LevelId = 'sample_level_1' | 'sample_level_2';
export type LevelDefinition = {
  id: LevelId; name: string; actId: 'prologue' | 'act1'; locationId: LocationId;
  sceneIds: readonly string[]; prerequisiteLevelId?: LevelId;
};
export const levels: readonly LevelDefinition[] = [
  { id: 'sample_level_1', name: 'Sample level one', actId: 'prologue', locationId: 'sample_site_1', sceneIds: ['p001'] },
  { id: 'sample_level_2', name: 'Sample level two', actId: 'act1', locationId: 'sample_site_2', sceneIds: ['a001'], prerequisiteLevelId: 'sample_level_1' },
];
export const levelIds = levels.map(level => level.id);
export const levelById = (id: string) => levels.find(level => level.id === id);
export const levelForScene = (actId: string, sceneId: string) => levels.find(level => level.actId === actId && level.sceneIds.includes(sceneId));
export const currentLevel = (completed: readonly LevelId[]) => levels[completed.length];
export const visibleLevels = (completed: readonly LevelId[]) => levels.slice(0, Math.min(levels.length, completed.length + 1));
export type MapEdge = { from: LocationId; to: LocationId; latest: boolean };
export function progressEdges(completed: readonly LevelId[]): MapEdge[] {
  if (completed.length === 0) return [];
  return [{ from: levels[0]!.locationId, to: levels[1]!.locationId, latest: completed.length === 1 }];
}
export const levelExits: Readonly<Record<LevelId, { sceneId: string; target?: string }>> = {
  sample_level_1: { sceneId: 'p001' },
  sample_level_2: { sceneId: 'a001' },
};