import { MAX_RANGE_MS, MIN_RANGE_MS, type Period } from '@nabd/shared';

import type { HistoryRange } from '../../lib/api';

const DAY = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight UTC at the start of a `YYYY-MM-DD` day, or `undefined` if the text is not a real date. */
export function dayStart(date: string): number | undefined {
  if (!DATE_PATTERN.test(date)) {
    return undefined;
  }
  const time = Date.parse(`${date}T00:00:00Z`);
  // A date that does not exist (the 30th of February) parses to another day; refuse it.
  return Number.isNaN(time) || toDateInput(time) !== date ? undefined : time;
}

/** The last millisecond of a `YYYY-MM-DD` day (UTC). */
export function dayEnd(date: string): number | undefined {
  const start = dayStart(date);
  return start === undefined ? undefined : start + DAY - 1;
}

/** A timestamp as the value of a date input: its UTC day, `YYYY-MM-DD`. */
export function toDateInput(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export type CustomRangeProblem = 'invalid' | 'order' | 'future' | 'tooOld';

export interface CustomRange {
  from: number;
  to: number;
  /** The range ends today, so live ticks still belong to it. */
  live: boolean;
}

export type CustomRangeResult =
  { ok: true; range: CustomRange } | { ok: false; problem: CustomRangeProblem };

/**
 * Turns the two date inputs into the range the API takes: whole UTC days, with the end clamped to
 * now when it is today. A range that would be under an hour is widened to an hour, since that is
 * the shortest the server serves. The oldest day offered is 364 days back, so the start of that
 * day is never older than the year the server allows.
 */
export function validateCustomRange(
  input: { from: string; to: string },
  now: number,
): CustomRangeResult {
  const fromStart = dayStart(input.from);
  const toStart = dayStart(input.to);
  const toEnd = dayEnd(input.to);
  if (fromStart === undefined || toStart === undefined || toEnd === undefined) {
    return { ok: false, problem: 'invalid' };
  }
  if (fromStart > toEnd) {
    return { ok: false, problem: 'order' };
  }
  if (toStart > now) {
    return { ok: false, problem: 'future' };
  }

  const to = Math.min(toEnd, now);
  const from = Math.min(fromStart, to - MIN_RANGE_MS);
  if (from < now - MAX_RANGE_MS) {
    return { ok: false, problem: 'tooOld' };
  }
  return { ok: true, range: { from, to, live: toEnd >= now } };
}

/** What the chart shows: one of the fixed periods, or a custom range the user applied. */
export type ChartRange =
  { kind: 'period'; period: Period } | { kind: 'custom'; range: CustomRange };

/** The range as the API takes it: the period itself, or just the two times. */
export function toHistoryRange(range: ChartRange): HistoryRange {
  return range.kind === 'period' ? range.period : { from: range.range.from, to: range.range.to };
}

/** The dates of a custom range, for a name or a label: `2026-06-10 – 2026-06-12`. */
export function describeCustomRange({ from, to }: CustomRange): string {
  return `${toDateInput(from)} – ${toDateInput(to)}`;
}
