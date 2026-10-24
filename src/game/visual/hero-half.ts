import type { ActorState } from '../state.js';
import { assetUrl } from '../asset-url.js';

export type HeroMood = 'friendly' | 'alert' | 'worried' | 'tired' | 'pained' | 'angry' | 'surprised' | 'excited';
const groups: Readonly<Record<HeroMood, readonly string[]>> = {
  friendly: ['默认平静', '疑惑', '好奇、友善', '好奇', '怀念、轻松', '轻松、准备出门', '放松、微笑', '装作平静', '轻松，偶尔走神'],
  alert: ['被吸引、犹豫', '震惊、警戒', '犹豫，决定', '认真、出头', '疑惑、警惕', '警惕', '戒备', '紧张，集中', '困惑，警惕', '认真', '担忧，坚定'],
  worried: ['困倦、慌张', '着急', '匆忙', '麻烦、担心', '尴尬、担心', '担心，松一口气', '焦急'],
  tired: ['疑惑，疲惫', '吃力，清醒', '紧张，疲惫'],
  pained: ['痛苦，重新集中精神', '挣扎，求生'],
  angry: ['愤怒，困倦'],
  surprised: ['茫然，逐渐警觉', '震惊', '惊魂未定，疑惑', '紧张，随后惊讶', '惊讶'],
  excited: ['自信、急着出门', '自信、兴奋', '期待', '兴奋、好奇', '紧张、期待', '得意', '热血、得意', '期待、认真'],
};
/** 精确登记剧本EXPRESSION，不读取对白，也不按当前说话者猜情绪。 */
export const heroExpressionPortraits: Readonly<Record<string, HeroMood>> = Object.fromEntries(
  Object.entries(groups).flatMap(([mood, expressions]) => expressions.map(expression => [expression, mood as HeroMood])),
);
export function heroHalfPortrait(actor: ActorState) {
  if (actor.asset !== 'char_male_high_normal') return undefined;
  const mood = heroExpressionPortraits[actor.expression ?? '默认平静'];
  const bed = actor.pose === '躺在床上、刚醒' || actor.pose === '躺在床上、望向天花板';
  const name = bed ? actor.expression === '困倦、慌张' ? 'bed-sleepy' : 'bed-awake' : mood ?? 'friendly';
  const file = `hero-half-${name}`;
  const knownBed = ['困倦、慌张', '自信、急着出门', '期待、认真'].includes(actor.expression ?? '');
  const diagnostic = bed ? knownBed ? undefined : `男高「${actor.pose}」当前表情尚未制作，使用已登记的躺靠半身回退，不用站姿替代。`
    : !mood ? '男高表情尚未登记，使用默认透明半身回退；未猜测情绪。'
    : `男高「${actor.pose ?? '未指定姿态'}」的完整动作尚未制作，当前使用对应透明半身表情回退。`;
  return { url: assetUrl(`/assets/portraits/hero-half-v1/${file}.png`), key: `half-v1:${file}`, frame: 'bust' as const, diagnostic };
}
