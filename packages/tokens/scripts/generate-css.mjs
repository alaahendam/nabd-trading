// Writes the web's tokens.css from the built package: `pnpm --filter @nabd/tokens run generate`.
import { writeFileSync } from 'node:fs';

import { generateTokensCss } from '../dist/index.js';

const target = process.argv[2];
if (target === undefined) {
  throw new Error('Usage: node scripts/generate-css.mjs <path to tokens.css>');
}
writeFileSync(target, generateTokensCss());
console.log(`Wrote ${target}`);
