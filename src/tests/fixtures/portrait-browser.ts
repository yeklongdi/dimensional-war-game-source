import '../../styles/player.css';
import { emptyState } from '../../game/state.js';
import type { Action, TextKind } from '../../game/state.js';
import { heroRecipes } from '../../game/visual/hero.js';
import { decodeImage, loadLayers } from '../../game/visual/loading.js';
import { PlayerView } from '../../game/ui/player-view.js';
import { button, element } from '../../game/ui/elements.js';
import { LayeredFigure, visualClock } from '../../game/ui/layered-figure.js';
import { showKeyframes } from './portrait-keyframes.js';

if (!import.meta.env.DEV) throw new Error('仅开发服务器使用的视觉验收页');
const root = document.querySelector<HTMLElement>('#app')!;
const state = emptyState();
let sequence = 0, fixedTime: number | undefined = 0, fail = false, delay = false, disposed = false, requests = 0;
let selected = heroRecipes[0]!;
let pendingImages = 0, completedImages = 0;
let background = '#435867', closeKeyframes: (() => void) | undefined;
state.sceneId = 'portrait_lab'; state.sceneTitle = ''; state.time = '白天';
const notes = element('pre');
const view = new PlayerView(root, (action: Action) => {
  if (action.type === 'warning') { notes.textContent += `${action.key}: ${action.message}\n`; return; }
  if (action.type === 'asset-failed') { state.failedAssets[action.id] = true; notes.textContent += `${action.message}\n`; return; }
  if (action.type === 'advance' && state.waiting?.kind === 'text') { state.waiting.revealed = Array.from(state.waiting.text).length; paint(); }
}, () => {}, undefined, { candidates: true, fixedTime: () => fixedTime,
  clock: { ...visualClock, request: tick => { panel.dataset.animationRequests = String(++requests); return visualClock.request(tick); } }, image: async url => {
  panel.dataset.pendingImages = String(++pendingImages);
  const reject = fail && /eyes-\w+-half\.png$/.test(url), slow = delay;
  try {
    if (slow) await new Promise<void>(resolve => window.setTimeout(resolve, 1200));
    if (reject) throw new Error('受控单层失败，不标坏原静态 asset');
    return await decodeImage(url);
  } finally { panel.dataset.pendingImages = String(--pendingImages); panel.dataset.completedImages = String(++completedImages); }
} });
function paint(): void {
  view.render(state);
  const backdrop = view.stage.querySelector<HTMLElement>('.backdrop');
  if (backdrop) backdrop.style.background = background;
}
function setWait(kind: TextKind, revealed: number, speaker = '男高'): void {
  state.waiting = { kind: 'text', textKind: kind, speaker: kind === 'dialogue' || kind === 'inner' ? speaker : undefined,
    text: '开发验收文字：此处只验证分层、窗口、口型与回退，不添加正式剧情。\n人物下部应延伸到半透明文字窗后。', revealed,
    token: `lab:${++sequence}`, origin: { nodeIndex: 0 } };
  paint();
}
function show(): void {
  state.actors['男高'] = { actor: '男高', visible: true, position: 'center', asset: 'char_male_high_normal', pose: selected.pose, expression: selected.expression };
  setWait('dialogue', 6);
}
const panel = element('aside');
panel.dataset.testid = 'portrait-lab-panel'; panel.dataset.pendingImages = '0';
panel.style.cssText = 'position:fixed;z-index:100;left:8px;top:8px;width:260px;max-height:92vh;overflow:auto;background:#101721e8;padding:12px;font-size:12px;line-height:1.5';
panel.append(element('p', '', `男高五组合视觉验收：${heroRecipes.filter(recipe => recipe.approved).length}/5已批准。F2隐藏／恢复工具。`));
for (const recipe of heroRecipes) panel.append(button(`${recipe.pose}／${recipe.expression}`, recipe.id, () => { selected = recipe; show(); }));
for (const [kind, label] of [['dialogue', '台词逐字'], ['inner', '心声'], ['narration', '旁白'], ['stage', '舞台说明']] as const) {
  panel.append(button(label, `text-${kind}`, () => setWait(kind, 6)));
}
panel.append(button('场外角色台词（不自动上场）', 'offscreen-speaker', () => {
  setWait('dialogue', 6, '场外角色');
}));
panel.append(button('补全文字', 'complete-text', () => setWait('dialogue', 999)),
  button('验证只替换差分（不代表新表情）', 'check-layer-reuse', () => {
    void (async () => {
      const recipe = heroRecipes[0]!, images = await loadLayers(recipe, decodeImage);
      const figure = new LayeredFigure(recipe, images), original = figure.root;
      const body = original.querySelector('[data-layer="body"]'), head = original.querySelector('[data-layer="head"]');
      const eyes = original.querySelector('[data-layer="eyes"]'), unchanged = eyes?.children[1];
      figure.updateRecipe({ ...recipe, id: 'fixture-controlled-difference', layers: recipe.layers.map(layer => layer.channel === 'eyes'
        ? { ...layer, frames: [layer.frames[1]!, ...layer.frames.slice(1)] } : layer) }, images);
      const result = { rootSame: figure.root === original, bodySame: original.querySelector('[data-layer="body"]') === body,
        headSame: original.querySelector('[data-layer="head"]') === head, eyesSame: original.querySelector('[data-layer="eyes"]') === eyes,
        unchangedFrameSame: eyes?.children[1] === unchanged, visibleFrames: original.querySelectorAll('.portrait-layer img:not([hidden])').length };
      figure.dispose(); panel.dataset.layerReuse = JSON.stringify(result); notes.textContent += `差分替换验证：${JSON.stringify(result)}\n`;
    })().catch(error => { panel.dataset.layerReuse = JSON.stringify({ error: String(error) }); });
  }),
  button('动画播放／冻结', 'animate', () => { fixedTime = fixedTime === undefined ? 0 : undefined; paint(); }),
  button('静止与闭嘴 0ms', 'rest-frame', () => { fixedTime = 0; setWait('dialogue', 999); }),
  button('呼吸上点 1050ms', 'breath-up', () => { fixedTime = 1050; paint(); }),
  button('呼吸下点 3150ms', 'breath-down', () => { fixedTime = 3150; paint(); }),
  button('固定半闭眼 4050ms', 'half-eye', () => { fixedTime = 4050; paint(); }),
  button('固定闭眼 4130ms', 'closed-eye', () => { fixedTime = 4130; paint(); }),
  button('固定口型 125ms', 'mouth-open', () => { fixedTime = 125; setWait('dialogue', 6); }),
  button('多人同槽／复原', 'peers', () => {
    if (state.actors['同学甲']) delete state.actors['同学甲'];
    else state.actors['同学甲'] = { actor: '同学甲', visible: true, position: 'center' };
    paint();
  }), button('切换可见性', 'visibility', () => { state.actors['男高']!.visible = !state.actors['男高']!.visible; paint(); }),
  button('浅色背景', 'background-light', () => { background = '#f2ece1'; paint(); }),
  button('深色背景', 'background-dark', () => { background = '#152033'; paint(); }),
  button('准备动作三关键帧', 'action-keyframes', () => {
    closeKeyframes?.(); void showKeyframes(heroRecipes[4]!).then(dispose => { closeKeyframes = dispose; });
  }),
  button('未覆盖坐姿（明确回退）', 'unsupported-pose', () => { state.actors['男高']!.pose = '坐在沙发上'; paint(); }),
  button('延迟加载开关（下次请求）', 'delay-load', () => { delay = !delay; panel.dataset.delay = String(delay); }),
  button('单层失败开关（重建实例）', 'fail-layer', () => { fail = !fail; ++state.run; show(); }),
  button('重建／恢复定格', 'restore', () => { ++state.run; show(); }),
  button('释放视图', 'dispose-view', () => { if (!disposed) { disposed = true; view.dispose(); } }), notes);
root.append(panel); show();
const toolsKey = (event: KeyboardEvent) => { if (event.code === 'F2' && !event.repeat) { event.preventDefault(); panel.hidden = !panel.hidden; } };
document.addEventListener('keydown', toolsKey);
import.meta.hot?.dispose(() => { closeKeyframes?.(); document.removeEventListener('keydown', toolsKey); view.dispose(); });
