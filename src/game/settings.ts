import type { StoragePort } from './save-storage.js';
import { record } from './save-v3.js';

export const settingsKey = 'dw.settings.v1';
export const textSpeeds = [100, 60, 30, 20, 10] as const;
export type Settings = { version: 1; bgm: number; sfx: number; textMs: number };
export const defaults: Readonly<Settings> = { version: 1, bgm: 65, sfx: 100, textMs: 30 };
export type SettingsRead = { data: Settings; message: string };
export function validSettings(value: unknown): value is Settings {
  return record(value) && Object.keys(value).sort().join(',') === 'bgm,sfx,textMs,version' && value.version === 1
    && [value.bgm, value.sfx].every(v => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100)
    && typeof value.textMs === 'number' && textSpeeds.some(ms => ms === value.textMs);
}
export function readSettings(raw: string | null): SettingsRead {
  if (raw === null) return { data: { ...defaults }, message: '' };
  try { const data: unknown = JSON.parse(raw); if (validSettings(data)) return { data: { ...data }, message: '' }; } catch { /* 原文保留，直到用户修改 */ }
  return { data: { ...defaults }, message: '设置记录损坏，当前使用默认设置；游戏存档未受影响。' };
}
export type SettingsStore = { read(): SettingsRead; write(data: Settings): string };
export function createSettingsStore(storage: StoragePort): SettingsStore {
  return {
    read() { try { return readSettings(storage.getItem(settingsKey)); } catch { return { data: { ...defaults }, message: '无法读取设置，当前使用默认值。' }; } },
    write(data) { if (!validSettings(data)) return '无效设置，未写入。';
      try { storage.setItem(settingsKey, JSON.stringify(data)); return ''; }
      catch { return '设置已在本页面生效，但未持久保存；刷新后可能丢失。'; }
    },
  };
}
