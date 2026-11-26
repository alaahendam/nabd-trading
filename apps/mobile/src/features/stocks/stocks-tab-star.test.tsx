import { aapl } from '@nabd/testing';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

const urlOf = (input: Parameters<typeof fetch>[0]) =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

/** The server: one stock, an empty watchlist, and a watchlist that accepts an addition. */
function stubServer() {
  return jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const path = new URL(urlOf(input)).pathname;
    if (path.endsWith('/stocks/AAPL')) return Promise.resolve(Response.json({ data: aapl }));
    if (path.endsWith('/stocks')) {
      return Promise.resolve(Response.json({ data: [aapl], nextCursor: null, total: 1 }));
    }
    if (path.endsWith('/watchlist/AAPL') && init?.method === 'PUT') {
      return Promise.resolve(Response.json({ data: { symbol: 'AAPL', addedAt: 1 } }));
    }
    if (path.endsWith('/watchlist')) return Promise.resolve(Response.json({ data: [] }));
    return Promise.resolve(
      Response.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
    );
  });
}

/** What the app asked the watchlist to add: a PUT of the symbol's own address. */
const additions = (fetchMock: ReturnType<typeof stubServer>) =>
  fetchMock.mock.calls
    .filter(([, init]) => init?.method === 'PUT')
    .map(([input]) => new URL(urlOf(input)).pathname.split('/').at(-1));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the star on the Stocks tab', () => {
  it('LST-11 puts a star on each row that adds the stock to the watchlist', async () => {
    const fetchMock = stubServer();
    await renderRouter('./app');
    await screen.findByText('Apple Inc.');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Watch AAPL', disabled: false }),
    );

    await waitFor(() => {
      expect(additions(fetchMock)).toEqual(['AAPL']);
    });
  });

  it('LST-12 does not open the stock when its star is pressed, and opens it from the row', async () => {
    stubServer();
    await renderRouter('./app');
    await screen.findByText('Apple Inc.');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Watch AAPL', disabled: false }),
    );
    expect(screen).toHavePathname('/');

    await act(async () => {
      await fireEvent.press(screen.getByRole('link', { name: /^AAPL, Apple Inc\./ }));
    });

    expect(screen).toHavePathname('/stock/AAPL');
  });
});
