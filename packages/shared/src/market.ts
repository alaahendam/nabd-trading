import { z } from 'zod';

import { DEFAULT_PERIOD, MAX_RANGE_MS, MIN_RANGE_MS, periodSchema } from './period.js';

/** Prices are rounded to cents, so a cent of disagreement is rounding, not an error. */
const CENT = 0.01;

const priceSchema = z.number().positive();
const volumeSchema = z.int().nonnegative();

/** Epoch milliseconds. The one time format used by every contract. */
export const timestampSchema = z.int().nonnegative();

export const symbolSchema = z.string().regex(/^[A-Z]{1,5}(\.[A-Z])?$/);

export const EXCHANGES = ['NASDAQ', 'NYSE'] as const;

export const stockSchema = z.object({
  symbol: symbolSchema,
  name: z.string().min(1),
  exchange: z.enum(EXCHANGES),
  sector: z.string().min(1),
  currency: z.literal('USD'),
});
export type Stock = z.infer<typeof stockSchema>;

export const quoteSchema = z
  .object({
    symbol: symbolSchema,
    price: priceSchema,
    previousClose: priceSchema,
    open: priceSchema,
    high: priceSchema,
    low: priceSchema,
    volume: volumeSchema,
    change: z.number(),
    changePercent: z.number(),
    timestamp: timestampSchema,
  })
  .superRefine((quote, ctx) => {
    if (quote.high < Math.max(quote.open, quote.price)) {
      ctx.addIssue({
        code: 'custom',
        path: ['high'],
        message: 'high must be at least the open and the price',
      });
    }
    if (quote.low > Math.min(quote.open, quote.price)) {
      ctx.addIssue({
        code: 'custom',
        path: ['low'],
        message: 'low must be at most the open and the price',
      });
    }
    const change = quote.price - quote.previousClose;
    if (Math.abs(quote.change - change) > CENT) {
      ctx.addIssue({
        code: 'custom',
        path: ['change'],
        message: 'change must equal price minus previous close',
      });
    }
    if (Math.abs(quote.changePercent - (change / quote.previousClose) * 100) > CENT) {
      ctx.addIssue({
        code: 'custom',
        path: ['changePercent'],
        message: 'changePercent must equal change divided by previous close',
      });
    }
  });
export type Quote = z.infer<typeof quoteSchema>;

/** One realtime update. `volume` is the cumulative volume for the day, like `Quote.volume`. */
export const priceTickSchema = z.object({
  symbol: symbolSchema,
  price: priceSchema,
  volume: volumeSchema,
  timestamp: timestampSchema,
});
export type PriceTick = z.infer<typeof priceTickSchema>;

export const historyPointSchema = z
  .object({
    time: timestampSchema,
    open: priceSchema,
    high: priceSchema,
    low: priceSchema,
    close: priceSchema,
    volume: volumeSchema,
  })
  .superRefine((point, ctx) => {
    if (point.high < Math.max(point.open, point.close)) {
      ctx.addIssue({
        code: 'custom',
        path: ['high'],
        message: 'high must be at least the open and the close',
      });
    }
    if (point.low > Math.min(point.open, point.close)) {
      ctx.addIssue({
        code: 'custom',
        path: ['low'],
        message: 'low must be at most the open and the close',
      });
    }
  });
export type HistoryPoint = z.infer<typeof historyPointSchema>;

export const stockWithQuoteSchema = stockSchema
  .extend({ quote: quoteSchema })
  .superRefine((item, ctx) => {
    if (item.quote.symbol !== item.symbol) {
      ctx.addIssue({
        code: 'custom',
        path: ['quote', 'symbol'],
        message: 'quote must belong to the same symbol',
      });
    }
  });
export type StockWithQuote = z.infer<typeof stockWithQuoteSchema>;

export const historyDataSchema = z
  .object({
    symbol: symbolSchema,
    /** The fixed period asked for, or `custom` for a from and to range. */
    period: z.union([periodSchema, z.literal('custom')]),
    /** Width of one candle in milliseconds, so a live tick can find the candle it belongs to. */
    bucketMs: z.int().positive(),
    points: z.array(historyPointSchema),
  })
  .superRefine((history, ctx) => {
    const { points } = history;
    const outOfOrder = points.some((point, index) => {
      const previous = points[index - 1];
      return previous !== undefined && point.time <= previous.time;
    });
    if (outOfOrder) {
      ctx.addIssue({
        code: 'custom',
        path: ['points'],
        message: 'points must be in strictly ascending time order',
      });
    }
  });
export type HistoryData = z.infer<typeof historyDataSchema>;

/** A custom range in epoch milliseconds, between an hour and a year long. */
const rangeQuerySchema = z
  .strictObject({
    from: z.coerce.number().int().nonnegative(),
    to: z.coerce.number().int().nonnegative(),
  })
  .refine(({ from, to }) => to - from >= MIN_RANGE_MS && to - from <= MAX_RANGE_MS, {
    message: 'The range must be between one hour and one year long',
    path: ['to'],
  });

const periodQuerySchema = z.strictObject({ period: periodSchema.default(DEFAULT_PERIOD) });

/** Either a fixed period (default 1D) or a `from` and `to` range, never both. */
export const historyQuerySchema = z.union([rangeQuerySchema, periodQuerySchema]);
export type HistoryQuery = z.infer<typeof historyQuerySchema>;

/** Every successful response wraps its payload, so fields can be added next to `data` later. */
export const dataEnvelope = <T extends z.ZodType>(schema: T) => z.object({ data: schema });

/** The largest page, and the most symbols one filtered request may name. */
export const STOCKS_MAX_LIMIT = 100;

/**
 * Query of the stock list. Without `limit` the list is not paged. A page starts after the
 * `cursor` symbol. `symbols` (comma separated) returns just those stocks, in list order.
 */
export const stocksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(STOCKS_MAX_LIMIT).optional(),
  cursor: symbolSchema.optional(),
  symbols: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(symbolSchema).min(1).max(STOCKS_MAX_LIMIT))
    .optional(),
});
export type StocksQuery = z.infer<typeof stocksQuerySchema>;

/** A page of the list: `nextCursor` is the last symbol of the page, or null at the end. */
export const stocksResponseSchema = z.object({
  data: z.array(stockWithQuoteSchema),
  nextCursor: symbolSchema.nullable(),
  total: z.int().nonnegative(),
});
export type StocksResponse = z.infer<typeof stocksResponseSchema>;

export const stockResponseSchema = dataEnvelope(stockWithQuoteSchema);
export type StockResponse = z.infer<typeof stockResponseSchema>;

export const historyResponseSchema = dataEnvelope(historyDataSchema);
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
