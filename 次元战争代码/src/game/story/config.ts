import overridesJson from '../../content/overrides.json';
import audioMapJson from '../../content/audio-map.json';
import { assetBindings } from '../asset-url.js';
import { staticBindings } from '../visual/static-portraits.js';

type Overrides = {
  displayNames: Record<string, Record<string, string>>;
  portraits: Record<string, string>;
  sceneHides: Record<string, Record<string, string[]>>;
  battleHides: Record<string, string[]>;
  stageNotes: Record<string, Record<string, string[]>>;
  choiceReturns: { actId: string; sceneId: string; optionIndex: number; metaNodeIndex: number }[];
};
export const overrides: Overrides = { ...overridesJson, portraits: { ...assetBindings(overridesJson.portraits), ...staticBindings } };
export const bgmBindings: Readonly<Record<string, string>> = assetBindings(audioMapJson);
/** 战斗打击反馈音效：本地程序合成，缺失时 AudioController 静默跳过。 */
export const sfxBindings: Readonly<Record<string, string>> = assetBindings({
  fx_whiff: '/assets/audio/sfx/fx_whiff.wav', fx_punch: '/assets/audio/sfx/fx_punch.wav',
  fx_blade: '/assets/audio/sfx/fx_blade.wav', fx_arrow: '/assets/audio/sfx/fx_arrow.wav',
  fx_cast: '/assets/audio/sfx/fx_cast.wav', fx_fire: '/assets/audio/sfx/fx_fire.wav',
  fx_frost: '/assets/audio/sfx/fx_frost.wav', fx_spark: '/assets/audio/sfx/fx_spark.wav',
  fx_acid: '/assets/audio/sfx/fx_acid.wav', fx_force: '/assets/audio/sfx/fx_force.wav',
  fx_necrotic: '/assets/audio/sfx/fx_necrotic.wav', fx_radiant: '/assets/audio/sfx/fx_radiant.wav',
  fx_crit: '/assets/audio/sfx/fx_crit.wav', fx_save: '/assets/audio/sfx/fx_save.wav',
  fx_fail: '/assets/audio/sfx/fx_fail.wav', fx_heal: '/assets/audio/sfx/fx_heal.wav',
  fx_ward: '/assets/audio/sfx/fx_ward.wav', fx_down: '/assets/audio/sfx/fx_down.wav',
});
export { backgroundBindings } from './backgrounds.js';
export const textInterval = 30;
export type Slot = 'far-left' | 'left' | 'center' | 'right' | 'far-right';
const slots: Readonly<Record<string, Slot>> = {
  left: 'left', bottom_left: 'left', right: 'right', top_right: 'right',
  center: 'center', front: 'center', center_front: 'center', bottom_center: 'center',
  bed: 'center', kitchen: 'center', door: 'center',
  window: 'far-left', far: 'far-left', back_left: 'far-left',
  back: 'far-right', back_right: 'far-right',
};
export const slotX: Readonly<Record<Slot, number>> = {
  'far-left': 180, left: 410, center: 640, right: 870, 'far-right': 1100,
};
export function placement(position: string) {
  return { slot: slots[position] ?? 'center', rear: position.startsWith('back'), known: position in slots };
}
export function displayName(actId: string, actor: string) {
  return overrides.displayNames[actId]?.[actor] ?? actor;
}
export function displayStoryText(actId: string, text: string) {
  return actId === 'act1' ? text.replace(/前排的怪盗|怪盗/g, displayName(actId, '怪盗')) : text;
}
export function actorColor(actor: string) {
  const hash = Array.from(actor).reduce((value, char) => ((value * 31) + char.codePointAt(0)!) >>> 0, 0);
  return `hsl(${hash % 360} 32% 27%)`;
}
export function timeGradient(time: string) {
  if (/地下/.test(time)) return 'linear-gradient(145deg, #0b0e14, #252330)';
  if (/深夜|夜晚|入夜/.test(time)) return 'linear-gradient(145deg, #0b1325, #253443)';
  if (/黄昏|傍晚/.test(time)) return 'linear-gradient(145deg, #253044, #785441)';
  if (/清晨/.test(time)) return 'linear-gradient(145deg, #304e61, #9b926d)';
  return 'linear-gradient(145deg, #304759, #68776c)';
}
