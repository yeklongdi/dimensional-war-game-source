import '../../styles/player.css';
import { PlayerView } from '../../game/ui/player-view.js';
import { emptyState } from '../../game/state.js';
import type { GameState } from '../../game/state.js';
import { resumeScene } from '../../game/story/restore.js';
import { reduceGame } from '../../game/story/player.js';
import { storyLibrary } from '../../game/story/library.js';
import { decodeImage, loadLayers } from '../../game/visual/loading.js';
import { heroRecipes } from '../../game/visual/hero.js';
import { element, button } from '../../game/ui/elements.js';
import { LayeredFigure, visualClock } from '../../game/ui/layered-figure.js';
import { portraitMetricGroups, portraitTransform } from '../../game/visual/portrait-metrics.js';

if (!import.meta.env.DEV) throw new Error('仅开发验收，不进入生产，不读写存档');
const root = document.querySelector<HTMLElement>('#app')!;
const panel = element('aside'); panel.dataset.testid = 'layout-tools';
panel.style.cssText = 'position:fixed;left:8px;top:8px;z-index:100;width:218px;max-height:90vh;overflow:auto;padding:10px;background:#0c1422e8;font:12px/1.5 sans-serif';
const label = element('p', '', '受控演出页，不是新档流程；F2隐藏工具。');
const select = element('select'); select.dataset.testid = 'layout-scene'; select.style.width = '100%';
for (const act of Object.values(storyLibrary)) for (const scene of act.scenes) {
  const option = element('option', '', `${scene.id} · ${scene.title}`); option.value = `${act.id}|${scene.id}`; select.append(option);
}
let state: GameState = emptyState(), serial = 800, fixedTime: number | undefined = 0, fail = false, slow = false;
let requests = 0, frames = 0, closeKeyframes: (() => void) | undefined;
const warnings = element('pre'); warnings.style.whiteSpace = 'pre-wrap';
const view = new PlayerView(root, action => {
  if (action.type === 'warning' || action.type === 'asset-failed') { warnings.textContent += `${action.message}\n`; return; }
  state = reduceGame(state, action, storyLibrary).state; paint();
}, () => {}, undefined, { fixedTime: () => fixedTime,
  clock: { ...visualClock, request: tick => { panel.dataset.frames = String(++frames); return visualClock.request(tick); } },
  image: async url => {
    panel.dataset.requests = String(++requests);
    const rejected = fail && /eyes-.*-half\.png$/.test(url), delayed = slow;
    if (delayed) await new Promise<void>(resolve => window.setTimeout(resolve, 900));
    if (rejected) throw new Error('受控分层失败');
    return decodeImage(url);
  },
});
function paint() {
  view.render(state); panel.dataset.state = JSON.stringify({ scene: state.sceneId, run: state.run, token: state.waiting?.token,
    flags: state.flags, actors: state.actors, kind: state.waiting?.kind, fast: !!state.fastForward });
}
function scene() {
  const [act, id] = select.value.split('|');
  state = resumeScene(emptyState(), storyLibrary, act!, id!, ++serial, undefined).state; paint();
}
select.onchange = scene;
function sample(index: number) {
  const recipe = heroRecipes[index]!;
  state = { ...emptyState(++serial), sceneId: 'sample', actors: { 男高: { actor: '男高', visible: true, position: 'center',
    asset: 'char_male_high_normal', pose: recipe.pose, expression: recipe.expression } }, waiting: {
    kind: 'text', token: `sample:${serial}`, origin: { nodeIndex: 0 }, textKind: 'dialogue', speaker: '男高', text: '受控画面验收，非正式剧情。', revealed: 5 } };
  paint();
}
panel.append(label, select, button('场景头重建', 'layout-rebuild', scene),
  button('推进／补全', 'layout-next', () => { if (state.waiting?.kind === 'text') { state = reduceGame(state, { type: 'advance', token: state.waiting.token }, storyLibrary).state; paint(); } }),
  button('模拟快进显示', 'layout-fast', () => { state.fastForward = state.fastForward ? undefined : { run: state.run, revision: 1 }; paint(); }),
  button('暂停／恢复动画', 'layout-pause', () => { state.progress = state.progress ? undefined : { confirming: true,
    completedLevelIds: [], status: 'ready', message: '', request: 0, navigation: 0 }; paint(); }),
  button('单层失败（下次重建）', 'layout-fail', () => { fail = !fail; panel.dataset.fail = String(fail); }),
  button('延迟加载（下次请求）', 'layout-delay', () => { slow = !slow; panel.dataset.delay = String(slow); }),
  button('动画播放／冻结', 'layout-animate', () => { fixedTime = fixedTime === undefined ? 0 : undefined; paint(); }));
heroRecipes.forEach((recipe, i) => panel.append(button(`${recipe.pose}／${recipe.expression}`, `sample-${i}`, () => sample(i))));
for (const [time, name] of [[0, '静止'], [4130, '闭眼'], [125, '口型']] as const) panel.append(button(name, `layout-frame-${time}`, () => { fixedTime = time; paint(); }));
panel.append(button('准备动作三关键帧', 'layout-keyframes', () => { closeKeyframes?.(); void keyframes().then(close => { closeKeyframes = close; }); }),
  button('男高在场但候补（受控）', 'layout-hidden-hero', () => {
    sample(0); state.actors = { 一: { actor: '一', visible: true, position: 'left' }, 二: { actor: '二', visible: true, position: 'center' },
      三: { actor: '三', visible: true, position: 'right' }, 男高: state.actors['男高']! };
    state.sceneId = 'hidden-fixture'; state.waiting = null; paint();
  }),
  button('候补更新准备姿态（受控）', 'layout-hidden-update', () => {
    const recipe = heroRecipes[4]!; Object.assign(state.actors['男高']!, { pose: recipe.pose, expression: recipe.expression }); paint();
  }),
  button('男高测试台词换入', 'layout-hero-speak', () => {
    state.waiting = { kind: 'text', token: `lab:${++serial}`, origin: { nodeIndex: 0 }, textKind: 'dialogue', speaker: '男高',
      text: '仅受控换入与动画测试。', revealed: 5 }; paint();
  }),
  button('四人候补对白', 'layout-fourth', () => {
    const a = state.actors['金发青年']; if (!a?.visible) return;
    state.waiting = { kind: 'text', token: `lab:${++serial}`, origin: { nodeIndex: 0 }, textKind: 'dialogue', speaker: a.actor,
      text: '仅受控换入测试，不添加正式台词。', revealed: 999 }; paint();
  }), warnings);
document.body.append(panel);
select.value = new URLSearchParams(location.search).get('scene') ?? 'prologue_4|c009'; scene();
const key = (e: KeyboardEvent) => { if (e.code === 'F2' && !e.repeat) panel.hidden = !panel.hidden; };
document.addEventListener('keydown', key);
import.meta.hot?.dispose(() => { closeKeyframes?.(); view.dispose(); document.removeEventListener('keydown', key); });

async function keyframes(): Promise<() => void> {
  const recipe = heroRecipes[4]!, images = await loadLayers(recipe, decodeImage), figures: LayeredFigure[] = [];
  const overlay = element('section'); overlay.dataset.testid = 'layout-motion';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:300;background:#293a48;display:flex;justify-content:center;gap:20px';
  const close = () => { figures.forEach(figure => figure.dispose()); overlay.remove(); };
  for (const time of [0, 425, 850]) {
    const column = element('div'); column.style.cssText = 'position:relative;width:400px;height:720px;overflow:hidden;border:1px solid #8693a0';
    let now = 0; const figure = new LayeredFigure(recipe, images, { now: () => now, request: () => 0, cancel: () => {} }, 0);
    now = time; figure.sync(false, true, 1050); figures.push(figure);
    const transform = portraitTransform(portraitMetricGroups.layered, 200);
    Object.assign(figure.root.style, { left: `${transform.left}px`, top: `${transform.top}px`, transform: `scale(${transform.scale})` });
    const label = element('p', '', `${time}ms · 外层0.47（不改内部坐标）`); label.style.cssText = 'position:absolute;bottom:0;font-size:14px';
    column.append(figure.root, label); overlay.append(column);
  }
  const buttonClose = button('关闭关键帧', 'layout-motion-close', close); buttonClose.style.cssText = 'position:absolute;right:10px;top:10px;width:auto';
  overlay.append(buttonClose); document.body.append(overlay); return close;
}
