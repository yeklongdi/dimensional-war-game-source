import type { LocationId } from '../../content/map-locations.js';
import { classNames, demo, demoTitle, encounterNames, events, items, slotNames } from '../loop/config.js';
import { assembleHero } from '../loop/characters.js';
import { visibleEvents } from '../loop/progress.js';
import { loopToken } from '../loop/route.js';
import type { ItemId, LoopAction, LoopCheckpoint, LoopIntent } from '../loop/types.js';
import type { GameState } from '../state.js';
import { button, element } from './elements.js';
import { buildPicker } from './loop-build.js';

type Dispatch = (action: LoopAction) => void;
export function sendLoop(state: GameState, dispatch: Dispatch, intent: LoopIntent) {
  return () => dispatch({ type: 'loop', token: loopToken(state), intent });
}
export function calendarLabel(loop: LoopCheckpoint): string {
  const days = demo.days[loop.cycle]!;
  return '第 ' + (loop.cycle + 1) + ' 周期 · 第 ' + loop.day + '/' + days + ' 天 · ' + slotNames[loop.slot] + ' · 剩余 ' + (days - loop.day + 1) + ' 天';
}
function actionButton(state: GameState, dispatch: Dispatch, title: string, id: string, intent: LoopIntent, disabled = false) {
  const node = button(title, id, sendLoop(state, dispatch, intent));
  node.disabled = disabled || state.progress?.status === 'saving';
  return node;
}
function shop(state: GameState, dispatch: Dispatch) {
  const loop = state.postPrologue!, section = element('section', 'loop-shop');
  section.append(element('h3', '', '补给商店'), element('p', '', '资金 ' + loop.gold + ' · 演示暂定配置'));
  for (const id of Object.keys(items) as ItemId[]) {
    const item = items[id], row = element('div', 'loop-shop-row');
    row.append(element('strong', '', item.name + ' ×' + loop.items[id]), element('span', '', item.description),
      actionButton(state, dispatch, '购买 · ' + item.price, 'loop-buy-' + id, { kind: 'buy', id }, loop.gold < item.price));
    section.append(row);
  }
  return section;
}

function summary(loop: LoopCheckpoint) {
  const unit = assembleHero(loop.hero);
  return classNames[loop.hero.classId] + ' 1 级 · HP ' + loop.hero.hp + '/' + unit.maxHp + ' · AC ' + unit.ac
    + ' · 资金 ' + loop.gold + ' · 金发青年出战 ' + loop.linkUses + ' 次';
}

export function locationActions(state: GameState, location: LocationId, dispatch: Dispatch): HTMLElement {
  const loop = state.postPrologue!, content = element('div', 'loop-location-actions');
  for (const event of visibleEvents(loop, location, state.flags)) {
    const label = event.label + ' · 1 时段' + (event.reward ? ' · +' + event.reward + ' 资金' : '');
    content.append(actionButton(state, dispatch, label, 'loop-event-' + event.id, { kind: 'event', id: event.id }));
  }
  if (location === 'grandma_home') {
    const details = element('details', 'loop-respec');
    const opener = element('summary', '', '玩游戏洗点'); opener.dataset.testid = 'loop-respec';
    details.append(opener, buildPicker(state, choice => sendLoop(state, dispatch, { kind: 'respec', choice })()));
    if (loop.slot === 'night') content.append(actionButton(state, dispatch, '与金发青年交流后休息', 'loop-sync', { kind: 'sync' }),
      actionButton(state, dispatch, '直接休息', 'loop-sleep', { kind: 'sleep' }));
    else content.append(actionButton(state, dispatch, '短休 · 1 时段', 'loop-home-rest', { kind: 'rest', rest: 'short' }));
    content.append(details);
  }
  if (!content.childElementCount) content.append(element('p', '', '当前时段没有可用行动。'));
  return content;
}

export class LoopMapHud {
  readonly root = element('section', 'loop-map-hud');
  private readonly controls = element('nav', 'loop-hud-controls');
  private readonly panel = element('section', 'loop-hud-panel');
  private readonly status = element('p', 'loop-hud-status');
  private selected?: 'shop' | 'status' | 'intel' | 'skip';
  private state?: GameState;
  private renderKey = '';
  private readonly dispatch: Dispatch;
  constructor(dispatch: Dispatch, closeLocation: () => void) {
    this.dispatch = dispatch;
    this.root.hidden = true;
    for (const [id, label] of [['shop', '商店'], ['status', '状态'], ['intel', '情报'], ['skip', '跳过今日']] as const) {
      this.controls.append(button(label, 'loop-' + id, () => {
        this.selected = this.selected === id ? undefined : id;
        if (this.selected) closeLocation();
        if (this.state) this.render(this.state);
      }));
    }
    this.status.setAttribute('aria-live', 'polite');
    this.root.append(this.controls, this.status, this.panel);
    this.root.addEventListener('click', event => event.stopPropagation());
  }
  close() {
    if (!this.selected) return;
    this.selected = undefined;
    if (this.state) this.render(this.state);
  }
  render(state: GameState) {
    this.state = state;
    const loop = state.postPrologue;
    this.root.hidden = !loop;
    if (!loop) return;
    const key = loopToken(state) + ':' + state.progress?.status + ':' + this.selected;
    if (key === this.renderKey) return;
    this.renderKey = key;
    this.status.textContent = state.loopNotice ?? summary(loop);
    this.panel.replaceChildren();
    this.panel.hidden = !this.selected;
    if (this.selected === 'shop') this.panel.append(shop(state, this.dispatch));
    if (this.selected === 'status') {
      const unit = assembleHero(loop.hero), scores = unit.abilities;
      this.panel.append(element('h3', '', '当前构筑'), element('p', '', summary(loop)),
        element('p', '', '力 ' + scores.str + ' / 敏 ' + scores.dex + ' / 体 ' + scores.con + ' / 智 ' + scores.int + ' / 感 ' + scores.wis + ' / 魅 ' + scores.cha),
        element('p', '', '经验 ' + loop.xp + ' · 同步率 ' + loop.sync), element('h3', '', '背包'));
      for (const id of Object.keys(items) as ItemId[]) this.panel.append(element('p', '', items[id].name + ' ×' + loop.items[id]));
    }
    if (this.selected === 'intel') {
      this.panel.append(element('h3', '', '男高的情报日志'));
      if (loop.clues.length === 0) this.panel.append(element('p', '', '暂无新情报。'));
      for (const event of events) if (loop.clues.includes(event.id)) this.panel.append(element('p', '', event.label + ' · 内容待接入'));
    }
    if (this.selected === 'skip') {
      const go = actionButton(state, this.dispatch, '确认跳过今日', 'loop-skip-confirm', { kind: 'skip_day' });
      go.addEventListener('click', () => this.close());
      this.panel.append(element('h3', '', '结束今天？'), element('p', '', '执行当晚长休和排定幕间剧。今日余下时段的行动收益会略过。'), go);
    }
    if (this.selected) this.panel.append(button('关闭', 'loop-panel-close', () => this.close()));
  }
}

export class LoopView {
  readonly stage = element('main', 'stage loop-stage');
  private readonly panel = element('section', 'loop-card');
  private readonly dispatch: Dispatch;
  private key = '';
  constructor(root: HTMLElement, dispatch: Dispatch) {
    this.dispatch = dispatch;
    this.stage.id = 'stage'; this.stage.dataset.testid = 'loop-stage';
    this.stage.append(this.panel); root.append(this.stage);
  }
  dispose() { this.stage.remove(); }
  render(state: GameState) {
    const loop = state.postPrologue!, phase = loop.phase;
    const key = loopToken(state) + ':' + state.progress?.status;
    if (key === this.key) return;
    this.key = key;
    Object.assign(this.stage.dataset, { phase: phase.kind, day: String(loop.day), cycle: String(loop.cycle + 1),
      linkUses: String(loop.linkUses), encounter: phase.kind === 'deploy' ? phase.encounter : '' });
    const ack = (title: string) => actionButton(state, this.dispatch, title, 'loop-continue', { kind: 'ack' });
    this.panel.replaceChildren(element('p', 'eyebrow', demoTitle + ' · 演示暂定配置'),
      element('p', 'loop-day-label', calendarLabel(loop)));
    switch (phase.kind) {
      case 'intro': this.panel.append(element('h1', '', '第 1 周期'), element('p', '', '第五幕剧情待接入。'), ack('开始备战')); break;
      case 'interlude': this.panel.append(element('h1', '', phase.moment === 'night' ? '夜末幕间剧' : '清晨幕间剧'),
        element('p', '', '其他视角剧情待接入。'), ack('继续日程')); break;
      case 'crisis': this.panel.append(element('h1', '', '截止日 · 大副本'), element('p', '', '危机剧情待接入。接下来进入副本流程。'), ack('进入副本')); break;
      case 'deploy': this.panel.append(element('h1', '', encounterNames[phase.encounter]),
        element('p', '', '演示战斗 · ' + summary(loop)),
        actionButton(state, this.dispatch, '男高独自出战', 'loop-deploy-solo', { kind: 'deploy', withLink: false }),
        actionButton(state, this.dispatch, '召唤金发青年 · 1 次', 'loop-deploy-link', { kind: 'deploy', withLink: true }, loop.linkUses < 1));
        if (phase.encounter === 'patrol') this.panel.append(actionButton(state, this.dispatch, '返回地图', 'loop-cancel-deploy', { kind: 'cancel_deploy' }));
        break;
      case 'safe': this.panel.append(element('h1', '', '安全点'), element('p', '', state.loopNotice ?? summary(loop)),
        actionButton(state, this.dispatch, '短休', 'loop-rest-short', { kind: 'rest', rest: 'short' }, phase.rested),
        actionButton(state, this.dispatch, '长休', 'loop-rest-long', { kind: 'rest', rest: 'long' }, phase.rested),
        ack('前往下一战'), shop(state, this.dispatch)); break;
      case 'settlement': this.panel.append(element('h1', '', '副本通关'), element('p', '', '通关后的主线剧情待接入。'),
        element('p', '', summary(loop)), ack(loop.cycle === demo.days.length - 1 ? '完成演示' : '进入下一周期')); break;
      case 'complete': this.panel.append(element('h1', '', '演示完成'), element('p', '', summary(loop))); break;
    }
  }
  showHint(text: string) {
    const hint = this.panel.querySelector('.loop-hint') ?? element('p', 'loop-hint');
    hint.textContent = text; this.panel.append(hint);
  }
}
