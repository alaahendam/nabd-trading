import { stockSchema } from '@nabd/shared';
import { MAX_SYMBOLS_PER_REQUEST } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { getUniverseEntry, STOCK_UNIVERSE, toStock } from './universe.js';

describe('STOCK_UNIVERSE', () => {
  it('UNI-01 has unique symbols', () => {
    const symbols = STOCK_UNIVERSE.map((entry) => entry.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it.each(STOCK_UNIVERSE.map((entry) => [entry.symbol, entry] as const))(
    'UNI-02 %s projects to a valid public stock with no simulation fields',
    (_symbol, entry) => {
      const stock = toStock(entry);
      expect(stockSchema.parse(stock)).toEqual(stock);
      expect(Object.keys(stock).sort()).toEqual(
        ['currency', 'exchange', 'name', 'sector', 'symbol'].sort(),
      );
    },
  );

  it.each(STOCK_UNIVERSE.map((entry) => [entry.symbol, entry] as const))(
    'UNI-03 %s has sane simulation parameters',
    (_symbol, entry) => {
      expect(entry.snapshotPrice).toBeGreaterThan(0);
      expect(Math.round(entry.snapshotPrice * 100)).toBeCloseTo(entry.snapshotPrice * 100, 6);
      expect(entry.beta).toBeGreaterThan(0);
      expect(entry.beta).toBeLessThan(3);
      expect(entry.dailyVolatility).toBeGreaterThan(0);
      expect(entry.dailyVolatility).toBeLessThan(0.1);
      expect(Number.isInteger(entry.avgDailyVolume)).toBe(true);
      expect(entry.avgDailyVolume).toBeGreaterThan(0);
      expect(entry.ticksPerSecond).toBeGreaterThan(0);
    },
  );

  it('UNI-04 covers both exchanges and a dotted symbol', () => {
    const exchanges = new Set(STOCK_UNIVERSE.map((entry) => entry.exchange));
    expect(exchanges).toEqual(new Set(['NASDAQ', 'NYSE']));
    expect(STOCK_UNIVERSE.some((entry) => entry.symbol.includes('.'))).toBe(true);
  });

  it('UNI-06 is big enough for a market view and within one subscription request', () => {
    expect(STOCK_UNIVERSE.length).toBeGreaterThanOrEqual(20);
    expect(STOCK_UNIVERSE.length).toBeLessThanOrEqual(MAX_SYMBOLS_PER_REQUEST);
  });
});

describe('getUniverseEntry', () => {
  it('UNI-05 finds a known symbol and returns undefined for an unknown one', () => {
    expect(getUniverseEntry('AAPL')?.name).toBe('Apple Inc.');
    expect(getUniverseEntry('NOPE')).toBeUndefined();
  });
});
