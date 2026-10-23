import type { SaveV2 } from './save-v2.js';
import type { VaultRead } from './save-v3.js';
import type { VaultRequest, VaultOutcome } from './vault-storage.js';
import type { Settings } from './settings.js';

export type SystemPanel = 'system' | 'load' | 'save' | 'settings' | 'confirm';
export type Confirmation = { kind: 'new' | 'load' | 'manual'; slot: number; expected: string; snapshot: SaveV2; replaceRaw?: string; returnPanel?: 'load' | 'save' };
export type SystemState = {
  read: VaultRead; activeRunId: string; clientId: string; revision: number; uiRevision: number;
  panel?: SystemPanel; parent?: 'system'; confirmation?: Confirmation; pending?: VaultRequest;
  stale: boolean; message: string; settingsMessage: string; settingsRevision: number;
};
export type SystemIntent = 'open' | 'load' | 'save' | 'settings' | 'back' | 'new' | 'confirm' | 'cancel'
  | 'pick-load' | 'pick-save' | 'reload' | 'go-map' | 'go-menu';
export type SystemAction = { type: 'system'; intent: SystemIntent; token: string; slot?: number };
export type RuntimeAction = SystemAction
  | { type: 'vault-result'; request: VaultRequest; outcome: VaultOutcome }
  | { type: 'vault-external'; read: VaultRead }
  | { type: 'settings-change'; data: Settings }
  | { type: 'settings-result'; revision: number; message: string };
