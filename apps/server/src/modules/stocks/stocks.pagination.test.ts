import type { StockWithQuote } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { ApiException } from '../../common/api-exception.js';
import { paginateStocks } from './stocks.pagination.js';

const stock = (symbol: string): StockWithQuote => ({
  symbol,
  name: `${symbol} Inc.`,
  exchange: 'NASDAQ',
  sector: 'Technology',
  currency: 'USD',
  quote: {
    symbol,
    price: 10,
    previousClose: 10,
    open: 10,
    high: 10,
    low: 10,
    volume: 1,
    change: 0,
    changePercent: 0,
    timestamp: 1,
  },
});

const all = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOG'].map(stock);
const symbols = (page: { data: StockWithQuote[] }) => page.data.map((item) => item.symbol);

describe('paginateStocks', () => {
  it('PAG-01 returns everything when there is no limit', () => {
    const page = paginateStocks(all, {});
    expect(symbols(page)).toEqual(['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOG']);
    expect(page).toMatchObject({ nextCursor: null, total: 5 });
  });

  it('PAG-02 returns a page and a cursor for a limit', () => {
    const page = paginateStocks(all, { limit: 2 });
    expect(symbols(page)).toEqual(['AAPL', 'MSFT']);
    expect(page).toMatchObject({ nextCursor: 'MSFT', total: 5 });
  });

  it('PAG-03 continues after the cursor until the end', () => {
    const first = paginateStocks(all, { limit: 2 });
    const second = paginateStocks(all, { limit: 2, cursor: first.nextCursor ?? '' });
    expect(symbols(second)).toEqual(['NVDA', 'AMZN']);
    expect(second.nextCursor).toBe('AMZN');

    const third = paginateStocks(all, { limit: 2, cursor: second.nextCursor ?? '' });
    expect(symbols(third)).toEqual(['GOOG']);
    expect(third.nextCursor).toBeNull();
  });

  it('PAG-04 has no next page when a page ends exactly at the end', () => {
    expect(paginateStocks(all, { limit: 5 }).nextCursor).toBeNull();
    const last = paginateStocks(all, { limit: 2, cursor: 'NVDA' });
    expect(symbols(last)).toEqual(['AMZN', 'GOOG']);
    expect(last.nextCursor).toBeNull();
  });

  it('PAG-05 returns everything after a cursor given without a limit', () => {
    const page = paginateStocks(all, { cursor: 'MSFT' });
    expect(symbols(page)).toEqual(['NVDA', 'AMZN', 'GOOG']);
    expect(page.nextCursor).toBeNull();
  });

  it('PAG-06 refuses a cursor that is not in the list', () => {
    expect(() => paginateStocks(all, { cursor: 'ZZZ' })).toThrow(ApiException);
    try {
      paginateStocks(all, { cursor: 'ZZZ' });
    } catch (error) {
      expect((error as ApiException).getResponse()).toMatchObject({
        error: { code: 'VALIDATION_ERROR', message: expect.stringContaining('ZZZ') as unknown },
      });
    }
  });

  it('PAG-07 keeps list order for the symbols filter', () => {
    const page = paginateStocks(all, { symbols: ['NVDA', 'AAPL'] });
    expect(symbols(page)).toEqual(['AAPL', 'NVDA']);
    expect(page).toMatchObject({ nextCursor: null, total: 2 });
  });

  it('PAG-08 skips symbols that are not in the list', () => {
    const page = paginateStocks(all, { symbols: ['AAPL', 'ZZZ'] });
    expect(symbols(page)).toEqual(['AAPL']);
    expect(page.total).toBe(1);
  });

  it('PAG-09 does not page a filtered list', () => {
    const page = paginateStocks(all, {
      symbols: ['AAPL', 'MSFT', 'NVDA'],
      limit: 1,
      cursor: 'AAPL',
    });
    expect(symbols(page)).toEqual(['AAPL', 'MSFT', 'NVDA']);
    expect(page.nextCursor).toBeNull();
  });
});
