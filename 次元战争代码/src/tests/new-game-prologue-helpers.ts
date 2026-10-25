import type { GameState } from '../game/state.js';
import type { CampaignAction } from '../game/campaign.js';
import { hydrateRuntime, reduceRuntime, systemToken } from '../game/runtime.js';
import type { GameAction, RuntimeTransition } from '../game/runtime.js';
import type { SystemIntent } from '../game/system-types.js';
import type { SaveV2 } from '../game/save-v2.js';
import type { StoragePort } from '../game/save-storage.js';
import { encodeV4, createStoryVaultStore, saveKeyV4 } from '../game/save-v4.js';
import { newVault } from '../game/save-v3.js';
import type { SaveV3 } from '../game/save-v3.js';
import { createSettingsStore, defaults } from '../game/settings.js';
import { storyLibrary } from '../game/story/library.js';
import { memory, serialLock } from './map-save-helpers.js';

/** 只用于本次专项：真实v4盘、真实runtime/router/关卡配置与正式剧情库，不替换入口、结算或保存激活逻辑。 */
export function storyHarness(data?: SaveV2, manual?: SaveV2) {
  const m = memory();
  if (data) {
    const vault = newVault('initial-run-identity', data);
    if (manual) vault.manual[0] = { revision: 1, data: manual };
    m.values.set(saveKeyV4, encodeV4(vault));
  }
  let fail = false, sequence = 0, time = 1792540800000;
  const port: StoragePort = {
    getItem: key => m.storage.getItem(key),
    setItem(key, value) { if (fail) throw new Error('配额故障'); m.storage.setItem(key, value); },
  };
  const store = createStoryVaultStore(port, serialLock(), storyLibrary), settingsStore = createSettingsStore(port);
  let state: GameState = hydrateRuntime(0, store.read(), { data: { ...defaults }, message: '' }, 'client-prologue-1', storyLibrary).state;
  async function apply(transition: RuntimeTransition): Promise<void> {
    state = transition.state;
    for (const request of transition.vaults ?? []) {
      const outcome = await store.write(request, () => request.kind === 'auto'
        ? state.system!.activeRunId === request.runId && state.run === request.session && state.progress!.request === request.revision
        : state.system!.pending?.id === request.id);
      await apply(reduceRuntime(state, { type: 'vault-result', request, outcome }, storyLibrary, ++time));
    }
    if (transition.settingsWrite) await apply(reduceRuntime(state, { type: 'settings-result', revision: transition.settingsWrite.revision,
      message: settingsStore.write(transition.settingsWrite.data) }, storyLibrary, ++time));
  }
  const action = async (value: GameAction) => {
    await apply(reduceRuntime(state, value, storyLibrary, ++time, `new-run-identity-${++sequence}`));
    return state;
  };
  const play = async (value: CampaignAction) => {
    await apply(reduceRuntime(state, { type: 'play', run: state.run, action: value }, storyLibrary, ++time, `new-run-identity-${++sequence}`));
    return state;
  };
  const vault = (): SaveV3 | undefined => {
    const raw = m.values.get(saveKeyV4);
    return raw === undefined ? undefined : JSON.parse(raw) as SaveV3;
  };
  const auto = (): SaveV2 => {
    const current = vault();
    if (!current) throw new Error('验收盘缺失');
    return (current.auto as { data: SaveV2 }).data;
  };
  return {
    m, store, action, play, vault, auto,
    get state() { return state; },
    setFailure(value: boolean) { fail = value; },
    async system(intent: SystemIntent, slot?: number) {
      return action({ type: 'system', intent, slot, token: systemToken(state) });
    },
  };
}

export type StoryFlow = ReturnType<typeof storyHarness>;
export async function loadAuto(h: StoryFlow) {
  await h.system('load'); await h.system('pick-load', 0); await h.system('confirm');
}

/** 逐句推进；遇到正式战斗时用现有系统菜单“跳过”，并记为跳过而非实打胜利。 */
export async function walk(h: StoryFlow, until: (state: GameState) => boolean, max = 700) {
  for (let index = 0; index < max; index++) {
    if (until(h.state)) return h.state;
    const state = h.state;
    if (state.screen === 'story' && state.waiting?.kind === 'text') { await h.play({ type: 'advance', token: state.waiting.token }); continue; }
    if (state.screen === 'battle') { await h.system('open'); await h.system('skip'); continue; }
    throw new Error(`无法继续：${state.screen}/${state.waiting?.kind ?? 'none'}`);
  }
  throw new Error('未到达目标状态');
}

export const atScene = (id: string) => (state: GameState) => state.screen === 'story' && state.sceneId === id;
export const atLastText = (scene: string, nodeIndex: number) => (state: GameState) =>
  state.screen === 'story' && state.sceneId === scene && state.waiting?.kind === 'text' && state.waiting.origin.nodeIndex === nodeIndex;
