import { defineConfig } from '@playwright/test';

import base from './playwright.config';

/**
 * Takes the README screenshots against the same built server and web app as the E2E suite
 * (`pnpm --filter @nabd/web screenshots`). It is a separate config so the images are never part of
 * a test run.
 */
export default defineConfig({
  ...base,
  testDir: 'screenshots',
  reporter: 'list',
  retries: 0,
  use: { ...base.use, viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 },
});
