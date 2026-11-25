import type { ConnectionStatus } from './connection-status.js';
import type { LivePrice } from './price-store.js';

/** Ticks arrive about every second or two per symbol, so ten seconds of silence is a problem. */
export const STALE_AFTER_MS = 10_000;

/** `none` means there is no price yet (a loading state), not that something is wrong. */
export type Freshness = 'none' | 'fresh' | 'stale';

export interface FreshnessOptions {
  now: number;
  status: ConnectionStatus;
  thresholdMs?: number;
}

export function freshness(
  price: LivePrice | undefined,
  { now, status, thresholdMs = STALE_AFTER_MS }: FreshnessOptions,
): Freshness {
  if (!price) {
    return 'none';
  }
  if (status !== 'connected') {
    return 'stale';
  }
  return now - price.receivedAt > thresholdMs ? 'stale' : 'fresh';
}
