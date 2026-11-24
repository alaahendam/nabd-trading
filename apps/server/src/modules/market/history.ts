import { type HistoryData, type HistoryPoint, type Period, PERIOD_CONFIG } from '@nabd/shared';

import { rngFor } from './rng.js';
import type { UniverseEntry } from './universe.js';

const DAY_MS = 86_400_000;
/** The overnight gap is this share of a stock's daily volatility. */
const GAP_SHARE = 0.5;
/** Wicks reach this share of a candle's volatility beyond its body. */
const WICK_SHARE = 0.5;
const REGIME_SPREAD = 0.35;
const REGIME_MIN = 0.6;
const REGIME_MAX = 2;

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Volatility regime of one UTC day. Constant within the day, so volatility clusters. */
export function dayRegime(symbol: string, dayIndex: number): number {
  const shock = rngFor(symbol, 'regime', dayIndex).normal();
  return Math.min(Math.max(Math.exp(REGIME_SPREAD * shock), REGIME_MIN), REGIME_MAX);
}

/**
 * Candles for a period, ending with a candle that closes at `currentPrice`.
 *
 * Each candle depends only on (symbol, bucket index) and the current price, so the same
 * request returns the same shape, shifted as time passes. The path is built backward from
 * the current price. Each UTC day starts with an overnight gap.
 */
export function generateHistory(
  entry: UniverseEntry,
  period: Period,
  now: number,
  currentPrice: number,
): HistoryData {
  if (!(currentPrice > 0)) {
    throw new RangeError(`currentPrice must be positive, got ${currentPrice}`);
  }
  const { lookbackMs, bucketMs } = PERIOD_CONFIG[period];
  if (now < lookbackMs) {
    throw new RangeError(`now (${now}) is earlier than the ${period} lookback`);
  }

  const count = lookbackMs / bucketMs;
  const lastIndex = Math.floor(now / bucketMs);
  const bucketVolatility = entry.dailyVolatility * Math.sqrt(bucketMs / DAY_MS);
  const dayVolume = entry.avgDailyVolume * (bucketMs / DAY_MS);

  const points: HistoryPoint[] = [];
  let closeLog = 0;
  for (let index = lastIndex; index > lastIndex - count; index -= 1) {
    const time = index * bucketMs;
    const regime = dayRegime(entry.symbol, Math.floor(time / DAY_MS));
    const rng = rngFor(entry.symbol, 'candle', bucketMs, index);

    const move = bucketVolatility * regime * rng.normal();
    const gap = time % DAY_MS === 0 ? entry.dailyVolatility * GAP_SHARE * rng.normal() : 0;
    const wickUp = bucketVolatility * WICK_SHARE * Math.abs(rng.normal());
    const wickDown = bucketVolatility * WICK_SHARE * Math.abs(rng.normal());
    const volume = Math.max(1, Math.round(dayVolume * (0.6 + 0.8 * rng.next())));

    const openLog = closeLog - move;
    const close = index === lastIndex ? currentPrice : round2(currentPrice * Math.exp(closeLog));
    const open = Math.max(0.01, round2(currentPrice * Math.exp(openLog)));
    const top = Math.max(open, close);
    const bottom = Math.min(open, close);

    points.push({
      time,
      open,
      high: Math.max(round2(top * (1 + wickUp)), top),
      low: Math.min(Math.max(round2(bottom * (1 - wickDown)), 0.01), bottom),
      close: Math.max(0.01, close),
      volume,
    });
    closeLog = openLog - gap;
  }

  return { symbol: entry.symbol, period, points: points.reverse() };
}
