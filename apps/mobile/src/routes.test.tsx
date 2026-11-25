import { router } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';

// The root layout reads this once, when it loads, which is when `renderRouter` first needs it.
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

describe('routes', () => {
  it('ROU-01 opens on the stock list', async () => {
    await renderRouter('./app');

    expect(await screen.findByRole('header', { name: 'Stocks' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('ROU-02 opens the watchlist', async () => {
    await renderRouter('./app', { initialUrl: '/watchlist' });

    expect(await screen.findByRole('header', { name: 'Watchlist' })).toBeOnTheScreen();
    expect(screen).toHavePathname('/watchlist');
  });

  it('ROU-03 shows the not-found screen for an unknown address', async () => {
    await renderRouter('./app', { initialUrl: '/nowhere' });

    expect(await screen.findByText('Page not found')).toBeOnTheScreen();
  });

  it('ROU-04 opens the stock detail above the tabs, and going back returns to them', async () => {
    await renderRouter('./app');
    await screen.findByRole('header', { name: 'Stocks' });

    await act(() => {
      router.push('/stock/AAPL');
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
