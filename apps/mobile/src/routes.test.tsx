import { renderRouter, screen } from 'expo-router/testing-library';

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
});
