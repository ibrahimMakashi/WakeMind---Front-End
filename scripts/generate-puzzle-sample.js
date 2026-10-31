/**
 * Generates src/assets/puzzle/sample.png (500×500) with distinct 5×5 regions.
 * Uses Node zlib only — run once: node scripts/generate-puzzle-sample.js
 */
/* eslint-env node */
/* eslint-disable no-bitwise */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 500;
const GRID = 5;
const CELL = SIZE / GRID;

const OUT = path.join(__dirname, '..', 'src', 'assets', 'puzzle', 'sample.png');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function cellColor(index) {
  const row = Math.floor(index / GRID);
  const col = index % GRID;
  const navy = 0x0b1020;
  const amber = 0xffb84d;
  const mix = (index * 17 + row * 31 + col * 53) % 100;
  if (mix < 35) {
    return {r: (navy >> 16) & 255, g: (navy >> 8) & 255, b: navy & 255};
  }
  if (mix < 70) {
    return {r: 0x22, g: 0x2a, b: 0x3b};
  }
  return {r: (amber >> 16) & 255, g: (amber >> 8) & 255, b: amber & 255};
}

function buildPixels() {
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 3));
  let offset = 0;
  for (let y = 0; y < SIZE; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < SIZE; x += 1) {
      const row = Math.min(GRID - 1, Math.floor(y / CELL));
      const col = Math.min(GRID - 1, Math.floor(x / CELL));
      const index = row * GRID + col;
      const {r, g, b} = cellColor(index);
      const edge =
        x % CELL === 0 || y % CELL === 0 ? 0x2c3447 : null;
      if (edge) {
        raw[offset] = (edge >> 16) & 255;
        raw[offset + 1] = (edge >> 8) & 255;
        raw[offset + 2] = edge & 255;
      } else {
        raw[offset] = r;
        raw[offset + 1] = g;
        raw[offset + 2] = b;
      }
      offset += 3;
    }
  }
  return zlib.deflateSync(raw, {level: 9});
}

function writePng() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = buildPixels();
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  fs.writeFileSync(OUT, png);
  console.log(`Wrote ${OUT} (${png.length} bytes)`);
}

writePng();
