import type { StockWithQuote } from './market.js';
import type { Period } from './period.js';

/**
 * The shapes a client works with when it asks for stocks and history. They are the wire contracts
 * in `market.ts` seen from the caller's side: a symbol list instead of a comma-separated string,
 * and a page without the response envelope. Types only; every client (web, mobile) and the test
 * fakes share them so none can drift from the others.
 */

/** A fixed period ("1D", "1W"…), or a custom range of epoch milliseconds. */
export type HistoryRange = Period | { from: number; to: number };

export interface StocksListQuery {
  /** Page size. Without it the whole list comes back. */
  limit?: number;
  /** The last symbol of the previous page. */
  cursor?: string;
  /** Only these stocks, in list order. A filtered list is not paged. */
  symbols?: readonly string[];
}

export interface StocksPage {
  stocks: StockWithQuote[];
  /** The cursor of the next page, or `null` at the end. */
  nextCursor: string | null;
  total: number;
}
