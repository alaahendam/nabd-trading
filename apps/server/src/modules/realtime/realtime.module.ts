import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import { MarketModule } from '../market/index.js';
import { RealtimeGateway } from './realtime.gateway.js';
import { REALTIME_OPTIONS, type RealtimeOptions } from './realtime.options.js';

@Module({
  imports: [MarketModule],
  providers: [
    {
      provide: REALTIME_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): RealtimeOptions => ({
        flushMs: config.get('TICK_FLUSH_MS', { infer: true }),
      }),
    },
    RealtimeGateway,
  ],
})
export class RealtimeModule {}
