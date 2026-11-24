import { expect, test } from '@playwright/test';

test('the app shell loads and the root opens the stock list', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/stocks$/);
  await expect(page).toHaveTitle('Stocks · Nabd');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Stocks');
  await expect(page.getByText('Simulated market data')).toBeVisible();
});
