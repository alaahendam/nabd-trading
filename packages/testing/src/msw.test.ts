import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { aapl, aaplHistory, brkb, watchlistItem } from './fixtures.js';
import {
  API_URL,
  historyHandler,
  server,
  stockHandler,
  stocksHandler,
  watchlistHandler,
} from './msw.js';

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

const get = async (path: string): Promise<unknown> => {
  const response = await fetch(`${API_URL}${path}`);
  return response.json();
};

describe('mock API handlers', () => {
  it('MSW-01 the watchlist handler is empty unless told otherwise', async () => {
    server.use(watchlistHandler());
    expect(await get('/api/watchlist')).toEqual({ data: [] });
    server.use(watchlistHandler([watchlistItem]));
    expect(await get('/api/watchlist')).toEqual({ data: [watchlistItem] });
  });

  it('MSW-02 the stock, history and list handlers', async () => {
    server.use(stockHandler, historyHandler, stocksHandler);
    expect(await get('/api/stocks/AAPL')).toEqual({ data: aapl });
    expect(await get('/api/stocks/AAPL/history')).toEqual({ data: aaplHistory });
    expect(await get('/api/stocks')).toEqual({
      data: [aapl, brkb],
      nextCursor: null,
      total: 2,
    });
  });

  it('MSW-03 a request with no handler fails', async () => {
    await expect(fetch(`${API_URL}/api/nothing`)).rejects.toThrow();
  });
});
