import type { WatchlistItem } from '@nabd/shared';
import { Inject, Injectable } from '@nestjs/common';

import { ApiException } from '../../common/api-exception.js';
import { CLOCK, type Clock } from '../../common/clock.js';
import { MarketService } from '../market/index.js';
import { WatchlistRepository } from './watchlist.repository.js';

@Injectable()
export class WatchlistService {
  constructor(
    private readonly repository: WatchlistRepository,
    private readonly market: MarketService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  list(clientId: string): WatchlistItem[] {
    return this.repository.list(clientId);
  }

  /** Idempotent: adding a symbol that is already there changes nothing. */
  add(clientId: string, symbol: string): WatchlistItem {
    if (!this.market.hasSymbol(symbol)) {
      throw new ApiException('NOT_FOUND', `No stock with symbol ${symbol}`);
    }
    const existing = this.repository.get(clientId, symbol);
    if (existing) {
      return existing;
    }
    const item = { symbol, addedAt: this.clock.now() };
    this.repository.save(clientId, item);
    return item;
  }

  /** Idempotent: removing something that is not there is fine. */
  remove(clientId: string, symbol: string): void {
    this.repository.delete(clientId, symbol);
  }
}
