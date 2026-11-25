import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node by default: nothing here may need a browser. The test of the React bindings opts into
    // jsdom for itself, to render components.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-wrapper.tsx'],
      reporter: ['text', 'lcov'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
