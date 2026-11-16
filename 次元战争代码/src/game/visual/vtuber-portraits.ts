import type { ActorState } from '../state.js';
import { assetUrl } from '../asset-url.js';

const asset = 'char_virtual_streamer_shy';
const folder = '/assets/portraits/vtuber-v1/';
export const vtuberBindings: Readonly<Record<string, string>> = { [asset]: assetUrl(`${folder}vtuber-shy.png`) };

/** 只匹配脚本显式状态；专用姿态优先，避免继承的表情覆盖电脑／躺姿。 */
const poses: Readonly<Record<string, string>> = {
  '缩在角落座位上，面前支着打开的笔记本电脑，指尖轻落键盘': 'vtuber-laptop-focus',
  '猛地一激灵，双手飞快压合笔记本电脑盖子，连人带椅往后缩贴墙壁': 'vtuber-laptop-guard',
  '稍微坐直身子，双手抱紧合上的电脑，重重点头': 'vtuber-laptop-guard',
  '肩膀紧绷，用力点头': 'vtuber-laptop-guard',
  '下巴抵在电脑外壳边沿，再次重重点头': 'vtuber-laptop-guard',
  '点完第四下头后僵在椅子上，指尖微抖，眼神躲闪': 'vtuber-laptop-guard',
  '单手抬起电脑一角抽出旧书，双手捧着推过桌面': 'vtuber-book-offer',
  '望着门口方向抬起半只手，小声提醒': 'vtuber-reminder',
  '趴在坑边、即将失去意识': 'vtuber-pit-collapse',
  '昏迷': 'vtuber-unconscious',
  '躺在病床上，逐渐醒来': 'vtuber-bed-awake',
};
const expressions: Readonly<Record<string, string>> = {
  '默认平静': 'vtuber-shy', '平静': 'vtuber-shy', '疑惑': 'vtuber-shy',
  '紧张': 'vtuber-shy', '紧张、躲避视线': 'vtuber-shy',
  '微笑': 'vtuber-smile', '浅笑': 'vtuber-smile', '放松': 'vtuber-smile',
  '害羞': 'vtuber-embarrassed', '害羞、耳朵发红': 'vtuber-embarrassed',
  '受惊': 'vtuber-startled', '震惊': 'vtuber-startled', '恐惧': 'vtuber-startled',
  '害怕、焦虑': 'vtuber-startled', '受惊，慌乱戒备': 'vtuber-startled',
  '不安': 'vtuber-tense', '认真': 'vtuber-tense', '认真，紧张': 'vtuber-tense',
  '微怔，强装镇定': 'vtuber-tense', '神情严肃，紧绷': 'vtuber-tense', '心虚，震惊，发白': 'vtuber-tense',
};

export function vtuberPortrait(actor: ActorState): { url: string; key: string; frame: 'waist'; diagnostic?: string } | undefined {
  if (actor.asset !== asset) return undefined;
  const pose = poses[actor.pose ?? ''];
  const file = pose ?? expressions[actor.expression ?? ''] ?? 'vtuber-shy';
  return { url: assetUrl(`${folder}${file}.png`), key: `vtuber-v1:${file}`, frame: 'waist',
    diagnostic: actor.pose && !pose ? `虚拟主播「${actor.pose}」使用静态半身代演，完整动作尚未制作。` : undefined };
}
