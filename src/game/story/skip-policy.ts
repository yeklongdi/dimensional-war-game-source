/** 仅批准这四处CALL；未知或将来的战斗不能借跳过入口自动开放。 */
export const skippableBattles = [
  'battle_prologue_tutorial', 'battle_black_humanoid',
  'battle_prologue4_patrol', 'battle_prologue4_deoxys_encounter',
] as const;
export const unbuiltBattles: readonly string[] = skippableBattles.slice(2);
export function skippedFlag(id: string): string | undefined {
  return skippableBattles.some(call => call === id) ? `flag_${id}_skipped` : undefined;
}
export const patrolSkipped = skippedFlag('battle_prologue4_patrol')!;
export const encounterSkipped = skippedFlag('battle_prologue4_deoxys_encounter')!;
export function lateSceneError(scene: string, flags: Readonly<Record<string, boolean>>): string | undefined {
  const index = /^c\d{3}$/.test(scene) ? Number(scene.slice(1)) : 0;
  if (index >= 4 && !flags[patrolSkipped]) return '尚未明确跳过巡逻队战斗，不能进入其后场景。';
  if (index >= 6 && !flags[encounterSkipped]) return '尚未明确跳过遭遇战，不能进入其后场景。';
  return undefined;
}
