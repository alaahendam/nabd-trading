import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

const OUT = join(import.meta.dirname, '..', '..', '..', 'docs', 'screenshots');
const STARRED = ['AAPL', 'MSFT', 'NVDA'];

/** Waits for fades and price flashes to end, so the image shows the resting colors. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );

const shoot = async (page: Page, name: string) => {
  await settled(page);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 78 });
};

mkdirSync(OUT, { recursive: true });

for (const theme of ['light', 'dark']) {
  for (const language of ['en', 'ar']) {
    test(`${theme} ${language}`, async ({ page }) => {
      await page.addInitScript(
        ([savedTheme, savedLanguage]) => {
          localStorage.setItem('nabd.theme', savedTheme ?? '');
          localStorage.setItem('nabd.language', savedLanguage ?? '');
        },
        [theme, language],
      );
      const name = (view: string) => `${view}-${theme}-${language}`;

      // The list, once prices are in and the connection is live.
      await page.goto('/stocks');
      await expect(page.locator('main li').first().locator('[data-direction]')).toHaveText(/^\$\d/);
      await shoot(page, name('stocks'));

      // Star three stocks so the watchlist has something in it.
      for (const symbol of STARRED) {
        const star = page.locator('main li', { hasText: symbol }).getByRole('button').first();
        await expect(star).toBeEnabled();
        await star.click();
        await expect(star).toHaveAttribute('aria-pressed', 'true');
      }
      await page.goto('/watchlist');
      await expect(page.locator('main li')).toHaveCount(STARRED.length);
      await shoot(page, name('watchlist'));

      // The detail page, with the chart drawn.
      await page.goto('/stocks/AAPL');
      const chart = page.getByRole('figure');
      await expect(chart.locator('canvas').first()).toBeVisible();
      await expect(chart).toHaveAccessibleDescription(/\d/);
      await shoot(page, name('stock'));
    });
  }
}
