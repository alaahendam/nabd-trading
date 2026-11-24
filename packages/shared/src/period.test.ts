import { describe, expect, it } from 'vitest';

import { DEFAULT_PERIOD, PERIOD_CONFIG, PERIODS, periodSchema } from './period.js';

describe('periods', () => {
  it('PER-01 are the agreed closed set, in order', () => {
    expect(PERIODS).toEqual(['1D', '1W', '1M', '3M', '1Y']);
  });

  it.each(PERIODS)('PER-02 schema accepts %s', (period) => {
    expect(periodSchema.parse(period)).toBe(period);
  });

  it.each(['2D', '1d', '', 5, null])('PER-03 schema rejects %j', (value) => {
    expect(periodSchema.safeParse(value).success).toBe(false);
  });

  it('PER-04 have a config for every period and nothing else', () => {
    expect(Object.keys(PERIOD_CONFIG).sort()).toEqual([...PERIODS].sort());
  });

  it.each(PERIODS)('PER-05 %s bucket divides its lookback evenly', (period) => {
    const { lookbackMs, bucketMs } = PERIOD_CONFIG[period];
    expect(lookbackMs % bucketMs).toBe(0);
  });

  it.each(PERIODS)('PER-06 %s bucket is positive and smaller than its lookback', (period) => {
    const { lookbackMs, bucketMs } = PERIOD_CONFIG[period];
    expect(bucketMs).toBeGreaterThan(0);
    expect(bucketMs).toBeLessThan(lookbackMs);
  });

  it('PER-07 longer periods look further back', () => {
    const lookbacks = PERIODS.map((period) => PERIOD_CONFIG[period].lookbackMs);
    expect(lookbacks).toEqual([...lookbacks].sort((a, b) => a - b));
    expect(new Set(lookbacks).size).toBe(lookbacks.length);
  });

  it('PER-08 default period is a valid period', () => {
    expect(periodSchema.parse(DEFAULT_PERIOD)).toBe('1D');
  });
});
