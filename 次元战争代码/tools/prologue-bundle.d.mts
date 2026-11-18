import type { Act, Diagnostic, ExportBundle } from '../src/content/types.js';
export function createPrologueBundle(sources: Readonly<Record<string, string>>): ExportBundle;
export function createReleaseBundle(prologue: Readonly<Record<string, string>>, firstCycle: Readonly<Record<string, string>>):
  ExportBundle & { firstCycle: Act; firstCycleWarnings: Diagnostic[] };
