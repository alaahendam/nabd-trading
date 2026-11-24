import { z } from 'zod';

import { DEFAULT_PERIOD, periodSchema } from './period.js';

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
    period: periodSchema,
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

export const historyQuerySchema = z.object({
  period: periodSchema.default(DEFAULT_PERIOD),
});
export type HistoryQuery = z.infer<typeof historyQuerySchema>;

/** Every successful response wraps its payload, so fields can be added next to `data` later. */
export const dataEnvelope = <T extends z.ZodType>(schema: T) => z.object({ data: schema });

export const stocksResponseSchema = dataEnvelope(z.array(stockWithQuoteSchema));
export type StocksResponse = z.infer<typeof stocksResponseSchema>;

export const stockResponseSchema = dataEnvelope(stockWithQuoteSchema);
export type StockResponse = z.infer<typeof stockResponseSchema>;

export const historyResponseSchema = dataEnvelope(historyDataSchema);
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
