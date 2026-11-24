import type { HistoryPoint } from '@nabd/shared';

export interface HistorySummary {
  /** The open of the first candle. */
  start: number;
  /** The close of the last candle. */
  end: number;
  high: number;
  low: number;
  /** From start to end, as a percentage: 2.46 means 2.46%. */
  changePercent: number;
}

/**
 * What a chart shows, in numbers, for the text alternative that goes with it. It is read from the
 * loaded history and not from live ticks, so the description stays still while prices move.
 */
export function summarizeHistory(points: readonly HistoryPoint[]): HistorySummary | undefined {
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) {
    return undefined;
  }
  return {
    start: first.open,
    end: last.close,
    high: Math.max(...points.map((point) => point.high)),
    low: Math.min(...points.map((point) => point.low)),
    changePercent: first.open === 0 ? 0 : ((last.close - first.open) / first.open) * 100,
  };
}
