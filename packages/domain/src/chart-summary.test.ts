import type { HistoryPoint } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { summarizeHistory } from './chart-summary.js';

const point = (open: number, high: number, low: number, close: number): HistoryPoint => ({
  time: 1,
  open,
  high,
  low,
  close,
  volume: 1,
});

describe('summarizeHistory', () => {
  it('SUM-01 has nothing to say about no candles', () => {
    expect(summarizeHistory([])).toBeUndefined();
  });

  it('SUM-02 takes the start from the first open and the end from the last close', () => {
    const summary = summarizeHistory([point(100, 110, 95, 105), point(105, 120, 100, 112)]);
    expect(summary).toMatchObject({ start: 100, end: 112 });
  });

  it('SUM-03 takes the high and the low from every candle, not only the ends', () => {
    const summary = summarizeHistory([
      point(100, 110, 95, 105),
      point(105, 140, 60, 100),
      point(100, 120, 99, 112),
    ]);
    expect(summary).toMatchObject({ high: 140, low: 60 });
  });

  it('SUM-04 gives the change as a percentage, up or down', () => {
    expect(summarizeHistory([point(200, 210, 190, 205)])?.changePercent).toBeCloseTo(2.5);
    expect(summarizeHistory([point(200, 210, 150, 150)])?.changePercent).toBeCloseTo(-25);
  });

  it('SUM-05 does not divide by zero', () => {
    expect(summarizeHistory([point(0, 1, 0, 1)])?.changePercent).toBe(0);
  });
});
