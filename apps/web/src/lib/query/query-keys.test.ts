import { describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys';

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
});
