import '../../../src/styles/player.css';
import { PlayerView } from '../../../src/game/ui/player-view.ts';
import { emptyState } from '../../../src/game/state.ts';

if (!import.meta.env.DEV) throw new Error('仅开发构图预览；不加入生产入口');
const app = document.querySelector('#app'), tools = document.querySelector('#tools');
app.tabIndex = 0;
const select = document.querySelector('[data-testid="background-select"]'), status = document.querySelector('#status');
const style = document.createElement('style');
style.textContent = '#tools{position:fixed;left:10px;top:10px;z-index:100;width:280px;padding:12px;background:#0c1422ef;border:1px solid #9b864e;border-radius:8px;font:13px/1.7 sans-serif}#tools p{margin:8px 0}#tools select{width:100%;padding:6px;font:inherit}#tools button{margin:10px 3px 0 0;padding:5px 7px;font:inherit;cursor:pointer}.clean-background{position:absolute;width:1280px;height:720px;left:50%;top:50%;transform:translate(-50%,-50%);object-fit:contain}';
document.head.append(style);
const labels = { bg_grandmother_house_dusk: '奶奶家门前', bg_school_classroom_day: '白天教室', bg_old_district_quiet_alley_night: '夜间安静小巷' };
const sourceActors = [
  { actor: '男高', visible: true, position: 'left', asset: 'char_male_high_normal', pose: '普通站姿', expression: '默认平静' },
  { actor: '女剑士', visible: true, position: 'center', asset: 'char_saber_traveler_placeholder', pose: '站在外侧留意来路', expression: '平静' },
  { actor: '怪盗', visible: true, position: 'right', asset: 'char_thief_smile', pose: '收起面罩', expression: '带笑，观察男高' },
];
let mode = 'clean', revision = 0, view;
async function render() {
  const request = ++revision, key = select.value;
  status.textContent = '正在解码候选图片…'; app.dataset.ready = 'false';
  const url = new URL(`./${key}_candidate_v001_16x9.png`, import.meta.url).href;
  const image = new Image(); image.src = url;
  try {
    await image.decode();
    if (request !== revision) return;
    view?.dispose(); view = undefined; app.replaceChildren();
    if (mode === 'clean') {
      image.className = 'clean-background'; image.alt = `${labels[key]} · 纯背景候选`;
      app.append(image);
    } else {
      const state = emptyState(request);
      Object.assign(state, { actId: '构图合成 · 未接入', sceneId: 'background_preview', sceneTitle: labels[key], time: '白天' });
      const actors = mode === 'one' ? [{ ...sourceActors[0], position: 'center' }] : sourceActors;
      state.actors = Object.fromEntries(actors.map(actor => [actor.actor, { ...actor }]));
      const text = '构图合成预览，未接入游戏。\n统一演员仅用于检查背景、立绘与文字窗的遮挡和对比，不表示本场剧情中的人物关系。';
      state.waiting = { kind: 'text', token: `preview:${request}`, origin: { nodeIndex: 0 }, textKind: 'narration', text, revealed: Array.from(text).length };
      view = new PlayerView(app, () => {}, () => {}, undefined, { fixedTime: () => 0 });
      view.render(state);
      const backdrop = view.stage.querySelector('.backdrop');
      backdrop.style.background = `url("${url}") center / cover`;
      backdrop.style.imageRendering = 'auto'; // 仅隔离预览背景；原立绘和全局像素规则不改。
    }
    Object.assign(app.dataset, { ready: 'true', background: key, mode, revision: String(request),
      backgroundUrl: url, rawDisplaySize: `${image.naturalWidth}x${image.naturalHeight}`, scope: 'isolated-composite-not-integrated' });
    status.textContent = `${labels[key]} · ${mode} · 候选v001\n1664×936原比例显示；F2隐藏／恢复工具。`;
  } catch (error) {
    if (request !== revision) return;
    status.textContent = `候选解码失败：${String(error)}`; console.error(error);
  }
}
select.addEventListener('change', () => void render());
for (const name of ['clean', 'one', 'three']) document.querySelector(`[data-testid="mode-${name}"]`).addEventListener('click', () => { mode = name; void render(); });
const keydown = event => { if (event.code === 'F2' && !event.repeat) { event.preventDefault(); tools.hidden = !tools.hidden; } };
document.addEventListener('keydown', keydown);
void render();
import.meta.hot?.dispose(() => { ++revision; view?.dispose(); document.removeEventListener('keydown', keydown); style.remove(); });
