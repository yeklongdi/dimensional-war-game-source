import {
  hasAssetMarker, isProductionText, parseCall, parseShow, parseSpeech,
  stripAssetMarkers, tokenizeStory,
} from './story-syntax.mjs';
import { createCollector, policyResolution } from './story-diagnostics.mjs';
import { normalizeChoices } from './story-normalize.mjs';

export function parseStory(markdown, options) {
  const act = { id: options.id, title: options.title, scenes: [] };
  const collector = createCollector(options.id, options.sourceFile);
  const locations = new WeakMap();
  const actorAssets = new Map();
  const speakers = new Map();
  const visualBatch = new Map();
  let scene;
  let choice;
  let option;
  let setCount = 0;

  function annotate(node, token, text = token.value) {
    const resolution = policyResolution(scene.id, token);
    if (hasAssetMarker(token.raw)) {
      node.placeholder = true;
      collector.add(scene.id, token, 'placeholder', '素材仍有原始占位 / 待绑定标记。');
    }
    if (node.kind === 'meta' || node.kind === 'unknown' || node.kind === 'check'
      || isProductionText(text, scene.id)) {
      node.meta = true;
      collector.add(scene.id, token, 'meta', '制作备注完整保留；默认不向玩家展示。', resolution);
    }
    if (token.raw.includes('[变量名待定]')) {
      collector.add(scene.id, token, 'variable', '原文变量名尚未确定；仅为显式 SET 生成布尔 flag，CHECK 内指令不执行。', resolution);
    }
    return node;
  }

  function append(node, token) {
    const nodes = option ? option.nodes : scene.nodes;
    annotate(node, token, 'text' in node ? node.text : token.value);
    nodes.push(node);
    locations.set(node, token);
    if (node.kind === 'show') visualBatch.set(node.actor, node);
    else visualBatch.clear();
    return node;
  }

  function updateVisual(token) {
    const separator = token.value.indexOf('=');
    if (separator < 1) {
      const node = append({ kind: 'unknown', raw: token.raw, meta: true }, token);
      collector.add(scene.id, token, 'unknown', `${token.key} 缺少角色与状态的分隔符。`);
      return node;
    }
    const actor = token.value.slice(0, separator).trim();
    const property = token.key === 'POSE' ? 'pose' : 'expression';
    const value = token.value.slice(separator + 1);
    const recent = visualBatch.get(actor);
    if (recent && recent[property] === undefined) {
      recent[property] = value;
      annotate(recent, token, value);
    } else {
      append({ kind: 'show', actor, update: true, [property]: value }, token);
    }
    if (!actorAssets.has(actor)) {
      collector.add(scene.id, token, 'missing_asset', `角色“${actor}”的状态更新尚无已知素材声明。`);
    }
  }

  for (const token of tokenizeStory(markdown)) {
    if (token.key === 'SCENE') {
      const id = token.value.trim().toLowerCase();
      if (act.scenes.some(item => item.id === id)) throw new Error(`场景 id 重复：${id}`);
      scene = {
        id, title: '', time: '', nodes: [],
        meta: { sourceFile: options.sourceFile, line: token.line },
      };
      act.scenes.push(scene);
      choice = undefined;
      option = undefined;
      setCount = 0;
      visualBatch.clear();
      continue;
    }
    if (!scene) throw new Error(`第 ${token.line} 行在 SCENE 前出现指令，已停止导出。`);
    switch (token.key) {
      case 'TITLE': scene.title = token.value; break;
      case 'TIME': scene.time = token.value; break;
      case 'BACKGROUND':
      case 'BGM':
      case 'SFX': {
        const kind = token.key.toLowerCase();
        const name = stripAssetMarkers(token.value);
        if (kind !== 'sfx' && scene[kind] === undefined) scene[kind] = name;
        append({ kind, name }, token);
        break;
      }
      case 'SHOW': {
        const node = parseShow(token.value);
        if (node.asset) actorAssets.set(node.actor, node.asset);
        else if (actorAssets.has(node.actor)) node.update = true;
        else collector.add(scene.id, token, 'missing_asset', `角色“${node.actor}”缺少 asset，且无可沿用的素材声明。`);
        append(node, token);
        break;
      }
      case 'POSE':
      case 'EXPRESSION': updateVisual(token); break;
      case 'HIDE': append({ kind: 'hide', actor: token.value }, token); break;
      case 'STAGE':
      case 'NARRATION': append({ kind: token.key.toLowerCase(), text: token.value }, token); break;
      case 'DIALOGUE':
      case 'INNER': {
        const speech = parseSpeech(token.value);
        append({ kind: token.key.toLowerCase(), ...speech }, token);
        if (speech.speaker) {
          const key = `${scene.id}:${speech.speaker}`;
          if (!speakers.has(key)) speakers.set(key, { sceneId: scene.id, actor: speech.speaker, token });
        }
        break;
      }
      case 'CHOICE': {
        option = undefined;
        choice = append({ kind: 'choice', prompt: token.value, options: [] }, token);
        break;
      }
      case 'OPTION': {
        option = undefined;
        if (!choice) choice = append({ kind: 'choice', prompt: '', options: [] }, token);
        const index = Number(token.index);
        option = {
          index, text: token.value,
          enabled: true,
          nodes: [],
        };
        annotate(option, token);
        choice.options.push(option);
        visualBatch.clear();
        break;
      }
      case 'SET': {
        setCount++;
        const sequence = String(setCount).padStart(2, '0');
        append({ kind: 'set', flag: `flag_${act.id}_${scene.id}_${sequence}`, note: token.raw }, token);
        break;
      }
      case 'CALL': {
        const node = append(parseCall(token.value), token);
        if (!node.name.startsWith('battle_')) {
          collector.add(scene.id, token, 'pending_call', `调用 ${node.name} 尚未接入；M0 只保留数据。`, policyResolution(scene.id, token));
        }
        break;
      }
      case 'CHECK':
        append({ kind: 'check', raw: token.raw }, token);
        collector.add(scene.id, token, 'check', 'CHECK 中的条件与嵌套 SET / JUMP 均不解释、不执行。', policyResolution(scene.id, token));
        break;
      case 'JUMP': append({ kind: 'jump', target: token.value.trim().toLowerCase() }, token); break;
      case 'END': append({ kind: 'end' }, token); break;
      case 'CAMERA': append({ kind: 'meta', directive: 'CAMERA', raw: token.raw, meta: true }, token); break;
      default:
        append({ kind: 'unknown', raw: token.raw, meta: true }, token);
        collector.add(scene.id, token, 'unknown', `未定义的指令 ${token.key}；保留原文并隐藏，不中断导出。`);
    }
  }
  if (!act.scenes.length) throw new Error('正式脚本没有 SCENE，已停止导出。');
  for (const entry of speakers.values()) {
    if (!actorAssets.has(entry.actor)) {
      collector.add(entry.sceneId, entry.token, 'missing_asset', `说话人“${entry.actor}”没有任何含 asset 的 SHOW 声明。`);
    }
  }
  normalizeChoices(act, locations, collector);
  return { act, warnings: collector.finish() };
}
