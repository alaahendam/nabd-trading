import { describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys.js';

describe('queryKeys', () => {
  it('QRY-07 are stable, distinct and hierarchical', () => {
    expect(queryKeys.stocks()).toEqual(queryKeys.stocks());
    expect(queryKeys.stock('AAPL')).toEqual(['stocks', 'AAPL']);
    expect(queryKeys.stock('AAPL')).not.toEqual(queryKeys.stock('MSFT'));
    expect(queryKeys.history('AAPL', '1W')).toEqual(['stocks', 'AAPL', 'history', '1W']);
    expect(queryKeys.history('AAPL', '1W')).not.toEqual(queryKeys.history('AAPL', '1M'));
    expect(queryKeys.watchlist()).toEqual(['watchlist']);

    const stockKey = queryKeys.stock('AAPL');
    expect(queryKeys.history('AAPL', '1D').slice(0, stockKey.length)).toEqual(stockKey);
  });

  it('QRY-08 keeps the paged list and the filtered lists apart, under the stocks prefix', () => {
    expect(queryKeys.stockPages()).toEqual(['stocks', 'pages']);
    expect(queryKeys.stockPages().slice(0, 1)).toEqual(queryKeys.stocks());
    expect(queryKeys.stocksBySymbols(['AAPL']).slice(0, 1)).toEqual(queryKeys.stocks());
    expect(queryKeys.stocksBySymbols(['AAPL'])).not.toEqual(queryKeys.stockPages());
  });

  it('QRY-08 gives the same filtered key for the same symbols in any order, once each', () => {
    expect(queryKeys.stocksBySymbols(['MSFT', 'AAPL'])).toEqual(
      queryKeys.stocksBySymbols(['AAPL', 'MSFT', 'AAPL']),
    );
    expect(queryKeys.stocksBySymbols(['AAPL', 'MSFT'])).not.toEqual(
      queryKeys.stocksBySymbols(['AAPL', 'NVDA']),
    );
  });
});

describe('history keys for a range', () => {
  it('QRY-09 gives a custom range its own key under the stock, apart from the periods', () => {
    const key = queryKeys.history('AAPL', { from: 1000, to: 9000 });
    expect(key).toEqual(['stocks', 'AAPL', 'history', 'custom', 1000, 9000]);
    expect(key).not.toEqual(queryKeys.history('AAPL', { from: 1000, to: 9001 }));
    expect(key).not.toEqual(queryKeys.history('AAPL', '1D'));
    expect(key.slice(0, 2)).toEqual(queryKeys.stock('AAPL'));
  });
});
