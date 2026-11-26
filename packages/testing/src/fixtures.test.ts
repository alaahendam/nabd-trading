import {
  historyDataSchema,
  type StockWithQuote,
  stockWithQuoteSchema,
  watchlistItemSchema,
} from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import {
  aapl,
  aaplHistory,
  brkb,
  fakeStocksServer,
  stocksPage,
  watchlistItem,
} from './fixtures.js';

const symbolOf = (letter: string): StockWithQuote => ({
  ...aapl,
  symbol: letter,
  quote: { ...aapl.quote, symbol: letter },
});
const five = ['A', 'B', 'C', 'D', 'E'].map(symbolOf);

describe('fixtures', () => {
  it('FIX-01 are valid contract data', () => {
    expect(() => stockWithQuoteSchema.parse(aapl)).not.toThrow();
    expect(() => stockWithQuoteSchema.parse(brkb)).not.toThrow();
    expect(() => historyDataSchema.parse(aaplHistory)).not.toThrow();
    expect(() => watchlistItemSchema.parse(watchlistItem)).not.toThrow();
  });

  it('FIX-02 stocksPage builds a page with sensible defaults', () => {
    expect(stocksPage([aapl])).toEqual({ stocks: [aapl], nextCursor: null, total: 1 });
    expect(stocksPage([aapl], 'AAPL', 21)).toEqual({
      stocks: [aapl],
      nextCursor: 'AAPL',
      total: 21,
    });
  });
});

describe('fakeStocksServer', () => {
  const list = fakeStocksServer(five);

  it('FIX-03 pages with a cursor', async () => {
    const first = await list({ limit: 2 });
    expect(first.stocks.map((stock) => stock.symbol)).toEqual(['A', 'B']);
    expect(first).toMatchObject({ nextCursor: 'B', total: 5 });

    const second = await list({ limit: 2, cursor: 'B' });
    expect(second.stocks.map((stock) => stock.symbol)).toEqual(['C', 'D']);
    expect(second.nextCursor).toBe('D');
  });

  it('FIX-04 the last page has no cursor', async () => {
    const last = await list({ limit: 2, cursor: 'D' });
    expect(last.stocks.map((stock) => stock.symbol)).toEqual(['E']);
    expect(last.nextCursor).toBeNull();
  });

  it('FIX-05 returns everything without a limit', async () => {
    const all = await list({});
    expect(all.stocks).toHaveLength(5);
    expect(all).toMatchObject({ nextCursor: null, total: 5 });
  });

  it('FIX-06 filters by symbols, in list order, without paging', async () => {
    const some = await list({ symbols: ['D', 'B'], limit: 1 });
    expect(some.stocks.map((stock) => stock.symbol)).toEqual(['B', 'D']);
    expect(some).toMatchObject({ nextCursor: null, total: 2 });
  });
});
