import { describe, expect, it } from 'vitest';
import sampleOne from '../samples/story/prologue.md?raw';
import sampleTwo from '../samples/story/act1.md?raw';
import { createExportBundle } from '../tools/story-bundle.mjs';

describe('synthetic story input', () => {
  it('parses the public samples without relying on private files', () => {
    const result = createExportBundle({ prologue: sampleOne, act1: sampleTwo });
    expect(result.acts.map(act => act.scenes.length)).toEqual([1, 1]);
    expect(result.acts[0]!.scenes[0]!.nodes.some(node => node.kind === 'call' && node.name === 'battle_demo_training')).toBe(true);
    expect(result.acts[1]!.scenes[0]!.nodes.some(node => node.kind === 'choice')).toBe(true);
    expect(result.index.warningCount).toBe(result.index.warnings.length);
  });
  it('labels its sample text as synthetic and keeps the original example wording', () => {
    expect(sampleOne).toContain('This synthetic line demonstrates a dialogue node.');
    expect(sampleTwo).toContain('Choose a sample action.');
    expect(sampleOne).not.toContain('E:\\');
  });
});