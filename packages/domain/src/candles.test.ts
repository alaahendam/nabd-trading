import type { HistoryPoint } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { applyLivePrice, toCandles, toVolumeBars } from './candles.js';

const HOUR = 3_600_000;

const point = (time: number, open: number, close: number, volume = 100): HistoryPoint => ({
  time,
  open,
  high: Math.max(open, close) + 1,
  low: Math.min(open, close) - 1,
  close,
  volume,
});

const candle = { time: 7200, open: 100, high: 105, low: 98, close: 102 };

describe('toCandles and toVolumeBars', () => {
  it('CND-01 turns history into candles with the time in seconds', () => {
    const candles = toCandles([point(2 * HOUR, 100, 102), point(3 * HOUR, 102, 101)]);
    expect(candles).toEqual([
      { time: 7200, open: 100, high: 103, low: 99, close: 102 },
      { time: 10_800, open: 102, high: 103, low: 100, close: 101 },
    ]);
  });

  it('CND-02 colors volume by whether the candle rose or fell', () => {
    const bars = toVolumeBars([
      point(HOUR, 100, 102, 10),
      point(2 * HOUR, 102, 100, 20),
      point(3 * HOUR, 100, 100, 30),
    ]);
    expect(bars).toEqual([
      { time: 3600, value: 10, direction: 'up' },
      { time: 7200, value: 20, direction: 'down' },
      { time: 10_800, value: 30, direction: 'up' },
    ]);
  });

  it('CND-03 handles an empty history', () => {
    expect(toCandles([])).toEqual([]);
    expect(toVolumeBars([])).toEqual([]);
  });
});

describe('applyLivePrice', () => {
  const bucketMs = HOUR;

  it('CND-04 moves the close and widens the high inside the candle', () => {
    const next = applyLivePrice(candle, { price: 107, timestamp: 7200 * 1000 + 1000, bucketMs });
    expect(next).toEqual({ time: 7200, open: 100, high: 107, low: 98, close: 107 });
  });

  it('CND-04 keeps the range when the price stays inside it', () => {
    const next = applyLivePrice(candle, { price: 101, timestamp: 7200 * 1000 + 1000, bucketMs });
    expect(next).toEqual({ time: 7200, open: 100, high: 105, low: 98, close: 101 });
  });

  it('CND-05 lowers the low when the price falls below it', () => {
    const next = applyLivePrice(candle, { price: 95, timestamp: 7200 * 1000 + 1000, bucketMs });
    expect(next).toEqual({ time: 7200, open: 100, high: 105, low: 95, close: 95 });
  });

  it('CND-06 starts a new candle at the bucket start in a later bucket', () => {
    const timestamp = 3 * HOUR + 20 * 60_000;
    const next = applyLivePrice(candle, { price: 110, timestamp, bucketMs });
    expect(next).toEqual({ time: 10_800, open: 110, high: 110, low: 110, close: 110 });
  });

  it('CND-07 never goes back to an earlier candle for an older timestamp', () => {
    const next = applyLivePrice(candle, { price: 101, timestamp: HOUR, bucketMs });
    expect(next).toEqual({ time: 7200, open: 100, high: 105, low: 98, close: 101 });
  });

  it('CND-08 starts a candle when there is none yet', () => {
    const next = applyLivePrice(undefined, { price: 50, timestamp: 5 * HOUR + 1234, bucketMs });
    expect(next).toEqual({ time: 18_000, open: 50, high: 50, low: 50, close: 50 });
  });
});
