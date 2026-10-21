/** 开发服务器专用的替换IO：不接触真实localStorage，控制数据不进入生产包。 */
import '../../styles/player.css';
import '../../styles/menu.css';
import '../../styles/map.css';
import { mountPlayer } from '../../game/controller.js';
import { createSaveStore } from '../../game/save-storage.js';
import { storyLibrary } from '../../game/story/library.js';
import { completionFlags, encodeSave, saveKey } from '../../game/save-format.js';
import { encodeV2, saveKeyV2 } from '../../game/save-v2.js';
import { sampleSave, sampleV2 } from '../m4-helpers.js';

const scenario = new URLSearchParams(location.search).get('case') ?? 'corrupt';
const scene = scenario.match(/v1-([pa]\d{3})/)?.[1] ?? 'p006';
const legacy = sampleSave(scene.startsWith('p') ? 'prologue' : 'act1', scene);
if (scenario.includes('prologue-complete') || scenario.includes('replay')) {
  legacy.flags[completionFlags.prologue] = true; legacy.unlockedActs = ['prologue', 'act1'];
}
if (scenario.includes('all-complete')) {
  legacy.flags[completionFlags.prologue] = true; legacy.flags[completionFlags.act1] = true; legacy.unlockedActs = ['prologue', 'act1'];
}
const legacyCase = scenario.startsWith('v1-') || scenario.startsWith('migration-');
const initialV1 = scenario === 'corrupt-v1' ? '  无法读取的v1原件\n ' : legacyCase ? ` \n${encodeSave(legacy)}\n ` : null;
const values = new Map<string, string>();
if (initialV1 !== null) values.set(saveKey, initialV1);
if (scenario === 'corrupt' || scenario === 'corrupt-delayed' || scenario === 'v2-bad-v1-valid') values.set(saveKeyV2, '这是一份无法读取的v2验收存档');
if (scenario === 'v2-bad-v1-valid') values.set(saveKey, encodeSave(legacy));
const originalV1 = values.get(saveKey) ?? '';
let writes = 0; const writeKeys: string[] = [];
const readout = document.createElement('aside'); readout.dataset.testid = 'fixture-storage';
Object.assign(readout.style, { position: 'fixed', left: '4px', top: '2px', zIndex: '100', maxWidth: '260px',
  maxHeight: '85px', overflow: 'auto', font: '10px/1.3 monospace', color: '#f3d68c', background: '#0b0e14eb', padding: '4px', pointerEvents: 'none', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' });
const render = () => {
  const v1 = values.get(saveKey) ?? '', v2 = values.get(saveKeyV2) ?? '';
  readout.textContent = `仅验收 · 假存储 · ${scenario}\n成功写入 ${writes} 次 · v1原件${v1 === originalV1 ? '一致' : '变化'}\nv2：${v2 || '空'}`;
  Object.assign(readout.dataset, { scenario, writes: String(writes), raw: v2, v1, originalV1, v1Unchanged: String(v1 === originalV1), writeKeys: writeKeys.join(',') });
};
document.body.append(readout); render();
const pendingWrites: Array<() => void> = [];
if (scenario === 'corrupt-delayed') {
  const release = document.createElement('button'); release.type = 'button'; release.textContent = '验收：释放待保存请求'; release.dataset.testid = 'fixture-release';
  Object.assign(release.style, { position: 'fixed', left: '4px', top: '90px', zIndex: '101', fontSize: '12px' });
  release.addEventListener('click', () => { for (const resolve of pendingWrites.splice(0)) resolve(); }); document.body.append(release);
}
const store = createSaveStore({
  getItem(key) {
    if (key !== saveKey && key !== saveKeyV2) throw new Error('键错误');
    if (scenario === 'read-failure') throw new Error('模拟读取失败'); return values.get(key) ?? null;
  },
  setItem(key, value) {
    if (key !== saveKeyV2) throw new Error('禁止写v1');
    if (scenario === 'write-failure' || scenario === 'migration-write-failure') throw new Error('模拟配额不足');
    values.set(key, value); writes++; writeKeys.push(key); render();
  },
}, { async run(work) {
  if (scenario === 'corrupt-delayed') await new Promise<void>(resolve => pendingWrites.push(resolve));
  if (scenario === 'migration-race' && !values.has(saveKeyV2)) { values.set(saveKeyV2, encodeV2(sampleV2('act1', 'a016'))); render(); }
  if (scenario === 'migration-race-bad' && !values.has(saveKeyV2)) { values.set(saveKeyV2, '另一窗口刚写的坏档'); render(); }
  return work();
} }, storyLibrary);
const root = document.querySelector<HTMLElement>('#app'); if (!root) throw new Error('缺少挂载点');
const dispose = mountPlayer(root, new URLSearchParams('seed=0'), { store });
import.meta.hot?.dispose(dispose);
