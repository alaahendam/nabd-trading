import type { ConfigModuleOptions } from '@nestjs/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
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
