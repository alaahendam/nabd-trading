import { z } from 'zod';

export const PERIODS = ['1D', '1W', '1M', '3M', '1Y'] as const;

export const periodSchema = z.enum(PERIODS);
export type Period = z.infer<typeof periodSchema>;

export const DEFAULT_PERIOD: Period = '1D';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface PeriodConfig {
  /** How far back the window reaches from now, in milliseconds. */
  readonly lookbackMs: number;
  /** Width of one candle in this period, in milliseconds. */
  readonly bucketMs: number;
}

export const PERIOD_CONFIG: Readonly<Record<Period, PeriodConfig>> = {
  '1D': { lookbackMs: DAY, bucketMs: 5 * MINUTE },
  '1W': { lookbackMs: 7 * DAY, bucketMs: 30 * MINUTE },
  '1M': { lookbackMs: 30 * DAY, bucketMs: 2 * HOUR },
  '3M': { lookbackMs: 90 * DAY, bucketMs: DAY },
  '1Y': { lookbackMs: 365 * DAY, bucketMs: DAY },
};
