import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { ClockModule } from './common/clock.module.js';
import { configModuleOptions } from './config/env.js';
import { HealthModule } from './modules/health/index.js';
import { RealtimeModule } from './modules/realtime/index.js';
import { StocksModule } from './modules/stocks/index.js';
import { WatchlistModule } from './modules/watchlist/index.js';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    ClockModule,
    HealthModule,
    StocksModule,
    WatchlistModule,
    RealtimeModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
