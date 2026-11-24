import type { WatchlistItem } from '@nabd/shared';

import { WatchlistRepository } from './watchlist.repository.js';

/**
 * Watchlists in memory (ADR 0003). Bounded: at `maxClients`, the least recently used client is
 * evicted, so random client IDs cannot grow memory without limit.
 */
export class InMemoryWatchlistRepository extends WatchlistRepository {
  /** Map order is recency: the first key is the least recently used client. */
  private readonly clients = new Map<string, Map<string, WatchlistItem>>();

  constructor(private readonly maxClients = 10_000) {
    super();
    if (!Number.isInteger(maxClients) || maxClients < 1) {
      throw new RangeError(`maxClients must be a positive integer, got ${maxClients}`);
    }
  }

  list(clientId: string): WatchlistItem[] {
    return [...(this.touch(clientId)?.values() ?? [])].map((item) => ({ ...item }));
  }

  get(clientId: string, symbol: string): WatchlistItem | undefined {
    const item = this.touch(clientId)?.get(symbol);
    return item && { ...item };
  }

  save(clientId: string, item: WatchlistItem): void {
    let items = this.touch(clientId);
    if (!items) {
      if (this.clients.size >= this.maxClients) {
        for (const leastRecentlyUsed of this.clients.keys()) {
          this.clients.delete(leastRecentlyUsed);
          break;
        }
      }
      items = new Map();
      this.clients.set(clientId, items);
    }
    items.set(item.symbol, { ...item });
  }

  delete(clientId: string, symbol: string): void {
    this.touch(clientId)?.delete(symbol);
  }

  /** Marks a client as just used and returns its items, if it has any. */
  private touch(clientId: string): Map<string, WatchlistItem> | undefined {
    const items = this.clients.get(clientId);
    if (items) {
      this.clients.delete(clientId);
      this.clients.set(clientId, items);
    }
    return items;
  }
}
