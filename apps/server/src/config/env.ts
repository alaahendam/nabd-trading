import type { ConfigModuleOptions } from '@nestjs/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
  MARKET_SEED: z.string().min(1).default('nabd'),
  SIM_VOLATILITY_SCALE: z.coerce.number().positive().default(3),
  SIM_STEP_MS: z.coerce.number().int().min(10).max(5000).default(100),
  TICK_FLUSH_MS: z.coerce.number().int().min(10).max(5000).default(250),
  CHAOS_LATENCY_MS: z.coerce.number().int().min(0).max(10_000).default(0),
  CHAOS_ERROR_RATE: z.coerce.number().min(0).max(1).default(0),
});

export type Env = z.infer<typeof envSchema>;

/** Synchronous so an invalid environment stops the app before it starts. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const configModuleOptions: ConfigModuleOptions = { isGlobal: true, validate: validateEnv };
