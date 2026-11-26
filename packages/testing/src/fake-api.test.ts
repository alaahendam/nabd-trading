import { describe, expect, it } from 'vitest';

import { createFakeApi } from './fake-api.js';
import { aapl } from './fixtures.js';

describe('createFakeApi', () => {
  it('FAK-01 rejects every method that was not stubbed, and records the call', async () => {
    const api = createFakeApi();
    const calls = {
      listStocks: () => api.listStocks({}),
      getStock: () => api.getStock('AAPL'),
      getHistory: () => api.getHistory('AAPL', '1D'),
      listWatchlist: () => api.listWatchlist(),
      addToWatchlist: () => api.addToWatchlist('AAPL'),
      removeFromWatchlist: () => api.removeFromWatchlist('AAPL'),
    };
    for (const [name, call] of Object.entries(calls)) {
      await expect(call()).rejects.toThrow(`${name} was not stubbed`);
    }
    expect(api.getHistory.calls).toEqual([['AAPL', '1D']]);
    expect(api.listWatchlist.calls).toHaveLength(1);
  });

  it('FAK-02 answers a stubbed method and leaves the others rejecting', async () => {
    const api = createFakeApi();
    api.getStock.resolves(aapl);
    expect(await api.getStock('AAPL')).toBe(aapl);
    await expect(api.listWatchlist()).rejects.toThrow('listWatchlist was not stubbed');
  });
});
