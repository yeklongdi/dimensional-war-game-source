import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createExportBundle } from './story-bundle.mjs';
import { walkNodes } from './story-normalize.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const defaults = { prologue: 'samples/story/prologue.md', act1: 'samples/story/act1.md' };
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

function inputs(argv) {
  const result = { ...defaults };
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (key !== '--prologue' && key !== '--act1') throw new Error('Unknown argument ' + key);
    const value = argv[++index];
    if (!value) throw new Error(key + ' requires an input path.');
    result[key.slice(2)] = value;
  }
  return result;
}

async function main() {
  const paths = inputs(process.argv.slice(2));
  const files = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([act, path]) => {
    try { return [act, { path, bytes: await readFile(resolve(process.cwd(), path)) }]; }
    catch (error) {
      throw new Error('Cannot read ' + act + ' input ' + path + '. Use samples/story or pass a readable path.\n' + error.message);
    }
  })));
  const fingerprints = Object.values(files).map(file => hash(file.bytes));
  const bundle = createExportBundle({
    prologue: files.prologue.bytes.toString('utf8'),
    act1: files.act1.bytes.toString('utf8'),
  });
  const outputs = [
    ...bundle.acts.map(act => ['src/content/' + act.id + '.json', JSON.stringify(act, null, 2) + '\n']),
    ['src/content/index.json', JSON.stringify(bundle.index, null, 2) + '\n'],
    ['docs-public/open-questions.md', bundle.questions],
  ];
  const current = await Promise.all(Object.entries(paths).map(async ([act, path]) =>
    readFile(resolve(process.cwd(), path)).then(bytes => [act, bytes])));
  if (current.some(([act, bytes]) => hash(bytes) !== hash(files[act].bytes))) {
    throw new Error('Input files changed during export; no outputs were written.');
  }
  for (const [file, contents] of outputs) {
    const destination = resolve(root, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents, 'utf8');
  }
  const after = await Promise.all(Object.values(files).map(file => readFile(resolve(process.cwd(), file.path))));
  if (after.some((bytes, index) => hash(bytes) !== fingerprints[index])) throw new Error('Sample input hash check failed.');
  const calls = bundle.acts.flatMap(act => act.scenes.flatMap(scene =>
    [...walkNodes(scene.nodes)].filter(node => node.kind === 'call' && node.name.startsWith('battle_'))));
  console.log(bundle.acts.map(act => act.title + ': ' + act.scenes.length + ' scenes').join(' / ')
    + '; ' + bundle.index.warningCount + ' diagnostics; ' + calls.length + ' sample battle calls.');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});