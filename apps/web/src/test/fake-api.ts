import { vi } from 'vitest';

import type { Api } from '../lib/api/endpoints';

const notStubbed = (name: string) => () => Promise.reject(new Error(`${name} was not stubbed`));

/** An `Api` whose methods are typed spies; a test stubs the ones it uses, the rest reject. */
export function createFakeApi() {
  return {
    listStocks: vi.fn<Api['listStocks']>(notStubbed('listStocks')),
    getStock: vi.fn<Api['getStock']>(notStubbed('getStock')),
    getHistory: vi.fn<Api['getHistory']>(notStubbed('getHistory')),
    listWatchlist: vi.fn<Api['listWatchlist']>(notStubbed('listWatchlist')),
    addToWatchlist: vi.fn<Api['addToWatchlist']>(notStubbed('addToWatchlist')),
    removeFromWatchlist: vi.fn<Api['removeFromWatchlist']>(notStubbed('removeFromWatchlist')),
  } satisfies Api;
}
