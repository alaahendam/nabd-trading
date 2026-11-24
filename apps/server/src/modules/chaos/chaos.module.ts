import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import type { Env } from '../../config/env.js';
import { ChaosInterceptor } from './chaos.interceptor.js';
import { CHAOS_OPTIONS, type ChaosOptions, RANDOM } from './chaos.options.js';

@Module({
  providers: [
    {
      provide: CHAOS_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): ChaosOptions => ({
        latencyMs: config.get('CHAOS_LATENCY_MS', { infer: true }),
        errorRate: config.get('CHAOS_ERROR_RATE', { infer: true }),
      }),
    },
    { provide: RANDOM, useValue: Math.random },
    { provide: APP_INTERCEPTOR, useClass: ChaosInterceptor },
  ],
})
export class ChaosModule {}
