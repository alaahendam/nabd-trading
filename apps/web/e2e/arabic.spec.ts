import { expect, test } from '@playwright/test';

/**
 * Arabic is more than translated words: the page runs right to left, figures stay in Latin digits
 * and read left to right, and the chart is never mirrored.
 */
test('Arabic runs right to left, keeps Latin digits and leaves the chart left to right', async ({
  page,
}) => {
  await page.goto('/stocks/AAPL');
  await expect(page.getByRole('heading', { level: 1, name: 'AAPL' })).toBeVisible();
  const chart = page.getByRole('figure');
  await expect(chart.locator('canvas').first()).toBeVisible();

  await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');

  // The document flips.
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByText('الإغلاق السابق')).toBeVisible();

  // The chart keeps its own direction (time runs left to right) and says what it shows in Arabic.
  await expect(chart).toHaveAttribute('dir', 'ltr');
  await expect(chart).toHaveAccessibleDescription(/^اليوم الماضي: من \$\d[\d,]*\.\d{2} إلى /);

  // Every figure on the page is Latin: no Arabic-Indic or Persian digits anywhere.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/[٠-٩۰-۹]/);
  await expect(page.locator('dl dd').first()).toHaveText(/^\$\d[\d,]*\.\d{2}$/);

  // The layout mirrors: the logo is on the right, past the language selector.
  const logo = await page.getByRole('banner').getByRole('link').first().boundingBox();
  const language = await page.getByRole('combobox', { name: 'اللغة' }).boundingBox();
  expect(logo).not.toBeNull();
  expect(language).not.toBeNull();
  expect(logo?.x ?? 0).toBeGreaterThan(language?.x ?? Infinity);

  // Each detail starts on the same side as its title (the right edge, in Arabic).
  const misaligned = await page.evaluate(() =>
    [...document.querySelectorAll('dl dt')].flatMap((title) => {
      const value = title.nextElementSibling;
      if (value === null) {
        return [];
      }
      const range = document.createRange();
      range.selectNodeContents(title);
      const gap = Math.abs(
        range.getBoundingClientRect().right - value.getBoundingClientRect().right,
      );
      return gap > 1 ? [`${title.textContent}: ${String(Math.round(gap))}px`] : [];
    }),
  );
  expect(misaligned).toEqual([]);
});
