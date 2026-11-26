import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['eslint/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['eslint/mobile-rules.js'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
