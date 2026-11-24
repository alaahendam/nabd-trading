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

export interface Api {
  listStocks(signal?: AbortSignal): Promise<StockWithQuote[]>;
  getStock(symbol: string, signal?: AbortSignal): Promise<StockWithQuote>;
  getHistory(symbol: string, period: Period, signal?: AbortSignal): Promise<HistoryData>;
  listWatchlist(signal?: AbortSignal): Promise<WatchlistItem[]>;
  addToWatchlist(symbol: string, signal?: AbortSignal): Promise<WatchlistItem>;
  removeFromWatchlist(symbol: string, signal?: AbortSignal): Promise<void>;
}

export function createApi(client: HttpClient): Api {
  const withSignal = (signal: AbortSignal | undefined) => (signal === undefined ? {} : { signal });

  return {
    async listStocks(signal) {
      const body = await client.request(stocksResponseSchema, {
        method: 'GET',
        path: ROUTES.stocks,
        ...withSignal(signal),
      });
      return body.data;
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
