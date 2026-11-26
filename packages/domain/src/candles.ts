import type { HistoryPoint } from '@nabd/shared';

/** One candle. `time` is in seconds, which is what the chart library expects. */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeBar {
  time: number;
  value: number;
  direction: 'up' | 'down';
}

/** The API speaks milliseconds, the chart library seconds. This is the only place that converts. */
const toSeconds = (milliseconds: number) => milliseconds / 1000;

export function toCandles(points: readonly HistoryPoint[]): Candle[] {
  return points.map(({ time, open, high, low, close }) => ({
    time: toSeconds(time),
    open,
    high,
    low,
    close,
  }));
}

export function toVolumeBars(points: readonly HistoryPoint[]): VolumeBar[] {
  return points.map(({ time, open, close, volume }) => ({
    time: toSeconds(time),
    value: volume,
    direction: close >= open ? 'up' : 'down',
  }));
}

interface LivePrice {
  price: number;
  /** Server time of the tick, in milliseconds. */
  timestamp: number;
  /** Width of one candle in this period, in milliseconds. */
  bucketMs: number;
}

/**
 * The last candle with a live price applied. A price inside the candle's bucket moves its close
 * and widens its range; a later bucket starts a new candle. Buckets are aligned to the epoch, as
 * on the server, so a live candle lands on the same grid as the history. A timestamp older than
 * the last candle is treated as inside it, so the chart never goes back in time.
 */
export function applyLivePrice(
  last: Candle | undefined,
  { price, timestamp, bucketMs }: LivePrice,
): Candle {
  if (last !== undefined && timestamp < last.time * 1000 + bucketMs) {
    return {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
    };
  }
  return {
    time: toSeconds(Math.floor(timestamp / bucketMs) * bucketMs),
    open: price,
    high: price,
    low: price,
    close: price,
  };
}
