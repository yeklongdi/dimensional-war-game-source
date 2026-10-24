import type { ActorState } from '../state.js';
import { assetUrl } from '../asset-url.js';
import { heroHalfPortrait } from './hero-half.js';

const folder = '/assets/portraits/prologue-v2/';
type StaticEntry = { base: string; expressions?: Readonly<Record<string, string>>; poses?: Readonly<Record<string, string>> };
/** 只匹配脚本显式状态；不读取对白、不推断情绪。未知人物保持原占位。 */
export const staticPortraits: Readonly<Record<string, StaticEntry>> = {
  char_thief_masked_black_placeholder: { base: 'thief-action' },
  char_thief_smile: { base: 'thief-daily-smile', expressions: {
    '意外': 'thief-daily-alert', '有趣、微笑': 'thief-daily-smile', '带笑，观察男高': 'thief-daily-smile',
    '认真': 'thief-daily-serious', '郑重': 'thief-daily-serious',
  }, poses: { '收起面罩': 'thief-unmasked-action-smile', '靠墙简短解释': 'thief-unmasked-action-serious',
    '侧身介绍同伴': 'thief-unmasked-action-serious', '放低声音，提出约定': 'thief-unmasked-action-serious' } },
  char_link_silent_placeholder: { base: 'link-calm', expressions: {
    '专注': 'link-guard', '冷静，警戒': 'link-guard', '观察，克制': 'link-calm', '警戒': 'link-guard',
    '观察': 'link-calm', '冷静': 'link-guard', '戒备': 'link-guard', '集中': 'link-guard', '安静': 'link-calm',
  }, poses: { '将旧布裹住的剑垂在身侧': 'link-wrapped' } },
  char_saber_traveler_placeholder: { base: 'saber-calm', expressions: {
    '沉着': 'saber-calm', '平静': 'saber-calm', '警戒': 'saber-alert', '耐心有限': 'saber-impatient',
  } },
  char_deoxys_normal_placeholder: { base: 'deoxys-normal' },
  char_deoxys_defense_placeholder: { base: 'deoxys-defense' },
};
const heroSeated: Readonly<Record<string, string>> = {
  '得意': 'hero-seated-proud', '热血、得意': 'hero-seated-proud', '轻松，偶尔走神': 'hero-seated-calm',
  '疑惑，疲惫': 'hero-seated-alert', '茫然，逐渐警觉': 'hero-seated-alert', '惊魂未定，疑惑': 'hero-seated-alert', '疑惑': 'hero-seated-alert',
};
const heroSeats = new Set(['坐在沙发上', '坐在餐桌旁，校服袖口挽起', '坐在床沿，解开旧布',
  '重新坐在饭桌旁', '从床上坐起，扶着被子', '坐在床沿，侧耳倾听']);
export function staticPortrait(actor: ActorState): { url: string; key: string; frame: 'waist' | 'bust'; diagnostic?: string } | undefined {
  let file: string | undefined;
  if (actor.asset === 'char_male_high_normal') {
    if (heroSeats.has(actor.pose ?? '')) file = heroSeated[actor.expression ?? ''];
    if (actor.pose === '持剑、准备保护虚拟主播' && actor.expression === '震惊、警戒') file = 'hero-sword-guard';
  } else {
    const entry = actor.asset ? staticPortraits[actor.asset] : undefined;
    if (entry) file = entry.poses?.[actor.pose ?? ''] ?? entry.expressions?.[actor.expression ?? ''] ?? entry.base;
  }
  return file ? { url: assetUrl(`${folder}${file}.png`), key: `static-v2:${file}`, frame: 'waist' } : heroHalfPortrait(actor);
}
export const staticBindings: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(staticPortraits).map(([asset, entry]) => [asset, assetUrl(`${folder}${entry.base}.png`)]),
);
