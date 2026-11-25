import { z } from 'zod';

/** The settings the app needs, checked. */
export interface Env {
  /** The API's address, with its scheme and without a trailing slash. */
  apiUrl: string;
}

export type EnvProblemKind = 'missing' | 'invalid';

export interface EnvProblem {
  /** The environment variable that is wrong. */
  name: string;
  kind: EnvProblemKind;
}

export type EnvResult = { ok: true; env: Env } | { ok: false; problems: EnvProblem[] };

/** The values the app read from `process.env`, by name. */
export interface EnvSource {
  EXPO_PUBLIC_API_URL: string | undefined;
}

const apiUrlSchema = z.url({ protocol: /^https?$/ });

/**
 * Checks the settings. Expo inlines only static `process.env.EXPO_PUBLIC_*` references, so the app
 * reads each one where it is written and passes them in; this function never touches `process.env`
 * itself. There are no defaults: a missing or invalid value is reported, not guessed.
 */
export function readEnv(source: EnvSource): EnvResult {
  const problems: EnvProblem[] = [];

  const raw = source.EXPO_PUBLIC_API_URL?.trim() ?? '';
  let apiUrl = '';
  if (raw === '') {
    problems.push({ name: 'EXPO_PUBLIC_API_URL', kind: 'missing' });
  } else if (apiUrlSchema.safeParse(raw).success) {
    apiUrl = raw.replace(/\/+$/, '');
  } else {
    problems.push({ name: 'EXPO_PUBLIC_API_URL', kind: 'invalid' });
  }

  return problems.length > 0 ? { ok: false, problems } : { ok: true, env: { apiUrl } };
}
