import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5195/dimensional-war-game-source/');
const output = process.argv[3] ?? 'local-resources.json';
assert.match(output, /^[a-z-]+\.json$/);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const page = await fetch(base, { cache: 'no-store' }); assert.equal(page.status, 200);
const html = await page.text(), script = /<script[^>]+src="([^"]+)"/.exec(html)?.[1];
assert.ok(script, '入口必须有生产模块');
const moduleUrl = new URL(script, base); assert.equal(moduleUrl.origin, base.origin);
const moduleResponse = await fetch(moduleUrl, { cache: 'no-store' }); assert.equal(moduleResponse.status, 200);
assert.match(moduleResponse.headers.get('content-type') ?? '', /javascript/);
const js = await moduleResponse.text();
for (const marker of ['dw.save.v4', 'prologue_four_parts_v1', 'prologue3_01', 'prologue4_01', 'blocked-call']) assert.ok(js.includes(marker), marker);
const css = /<link[^>]+stylesheet[^>]+href="([^"]+)"/.exec(html)?.[1]; assert.ok(css);
const cssResponse = await fetch(new URL(css, base)); assert.equal(cssResponse.status, 200);
assert.match(cssResponse.headers.get('content-type') ?? '', /text\/css/);
const registration = JSON.parse(await readFile(resolve(root, 'art/prologue-v2/registration.json'), 'utf8'));
const halfRegistration = JSON.parse(await readFile(resolve(root, 'art/hero-half-v1/registration.json'), 'utf8'));
const portraits = await Promise.all([...registration.assets, ...halfRegistration.assets].map(async asset => {
  const url = new URL(asset.file.replace(/^public\//, ''), base);
  const response = await fetch(url, { cache: 'no-store' }); assert.equal(response.status, 200, asset.id);
  assert.match(response.headers.get('content-type') ?? '', /image\/png/, asset.id);
  const sha256 = hash(new Uint8Array(await response.arrayBuffer())); assert.equal(sha256, asset.sha256, asset.id);
  return { id: asset.id, url: String(url), status: response.status, sha256 };
}));
const result = { base: String(base), checkedAt: new Date().toISOString(), html: page.status, module: String(moduleUrl),
  jsBytes: Buffer.byteLength(js), css: cssResponse.status, contentVersion: 'prologue_four_parts_v1', portraits };
await writeFile(resolve(root, 'docs/verification/prologue-v2', output), `${JSON.stringify(result, null, 2)}\n`);
console.log(`${base}：入口、JS／CSS、v4／四段标记与${portraits.length}张PNG的远端哈希通过。`);
