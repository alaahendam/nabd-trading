import type {
  HistoryData,
  HistoryRange,
  StocksListQuery,
  StocksPage,
  StockWithQuote,
  WatchlistItem,
} from '@nabd/shared';

import { createRecorder } from './recorder.js';

const notStubbed = (name: string) => () => Promise.reject(new Error(`${name} was not stubbed`));

/**
 * A stand-in for the API client: one recorder per method. A test stubs the ones it uses and the
 * rest reject, so a call nobody expected cannot go unnoticed.
 *
 * It is typed from the shared contracts and not from `@nabd/api-client`, so this package does not
 * depend on it. Where a fake is passed in as an `Api`, the compiler checks the two still match.
 */
export function createFakeApi() {
  return {
    listStocks: createRecorder<[query: StocksListQuery, signal?: AbortSignal], Promise<StocksPage>>(
      notStubbed('listStocks'),
    ),
    getStock: createRecorder<[symbol: string, signal?: AbortSignal], Promise<StockWithQuote>>(
      notStubbed('getStock'),
    ),
    getHistory: createRecorder<
      [symbol: string, range: HistoryRange, signal?: AbortSignal],
      Promise<HistoryData>
    >(notStubbed('getHistory')),
    listWatchlist: createRecorder<[signal?: AbortSignal], Promise<WatchlistItem[]>>(
      notStubbed('listWatchlist'),
    ),
    addToWatchlist: createRecorder<[symbol: string, signal?: AbortSignal], Promise<WatchlistItem>>(
      notStubbed('addToWatchlist'),
    ),
    removeFromWatchlist: createRecorder<[symbol: string, signal?: AbortSignal], Promise<void>>(
      notStubbed('removeFromWatchlist'),
    ),
  };
}

export type FakeApi = ReturnType<typeof createFakeApi>;
