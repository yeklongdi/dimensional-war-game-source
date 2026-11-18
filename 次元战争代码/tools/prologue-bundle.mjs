import { parseStory } from './story-parser.mjs';
import { renderQuestions } from './story-diagnostics.mjs';
import { firstCycleSources, prologueSources, storyVersion } from './prologue-sources.mjs';

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

export function createReleaseBundle(prologue, firstCycleSourcesById) {
  const bundle = createPrologueBundle(prologue);
  const id = 'first_cycle', title = '第一幕（一）';
  const firstCycle = { id, title, scenes: [] }, firstCycleWarnings = [];
  const additionalScenes = firstCycleSources.flatMap(item => item.sceneIds);
  for (const source of firstCycleSources) {
    const { act, warnings } = parseStory(firstCycleSourcesById[source.id], {
      id, title, sourceFile: source.sourceFile, additionalScenes,
    });
    if (act.scenes.map(scene => scene.id).join() !== source.sceneIds.join()
      || warnings.some(item => item.categories.includes('unresolved_jump'))) {
      throw new Error(`首周期场景或跳转与已确认清单不符：${source.sourceFile}`);
    }
    firstCycle.scenes.push(...act.scenes);
    firstCycleWarnings.push(...warnings);
  }
  return { ...bundle, firstCycle, firstCycleWarnings,
    questions: renderQuestions([...bundle.acts, firstCycle], [...bundle.index.warnings, ...firstCycleWarnings]) };
}
