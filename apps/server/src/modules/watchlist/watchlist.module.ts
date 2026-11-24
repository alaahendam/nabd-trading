import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/index.js';
import { MarketModule } from '../market/index.js';
import { InMemoryWatchlistRepository } from './in-memory-watchlist.repository.js';
import { WatchlistController } from './watchlist.controller.js';
import { WatchlistRepository } from './watchlist.repository.js';
import { WatchlistService } from './watchlist.service.js';

@Module({
  imports: [IdentityModule, MarketModule],
  controllers: [WatchlistController],
  providers: [
    WatchlistService,
    { provide: WatchlistRepository, useFactory: () => new InMemoryWatchlistRepository() },
  ],
})
export class WatchlistModule {}
