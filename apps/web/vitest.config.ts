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
        'src/lib/i18n/language-store.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/i18n/i18n-provider.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/connectivity/browser-connectivity.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/api/browser-client-id.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/app/**/*.{ts,tsx}': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/features/watchlist/**/*.{ts,tsx}': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/features/stocks/**/*.{ts,tsx}': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/shared/**/*.{ts,tsx}': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/theme/theme.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/lib/theme/theme-hooks.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
