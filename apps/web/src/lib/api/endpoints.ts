import type { HistoryData, Period, StockWithQuote, WatchlistItem } from '@nabd/shared';
import {
  historyResponseSchema,
  ROUTES,
  stockResponseSchema,
  stocksResponseSchema,
  symbolRoute,
  watchlistItemResponseSchema,
  watchlistResponseSchema,
} from '@nabd/shared';

import type { HttpClient } from './http-client';

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

export interface Api {
  listStocks(query: StocksListQuery, signal?: AbortSignal): Promise<StocksPage>;
  getStock(symbol: string, signal?: AbortSignal): Promise<StockWithQuote>;
  getHistory(symbol: string, period: Period, signal?: AbortSignal): Promise<HistoryData>;
  listWatchlist(signal?: AbortSignal): Promise<WatchlistItem[]>;
  addToWatchlist(symbol: string, signal?: AbortSignal): Promise<WatchlistItem>;
  removeFromWatchlist(symbol: string, signal?: AbortSignal): Promise<void>;
}

export function createApi(client: HttpClient): Api {
  const withSignal = (signal: AbortSignal | undefined) => (signal === undefined ? {} : { signal });

  return {
    async listStocks({ limit, cursor, symbols }, signal) {
      const query: Record<string, string> = {};
      if (limit !== undefined) {
        query['limit'] = String(limit);
      }
      if (cursor !== undefined) {
        query['cursor'] = cursor;
      }
      if (symbols !== undefined) {
        query['symbols'] = symbols.join(',');
      }
      const body = await client.request(stocksResponseSchema, {
        method: 'GET',
        path: ROUTES.stocks,
        query,
        ...withSignal(signal),
      });
      return { stocks: body.data, nextCursor: body.nextCursor, total: body.total };
    },
    async getStock(symbol, signal) {
      const body = await client.request(stockResponseSchema, {
        method: 'GET',
        path: symbolRoute(ROUTES.stock, symbol),
        ...withSignal(signal),
      });
      return body.data;
    },
    async getHistory(symbol, period, signal) {
      const body = await client.request(historyResponseSchema, {
        method: 'GET',
        path: symbolRoute(ROUTES.history, symbol),
        query: { period },
        ...withSignal(signal),
      });
      return body.data;
    },
    async listWatchlist(signal) {
      const body = await client.request(watchlistResponseSchema, {
        method: 'GET',
        path: ROUTES.watchlist,
        ...withSignal(signal),
      });
      return body.data;
    },
    async addToWatchlist(symbol, signal) {
      const body = await client.request(watchlistItemResponseSchema, {
        method: 'PUT',
        path: symbolRoute(ROUTES.watchlistItem, symbol),
        ...withSignal(signal),
      });
      return body.data;
    },
    async removeFromWatchlist(symbol, signal) {
      await client.send({
        method: 'DELETE',
        path: symbolRoute(ROUTES.watchlistItem, symbol),
        ...withSignal(signal),
      });
    },
  };
}
