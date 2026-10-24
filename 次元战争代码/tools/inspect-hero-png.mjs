import { inflateSync } from 'node:zlib';

/** 检查实际RGBA像素而非四角透明；仅测试工具，无浏览器／运行时依赖。 */
export function inspectPng(bytes) {
  let width = 0, height = 0;
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset), kind = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('只接受8位非交错RGBA');
    }
    if (kind === 'IDAT') chunks.push(data);
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * 4;
  let previous = new Uint8Array(stride), nonzero = 0, partial = 0, outsideRgb = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(stride), start = y * (stride + 1), filter = raw[start];
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? row[i - 4] : 0, b = previous[i], c = i >= 4 ? previous[i - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predictor = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2)
        : filter === 4 ? pa <= pb && pa <= pc ? a : pb <= pc ? b : c : NaN;
      if (!Number.isFinite(predictor)) throw new Error('不支持的PNG滤镜');
      row[i] = (raw[start + 1 + i] + predictor) & 255;
    }
    for (let x = 0; x < width; x++) {
      const i = x * 4, alpha = row[i + 3];
      if (alpha > 0) {
        nonzero++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        if (alpha < 255) partial++;
      } else if (row[i] || row[i + 1] || row[i + 2]) outsideRgb++;
    }
    previous = row;
  }
  return { width, height, nonzero, partial, outsideRgb, bounds: [minX, minY, maxX + 1, maxY + 1] };
}
