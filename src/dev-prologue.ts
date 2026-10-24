import './styles/player.css';
import { PlayerView } from './game/ui/player-view.js';
import { emptyState } from './game/state.js';
import type { Action, GameState } from './game/state.js';
import { storyLibrary } from './game/story/library.js';
import { resumeScene } from './game/story/restore.js';
import { reduceGame } from './game/story/player.js';
import { element, button } from './game/ui/elements.js';
import inventory from '../docs/verification/prologue-v2/visual-inventory.json';
import registration from '../art/prologue-v2/registration.json';
import halfRegistration from '../art/hero-half-v1/registration.json';
import { assetUrl } from './game/asset-url.js';

if (!import.meta.env.DEV) throw new Error('开发预览不在生产环境开放');
const style = element('style');
style.textContent = `body{display:grid;grid-template-columns:270px 1fr;height:100dvh} .preview-controls{padding:16px;overflow:auto;background:#151b25;font-size:14px;z-index:10} .preview-controls select,.preview-controls button{width:100%;margin:8px 0;padding:8px;font:inherit} #preview-root{position:relative;overflow:hidden} .preview-status{white-space:pre-wrap} .contact-sheet{position:fixed;inset:0;z-index:30;overflow:auto;background:#25374a;padding:60px 18px 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px} .contact-sheet.light{background:#e6e4de;color:#111} .contact-sheet figure{margin:0;text-align:center;border:1px solid #8885} .contact-sheet img{display:block;width:100%;height:340px;object-fit:contain} .contact-sheet figcaption{font-size:13px} .contact-close{position:fixed;top:10px;right:20px;z-index:31;padding:8px} .contact-theme{position:fixed;top:10px;left:20px;z-index:31;padding:8px}`;
document.head.append(style);
const controls = element('aside', 'preview-controls'), root = element('div'); root.id = 'preview-root';
const sceneSelect = element('select'), actorSelect = element('select'), status = element('pre', 'preview-status');
sceneSelect.dataset.testid = 'preview-scene'; sceneSelect.setAttribute('aria-label', '选择开发预览场景');
actorSelect.dataset.testid = 'preview-actor'; actorSelect.setAttribute('aria-label', '选择立绘状态');
for (const act of Object.values(storyLibrary)) for (const scene of act.scenes) {
  const option = element('option', '', `${act.title.split('：')[0]} ${scene.id} ${scene.title}`);
  option.value = `${act.id}|${scene.id}`; sceneSelect.append(option);
}
inventory.forEach((row, i) => { const option = element('option', '', `${row.asset} · ${row.pose}／${row.expression}`); option.value = String(i); actorSelect.append(option); });
let state: GameState = emptyState(), serial = 100, library = storyLibrary, previewCalls = false;
const dispatch = (action: Action) => { state = reduceGame(state, action, library).state; render(); };
const view = new PlayerView(root, dispatch, () => undefined);
function render() {
  view.render(state); const w = state.waiting;
  status.textContent = `${previewCalls ? '仅开发：略过CALL，不记录战斗胜利\n' : ''}${state.actId}/${state.sceneId}\n${w?.kind ?? ''}\n${Object.values(state.actors).filter(a => a.visible).map(a => `${a.actor}：${a.pose}／${a.expression}`).join('\n')}`;
}
function scene(skipCalls = false) {
  previewCalls = skipCalls; library = storyLibrary;
  if (skipCalls) {
    library = structuredClone(storyLibrary);
    for (const act of Object.values(library)) for (const item of act.scenes) item.nodes = item.nodes.map(node =>
      node.kind === 'call' && node.name.startsWith('battle_')
        ? { kind: 'meta', directive: 'DEV_PREVIEW_CALL', meta: true, raw: `仅开发预览略过 ${node.name}，不生成胜利结果。` } : node);
  }
  const [act, id] = sceneSelect.value.split('|');
  const base = { ...emptyState(), flags: { has_master_sword: true, link_summoned: true, prologue_3_complete: true } };
  state = resumeScene(base, library, act!, id!, ++serial, undefined).state; render();
}
sceneSelect.addEventListener('change', () => scene());
actorSelect.addEventListener('change', () => {
  const row = inventory[Number(actorSelect.value)]!;
  const names: Record<string, string> = { char_male_high_normal: '男高', char_thief_smile: '怪盗', char_thief_masked_black_placeholder: '蒙面人',
    char_link_silent_placeholder: '金发青年', char_saber_traveler_placeholder: '女剑士', char_deoxys_normal_placeholder: '不明生物·普通型', char_deoxys_defense_placeholder: '不明生物·防御型' };
  const actor = names[row.asset] ?? row.asset;
  state = { ...emptyState(++serial), sceneTitle: '素材预览，不参与剧情与存档', actors: { [actor]: { actor, asset: row.asset, pose: row.pose,
    expression: row.expression, position: 'center', visible: true } }, waiting: { kind: 'text', token: `preview:${serial}`, origin: { nodeIndex: 0 },
    textKind: 'narration', text: `${row.pose}／${row.expression}`, revealed: 999 } }; render();
});
function contactSheet() {
  const sheet = element('section', 'contact-sheet'); sheet.dataset.testid = 'portrait-contact-sheet';
  const close = button('关闭对照表', 'contact-close', () => { sheet.remove(); close.remove(); theme.remove(); }); close.className = 'contact-close';
  const theme = button('切换浅／深背景', 'contact-theme', () => sheet.classList.toggle('light')); theme.className = 'contact-theme';
  for (const asset of [...registration.assets, ...halfRegistration.assets]) {
    const figure = element('figure'), img = element('img'); img.src = assetUrl(asset.file.replace(/^public/, '')); img.alt = asset.id;
    figure.append(img, element('figcaption', '', asset.id)); sheet.append(figure);
  }
  document.body.append(sheet, close, theme);
}
controls.append(element('h1', '', '开发预览'), element('p', '', '不读写任何存档，不开放正式跳关。'), sceneSelect,
  button('从本场景开头查看', 'preview-start', () => scene()), actorSelect,
  button('推进／补全文字', 'preview-advance', () => { if (state.waiting?.kind === 'text') dispatch({ type: 'advance', token: state.waiting.token }); }),
  button('仅开发：查看战斗CALL后的原文', 'preview-after-call', () => scene(true)),
  button('素材表情对照表', 'preview-contact', contactSheet), status);
document.body.append(controls, root); scene();
import.meta.hot?.dispose(() => view.dispose());
