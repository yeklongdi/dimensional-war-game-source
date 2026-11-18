import type { FeedbackCue } from './feedback.js';

/** 表现指令到本地音效 id 的映射；音量为 0 时由 AudioController 自然静音。 */
const elementSfx: Record<string, string> = {
  fire: 'fx_fire', cold: 'fx_frost', lightning: 'fx_spark', thunder: 'fx_spark',
  acid: 'fx_acid', poison: 'fx_acid', force: 'fx_force', necrotic: 'fx_necrotic',
  radiant: 'fx_radiant', psychic: 'fx_force',
};

export function sfxFor(cue: FeedbackCue): string | undefined {
  switch (cue.kind) {
    case 'swing':
      if (!cue.hit) return cue.style === 'spell' ? 'fx_cast' : 'fx_whiff';
      return cue.style === 'fist' ? 'fx_punch' : cue.style === 'spell' ? 'fx_cast' : cue.style === 'ranged' ? 'fx_arrow' : 'fx_blade';
    case 'impact': return cue.critical ? 'fx_crit' : elementSfx[cue.element] ?? 'fx_blade';
    case 'save': return cue.success ? 'fx_save' : 'fx_fail';
    case 'heal': return 'fx_heal';
    case 'ward': return 'fx_ward';
    case 'down': return 'fx_down';
  }
}
