import {
  bucketForSpan,
  type HistoryData,
  type HistoryPoint,
  MAX_RANGE_MS,
  MIN_RANGE_MS,
  type Period,
  PERIOD_CONFIG,
} from '@nabd/shared';

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

function assertPrice(currentPrice: number): void {
  if (!(currentPrice > 0)) {
    throw new RangeError(`currentPrice must be positive, got ${currentPrice}`);
  }
}

/** Which candles to build: they are numbered by bucket, counted from the epoch. */
interface Window {
  bucketMs: number;
  /** The candle that holds "now". The path is anchored here, on the current price. */
  anchorIndex: number;
  /** The first and last candles to return. */
  firstIndex: number;
  lastIndex: number;
}

/**
 * Each candle depends only on (symbol, bucket index) and the current price, so a candle is the
 * same whichever request asks for it, shifted only as time passes. The path is built backward from
 * the current price at the anchor, so a window in the past is walked from now back to its start
 * and only its own candles are returned. Each UTC day starts with an overnight gap.
 */
function buildCandles(entry: UniverseEntry, window: Window, currentPrice: number): HistoryPoint[] {
  const { bucketMs, anchorIndex, firstIndex, lastIndex } = window;
  const bucketVolatility = entry.dailyVolatility * Math.sqrt(bucketMs / DAY_MS);
  const dayVolume = entry.avgDailyVolume * (bucketMs / DAY_MS);

  const points: HistoryPoint[] = [];
  let closeLog = 0;
  for (let index = anchorIndex; index >= firstIndex; index -= 1) {
    const time = index * bucketMs;
    const regime = dayRegime(entry.symbol, Math.floor(time / DAY_MS));
    const rng = rngFor(entry.symbol, 'candle', bucketMs, index);

    const move = bucketVolatility * regime * rng.normal();
    const gap = time % DAY_MS === 0 ? entry.dailyVolatility * GAP_SHARE * rng.normal() : 0;
    const wickUp = bucketVolatility * WICK_SHARE * Math.abs(rng.normal());
    const wickDown = bucketVolatility * WICK_SHARE * Math.abs(rng.normal());
    const volume = Math.max(1, Math.round(dayVolume * (0.6 + 0.8 * rng.next())));

    const openLog = closeLog - move;
    const close = index === anchorIndex ? currentPrice : round2(currentPrice * Math.exp(closeLog));
    const open = Math.max(0.01, round2(currentPrice * Math.exp(openLog)));
    const top = Math.max(open, close);
    const bottom = Math.min(open, close);

    if (index <= lastIndex) {
      points.push({
        time,
        open,
        high: Math.max(round2(top * (1 + wickUp)), top),
        low: Math.min(Math.max(round2(bottom * (1 - wickDown)), 0.01), bottom),
        close: Math.max(0.01, close),
        volume,
      });
    }
    closeLog = openLog - gap;
  }

  return points.reverse();
}

/** Candles for a fixed period, ending with a candle that closes at `currentPrice`. */
export function generateHistory(
  entry: UniverseEntry,
  period: Period,
  now: number,
  currentPrice: number,
): HistoryData {
  assertPrice(currentPrice);
  const { lookbackMs, bucketMs } = PERIOD_CONFIG[period];
  if (now < lookbackMs) {
    throw new RangeError(`now (${now}) is earlier than the ${period} lookback`);
  }

  const anchorIndex = Math.floor(now / bucketMs);
  const window = {
    bucketMs,
    anchorIndex,
    firstIndex: anchorIndex - lookbackMs / bucketMs + 1,
    lastIndex: anchorIndex,
  };
  return {
    symbol: entry.symbol,
    period,
    bucketMs,
    points: buildCandles(entry, window, currentPrice),
  };
}

/** What is wrong with a custom range, in a sentence, or undefined when it is fine. */
export function rangeProblem(
  { from, to }: { from: number; to: number },
  now: number,
): string | undefined {
  const span = to - from;
  if (span < MIN_RANGE_MS || span > MAX_RANGE_MS) {
    return 'The range must be between one hour and one year long';
  }
  if (to > now) {
    return 'The range must not end in the future';
  }
  if (from < now - MAX_RANGE_MS) {
    return 'The range must start within the last year';
  }
  return undefined;
}

/**
 * Candles for a custom range, from the candle that holds `from` to the one that holds `to`. The
 * candle size comes from the span, so a range reads like the fixed period of a similar length. The
 * range must lie in the past, within a year of `now`, and be between an hour and a year long.
 */
export function generateRangeHistory(
  entry: UniverseEntry,
  { from, to }: { from: number; to: number },
  now: number,
  currentPrice: number,
): HistoryData {
  assertPrice(currentPrice);
  const problem = rangeProblem({ from, to }, now);
  if (problem !== undefined) {
    throw new RangeError(problem);
  }
  const span = to - from;
  const bucketMs = bucketForSpan(span);
  const window = {
    bucketMs,
    anchorIndex: Math.floor(now / bucketMs),
    firstIndex: Math.floor(from / bucketMs),
    lastIndex: Math.floor(to / bucketMs),
  };
  return {
    symbol: entry.symbol,
    period: 'custom',
    bucketMs,
    points: buildCandles(entry, window, currentPrice),
  };
}
