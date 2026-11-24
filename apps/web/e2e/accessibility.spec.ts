import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Waits until every finite animation and transition has ended, so contrast is measured on the
 * final colors and not in the middle of a fade or a price flash. Endless ones (skeleton pulses)
 * are not waited for.
 */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        // A flash replaced by the next tick is cancelled, which rejects `finished`: it is over too.
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );

const PAGES = [
  { path: '/stocks', ready: (page: Page) => page.getByText(/^21 stocks|^21 سهمًا/).waitFor() },
  {
    path: '/stocks/AAPL',
    ready: async (page: Page) => {
      await page.getByRole('figure', { name: /AAPL/ }).locator('canvas').first().waitFor();
    },
  },
  {
    path: '/watchlist',
    ready: (page: Page) => page.getByRole('heading', { level: 1 }).waitFor(),
  },
  {
    path: '/no-such-page',
    ready: (page: Page) => page.getByRole('heading', { level: 1 }).waitFor(),
  },
];

for (const theme of ['light', 'dark']) {
  for (const language of ['en', 'ar']) {
    test.describe(`${theme} theme, ${language}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(
          ([savedTheme, savedLanguage]) => {
            localStorage.setItem('nabd.theme', savedTheme ?? '');
            localStorage.setItem('nabd.language', savedLanguage ?? '');
          },
          [theme, language],
        );
      });

      for (const { path, ready } of PAGES) {
        test(`${path} has no WCAG A or AA violations`, async ({ page }) => {
          await page.goto(path);
          await ready(page);
          await settled(page);

          const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();

          expect(
            violations.map((violation) => ({
              rule: violation.id,
              impact: violation.impact,
              nodes: violation.nodes.map((node) => node.target.join(' ')),
            })),
          ).toEqual([]);
        });
      }
    });
  }
}

test('the custom range form and its error have no violations', async ({ page }) => {
  await page.goto('/stocks/AAPL');
  await page.getByRole('button', { name: 'Custom' }).click();
  await page.getByLabel('From').fill('2026-01-10');
  await page.getByLabel('To').fill('2026-01-05');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await settled(page);

  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);
});
