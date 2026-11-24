import type { HistoryData, StockWithQuote, WatchlistItem } from '@nabd/shared';

import type { StocksListQuery, StocksPage } from '../lib/api/endpoints';

/** Valid contract data for tests, so every test starts from something the schemas accept. */
export const aapl: StockWithQuote = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  sector: 'Technology',
  currency: 'USD',
  quote: {
    symbol: 'AAPL',
    price: 230,
    previousClose: 228,
    open: 229,
    high: 231,
    low: 227.5,
    volume: 1_000_000,
    change: 2,
    changePercent: 0.88,
    timestamp: 1_700_000_000_000,
  },
};

export const brkb: StockWithQuote = {
  symbol: 'BRK.B',
  name: 'Berkshire Hathaway Inc.',
  exchange: 'NYSE',
  sector: 'Financials',
  currency: 'USD',
  quote: {
    symbol: 'BRK.B',
    price: 460,
    previousClose: 458,
    open: 459,
    high: 461,
    low: 457,
    volume: 400_000,
    change: 2,
    changePercent: 0.44,
    timestamp: 1_700_000_000_000,
  },
};

export const aaplHistory: HistoryData = {
  symbol: 'AAPL',
  period: '1W',
  bucketMs: 1_800_000,
  points: [
    { time: 1_699_999_000_000, open: 228, high: 231, low: 227, close: 230, volume: 5000 },
    { time: 1_700_000_000_000, open: 230, high: 232, low: 229, close: 231, volume: 6000 },
  ],
};

export const watchlistItem: WatchlistItem = { symbol: 'AAPL', addedAt: 1_700_000_000_000 };

/** One page of the stock list, as the API client returns it. */
export const stocksPage = (
  stocks: StockWithQuote[],
  nextCursor: string | null = null,
  total: number = stocks.length,
): StocksPage => ({ stocks, nextCursor, total });

/** A stand-in for the server's stock list: it pages, filters and counts like the real one. */
export function fakeStocksServer(stocks: readonly StockWithQuote[]) {
  return ({ limit, cursor, symbols }: StocksListQuery): Promise<StocksPage> => {
    if (symbols !== undefined) {
      const matching = stocks.filter((stock) => symbols.includes(stock.symbol));
      return Promise.resolve(stocksPage(matching, null, matching.length));
    }
    const start =
      cursor === undefined ? 0 : stocks.findIndex((stock) => stock.symbol === cursor) + 1;
    const end = limit === undefined ? stocks.length : start + limit;
    const page = stocks.slice(start, end);
    const last = page.at(-1);
    return Promise.resolve(
      stocksPage(
        page,
        end < stocks.length && last !== undefined ? last.symbol : null,
        stocks.length,
      ),
    );
  };
}
