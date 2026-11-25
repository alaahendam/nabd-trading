import { portable } from '@nabd/config/eslint/portable';
import { defineConfig } from 'eslint/config';

export default defineConfig(portable, {
  // The mock API handlers are tested by really sending requests through them.
  files: ['src/**/*.test.ts'],
  rules: { 'no-restricted-globals': 'off' },
});
