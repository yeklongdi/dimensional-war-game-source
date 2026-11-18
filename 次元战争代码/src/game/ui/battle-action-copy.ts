import type { AbilityId } from '../battle/types.js';
import type { ActionIcon } from './battle-action-icons.js';

type Presentation = { icon: ActionIcon; tone: string; description: string; shortName?: string };

/** 仅解释现有结算；数值和可用条件仍由战斗规则提供。 */
export const abilityPresentation: Record<AbilityId, Presentation> = {
  fire_bolt: { icon: 'fire', tone: 'fire', description: '远程法术攻击，命中造成 1d10 火焰伤害。' },
  ray_of_frost: { icon: 'frost', tone: 'cold', description: '远程法术攻击，命中造成 1d8 冷冻伤害，并暂时降低目标速度。' },
  shocking_grasp: { icon: 'lightning', tone: 'lightning', description: '近战法术攻击，命中造成 1d8 闪电伤害，并暂时阻止目标发动借机攻击。' },
  poison_spray: { icon: 'poison', tone: 'poison', description: '远程法术攻击，命中造成 1d12 毒素伤害。' },
  acid_splash: { icon: 'acid', tone: 'acid', description: '选择范围中心，中心及相邻一格内的单位进行敏捷豁免，失败受到 1d6 强酸伤害。会波及友方。' },
  sorcerous_burst: { icon: 'burst', tone: 'arcane', description: '远程法术攻击，命中造成 1d8 所选类型伤害；掷出 8 时按现有规则追加伤害骰。' },
  magic_missile: { icon: 'missile', tone: 'arcane', description: '三枚飞弹集中命中选定敌人，每枚造成 1d4+1 力场伤害，无需攻击检定。' },
  burning_hands: { icon: 'fire', tone: 'fire', description: '选择相邻一格作为施放方向。15 尺锥形内的单位进行敏捷豁免，失败受到 3d6 火焰伤害，成功减半。会波及友方。' },
  mage_armor: { icon: 'shield', tone: 'cold', description: '为自己施加护甲防护，使护甲等级变为 13＋敏捷调整值，持续至长休。' },
  false_life: { icon: 'heart', tone: 'poison', description: '获得 2d4+4 临时生命值，与现有临时生命值取较高值。' },
  second_wind: { icon: 'wind', tone: 'healing', description: '使用附赠动作，为自己恢复 1d10+1 生命值。' },
  innate_sorcery: { icon: 'burst', tone: 'arcane', description: '激活先天术法，暂时使法术攻击具有优势，并提高法术豁免难度。' },
  healing_potion: { icon: 'potion', tone: 'healing', description: '饮用或给相邻同伴使用一瓶药水，恢复 2d4+2 生命值。' },
  missile_scroll: { icon: 'scroll', tone: 'arcane', shortName: '飞弹卷轴', description: '消耗一张卷轴施放魔法飞弹：三枚飞弹集中命中选定敌人，不消耗法术位。' },
  acid: { icon: 'acid', tone: 'acid', description: '投向 20 尺内的一名敌人，目标进行敏捷豁免，失败受到 2d6 强酸伤害。' },
  divine_aid: { icon: 'heart', tone: 'healing', shortName: '至圣援护', description: '为自己或相邻同伴恢复 4d8+10 生命值，消耗一次至圣援护。' },
  slaying_bow: { icon: 'bow', tone: 'gold', description: '目标进行敏捷豁免；失败且生命值不高于 100 时死亡，否则受到 4d8+6 穿刺与 8d8 光耀伤害。' },
  multiattack: { icon: 'swords', tone: 'gold', shortName: '双重剑击', description: '以凌空剑攻击选定敌人两次。第一击已使目标倒下时，不再追加第二击。' },
  multiattack_bow: { icon: 'bow', tone: 'gold', shortName: '剑弓连击', description: '对选定敌人先使用凌空剑，再使用杀戮神弓。第一击使目标倒下时停止。' },
};
