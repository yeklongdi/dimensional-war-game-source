import { describe, expect, it } from 'vitest';
import { storyLibrary } from '../src/game/story/library.js';
import { completionFlags } from '../src/game/save-format.js';
import { decodeV2, migrateV1, readSaves } from '../src/game/save-v2.js';

const sample = {
  version: 2 as const,
  flags: {},
  completedLevelIds: [],
  checkpoint: { kind: 'level' as const, levelId: 'sample_level_1' as const, sceneId: 'p001' },
  savedAt: 10,
};

describe('public demo save handling', () => {
  it('accepts the five-field v2 sample checkpoint and preserves the same schema', () => {
    const decoded = decodeV2(JSON.stringify(sample), storyLibrary);
    expect(decoded).toMatchObject({ kind: 'valid', data: sample });
  });
  it('keeps a malformed v2 save authoritative instead of falling back to v1', () => {
    const legacy = JSON.stringify({ actId: 'prologue', sceneId: 'p001', flags: {}, savedAt: 10, unlockedActs: ['prologue'] });
    expect(readSaves('{broken', () => legacy, storyLibrary)).toMatchObject({ kind: 'invalid', key: 'v2' });
  });
  it('migrates a valid v1 sample and only marks completion for an explicit flag', () => {
    const old = { actId: 'prologue' as const, sceneId: 'p001', flags: {}, savedAt: 10, unlockedActs: ['prologue' as const] };
    expect(migrateV1(old)).toMatchObject({ version: 2, completedLevelIds: [], checkpoint: { kind: 'level', levelId: 'sample_level_1', sceneId: 'p001' } });
    const completed = { ...old, flags: { [completionFlags.prologue]: true }, actId: 'act1' as const,
      sceneId: 'a001', unlockedActs: ['prologue', 'act1'] as ['prologue', 'act1'] };
    expect(migrateV1(completed)).toMatchObject({ completedLevelIds: ['sample_level_1'], checkpoint: { kind: 'level', levelId: 'sample_level_2', sceneId: 'a001' } });
  });
});