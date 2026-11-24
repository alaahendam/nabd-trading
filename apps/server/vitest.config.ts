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
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
        'src/modules/market/rng.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/modules/watchlist/watchlist.service.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/modules/watchlist/in-memory-watchlist.repository.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/modules/identity/identity.guard.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/modules/identity/current-user.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/modules/market/market.service.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/common/clock.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/modules/market/history.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/modules/market/simulator.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/modules/market/universe.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
