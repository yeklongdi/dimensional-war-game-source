import type { BattleEvent, BattleState, D20Roll } from './types.js';
import { tutorialText } from './tutorial.js';

const statusNames = { active: '苏醒', unconscious: '昏迷、倒地、失能', stable: '稳定（尚未苏醒）', dead: '死亡', defeated: '被击败' };
const actionNames = { dash: '疾走：动作已消耗，增加等于速度的移动力', disengage: '撤离：动作已消耗，本回合移动不引发借机', dodge: '回避：动作已消耗，持续到下次自身回合开始' };
const typeNames = { bludgeoning: '钝击', slashing: '挥砍', piercing: '穿刺', acid: '酸', cold: '冷', fire: '火', lightning: '闪电', thunder: '雷鸣', necrotic: '暗蚀', poison: '毒素', radiant: '光耀' };
function d20(roll: D20Roll) {
  const mode = roll.mode === 'advantage' ? '优势' : roll.mode === 'disadvantage' ? '劣势' : '普通';
  return `d20(${roll.dice.join(',')})${roll.dice.length > 1 ? `取${roll.chosen}` : ''} [${mode}]`;
}
export function formatEvent(state: BattleState, event: BattleEvent): string {
  const name = (id: string) => state.units.find(unit => unit.id === id)?.name ?? id;
  switch (event.kind) {
    case 'initiative': return `先攻第${event.rank}位 ${name(event.actor)}：${d20(event.roll)}+${event.bonus}=${event.total}`;
    case 'turn': return `第 ${event.round} 轮 · ${name(event.actor)}回合开始，刷新回合资源及反应`;
    case 'move': return `${name(event.actor)} (${event.from.col},${event.from.row})→(${event.to.col},${event.to.row})，消耗5尺，剩余${event.remaining}尺`;
    case 'attack': {
      const sources = [...event.advantages.map(item => `优势：${item}`), ...event.disadvantages.map(item => `劣势：${item}`)];
      if (event.cover) sources.push('方向性半身掩护 +2 AC');
      return `${name(event.actor)}→${name(event.target)} ${event.source === 'reaction' ? '借机' : event.source === 'bonus' ? '附赠' : '动作'}·${event.attack}：${d20(event.roll)}+${event.bonus}=${event.total} vs AC${event.ac}，${event.hit ? event.critical ? '命中·重击' : '命中' : '失误'}${sources.length ? `；${sources.join('；')}` : ''}`;
    }
    case 'damage': {
      const roll = event.roll, report = event.report;
      return `伤害 ${roll.expression}${roll.critical ? '（重击加倍骰子）' : ''}：d${roll.sides}(${roll.dice.join(',')})${roll.modifier >= 0 ? '+' : ''}${roll.modifier}=${roll.total} ${typeNames[event.damageType]}；${report.modifiers.join('、') || '无伤害减免'}→${report.adjusted}；临时HP ${report.tempBefore}→${report.tempAfter}；${name(event.target)} HP ${report.hpBefore}→${report.hpAfter}${report.failureAdded ? `；死亡失败 +${report.failureAdded}` : ''}`;
    }
    case 'condition': return `${name(event.actor)}：${statusNames[event.status]}`;
    case 'death-save': return `${name(event.actor)} 死亡豁免 ${d20(event.roll)} vs DC10，成功${event.successes}/失败${event.failures}；${({ revived: '天然20，恢复1HP并清除昏迷、倒地', dead: '死亡', stable: '稳定、失去战斗能力', success: '成功', failure: '失败' } as Record<string, string>)[event.outcome]}`;
    case 'reaction': return `${name(event.actor)}对${name(event.target)}：${event.decision === 'pending' ? '等待选择借机攻击，移动暂停' : event.decision === 'attack' ? '借机攻击，消耗反应' : '放弃借机，保留反应、不掷骰'} `;
    case 'resource': return `${name(event.actor)} ${actionNames[event.action]}`;
    case 'ai': return `AI ${name(event.actor)}：${event.decision === 'move' ? `移动至(${event.destination?.col},${event.destination?.row})` : event.decision === 'attack' ? `攻击${name(event.target ?? '')}` : '结束回合'}`;
    case 'temp-hp': return `剑形灼痕共鸣：获得${event.amount}点临时生命值`;
    case 'tutorial': return `教学：${tutorialText[event.notice]}`;
    case 'inspiration': return `${name(event.actor)} 英雄激励·${({ initiative: '先攻', attack: '攻击', damage: '伤害', 'death-save': '死亡豁免' })[event.purpose]}：原骰(${event.original.join(',')})；${event.replacement === undefined ? '保留，不掷新骰' : `替换第${event.dieIndex! + 1}颗→${event.replacement}，必须采用新骰`}；最终骰(${event.adopted.join(',')})，采用值${event.chosen}；剩余${event.remaining}点`;
    case 'result': return event.outcome === 'win' ? '胜利：敌人全部被击败' : event.reason === 'stable' ? '失败：男高已稳定，但失去战斗能力（未死亡）' : '失败：男高死亡';
  }
}
