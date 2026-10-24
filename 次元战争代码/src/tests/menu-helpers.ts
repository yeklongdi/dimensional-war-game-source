import { hydrateRuntime, reduceRuntime, systemToken } from '../game/runtime.js';
import type { GameAction, RuntimeTransition } from '../game/runtime.js';
import type { SystemIntent } from '../game/system-types.js';
import { newVault, saveKeyV3 } from '../game/save-v3.js';
import type { SaveV2 } from '../game/save-v2.js';
import { createVaultStore } from '../game/vault-storage.js';
import { defaults, createSettingsStore } from '../game/settings.js';
import { storyLibrary } from '../game/story/library.js';
import { memory, serialLock } from './map-save-helpers.js';

export function menuHarness(data?: SaveV2) {
  const m = memory();
  if (data) m.values.set(saveKeyV3, JSON.stringify(newVault('initial-run-identity', data)));
  let fail = false, sequence = 0, time = 1792540800000;
  const port = { ...m.storage, setItem(key: string, value: string) { if (fail) throw new Error('配额故障'); m.storage.setItem(key, value); } };
  const store = createVaultStore(port, serialLock(), storyLibrary), settingsStore = createSettingsStore(port);
  let state = hydrateRuntime(0, store.read(), { data: { ...defaults }, message: '' }, 'client-identity-1', storyLibrary).state;
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
  return { m, store, get state() { return state; }, setFailure(value: boolean) { fail = value; },
    async action(action: GameAction) { await apply(reduceRuntime(state, action, storyLibrary, ++time, `new-run-identity-${++sequence}`)); return state; },
    async system(intent: SystemIntent, slot?: number) { await apply(reduceRuntime(state, { type: 'system', intent, slot, token: systemToken(state) }, storyLibrary, ++time, `new-run-identity-${++sequence}`)); return state; },
    external() { state = reduceRuntime(state, { type: 'vault-external', read: store.read() }, storyLibrary, ++time).state; },
  };
}
export async function loadAuto(h: ReturnType<typeof menuHarness>) { await h.system('load'); await h.system('pick-load', 0); await h.system('confirm'); }
