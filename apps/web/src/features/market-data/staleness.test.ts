import { describe, expect, it } from 'vitest';

import { CONNECTION_STATUSES } from './connection-status';
import type { LivePrice } from './price-store';
import { freshness, STALE_AFTER_MS } from './staleness';

const NOW = 100_000;

const priceReceivedAt = (receivedAt: number): LivePrice => ({
  symbol: 'AAPL',
  price: 100,
  previousPrice: undefined,
  high: 100,
  low: 100,
  volume: 1,
  timestamp: 1,
  receivedAt,
});

describe('freshness', () => {
  it.each(CONNECTION_STATUSES)('STL-01 is none without a price (%s)', (status) => {
    expect(freshness(undefined, { now: NOW, status, thresholdMs: 10_000 })).toBe('none');
  });

  it('STL-02 is fresh for a recent price while connected', () => {
    expect(
      freshness(priceReceivedAt(NOW - 1000), {
        now: NOW,
        status: 'connected',
        thresholdMs: 10_000,
      }),
    ).toBe('fresh');
  });

  it('STL-03 is stale for an old price, and fresh at exactly the threshold', () => {
    const options = { now: NOW, status: 'connected', thresholdMs: 10_000 } as const;
    expect(freshness(priceReceivedAt(NOW - 11_000), options)).toBe('stale');
    expect(freshness(priceReceivedAt(NOW - 10_000), options)).toBe('fresh');
  });

  it.each(['connecting', 'reconnecting', 'offline'] as const)(
    'STL-04 is stale when the connection is %s',
    (status) => {
      expect(freshness(priceReceivedAt(NOW - 100), { now: NOW, status, thresholdMs: 10_000 })).toBe(
        'stale',
      );
    },
  );

  it('STL-05 uses the default threshold', () => {
    expect(STALE_AFTER_MS).toBe(10_000);
    expect(
      freshness(priceReceivedAt(NOW - STALE_AFTER_MS), { now: NOW, status: 'connected' }),
    ).toBe('fresh');
    expect(
      freshness(priceReceivedAt(NOW - STALE_AFTER_MS - 1), { now: NOW, status: 'connected' }),
    ).toBe('stale');
  });
});
