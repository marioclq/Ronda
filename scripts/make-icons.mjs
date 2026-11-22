import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePng(size, pixelAt) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixelAt(x / (size - 1), y / (size - 1));
      const offset = y * stride + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Same atmosphere as the SOFT level: dusk base with apricot, lilac and teal light, and one glass disc.
const BASE = [27, 22, 51];
const BLOBS = [
  { x: 0.15, y: 0.1, spread: 0.55, color: [255, 158, 128] },
  { x: 0.9, y: 0.95, spread: 0.6, color: [142, 124, 255] },
  { x: 0.55, y: 0.5, spread: 0.4, color: [63, 208, 201] },
];

function pixelAt(u, v) {
  let rgb = [...BASE];
  for (const blob of BLOBS) {
    const weight = Math.exp(-((u - blob.x) ** 2 + (v - blob.y) ** 2) / blob.spread ** 2) * 0.85;
    rgb = rgb.map((channel, i) => channel + (blob.color[i] - channel) * weight);
  }
  const dist = Math.hypot(u - 0.5, v - 0.5);
  const fill = 1 - smoothstep(0.255, 0.27, dist);
  const ring = Math.exp(-(((dist - 0.26) / 0.008) ** 2));
  const light = Math.min(1, Math.max(0, 0.5 + (0.5 - u + (0.5 - v))));
  const white = Math.min(1, fill * 0.18 + ring * (0.25 + 0.6 * light));
  rgb = rgb.map((channel) => channel + (255 - channel) * white);
  return [...rgb.map((channel) => Math.round(channel)), 255];
}

mkdirSync('public', { recursive: true });
for (const [name, size] of [['pwa-192.png', 192], ['pwa-512.png', 512], ['pwa-maskable-512.png', 512]]) {
  writeFileSync(`public/${name}`, encodePng(size, pixelAt));
  console.log(`wrote public/${name} (${size}x${size})`);
}
