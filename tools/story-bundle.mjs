import { parseStory } from './story-parser.mjs';
import { renderQuestions } from './story-diagnostics.mjs';

export function createExportBundle(sources) {
  const definitions = [
    { id: 'prologue', title: '序幕', sourceFile: 'source/story/prologue.md' },
    { id: 'act1', title: '第一幕', sourceFile: 'source/story/act1.md' },
  ];
  const parsed = definitions.map(definition => parseStory(sources[definition.id], definition));
  const acts = parsed.map(result => result.act);
  const warnings = parsed.flatMap(result => result.warnings);
  const index = {
    acts: acts.map(act => ({
      id: act.id, title: act.title, file: `${act.id}.json`, sceneCount: act.scenes.length,
    })),
    warningCount: warnings.length,
    warnings,
  };
  return { acts, index, questions: renderQuestions(acts, warnings) };
}
