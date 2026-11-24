import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Vitest stubs CSS imports with empty modules; tests that read the token files as text opt in.
    css: { include: [/\?raw$/] },
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
        'src/lib/theme/theme.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/theme/theme-hooks.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/realtime-hooks.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/clock-ticker.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/create-realtime-client.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/realtime-client.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/socket-io-adapter.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/price-store.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/staleness.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/market-data/connection-status.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
