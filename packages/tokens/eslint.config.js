import { portable } from '@nabd/config/eslint/portable';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig(
  portable,
  {
    // The palette is the one place with color literals; its tests check real colors against it.
    files: ['src/palette.ts', 'src/**/*.test.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // The generator script runs in Node.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
