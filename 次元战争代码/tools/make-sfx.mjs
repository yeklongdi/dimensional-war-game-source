import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 生成战斗反馈音效（16 位单声道 WAV）。全部为程序合成：正弦、噪声与包络，无第三方素材。 */
const rate = 22050;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'audio', 'sfx');

let seed = 20261117;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296) * 2 - 1;
const sine = (t, hz) => Math.sin(2 * Math.PI * hz * t);
const env = (t, dur, attack = 0.006, power = 2) => Math.min(1, t / attack) * Math.pow(Math.max(0, 1 - t / dur), power);

function track(duration, sample) {
  const length = Math.floor(duration * rate);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) data[i] = sample(i / rate);
  return data;
}
function mix(...parts) {
  const length = Math.max(...parts.map(part => part.length));
  const data = new Float32Array(length);
  for (const part of parts) for (let i = 0; i < part.length; i++) data[i] += part[i];
  return data;
}
function gain(data, scale) { for (let i = 0; i < data.length; i++) data[i] *= scale; return data; }
function noise(duration, power, tone) {
  return track(duration, t => rand() * Math.pow(1 - t / duration, power) * (tone ? tone(t) : 1));
}
function tone(duration, hz, power = 2) {
  let phase = 0;
  return track(duration, t => { phase += (2 * Math.PI * hz(t)) / rate; return Math.sin(phase) * Math.pow(1 - t / duration, power); });
}
function chord(duration, hz, power = 2) {
  return track(duration, t => hz.reduce((sum, f) => sum + sine(t, f), 0) / hz.length * Math.pow(1 - t / duration, power));
}
function write(name, data, peak = 0.55) {
  let max = 0;
  for (const value of data) max = Math.max(max, Math.abs(value));
  const scale = max > 0 ? peak / max : 0;
  const buffer = Buffer.alloc(44 + data.length * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + data.length * 2, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * scale)) * 32767), 44 + i * 2);
  writeFileSync(join(out, `${name}.wav`), buffer);
}

mkdirSync(out, { recursive: true });
write('fx_whiff', gain(noise(0.14, 3, t => 0.4 + 0.6 * Math.sin(2 * Math.PI * 900 * t)), 0.9), 0.4);
write('fx_punch', mix(tone(0.13, t => 150 - 90 * t, 3), gain(noise(0.07, 5), 0.5)), 0.6);
write('fx_blade', mix(tone(0.16, t => 2400 - 900 * t, 3), gain(noise(0.09, 4), 0.7)), 0.5);
write('fx_arrow', mix(noise(0.1, 6, t => 1 - 0.7 * t), gain(tone(0.09, t => 700 + 500 * t, 4), 0.4)), 0.45);
write('fx_cast', tone(0.24, t => 280 + 900 * t, 1.4), 0.4);
write('fx_fire', mix(noise(0.32, 2.4, t => 0.6 + 0.4 * Math.sin(2 * Math.PI * 40 * t)), gain(tone(0.3, () => 120, 3), 0.4)), 0.55);
write('fx_frost', mix(chord(0.3, [1760, 2637], 2.4), gain(noise(0.2, 5), 0.25)), 0.45);
write('fx_spark', mix(tone(0.18, t => 950 - 300 * t, 3), gain(noise(0.08, 5), 0.4)), 0.5);
write('fx_acid', mix(noise(0.28, 2, t => 0.5 + 0.5 * Math.sin(2 * Math.PI * 18 * t)), gain(tone(0.26, t => 220 - 90 * t, 3), 0.3)), 0.45);
write('fx_force', track(0.32, t => sine(t, 260) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 22 * t)) * env(t, 0.32, 0.01, 1.8)), 0.5);
write('fx_necrotic', mix(tone(0.34, t => 150 - 50 * t, 2), gain(noise(0.3, 3), 0.3)), 0.4);
write('fx_radiant', chord(0.38, [660, 880, 1320], 1.6), 0.5);
write('fx_crit', mix(tone(0.24, t => 180 - 60 * t, 2.4), gain(noise(0.16, 3), 0.7), gain(tone(0.2, t => 2200 - 800 * t, 3), 0.5)), 0.65);
write('fx_save', chord(0.28, [520, 780], 2.2), 0.42);
write('fx_fail', tone(0.24, t => 420 - 240 * t, 2.6), 0.45);
write('fx_heal', mix(tone(0.2, () => 523, 1.2), gain(tone(0.22, () => 784, 1.6), 0.8), gain(tone(0.26, () => 1046, 1.8), 0.6)), 0.45);
write('fx_ward', chord(0.4, [330, 440, 550], 1.8), 0.45);
write('fx_down', tone(0.44, t => 300 - 200 * t, 1.6), 0.5);
console.log(`已生成 ${out}`);
