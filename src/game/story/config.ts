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
export const sfxBindings: Readonly<Record<string, string>> = {};
export const backgroundBindings: Readonly<Record<string, string>> = {};
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
