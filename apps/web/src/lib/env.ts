import { z } from 'zod';

export const envSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

/** Throws before the app renders, so a bad configuration never reaches a user. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env: Env = parseEnv(import.meta.env);
