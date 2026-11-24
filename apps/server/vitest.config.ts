import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.module.ts', 'src/**/*.test.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
