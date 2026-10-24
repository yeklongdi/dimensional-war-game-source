/** 仅开发IO夹具：合法场景头存档，不注入GameState、战斗血量或胜负。 */
import '../../styles/player.css';
import '../../styles/menu.css';
import '../../styles/map.css';
import '../../styles/battle.css';
import { mountPlayer } from '../../game/controller.js';
import { createStoryVaultStore, encodeV4, saveKeyV4 } from '../../game/save-v4.js';
import { newVault } from '../../game/save-v3.js';
import { createSettingsStore, settingsKey } from '../../game/settings.js';
import { storyLibrary } from '../../game/story/library.js';
import { levels, levelIds } from '../../content/levels.js';
import { patrolSkipped, encounterSkipped } from '../../game/story/skip-policy.js';
import type { SaveV2 } from '../../game/save-v2.js';

const scene = new URLSearchParams(location.search).get('scene') ?? 'p006';
const index = levels.findIndex(level => level.sceneIds.includes(scene));
if (index < 0) throw new Error('无效验收场景');
const flags: Record<string, boolean> = {};
if (index >= 3) flags.flag_prologue_completed = true;
if (index >= 7) { flags.flag_act1_completed = true; flags.has_master_sword = true; }
if (index >= 8) { flags.prologue_3_complete = true; flags.link_summoned = true; }
if (/^c\d{3}$/.test(scene) && Number(scene.slice(1)) >= 4) flags[patrolSkipped] = true;
if (/^c\d{3}$/.test(scene) && Number(scene.slice(1)) >= 6) flags[encounterSkipped] = true;
const data: SaveV2 = { version: 2, flags, completedLevelIds: levelIds.slice(0, index),
  checkpoint: { kind: 'level', levelId: levels[index]!.id, sceneId: scene }, savedAt: 1792800000000 };
const values = new Map<string, string>([[saveKeyV4, encodeV4(newVault('skip-fixture-active-run', data))],
  ['dw.save.v1', '旧v1原串'], ['dw.save.v2', '旧v2原串'], ['dw.save.v3', '旧v3原串']]);
let writes = 0;
const readout = document.createElement('aside'); readout.dataset.testid = 'skip-fixture';
Object.assign(readout.style, { position: 'fixed', top: '0', left: '0', zIndex: '500', font: '11px monospace',
  color: '#e5d19c', background: '#0b0e14dd', padding: '4px', pointerEvents: 'none' }); document.body.append(readout);
const render = () => { readout.textContent = `受控IO · ${scene} · 成功写 ${writes} 次 · 非新档全流程`;
  Object.assign(readout.dataset, { scene, writes: String(writes), raw: values.get(saveKeyV4),
    legacyUnchanged: String([1, 2, 3].every(v => values.get(`dw.save.v${v}`) === `旧v${v}原串`)) }); };
render();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem(key: string, raw: string) {
  if (key !== saveKeyV4 && key !== settingsKey) throw new Error('禁止改旧键'); values.set(key, raw); writes++; render();
} };
const store = createStoryVaultStore(storage, { async run<T>(work: () => T | Promise<T>) { return work(); } }, storyLibrary);
const root = document.querySelector<HTMLElement>('#app'); if (!root) throw new Error('没有挂载点');
const dispose = mountPlayer(root, new URLSearchParams('seed=0'), { vault: store, settingsStore: createSettingsStore(storage) });
import.meta.hot?.dispose(dispose);
