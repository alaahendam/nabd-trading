import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import { MARKET_OPTIONS, type MarketOptions } from './market.options.js';
import { MarketService } from './market.service.js';

@Module({
  providers: [
    {
      provide: MARKET_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): MarketOptions => ({
        seed: config.get('MARKET_SEED', { infer: true }),
        volatilityScale: config.get('SIM_VOLATILITY_SCALE', { infer: true }),
        stepMs: config.get('SIM_STEP_MS', { infer: true }),
      }),
    },
    MarketService,
  ],
  exports: [MarketService],
})
export class MarketModule {}
