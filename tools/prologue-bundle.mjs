import { parseStory } from './story-parser.mjs';
import { renderQuestions } from './story-diagnostics.mjs';
import { prologueSources, storyVersion } from './prologue-sources.mjs';

export function createPrologueBundle(sources) {
  const parsed = prologueSources.map(item => parseStory(sources[item.id], item));
  const acts = parsed.map(item => item.act), warnings = parsed.flatMap(item => item.warnings);
  for (const [i, act] of acts.entries()) {
    if (act.scenes.length !== prologueSources[i].count) throw new Error(`${act.id} 场景数变化，请人工复核原稿。`);
  }
  const index = { contentVersion: storyVersion, acts: acts.map(act => ({ id: act.id, title: act.title,
    file: `${act.id}.json`, sceneCount: act.scenes.length })), warningCount: warnings.length, warnings };
  return { acts, index, questions: renderQuestions(acts, warnings) };
}
