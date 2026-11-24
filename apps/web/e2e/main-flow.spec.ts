import { expect, test } from '@playwright/test';

/**
 * The whole app the way a user meets it, against the real server: a live list, a stock page with
 * its chart, a star that survives a reload, the watchlist, and the switch to Arabic. Prices are
 * random, so the test waits for a price to change and never expects a number.
 */
test('a user follows a stock from the live list to the watchlist, in two languages', async ({
  page,
}) => {
  await page.goto('/stocks');

  // The list loads a page, says how many stocks there are, and is live.
  await expect(page.getByRole('heading', { level: 1, name: 'Stocks' })).toBeVisible();
  await expect(page.getByText('21 stocks')).toBeVisible();
  await expect(page.getByRole('banner').getByRole('status')).toHaveText('Live');
  const firstPrice = page.locator('main li').first().locator('[data-direction]');
  await expect(firstPrice).toHaveText(/^\$\d/);
  const before = await firstPrice.innerText();
  await expect.poll(async () => firstPrice.innerText(), { timeout: 30_000 }).not.toBe(before);

  // The stock page shows the header and the chart.
  await page.getByRole('link', { name: /AAPL/ }).click();
  await expect(page).toHaveURL(/\/stocks\/AAPL$/);
  await expect(page.getByRole('heading', { level: 1, name: 'AAPL' })).toBeVisible();
  await expect(page.getByText('Previous close')).toBeVisible();
  const chart = page.getByRole('img', { name: 'AAPL price chart: Past day' });
  await expect(chart.locator('canvas').first()).toBeVisible();

  // Another period reloads the chart and is named in its label.
  await page.getByRole('button', { name: 'Past week' }).click();
  await expect(page.getByRole('button', { name: 'Past week' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('img', { name: 'AAPL price chart: Past week' })).toBeVisible();

  // The star adds it to the watchlist at once.
  const star = page.getByRole('button', { name: 'Watch AAPL' });
  await expect(star).toBeEnabled();
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');

  // The watchlist shows it, and it is still there after a reload (the server kept it).
  await page.getByRole('navigation', { name: 'Main navigation' }).getByText('Watchlist').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
  await expect(page.getByRole('link', { name: /AAPL/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /AAPL/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Watch AAPL' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Arabic flips the language, the direction and the document, and the choice is kept.
  await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');
  await expect(page.getByRole('heading', { level: 1, name: 'قائمة المراقبة' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'قائمة المراقبة' })).toBeVisible();

  // Taking the star off empties the watchlist.
  await page.getByRole('button', { name: 'متابعة AAPL' }).click();
  await expect(page.getByText('قائمة المراقبة فارغة')).toBeVisible();
});

test('a custom range replaces the period and names the chart with its dates', async ({ page }) => {
  await page.goto('/stocks/MSFT');
  await expect(page.getByRole('heading', { level: 1, name: 'MSFT' })).toBeVisible();

  await page.getByRole('button', { name: 'Custom' }).click();
  const to = new Date();
  const from = new Date(to.getTime() - 5 * 86_400_000);
  const day = (date: Date) => date.toISOString().slice(0, 10);
  await page.getByLabel('From').fill(day(from));
  await page.getByLabel('To').fill(day(to));
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(
    page.getByRole('img', { name: `MSFT price chart: ${day(from)} – ${day(to)}` }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Custom' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
