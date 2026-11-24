import type { WatchlistItem } from '@nabd/shared';

/** Storage for watchlists, per client. An abstract class so it doubles as the injection token. */
export abstract class WatchlistRepository {
  /** Items in the order they were saved. */
  abstract list(clientId: string): WatchlistItem[];
  abstract get(clientId: string, symbol: string): WatchlistItem | undefined;
  abstract save(clientId: string, item: WatchlistItem): void;
  abstract delete(clientId: string, symbol: string): void;
}
