import '../../styles/player.css';
import { PlayerView } from '../../game/ui/player-view.js';
import { emptyState } from '../../game/state.js';
import type { Action, GameState } from '../../game/state.js';
import { storyLibrary } from '../../game/story/library.js';
import { resumeScene } from '../../game/story/restore.js';
import { reduceGame } from '../../game/story/player.js';
import { element, button } from '../../game/ui/elements.js';
import { decodeImage } from '../../game/visual/loading.js';
import { rawBackgroundBindings } from '../../game/story/backgrounds.js';
import { levels } from '../../content/levels.js';

if (!import.meta.env.DEV) throw new Error('背景验收页仅开发服务器可用，不读写存档');
const style = element('style');
style.textContent = '#tools{position:fixed;z-index:80;right:8px;top:8px;width:285px;max-height:95vh;overflow:auto;padding:12px;background:#0b1424f5;border:1px solid #bca870;font:13px/1.6 sans-serif}#tools select,#tools button{width:100%;padding:6px;margin:5px 0;font:inherit}#tools pre{white-space:pre-wrap;font:12px/1.6 sans-serif}#app{position:relative;width:100vw;height:100dvh}';
document.head.append(style);
const root = element('div'); root.id = 'app';
const tools = element('aside'); tools.id = 'tools';
const scenes = element('select'), policy = element('select'), status = element('pre'), diagnostics = element('pre');
scenes.dataset.testid = 'scene'; scenes.setAttribute('aria-label', '场景头受控预览');
policy.dataset.testid = 'load-policy'; policy.setAttribute('aria-label', '下一个背景请求的IO条件');
for (const level of levels) for (const id of level.sceneIds) {
  const scene = storyLibrary[level.actId]!.scenes.find(item => item.id === id)!;
  const option = element('option', '', `${level.actId}/${id} ${scene.title}`);
  option.value = `${level.actId}|${id}`; scenes.append(option);
}
for (const [value, text] of [['normal', '正常解码'], ['delay', '等待手动释放后真实解码'], ['404', '请求不存在的图片'],
  ['invalid', '真实请求非图片文件并解码'], ['delay-invalid', '等待释放后解码失败']]) {
  const option = element('option', '', text); option.value = value!; policy.append(option);
}
let state: GameState = emptyState(100), serial = 100;
let holds: (() => void)[] = [];
const dispatch = (action: Action) => {
  if (action.type === 'warning') diagnostics.textContent += `${action.message}\n`;
  state = reduceGame(state, action, storyLibrary).state; render();
};
function createView() {
  return new PlayerView(root, dispatch, () => {}, undefined, { fixedTime: () => 0 }, undefined, {
    decode: async url => {
      const method = policy.value;
      if (method.startsWith('delay')) await new Promise<void>(resolve => { holds.push(resolve); updateStatus(); });
      if (method === '404') return decodeImage('/__background_missing_v1__.webp');
      if (method === 'invalid' || method === 'delay-invalid') return decodeImage('/tests/fixtures/not-an-image.txt');
      return decodeImage(url);
    },
  });
}
let view = createView();
function updateStatus() {
  const w = state.waiting;
  status.textContent = `开发场景头预览，不是正式存档／完整通关\n${state.actId}/${state.sceneId}\nbackground=${state.backgroundId}\n等待=${w?.kind} 节点=${w?.origin.nodeIndex}\n未释放请求=${holds.length}\nF2显示／隐藏工具`;
  Object.assign(root.dataset, { actId: state.actId, sceneId: state.sceneId, node: String(w?.origin.nodeIndex), backgroundId: state.backgroundId,
    flags: JSON.stringify(state.flags), pending: String(holds.length), scope: 'dev-only-no-storage' });
}
function render() { view.render(state); updateStatus(); }
function start() {
  const [actId, sceneId] = scenes.value.split('|');
  const base = emptyState(++serial);
  base.flags = { has_master_sword: true, link_summoned: true, prologue_3_complete: true };
  state = resumeScene(base, storyLibrary, actId!, sceneId!, serial).state; render();
}
const rebuild = button('重建视图并重试当前场景', 'rebuild', () => { view.dispose(); view = createView(); start(); });
const release = button('释放等待中的真实请求', 'release', () => {
  const current = holds; holds = []; for (const ready of current) ready(); updateStatus();
});
scenes.addEventListener('change', start);
const next = button('推进／补全文字', 'advance', () => {
  if (state.waiting?.kind === 'text') dispatch({ type: 'advance', token: state.waiting.token });
});
const audit = button('逐张真实解码全部34张运行图', 'decode-all', async () => {
  const urls = [...new Set(Object.values(rawBackgroundBindings))], results = [];
  for (const url of urls) {
    try { const image = await decodeImage(url); results.push({ url, width: image.naturalWidth, height: image.naturalHeight, loaded: true }); }
    catch { results.push({ url, loaded: false }); }
  }
  const report = element('pre'); report.dataset.testid = 'decode-report'; report.textContent = JSON.stringify(results);
  tools.querySelector('[data-testid="decode-report"]')?.remove(); tools.append(report);
});
tools.append(element('strong', '', '背景接入验收 · 开发专用'), scenes, policy, rebuild, next, release, audit,
  element('p', '', '无存档、无音频、无正式跳关。故障仅替换图片IO，复用真实PlayerView和解码器。'), status, diagnostics);
document.body.append(root, tools);
const keydown = (event: KeyboardEvent) => {
  if (event.code === 'F2' && !event.repeat) { event.preventDefault(); tools.hidden = !tools.hidden; }
  if (event.code === 'Space' && !event.repeat && event.target === view.stage && state.waiting?.kind === 'text') {
    event.preventDefault(); dispatch({ type: 'advance', token: state.waiting.token });
  }
};
document.addEventListener('keydown', keydown); start();
import.meta.hot?.dispose(() => { view.dispose(); for (const release of holds) release(); holds = []; document.removeEventListener('keydown', keydown); });
