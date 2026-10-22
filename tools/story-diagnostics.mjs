const CATEGORY_LABELS = {
  placeholder: 'Placeholder asset', meta: 'Production note', variable: 'Variable placeholder',
  check: 'CHECK note', unknown: 'Unknown instruction', missing_asset: 'Missing actor asset',
  pending_call: 'Pending call', unresolved_jump: 'Missing jump target', missing_prompt: 'Missing choice prompt',
};

export function policyResolution(_sceneId, token) {
  if (token.key === 'CAMERA') return 'Camera instructions are retained for maintainers and hidden from players.';
  if (token.raw.includes('[变量名待定]')) return 'The sample keeps the note and assigns a deterministic example flag.';
  if (token.key === 'CHECK') return 'CHECK is preserved as a non-executable sample note.';
  return '';
}
export function createCollector(actId, sourceFile) {
  const records = new Map();
  return {
    add(sceneId, token, category, detail, resolution = '') {
      const key = sceneId + ':' + token.line;
      let record = records.get(key);
      if (!record) record = { actId, sceneId, sourceFile, line: token.line, raw: token.raw, categories: [], details: [], resolutions: [] };
      records.set(key, record);
      if (!record.categories.includes(category)) record.categories.push(category);
      if (detail && !record.details.includes(detail)) record.details.push(detail);
      if (resolution && !record.resolutions.includes(resolution)) record.resolutions.push(resolution);
    },
    finish() { return [...records.values()].sort((left, right) => left.line - right.line); },
  };
}
export function renderQuestions(acts, warnings) {
  const lines = ['# Sample content notes', '', '> Generated from the synthetic sample inputs. No official game content is included.', '',
    'Scenes: ' + acts.map(act => act.title + ': ' + act.scenes.length).join(' / ') + '.', '', 'Diagnostics: ' + warnings.length + '.', ''];
  if (!warnings.length) lines.push('No unresolved sample-content issues were found.');
  for (const act of acts) {
    const items = warnings.filter(item => item.actId === act.id);
    if (!items.length) continue;
    lines.push('', '## ' + act.title, '');
    for (const item of items) lines.push('### ' + item.sceneId + ' · ' + item.categories.map(category => CATEGORY_LABELS[category]).join(' / '), '',
      ...item.details.map(detail => '- ' + detail), ...item.resolutions.map(resolution => '- Resolution: ' + resolution), '');
  }
  return lines.join('\n').trimEnd() + '\n';
}