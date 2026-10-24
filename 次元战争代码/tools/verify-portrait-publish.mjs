import { readFileSync, writeFileSync, readdirSync } from './evidence-files.mjs';
import { createHash } from 'node:crypto';
const base = process.argv[2], output = process.argv[3];
if (!base || !output?.startsWith('docs/verification/portrait-layout/')) throw new Error('需要目标base和本轮证据路径');
const files = [], sha = data => createHash('sha256').update(data).digest('hex');
function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) {
  const path = `${dir}/${entry.name}`; if (entry.isDirectory()) walk(path); else files.push(path);
} }
walk('dist');
const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < files.length) {
    const file = files[cursor++], expected = sha(readFileSync(file));
    const url = new URL(file.slice('dist/'.length), base.endsWith('/') ? base : `${base}/`).href;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      const bytes = new Uint8Array(await response.arrayBuffer()), actual = sha(bytes);
      results.push({ file, url, status: response.status, bytes: bytes.length, expected, actual, match: response.ok && expected === actual });
    } catch (error) { results.push({ file, url, expected, match: false, error: String(error) }); }
  }
}));
results.sort((a, b) => a.file.localeCompare(b.file));
const result = { base, checkedAt: new Date().toISOString(), total: results.length, failed: results.filter(f => !f.match), results };
writeFileSync(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ total: result.total, failed: result.failed.map(f => ({ file: f.file, status: f.status, error: f.error })) }));
if (result.failed.length) process.exitCode = 1;
