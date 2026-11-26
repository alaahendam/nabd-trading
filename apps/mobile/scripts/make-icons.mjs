// Draws the app icon, the adaptive icon and the splash image: a heartbeat line (the name means
// "pulse") in the accent color. It uses no image library: each pixel's coverage comes from its
// distance to the line, and the PNG is written by hand. Run `node scripts/make-icons.mjs` to
// redraw them; the results in `assets/` are committed.
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

import { resolveToken } from '@nabd/tokens';

const SIZE = 1024;
const background = resolveToken('light', 'brand');
const line = resolveToken('dark', 'brand');

// The heartbeat, in a unit square: flat, a small rise, a deep drop, a high peak, flat again.
const POINTS = [
  [0.14, 0.52],
  [0.34, 0.52],
  [0.42, 0.34],
  [0.52, 0.72],
  [0.61, 0.28],
  [0.68, 0.52],
  [0.86, 0.52],
];

const rgb = (hex) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** An RGBA picture: `background` (or transparent) with the line, scaled about the centre. */
function draw({ background: fill, scale }) {
  const points = POINTS.map(([x, y]) => [
    (0.5 + (x - 0.5) * scale) * SIZE,
    (0.5 + (y - 0.5) * scale) * SIZE,
  ]);
  const radius = 0.03 * scale * SIZE;
  const lineColor = rgb(line);
  // With no fill the edges stay the line color and only fade in alpha, so there is no dark fringe.
  const fillColor = fill === undefined ? lineColor : rgb(fill);
  const pixels = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let distance = Infinity;
      for (let index = 1; index < points.length; index += 1) {
        distance = Math.min(
          distance,
          distanceToSegment(x + 0.5, y + 0.5, points[index - 1], points[index]),
        );
      }
      const coverage = Math.max(0, Math.min(1, radius - distance + 0.5));
      const base = fill === undefined ? 0 : 255;
      const offset = (y * SIZE + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[offset + channel] = Math.round(
          lineColor[channel] * coverage + fillColor[channel] * (1 - coverage),
        );
      }
      pixels[offset + 3] = Math.round(255 * coverage + base * (1 - coverage));
    }
  }
  return pixels;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function png(pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    pixels.copy(rows, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(assets, { recursive: true });
const files = {
  // The store icon: the line on the brand color, filling the square.
  'icon.png': draw({ background, scale: 1 }),
  // Android masks the foreground to a circle or a squircle: keep the line in the middle 66%.
  'adaptive-icon.png': draw({ background: undefined, scale: 0.62 }),
  // The splash: the line alone, on the brand color the splash screen sets.
  'splash-icon.png': draw({ background: undefined, scale: 1 }),
};
for (const [name, pixels] of Object.entries(files)) {
  writeFileSync(join(assets, name), png(pixels));
}
