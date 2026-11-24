import { describe, expect, it } from 'vitest';

import { API_PREFIX, ROUTES, symbolRoute } from './routes.js';

describe('routes', () => {
  it('RTE-01 prefix is /api and every pattern starts with a slash', () => {
    expect(API_PREFIX).toBe('/api');
    for (const pattern of Object.values(ROUTES)) {
      expect(pattern.startsWith('/')).toBe(true);
    }
  });

  it.each([
    [ROUTES.stock, '/stocks/AAPL'],
    [ROUTES.history, '/stocks/AAPL/history'],
    [ROUTES.watchlistItem, '/watchlist/AAPL'],
  ] as const)('RTE-02 %s becomes %s', (pattern, expected) => {
    expect(symbolRoute(pattern, 'AAPL')).toBe(expected);
  });

  it('RTE-03 keeps a dotted symbol readable', () => {
    expect(symbolRoute(ROUTES.stock, 'BRK.B')).toBe('/stocks/BRK.B');
  });

  it.each([
    ['A/B', 'A%2FB'],
    ['A B', 'A%20B'],
    ['A?B', 'A%3FB'],
  ])('RTE-04 encodes %j as %s', (symbol, encoded) => {
    expect(symbolRoute(ROUTES.stock, symbol)).toBe(`/stocks/${encoded}`);
  });
});
