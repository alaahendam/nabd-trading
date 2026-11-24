import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env['CI']);

// Dedicated ports, so a running dev server (3000, 5173) or preview (4173) never collides.
const API_PORT = 3300;
const WEB_PORT = 4273;
const API_URL = `http://localhost:${String(API_PORT)}`;
const WEB_URL = `http://localhost:${String(WEB_PORT)}`;

/**
 * The suite runs the real stack: the built server and the built web app. Every test gets a fresh
 * browser context, so a fresh client ID and an empty watchlist, and tests do not share state.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'github' : 'list',
  expect: { timeout: 15_000 },
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Turbo builds the shared package first, then the server.
      command: 'pnpm exec turbo run build --filter=@nabd/server && node dist/main.js',
      cwd: '../server',
      url: `${API_URL}/api/health`,
      env: { PORT: String(API_PORT), CORS_ORIGIN: WEB_URL },
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
    {
      command: `pnpm build && pnpm preview --port ${String(WEB_PORT)} --strictPort`,
      url: WEB_URL,
      env: { VITE_API_URL: API_URL },
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
  ],
});
