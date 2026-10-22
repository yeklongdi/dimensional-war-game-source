import '../../styles/player.css';
import { emptyState } from '../../game/state.js';
import type { Action, TextKind } from '../../game/state.js';
import { heroRecipes } from '../../game/visual/hero.js';
import { decodeImage } from '../../game/visual/loading.js';
import { PlayerView } from '../../game/ui/player-view.js';
import { button, element } from '../../game/ui/elements.js';
import { visualClock } from '../../game/ui/layered-figure.js';

if (!import.meta.env.DEV) throw new Error('仅开发服务器使用的视觉验收页');
const root = document.querySelector<HTMLElement>('#app')!;
const state = emptyState();
let sequence = 0, fixedTime: number | undefined = 0, fail = false, delay = false, disposed = false, requests = 0;
let selected = heroRecipes[0]!;
state.sceneId = 'portrait_lab'; state.sceneTitle = '分层候选验收 · 尚未通过视觉交付'; state.time = '白天';
const notes = element('pre');
const view = new PlayerView(root, (action: Action) => {
  if (action.type === 'warning') { notes.textContent += `${action.key}: ${action.message}\n`; return; }
  if (action.type === 'asset-failed') { state.failedAssets[action.id] = true; notes.textContent += `${action.message}\n`; return; }
  if (action.type === 'advance' && state.waiting?.kind === 'text') { state.waiting.revealed = Array.from(state.waiting.text).length; view.render(state); }
}, () => {}, undefined, { candidates: true, fixedTime: () => fixedTime,
  clock: { ...visualClock, request: tick => { panel.dataset.animationRequests = String(++requests); return visualClock.request(tick); } }, image: async url => {
  const reject = fail && url.endsWith('eyes-half-v2.png'), slow = delay;
  if (slow) await new Promise<void>(resolve => window.setTimeout(resolve, 1200));
  if (reject) throw new Error('受控单层失败，不标坏原静态 asset');
  return decodeImage(url);
} });
function setWait(kind: TextKind, revealed: number): void {
  state.waiting = { kind: 'text', textKind: kind, speaker: kind === 'dialogue' || kind === 'inner' ? '男高' : undefined,
    text: '开发验收文字：此处只验证分层、窗口、口型与回退，不添加正式剧情。\n人物下部应延伸到半透明文字窗后。', revealed,
    token: `lab:${++sequence}`, origin: { nodeIndex: 0 } };
  view.render(state);
}
function show(): void {
  state.actors['男高'] = { actor: '男高', visible: true, position: 'center', asset: 'char_male_high_normal', pose: selected.pose, expression: selected.expression };
  setWait('dialogue', 6);
}
const panel = element('aside');
panel.style.cssText = 'position:fixed;z-index:100;left:8px;top:8px;width:260px;max-height:92vh;overflow:auto;background:#101721e8;padding:12px;font-size:12px;line-height:1.5';
panel.append(element('p', '', '开发样板页：只有普通平静有完整候选图，其余组合明确回退。候选不是视觉交付。'));
for (const recipe of heroRecipes) panel.append(button(`${recipe.pose}／${recipe.expression}`, recipe.id, () => { selected = recipe; show(); }));
for (const [kind, label] of [['dialogue', '台词逐字'], ['inner', '心声'], ['narration', '旁白'], ['stage', '舞台说明']] as const) {
  panel.append(button(label, `text-${kind}`, () => setWait(kind, 6)));
}
panel.append(button('补全文字', 'complete-text', () => setWait('dialogue', 999)),
  button('动画播放／冻结', 'animate', () => { fixedTime = fixedTime === undefined ? 0 : undefined; view.render(state); }),
  button('固定半闭眼 4050ms', 'half-eye', () => { fixedTime = 4050; view.render(state); }),
  button('固定闭眼 4130ms', 'closed-eye', () => { fixedTime = 4130; view.render(state); }),
  button('固定口型 125ms', 'mouth-open', () => { fixedTime = 125; setWait('dialogue', 6); }),
  button('多人同槽／复原', 'peers', () => {
    if (state.actors['同学甲']) delete state.actors['同学甲'];
    else state.actors['同学甲'] = { actor: '同学甲', visible: true, position: 'center' };
    view.render(state);
  }), button('切换可见性', 'visibility', () => { state.actors['男高']!.visible = !state.actors['男高']!.visible; view.render(state); }),
  button('延迟加载开关（下次请求）', 'delay-load', () => { delay = !delay; panel.dataset.delay = String(delay); }),
  button('单层失败开关（重建实例）', 'fail-layer', () => { fail = !fail; ++state.run; show(); }),
  button('重建／恢复定格', 'restore', () => { ++state.run; show(); }),
  button('释放视图', 'dispose-view', () => { if (!disposed) { disposed = true; view.dispose(); } }), notes);
root.append(panel); show();
import.meta.hot?.dispose(() => view.dispose());
