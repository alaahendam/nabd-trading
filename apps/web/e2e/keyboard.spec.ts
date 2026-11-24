import { expect, type Page, test } from '@playwright/test';

interface Stop {
  /** What a screen reader would call it: aria-label, label, text, title or alt. */
  name: string;
  tag: string;
  /** Whether keyboard focus is visibly drawn (an outline or a ring). */
  indicator: boolean;
}

const TAB_LIMIT = 120;

/**
 * Presses Tab until focus leaves the page, and records every stop. A page that traps focus would
 * never leave, so reaching the limit is a failure.
 */
async function tabThrough(page: Page): Promise<Stop[]> {
  const stops: Stop[] = [];
  for (let press = 0; press < TAB_LIMIT; press += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate((): Stop | null => {
      const element = document.activeElement;
      if (element === null || element === document.body) {
        return null;
      }
      const style = getComputedStyle(element);
      const labelled: Partial<HTMLInputElement> = element;
      // The first candidate that is not empty: an empty aria-label or empty text is no name.
      const name =
        [
          element.getAttribute('aria-label'),
          labelled.labels?.[0]?.textContent,
          element.textContent,
          element.getAttribute('title'),
        ]
          .map((candidate) => candidate?.trim())
          .find((candidate) => candidate !== undefined && candidate !== '') ?? '';
      return {
        name,
        tag: element.tagName.toLowerCase(),
        indicator:
          (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
          style.boxShadow !== 'none',
      };
    });
    if (stop === null) {
      return stops;
    }
    stops.push(stop);
  }
  throw new Error(`Focus never left the page after ${String(TAB_LIMIT)} Tab presses`);
}

const names = (stops: Stop[]) => stops.map((stop) => stop.name);

const PAGES = [
  {
    path: '/stocks',
    ready: async (page: Page) => {
      await page.getByText('21 stocks').waitFor();
      // A star is disabled until the watchlist has loaded, and a disabled button is not a stop.
      await expect(page.getByRole('button', { name: 'Watch AAPL' })).toBeEnabled();
    },
    expected: ['AAPL', 'Watch AAPL'],
  },
  {
    path: '/stocks/AAPL',
    ready: async (page: Page) => {
      await page.getByText('Previous close').waitFor();
      await expect(page.getByRole('button', { name: 'Watch AAPL' })).toBeEnabled();
    },
    expected: ['1D, Past day', '1W, Past week', 'Custom', 'Watch AAPL'],
  },
  {
    path: '/watchlist',
    ready: (page: Page) => page.getByText('Your watchlist is empty').waitFor(),
    expected: [],
  },
  {
    path: '/no-such-page',
    ready: (page: Page) => page.getByText('Page not found').waitFor(),
    expected: [],
  },
];

for (const { path, ready, expected } of PAGES) {
  test(`${path} can be used with the keyboard alone`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    const stops = await tabThrough(page);
    const found = names(stops);

    // The skip link comes first, then the header, then the page, then the footer.
    expect(found[0]).toBe('Skip to content');
    const nav = found.findIndex((name) => name.includes('Stocks'));
    expect(nav).toBeGreaterThan(0);
    for (const name of expected) {
      expect(found.some((candidate) => candidate.includes(name))).toBe(true);
    }
    expect(stops.at(-1)?.tag).toBe('a');
    expect(found.at(-1)).toContain('TradingView');

    // Every stop has a name a screen reader can say, and a focus indicator the eye can find.
    expect(stops.filter((stop) => stop.name === '')).toEqual([]);
    expect(stops.filter((stop) => !stop.indicator).map((stop) => stop.name)).toEqual([]);
  });
}

test('the skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/stocks');
  await page.getByText('21 stocks').waitFor();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('a stock opens with Enter and is followed with Space', async ({ page }) => {
  await page.goto('/stocks');
  await page.getByText('21 stocks').waitFor();
  await page.getByRole('link', { name: /AAPL/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/stocks\/AAPL$/);

  const star = page.getByRole('button', { name: 'Watch AAPL' });
  await expect(star).toBeEnabled();
  await star.focus();
  await page.keyboard.press('Space');
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(star).toHaveAttribute('aria-pressed', 'false');
});

test('the periods and the custom range work with the keyboard', async ({ page }) => {
  await page.goto('/stocks/AAPL');
  await page.getByText('Previous close').waitFor();

  const week = page.getByRole('button', { name: '1W, Past week' });
  await week.focus();
  await page.keyboard.press('Enter');
  await expect(week).toHaveAttribute('aria-pressed', 'true');

  const custom = page.getByRole('button', { name: 'Custom' });
  await custom.focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('From')).toBeVisible();

  // Tab goes From, To, Apply; Enter in a date field submits the form.
  await page.getByLabel('From').focus();
  await page.keyboard.press('Tab'); // the first Tab moves inside the date field's own parts
  await page.getByLabel('To').focus();
  await page.keyboard.press('Enter');
  await expect(custom).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('From')).toBeHidden();
});

test.describe('live prices and screen readers', () => {
  const LIVE = '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]';

  test('no price sits in a live region', async ({ page }) => {
    await page.goto('/stocks');
    await page.getByText('21 stocks').waitFor();
    const prices = page.locator('[data-direction]');
    await expect(prices.first()).toBeVisible();

    const inLive = await page.evaluate(
      (selector) =>
        [...document.querySelectorAll('[data-direction]')].filter((price) =>
          price.closest(selector),
        ).length,
      LIVE,
    );
    expect(inLive).toBe(0);
  });

  test('prices keep ticking without a single announcement', async ({ page }) => {
    await page.goto('/stocks');
    await page.getByText('21 stocks').waitFor();
    const firstPrice = page.locator('main li').first().locator('[data-direction]');
    const before = await firstPrice.innerText();

    // Count what a screen reader would be told: every change inside a live region.
    await page.evaluate((selector) => {
      const announced: string[] = [];
      Object.assign(window, { announced });
      new MutationObserver((records) => {
        for (const record of records) {
          const region = (
            record.target instanceof Element ? record.target : record.target.parentElement
          )?.closest(selector);
          if (region) {
            announced.push(region.textContent);
          }
        }
      }).observe(document.body, { subtree: true, childList: true, characterData: true });
    }, LIVE);

    await expect.poll(async () => firstPrice.innerText(), { timeout: 30_000 }).not.toBe(before);
    const announced = await page.evaluate(
      () => (window as unknown as { announced: string[] }).announced,
    );

    // Many prices changed on screen; none of it reached a live region.
    expect(announced.filter((text) => /\$\d/.test(text))).toEqual([]);
  });
});
