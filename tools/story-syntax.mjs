const ASSET_MARKER = /\[(?:占位符[^\]\r\n]*|已有候选素材[^\]\r\n]*)\]/g;
const PRODUCTION_MARKER = /【(?:待确认|不可执行|暂无线性后果)】|\[变量名待定\]/;
const TEXT_KEYS = new Set(['STAGE', 'DIALOGUE', 'INNER', 'NARRATION']);
const KNOWN_KEYS = new Set([
  'SCENE', 'TITLE', 'TIME', 'BACKGROUND', 'BGM', 'SFX', 'SHOW', 'HIDE',
  'POSE', 'EXPRESSION', ...TEXT_KEYS, 'CHOICE', 'OPTION', 'SET', 'CALL',
  'CHECK', 'JUMP', 'END', 'CAMERA',
]);
export function hasAssetMarker(text) {
  return new RegExp(ASSET_MARKER).test(text);
}

export function stripAssetMarkers(value) {
  return value.replace(ASSET_MARKER, '').replace(/[ \t]{2,}/g, ' ').trim();
}

export function isProductionText(text, _sceneId) {
  return text.trimStart().startsWith('【') || PRODUCTION_MARKER.test(text)
;
}

export function readInstruction(line) {
  const match = /^([A-Z][A-Z0-9_]*)(?:[ \t]+(\d+))?[:：][ \t]*(.*)$/.exec(line);
  return match ? { key: match[1], index: match[2], value: match[3] } : null;
}

function isSceneHeading(line) {
  return /^###[ \t]+SCENE[:：]/.test(line);
}

export function tokenizeStory(markdown) {
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  const start = lines.findIndex(line => /^##[ \t]+第三部分[:：][ \t]*Galgame 正式脚本[ \t]*$/.test(line));
  const end = lines.findIndex((line, index) => index > start && /^##[ \t]+第四部分/.test(line));
  if (start < 0 || end < 0) throw new Error('缺少第三部分正式脚本或第四部分边界，已停止导出。');
  const tokens = [];
  for (let cursor = start + 1; cursor < end; cursor++) {
    const line = lines[cursor];
    if (!line.trim() || isSceneHeading(line)) continue;
    const instruction = readInstruction(line);
    if (!instruction) {
      tokens.push({ key: 'UNRECOGNIZED', value: line, line: cursor + 1, raw: line });
      continue;
    }
    const token = { ...instruction, line: cursor + 1, raw: line };
    if (TEXT_KEYS.has(token.key) && token.value === '') {
      const body = [];
      const raw = [line];
      while (cursor + 1 < end) {
        const next = lines[cursor + 1];
        if (!next.trim() || isSceneHeading(next)) break;
        const nextInstruction = readInstruction(next);
        const speaker = body.length === 0 && ['DIALOGUE', 'INNER'].includes(token.key)
          && /^([^:：]+)[:：][ \t]*$/.test(next)
          && !KNOWN_KEYS.has(nextInstruction?.key);
        if (nextInstruction && !speaker) break;
        body.push(next);
        raw.push(next);
        cursor++;
      }
      token.value = body.join('\n');
      token.raw = raw.join('\n');
    } else if (token.key === 'OPTION' && token.value === '') {
      const next = lines[cursor + 1];
      if (next !== undefined && next.trim() && !isSceneHeading(next) && !readInstruction(next)) {
        token.value = next;
        token.raw += `\n${next}`;
        cursor++;
      }
    }
    tokens.push(token);
  }
  return tokens;
}

export function parseSpeech(value) {
  const lines = value.split('\n');
  const speaker = /^([^:：]+)[:：][ \t]*$/.exec(lines[0]);
  return speaker ? { speaker: speaker[1], text: lines.slice(1).join('\n') }
    : { speaker: '', text: value };
}

export function parseShow(value) {
  const cleaned = stripAssetMarkers(value);
  const actor = /^[^ \t]+/.exec(cleaned)?.[0] ?? '';
  const node = { kind: 'show', actor };
  const parameters = cleaned.slice(actor.length);
  const pattern = /(?:^|[ \t]+)(asset|position|expression|pose)=([\s\S]*?)(?=[ \t]+(?:asset|position|expression|pose)=|$)/g;
  for (const match of parameters.matchAll(pattern)) node[match[1]] = match[2];
  return node;
}

export function parseCall(value) {
  const [name = '', ...parameters] = value.trim().split(/[ \t]+/);
  const node = { kind: 'call', name };
  const args = {};
  for (const parameter of parameters) {
    const separator = parameter.indexOf('=');
    if (separator > 0) args[parameter.slice(0, separator)] = parameter.slice(separator + 1);
  }
  if (Object.keys(args).length) node.args = args;
  return node;
}
