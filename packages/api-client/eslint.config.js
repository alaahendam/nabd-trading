import { portable } from '@nabd/config/eslint/portable';
import { defineConfig } from 'eslint/config';

export default defineConfig(portable, {
  // The one place that may call the network, and the tests that send requests through it.
  files: ['src/http-client.ts', 'src/**/*.test.ts'],
  rules: { 'no-restricted-globals': 'off' },
});
