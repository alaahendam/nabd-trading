import { aapl, watchlistItem } from '@nabd/testing';
import {
  historyHandler,
  server,
  stockHandler,
  stocksHandler,
  watchlistHandler,
} from '@nabd/testing/msw';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { use } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestServices } from '../../test/app-services';
import { Shell } from '../layout/shell';
import { Providers } from '../providers/providers';
import { StockPage } from './pages/stock-page';
import { createAppRoutes } from './routes';

const mount = (
  path = '/stocks',
  { language = 'en', onError = vi.fn() }: { language?: 'en' | 'ar'; onError?: () => void } = {},
  routes = createAppRoutes({ onError }),
) => {
  const test = createTestServices({ language });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers services={test.services}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...test, router, onError };
};

beforeEach(() => {
  document.title = '';
  server.use(stocksHandler, watchlistHandler());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('app routes and shell', () => {
  it('APP-02 has the landmarks and a skip link to the main content', async () => {
    mount();
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('APP-03 makes the skip link the first stop for the keyboard', async () => {
    mount();
    await screen.findByRole('heading', { name: 'Stocks' });
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
  });

  it('APP-04 navigates and marks the current page', async () => {
    mount('/stocks');
    await screen.findByRole('heading', { level: 1, name: 'Stocks' });
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Stocks' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(within(nav).getByRole('link', { name: 'Watchlist' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
    expect(within(nav).getByRole('link', { name: 'Watchlist' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Stocks' })).not.toHaveAttribute('aria-current');
  });

  it('APP-04 sends the root to the stock list', async () => {
    const { router } = mount('/');
    await screen.findByRole('heading', { level: 1, name: 'Stocks' });
    expect(router.state.location.pathname).toBe('/stocks');
  });

  it('APP-04 opens the stock page for a symbol and titles the tab with it', async () => {
    server.use(stockHandler, historyHandler);
    mount('/stocks/AAPL');
    expect(await screen.findByRole('heading', { level: 1, name: 'AAPL' })).toBeVisible();
    expect(screen.getByText('Apple Inc.')).toBeVisible();
    expect(document.title).toBe('AAPL · Nabd');
  });

  it('APP-19 puts a star on every row of the stock list', async () => {
    mount('/stocks');
    await screen.findByText('Apple Inc.');
    expect(await screen.findAllByRole('button', { name: /^Watch / })).toHaveLength(2);
  });

  it('APP-20 puts the star beside the symbol on the stock page', async () => {
    server.use(stockHandler, historyHandler);
    mount('/stocks/AAPL');
    await screen.findByRole('heading', { level: 1, name: 'AAPL' });
    expect(await screen.findByRole('button', { name: 'Watch AAPL' })).toBeVisible();
  });

  it('APP-21 lists the watched stocks on the watchlist page', async () => {
    server.use(watchlistHandler([watchlistItem]));
    mount('/watchlist');
    expect(await screen.findByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
    expect(await screen.findByText(aapl.name)).toBeVisible();
    expect(screen.queryByText('Berkshire Hathaway Inc.')).not.toBeInTheDocument();
  });

  it('APP-17 shows the not found page when the stock route has no symbol', async () => {
    mount('/anything', {}, [
      {
        element: <Shell onError={vi.fn()} />,
        children: [{ path: 'anything', element: <StockPage /> }],
      },
    ]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(document.title).toBe('Page not found · Nabd');
  });

  it('APP-05 shows the not found page for an unknown route', async () => {
    mount('/nope');
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to stocks' })).toHaveAttribute('href', '/stocks');
  });

  it('APP-06 switches the theme and reports the choice', async () => {
    const { services } = mount();
    const select = await screen.findByRole('combobox', { name: 'Theme' });
    expect(select).toHaveValue('system');
    await userEvent.selectOptions(select, 'dark');
    expect(services.themeStore.getState().preference).toBe('dark');
    expect(select).toHaveValue('dark');
  });

  it('APP-07 switches to Arabic: text, direction and the document', async () => {
    const { languageRoot } = mount();
    const select = await screen.findByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    await userEvent.selectOptions(select, 'ar');
    expect(await screen.findByRole('heading', { level: 1, name: 'الأسهم' })).toBeVisible();
    expect(languageRoot).toMatchObject({ lang: 'ar', dir: 'rtl' });
    expect(screen.getByRole('combobox', { name: 'اللغة' })).toHaveValue('ar');
  });

  it('APP-23 leads home from the logo, named with the app name', async () => {
    mount('/watchlist');
    const banner = await screen.findByRole('banner');
    const home = within(banner).getByRole('link', { name: 'Nabd' });
    expect(home).toHaveAttribute('href', '/stocks');
  });

  it('APP-22 ignores a language value that is not offered', async () => {
    const { languageRoot } = mount();
    const select = await screen.findByRole('combobox', { name: 'Language' });
    fireEvent.change(select, { target: { value: 'xx' } });
    expect(languageRoot).toMatchObject({ lang: 'en', dir: 'ltr' });
  });

  it('APP-08 follows the realtime connection', async () => {
    const { socket } = mount();
    const connection = async () => within(await screen.findByRole('banner')).getByRole('status');
    expect(await connection()).toHaveTextContent('Connecting…');

    act(() => {
      socket.simulateConnect();
    });
    expect(await connection()).toHaveTextContent('Live');

    act(() => {
      socket.simulateDisconnect('transport close');
    });
    expect(await connection()).toHaveTextContent('Reconnecting…');
  });

  it('APP-18 credits the chart library with its notice and a link, as its license asks', async () => {
    mount();
    const footer = await screen.findByRole('contentinfo');
    const credit = within(footer).getByRole('link', { name: /TradingView Lightweight Charts/ });
    expect(credit).toHaveTextContent('Copyright © 2025 TradingView, Inc.');
    expect(credit).toHaveAttribute('href', 'https://www.tradingview.com/');
    expect(credit).toHaveAttribute('rel', 'noopener noreferrer');
    expect(credit).toHaveAttribute('target', '_blank');
  });

  it('APP-18 keeps the notice in English and left to right in the Arabic layout', async () => {
    mount('/stocks', { language: 'ar' });
    const credit = await screen.findByRole('link', { name: /TradingView Lightweight Charts/ });
    expect(credit).toHaveAttribute('lang', 'en');
    expect(credit).toHaveAttribute('dir', 'ltr');
  });

  it('APP-09 says the data is simulated', async () => {
    mount();
    const footer = await screen.findByRole('contentinfo');
    expect(within(footer).getByText('Simulated market data')).toBeVisible();
    expect(
      within(footer).getByText('All prices are simulated and are not real market data.'),
    ).toBeVisible();
  });

  it('APP-10 keeps the shell when a page throws, and recovers on navigation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken = () => {
      throw new Error('page failed');
    };
    const onError = vi.fn();
    mount('/broken', { onError }, [
      {
        element: <Shell onError={onError} />,
        children: [
          { path: 'broken', element: <Broken /> },
          { path: 'stocks', element: <h1>Fine</h1> },
        ],
      },
    ]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('banner')).toBeVisible();
    expect(onError).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('link', { name: 'Stocks' }));
    expect(await screen.findByRole('heading', { name: 'Fine' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('APP-13 shows a loading status while a page loads', async () => {
    const Suspender = () => use(new Promise<never>(() => undefined));
    mount('/slow', {}, [
      {
        element: <Shell onError={vi.fn()} />,
        children: [{ path: 'slow', element: <Suspender /> }],
      },
    ]);
    expect(await screen.findByText('Loading…')).toBeVisible();
  });

  it('APP-14 follows the page and the language in the document title', async () => {
    mount('/stocks');
    await screen.findByRole('heading', { level: 1, name: 'Stocks' });
    expect(document.title).toBe('Stocks · Nabd');

    await userEvent.click(screen.getByRole('link', { name: 'Watchlist' }));
    await screen.findByRole('heading', { level: 1, name: 'Watchlist' });
    expect(document.title).toBe('Watchlist · Nabd');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ar');
    expect(document.title).toBe('قائمة المراقبة · نبض');
  });

  it('APP-14 titles the not found page', async () => {
    mount('/nope');
    await screen.findByRole('heading', { level: 1, name: 'Page not found' });
    expect(document.title).toBe('Page not found · Nabd');
  });
});
