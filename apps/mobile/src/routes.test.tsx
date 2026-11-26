import { aapl } from '@nabd/testing';
import { router } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';

// The root layout reads this once, when it loads, which is when `renderRouter` first needs it.
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

/** The server, by address: the stock list and one stock, an empty watchlist, nothing else. */
function stubServer() {
  jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url).pathname;
    if (path.endsWith('/stocks/AAPL')) return Promise.resolve(Response.json({ data: aapl }));
    if (path.endsWith('/stocks')) {
      return Promise.resolve(Response.json({ data: [aapl], nextCursor: null, total: 1 }));
    }
    if (path.endsWith('/watchlist')) return Promise.resolve(Response.json({ data: [] }));
    return Promise.resolve(
      Response.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
    );
  });
}

beforeEach(stubServer);
afterEach(() => {
  jest.restoreAllMocks();
});

describe('routes', () => {
  it('ROU-01 opens on the stock list', async () => {
    await renderRouter('./app');

    expect(await screen.findByText('Apple Inc.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('ROU-02 opens the watchlist', async () => {
    await renderRouter('./app', { initialUrl: '/watchlist' });

    expect(await screen.findByText('Your watchlist is empty')).toBeOnTheScreen();
    expect(screen).toHavePathname('/watchlist');
  });

  it('ROU-03 shows the not-found screen for an unknown address', async () => {
    await renderRouter('./app', { initialUrl: '/nowhere' });

    expect(await screen.findByText('Page not found')).toBeOnTheScreen();
  });

  it('ROU-04 opens the stock detail above the tabs, and going back returns to them', async () => {
    await renderRouter('./app');
    await screen.findByText('Apple Inc.');

    await act(() => {
      router.push({ pathname: '/stock/[symbol]', params: { symbol: 'AAPL' } });
    });

    expect(await screen.findByRole('header', { name: 'AAPL' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/stock/AAPL');

    await act(() => {
      router.back();
    });

    expect(screen).toHavePathname('/');
  });

  it.each(['/', '/watchlist', '/stock/AAPL'])(
    'ROU-05 shows the simulated-data notice and the connection on %s',
    async (url) => {
      await renderRouter('./app', { initialUrl: url });

      expect(await screen.findByText('Simulated market data')).toBeOnTheScreen();
      expect(screen.getByText('Connecting…')).toBeOnTheScreen();
    },
  );
});

describe('safe areas', () => {
  it.each([
    ['/', ['left', 'right']],
    ['/watchlist', ['left', 'right']],
    ['/settings', ['left', 'right']],
    ['/stock/AAPL', ['bottom', 'left', 'right']],
    ['/nowhere', ['bottom', 'left', 'right', 'top']],
  ])(
    'SAF-01 on %s leaves out the edges the header and the tab bar already cover',
    async (url, edges) => {
      await renderRouter('./app', { initialUrl: url });
      await screen.findByTestId('screen');

      const modes = screen.getByTestId('screen').props['edges'] as Record<string, string>;
      const on = Object.entries(modes)
        .filter(([, mode]) => mode !== 'off')
        .map(([edge]) => edge)
        .sort();

      expect(on).toEqual(edges);
    },
  );
});
