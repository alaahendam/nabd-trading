import { historyDataSchema, PERIOD_CONFIG, PERIODS } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { dayRegime, generateHistory, generateRangeHistory } from './history.js';
import { STOCK_UNIVERSE, type UniverseEntry } from './universe.js';

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 5, 17, 13, 7, 41);

const must = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error('expected a value');
  }
  return value;
};
const stock = (symbol: string): UniverseEntry =>
  must(STOCK_UNIVERSE.find((entry) => entry.symbol === symbol));
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const std = (values: number[]) => {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};
const isCents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const AAPL = stock('AAPL');

describe('generateHistory', () => {
  it.each(PERIODS)('HIS-01 %s has the right count, alignment and order', (period) => {
    const { lookbackMs, bucketMs } = PERIOD_CONFIG[period];
    const { points } = generateHistory(AAPL, period, NOW, 230);
    expect(points).toHaveLength(lookbackMs / bucketMs);
    expect(must(points.at(-1)).time).toBe(Math.floor(NOW / bucketMs) * bucketMs);
    for (const [index, point] of points.entries()) {
      expect(point.time % bucketMs).toBe(0);
      if (index > 0) {
        expect(point.time - must(points[index - 1]).time).toBe(bucketMs);
      }
    }
  });

  it('HIS-02 is valid for every stock and period', () => {
    for (const entry of STOCK_UNIVERSE) {
      for (const period of PERIODS) {
        const history = generateHistory(entry, period, NOW, entry.snapshotPrice);
        expect(historyDataSchema.safeParse(history).success).toBe(true);
        expect(history.symbol).toBe(entry.symbol);
        expect(history.period).toBe(period);
      }
    }
  });

  it.each([0.05, 23.5, 1234.56])('HIS-03 ends at the current price %f exactly', (price) => {
    for (const period of PERIODS) {
      expect(must(generateHistory(AAPL, period, NOW, price).points.at(-1)).close).toBe(price);
    }
  });

  it('HIS-04 is deterministic and specific to the symbol', () => {
    const first = generateHistory(AAPL, '1W', NOW, 230);
    expect(generateHistory(AAPL, '1W', NOW, 230)).toEqual(first);
    expect(generateHistory(stock('MSFT'), '1W', NOW, 230)).not.toEqual(first);
  });

  it('HIS-05 has the same shape at another price level', () => {
    const low = generateHistory(AAPL, '1M', NOW, 100).points;
    const high = generateHistory(AAPL, '1M', NOW, 200).points;
    const lastLow = must(low.at(-1)).close;
    const lastHigh = must(high.at(-1)).close;
    for (const [index, point] of low.entries()) {
      const ratioLow = point.close / lastLow;
      const ratioHigh = must(high[index]).close / lastHigh;
      expect(Math.abs(ratioLow / ratioHigh - 1)).toBeLessThan(0.01);
    }
  });

  it('HIS-06 is stable while time moves inside a bucket', () => {
    const bucketStart =
      Math.floor(NOW / PERIOD_CONFIG['1D'].bucketMs) * PERIOD_CONFIG['1D'].bucketMs;
    const a = generateHistory(AAPL, '1D', bucketStart + 1000, 230);
    const b = generateHistory(AAPL, '1D', bucketStart + 2000, 230);
    expect(b).toEqual(a);
  });

  it('HIS-07 is stable when a new bucket starts', () => {
    const { bucketMs } = PERIOD_CONFIG['1M'];
    const before = generateHistory(AAPL, '1M', NOW, 230).points;
    const after = generateHistory(AAPL, '1M', NOW + bucketMs, 230).points;
    const returns = (points: typeof before) =>
      new Map(
        points
          .slice(1)
          .map((point, index) => [point.time, Math.log(point.close / must(points[index]).close)]),
      );
    const earlier = returns(before);
    const later = returns(after);
    let compared = 0;
    for (const [time, value] of earlier) {
      const other = later.get(time);
      if (other !== undefined) {
        expect(Math.abs(value - other)).toBeLessThan(0.0005);
        compared += 1;
      }
    }
    expect(compared).toBeGreaterThan(300);
  });

  it('HIS-08 gaps open away from the previous close only at day boundaries', () => {
    const { points } = generateHistory(AAPL, '1W', NOW, 230);
    let largestGap = 0;
    for (const [index, point] of points.entries()) {
      if (index === 0) {
        continue;
      }
      const gap = Math.abs(point.open - must(points[index - 1]).close);
      if (point.time % DAY_MS === 0) {
        largestGap = Math.max(largestGap, gap);
      } else {
        expect(gap).toBeLessThanOrEqual(0.011);
      }
    }
    expect(largestGap).toBeGreaterThan(0.01);
  });

  it('HIS-09 has positive volume and a realistic day volume', () => {
    const { points } = generateHistory(AAPL, '1W', NOW, 230);
    for (const point of points) {
      expect(Number.isInteger(point.volume)).toBe(true);
      expect(point.volume).toBeGreaterThan(0);
    }
    const dayVolumes = new Map<number, { total: number; count: number }>();
    for (const point of points) {
      const day = Math.floor(point.time / DAY_MS);
      const entry = dayVolumes.get(day) ?? { total: 0, count: 0 };
      dayVolumes.set(day, { total: entry.total + point.volume, count: entry.count + 1 });
    }
    const perDay = DAY_MS / PERIOD_CONFIG['1W'].bucketMs;
    const fullDays = [...dayVolumes.values()].filter((day) => day.count === perDay);
    expect(fullDays.length).toBeGreaterThanOrEqual(5);
    for (const day of fullDays) {
      expect(Math.abs(day.total / AAPL.avgDailyVolume - 1)).toBeLessThan(0.15);
    }
  });

  it('HIS-10 has realistic volatility', () => {
    const { bucketMs } = PERIOD_CONFIG['1M'];
    const { points } = generateHistory(AAPL, '1M', NOW, 230);
    const returns = points
      .slice(1)
      .filter((point) => point.time % DAY_MS !== 0)
      .map((point, _index) => Math.log(point.close / point.open));
    const expected = AAPL.dailyVolatility * Math.sqrt(bucketMs / DAY_MS);
    const ratio = std(returns) / expected;
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.45);
  });

  it('HIS-11 keeps prices in cents and at least one cent', () => {
    const penny: UniverseEntry = {
      ...AAPL,
      symbol: 'PNY',
      snapshotPrice: 0.05,
      dailyVolatility: 0.09,
    };
    for (const period of PERIODS) {
      for (const point of generateHistory(penny, period, NOW, 0.05).points) {
        for (const value of [point.open, point.high, point.low, point.close]) {
          expect(value).toBeGreaterThanOrEqual(0.01);
          expect(isCents(value)).toBe(true);
        }
      }
    }
  });

  it('HIS-12 handles a bucket boundary', () => {
    const { bucketMs } = PERIOD_CONFIG['1D'];
    const boundary = Math.floor(NOW / bucketMs) * bucketMs;
    expect(must(generateHistory(AAPL, '1D', boundary, 230).points.at(-1)).time).toBe(boundary);
    expect(must(generateHistory(AAPL, '1D', boundary - 1, 230).points.at(-1)).time).toBe(
      boundary - bucketMs,
    );
  });

  it.each([0, -1, Number.NaN])('HIS-14 rejects the price %s', (price) => {
    expect(() => generateHistory(AAPL, '1D', NOW, price)).toThrow(RangeError);
  });

  it('HIS-14 rejects a time earlier than the lookback', () => {
    expect(() => generateHistory(AAPL, '1Y', 1000, 230)).toThrow(RangeError);
  });
});

describe('dayRegime', () => {
  it('HIS-13 is deterministic, bounded, varied and specific to the symbol', () => {
    const days = Array.from({ length: 200 }, (_, day) => 20_000 + day);
    const regimes = days.map((day) => dayRegime('AAPL', day));
    expect(days.map((day) => dayRegime('AAPL', day))).toEqual(regimes);
    for (const regime of regimes) {
      expect(regime).toBeGreaterThanOrEqual(0.6);
      expect(regime).toBeLessThanOrEqual(2);
    }
    expect(new Set(regimes).size).toBeGreaterThan(100);
    expect(days.map((day) => dayRegime('MSFT', day))).not.toEqual(regimes);
  });
});

describe('range history', () => {
  const HOUR_MS = 3_600_000;
  const from = NOW - 5 * DAY_MS;
  const to = NOW - 2 * DAY_MS;

  it.each(PERIODS)('HIS-15 %s names its candle size', (period) => {
    expect(generateHistory(AAPL, period, NOW, 230).bucketMs).toBe(PERIOD_CONFIG[period].bucketMs);
  });

  it('HIS-16 returns the candles inside the range', () => {
    const history = generateRangeHistory(AAPL, { from, to }, NOW, 230);
    const bucket = 30 * 60_000;
    expect(history).toMatchObject({ symbol: 'AAPL', period: 'custom', bucketMs: bucket });
    expect(historyDataSchema.safeParse(history).success).toBe(true);
    expect(must(history.points[0]).time).toBe(Math.floor(from / bucket) * bucket);
    expect(must(history.points.at(-1)).time).toBe(Math.floor(to / bucket) * bucket);
    for (const [index, point] of history.points.entries()) {
      expect(point.time % bucket).toBe(0);
      if (index > 0) {
        expect(point.time - must(history.points[index - 1]).time).toBe(bucket);
      }
    }
  });

  it('HIS-17 agrees with the 1W period for a range that ends now', () => {
    const week = generateHistory(AAPL, '1W', NOW, 230);
    const range = generateRangeHistory(AAPL, { from: NOW - 7 * DAY_MS, to: NOW }, NOW, 230);
    expect(range.bucketMs).toBe(week.bucketMs);
    expect(range.points).toHaveLength(week.points.length + 1);
    expect(range.points.slice(1)).toEqual(week.points);
  });

  it('HIS-18 returns the same candle whichever way it is asked for', () => {
    const day = generateHistory(AAPL, '1D', NOW, 230);
    const range = generateRangeHistory(AAPL, { from: NOW - 2 * HOUR_MS, to: NOW }, NOW, 230);
    expect(range.bucketMs).toBe(day.bucketMs);
    expect(range.points).toEqual(day.points.slice(-range.points.length));
  });

  it('HIS-19 ends at the current price when the range ends now', () => {
    const history = generateRangeHistory(AAPL, { from: NOW - DAY_MS, to: NOW }, NOW, 231.37);
    expect(must(history.points.at(-1)).close).toBe(231.37);
  });

  it('HIS-20 uses 5-minute candles for a one-hour range', () => {
    const history = generateRangeHistory(AAPL, { from: NOW - HOUR_MS, to: NOW }, NOW, 230);
    expect(history.bucketMs).toBe(300_000);
    expect([12, 13]).toContain(history.points.length);
  });

  it.each([
    ['to after now', { from: NOW - DAY_MS, to: NOW + 1 }],
    ['from older than a year', { from: NOW - 366 * DAY_MS, to: NOW - 300 * DAY_MS }],
    ['a span under an hour', { from: NOW - HOUR_MS + 1, to: NOW }],
    ['from not before to', { from: NOW - DAY_MS, to: NOW - DAY_MS }],
  ])('HIS-21 refuses %s', (_label, range) => {
    expect(() => generateRangeHistory(AAPL, range, NOW, 230)).toThrow(RangeError);
  });

  it('HIS-21 refuses a non-positive current price for a range too', () => {
    expect(() => generateRangeHistory(AAPL, { from, to }, NOW, 0)).toThrow(RangeError);
  });
});
