import { expect, test } from '@playwright/test';

test('a failing server shows an error with a retry that recovers', async ({ page }) => {
  await page.route('**/api/stocks?*', (route) => route.abort());
  await page.goto('/stocks');

  // Network errors are retried a couple of times before the error is shown.
  await expect(page.getByRole('alert')).toContainText('Could not load stocks', { timeout: 20_000 });

  await page.unroute('**/api/stocks?*');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('21 stocks')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('going offline and coming back is shown and recovers', async ({ page, context }) => {
  await page.goto('/stocks');
  const connection = page.getByRole('banner').getByRole('status');
  await expect(connection).toHaveText('Live');

  await context.setOffline(true);
  await expect(connection).toHaveText('Offline');

  await context.setOffline(false);
  await expect(connection).toHaveText('Live', { timeout: 30_000 });
});

test('reduced motion switches animations and transitions off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/stocks');
  await expect(page.getByText('21 stocks')).toBeVisible();

  const durations = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector('main button') ?? document.body);
    return [style.transitionDuration, style.animationDuration].map((value) => parseFloat(value));
  });
  for (const seconds of durations) {
    expect(seconds).toBeLessThan(0.001);
  }
});

test.describe('on a 320 px screen', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  for (const [path, waitFor] of [
    ['/stocks', '21 stocks'],
    ['/stocks/AAPL', 'Previous close'],
    ['/watchlist', 'Your watchlist is empty'],
    ['/no-such-page', 'Page not found'],
  ] as const) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(waitFor).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('the custom range form fits as well', async ({ page }) => {
    await page.goto('/stocks/AAPL');
    await page.getByRole('button', { name: 'Custom' }).click();
    await expect(page.getByLabel('From')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
