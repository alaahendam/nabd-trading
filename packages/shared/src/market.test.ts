import { describe, expect, it } from 'vitest';

import {
  dataEnvelope,
  historyDataSchema,
  historyPointSchema,
  historyQuerySchema,
  historyResponseSchema,
  priceTickSchema,
  quoteSchema,
  stockResponseSchema,
  stockSchema,
  stocksQuerySchema,
  stocksResponseSchema,
  stockWithQuoteSchema,
  symbolSchema,
} from './market.js';
import { DEFAULT_PERIOD } from './period.js';

const stock = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  sector: 'Technology',
  currency: 'USD',
};

const quote = {
  symbol: 'AAPL',
  price: 102,
  previousClose: 100,
  open: 101,
  high: 103,
  low: 99.5,
  volume: 1_200_000,
  change: 2,
  changePercent: 2,
  timestamp: 1_700_000_000_000,
};

const candle = {
  time: 1_700_000_000_000,
  open: 100,
  high: 105,
  low: 98,
  close: 102,
  volume: 5000,
};

const issuePaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('symbolSchema', () => {
  it.each(['AAPL', 'F', 'BRK.B'])('MKT-01 accepts %s', (symbol) => {
    expect(symbolSchema.parse(symbol)).toBe(symbol);
  });

  it.each(['', 'aapl', 'TOOLONG', 'A.', 'AAPL.BB', 'A B'])('MKT-02 rejects %j', (symbol) => {
    expect(symbolSchema.safeParse(symbol).success).toBe(false);
  });
});

describe('stockSchema', () => {
  it('MKT-03 parses a valid stock and strips unknown keys', () => {
    expect(stockSchema.parse({ ...stock, extra: 'x' })).toEqual(stock);
  });

  it.each([
    ['exchange', { exchange: 'LSE' }],
    ['name', { name: '' }],
    ['sector', { sector: '' }],
    ['currency', { currency: 'EUR' }],
  ])('MKT-04 rejects a bad %s', (field, override) => {
    expect(issuePaths(stockSchema.safeParse({ ...stock, ...override }))).toEqual([field]);
  });

  it('MKT-04 rejects a missing field', () => {
    const { sector: _sector, ...rest } = stock;
    expect(issuePaths(stockSchema.safeParse(rest))).toEqual(['sector']);
  });
});

describe('quoteSchema', () => {
  it('MKT-05 parses a consistent quote', () => {
    expect(quoteSchema.parse(quote)).toEqual(quote);
  });

  it.each([
    ['price', { price: 0 }],
    ['price', { price: -1 }],
    ['price', { price: Number.NaN }],
    ['price', { price: Number.POSITIVE_INFINITY }],
    ['volume', { volume: -1 }],
    ['volume', { volume: 1.5 }],
  ])('MKT-06 rejects a bad %s (%j)', (field, override) => {
    expect(issuePaths(quoteSchema.safeParse({ ...quote, ...override }))).toContain(field);
  });

  it.each([
    ['below the price', { high: 101.5 }],
    ['below the open', { high: 100.5, price: 100, change: 0, changePercent: 0 }],
  ])('MKT-07 rejects a high %s', (_label, override) => {
    expect(issuePaths(quoteSchema.safeParse({ ...quote, ...override }))).toEqual(['high']);
  });

  it.each([
    ['above the price', { low: 102.5 }],
    ['above the open', { low: 101.5, price: 104, high: 105, change: 4, changePercent: 4 }],
  ])('MKT-08 rejects a low %s', (_label, override) => {
    expect(issuePaths(quoteSchema.safeParse({ ...quote, ...override }))).toEqual(['low']);
  });

  it('MKT-09 rejects a change that disagrees with price minus previous close', () => {
    expect(issuePaths(quoteSchema.safeParse({ ...quote, change: 2.5 }))).toEqual(['change']);
  });

  it('MKT-10 rejects a change percent that disagrees with the change', () => {
    expect(issuePaths(quoteSchema.safeParse({ ...quote, changePercent: 2.5 }))).toEqual([
      'changePercent',
    ]);
  });

  it('MKT-11 tolerates cent rounding', () => {
    const rounded = {
      ...quote,
      price: 101.57,
      high: 103,
      previousClose: 99.13,
      change: 2.44,
      changePercent: 2.46,
    };
    expect(quoteSchema.safeParse(rounded).success).toBe(true);
  });
});

describe('priceTickSchema', () => {
  const tick = { symbol: 'AAPL', price: 102.5, volume: 1000, timestamp: 1_700_000_000_000 };

  it('MKT-12 parses a valid tick', () => {
    expect(priceTickSchema.parse(tick)).toEqual(tick);
  });

  it.each([
    ['symbol', { symbol: 'nope' }],
    ['price', { price: 0 }],
    ['timestamp', { timestamp: -1 }],
    ['timestamp', { timestamp: 1.5 }],
    ['volume', { volume: -5 }],
  ])('MKT-13 rejects a bad %s (%j)', (field, override) => {
    expect(issuePaths(priceTickSchema.safeParse({ ...tick, ...override }))).toEqual([field]);
  });
});

describe('historyPointSchema', () => {
  it('MKT-14 parses a consistent candle', () => {
    expect(historyPointSchema.parse(candle)).toEqual(candle);
  });

  it.each([
    ['open', { high: 99 }],
    ['close', { high: 101, open: 100, close: 102 }],
  ])('MKT-15 rejects a high below the %s', (_label, override) => {
    expect(issuePaths(historyPointSchema.safeParse({ ...candle, ...override }))).toEqual(['high']);
  });

  it.each([
    ['open', { low: 101 }],
    ['close', { low: 103, open: 104, close: 102 }],
  ])('MKT-16 rejects a low above the %s', (_label, override) => {
    expect(issuePaths(historyPointSchema.safeParse({ ...candle, ...override }))).toEqual(['low']);
  });
});

describe('stockWithQuoteSchema', () => {
  it('MKT-17 parses a stock with its quote', () => {
    expect(stockWithQuoteSchema.parse({ ...stock, quote })).toEqual({ ...stock, quote });
  });

  it('MKT-18 rejects a quote for a different symbol', () => {
    const result = stockWithQuoteSchema.safeParse({
      ...stock,
      quote: { ...quote, symbol: 'MSFT' },
    });
    expect(issuePaths(result)).toEqual(['quote.symbol']);
  });
});

describe('historyDataSchema', () => {
  const base = { symbol: 'AAPL', period: '1D' };
  const at = (time: number) => ({ ...candle, time });

  it('MKT-19 parses ascending points', () => {
    const data = { ...base, points: [at(1), at(2), at(3)] };
    expect(historyDataSchema.parse(data)).toEqual(data);
  });

  it.each([
    ['descending', [at(2), at(1)]],
    ['duplicated', [at(1), at(1)]],
  ])('MKT-20 rejects %s points', (_label, points) => {
    expect(issuePaths(historyDataSchema.safeParse({ ...base, points }))).toEqual(['points']);
  });

  it('MKT-21 accepts an empty window', () => {
    expect(historyDataSchema.safeParse({ ...base, points: [] }).success).toBe(true);
  });
});

describe('historyQuerySchema', () => {
  it('MKT-22 defaults the period', () => {
    expect(historyQuerySchema.parse({})).toEqual({ period: DEFAULT_PERIOD });
  });

  it('MKT-23 rejects an unknown period', () => {
    expect(historyQuerySchema.safeParse({ period: '2D' }).success).toBe(false);
  });
});

describe('response schemas', () => {
  const item = { ...stock, quote };
  const history = { symbol: 'AAPL', period: '1D', points: [candle] };

  it.each([
    ['stock', stockResponseSchema, item],
    ['history', historyResponseSchema, history],
  ])('MKT-25 %s response wraps its payload in { data }', (_name, schema, payload) => {
    expect(schema.parse({ data: payload })).toEqual({ data: payload });
    expect(schema.safeParse(payload).success).toBe(false);
  });
});

describe('dataEnvelope', () => {
  const schema = dataEnvelope(stockSchema);

  it('MKT-24 accepts { data } and rejects a bare value or bad data', () => {
    expect(schema.parse({ data: stock })).toEqual({ data: stock });
    expect(schema.safeParse(stock).success).toBe(false);
    expect(schema.safeParse({ data: { ...stock, exchange: 'LSE' } }).success).toBe(false);
  });
});

describe('stocks list paging', () => {
  const item = { ...stock, quote };

  it('MKT-26 accepts no query, coerces the limit and checks it and the cursor', () => {
    expect(stocksQuerySchema.parse({})).toEqual({});
    expect(stocksQuerySchema.parse({ limit: '10' })).toEqual({ limit: 10 });
    expect(stocksQuerySchema.parse({ cursor: 'AAPL', limit: '1' })).toEqual({
      cursor: 'AAPL',
      limit: 1,
    });
    for (const limit of ['0', '101', 'x', '1.5']) {
      expect(stocksQuerySchema.safeParse({ limit }).success).toBe(false);
    }
    expect(stocksQuerySchema.safeParse({ cursor: 'aapl' }).success).toBe(false);
  });

  it('MKT-27 turns the symbols filter into a list of valid symbols', () => {
    expect(stocksQuerySchema.parse({ symbols: 'AAPL,MSFT' })).toEqual({
      symbols: ['AAPL', 'MSFT'],
    });
    expect(stocksQuerySchema.parse({ symbols: 'BRK.B' })).toEqual({ symbols: ['BRK.B'] });
    expect(stocksQuerySchema.safeParse({ symbols: '' }).success).toBe(false);
    expect(stocksQuerySchema.safeParse({ symbols: 'AAPL,aapl' }).success).toBe(false);
    const tooMany = Array.from({ length: 101 }, () => 'AAPL').join(',');
    expect(stocksQuerySchema.safeParse({ symbols: tooMany }).success).toBe(false);
  });

  it('MKT-28 wraps the list with its paging information', () => {
    const page = { data: [item], nextCursor: 'AAPL', total: 21 };
    expect(stocksResponseSchema.parse(page)).toEqual(page);
    expect(stocksResponseSchema.parse({ ...page, nextCursor: null }).nextCursor).toBeNull();
    expect(stocksResponseSchema.safeParse([item]).success).toBe(false);
    expect(stocksResponseSchema.safeParse({ data: [item] }).success).toBe(false);
    expect(stocksResponseSchema.safeParse({ ...page, total: -1 }).success).toBe(false);
    expect(stocksResponseSchema.safeParse({ ...page, nextCursor: 'aapl' }).success).toBe(false);
  });
});
