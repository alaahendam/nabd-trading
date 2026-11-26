import { describe, expect, it } from 'vitest';

import {
  dayEnd,
  dayStart,
  describeCustomRange,
  toDateInput,
  toHistoryRange,
  validateCustomRange,
} from './custom-range.js';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 5, 17, 13, 0, 0);

describe('custom range', () => {
  it('CRG-01 finds the start and the end of a day, and refuses text that is not a date', () => {
    expect(dayStart('2026-06-17')).toBe(Date.UTC(2026, 5, 17));
    expect(dayEnd('2026-06-17')).toBe(Date.UTC(2026, 5, 17) + DAY - 1);
    for (const text of ['', '2026-13-01', '2026-02-30', 'abc', '2026-6-1']) {
      expect(dayStart(text)).toBeUndefined();
      expect(dayEnd(text)).toBeUndefined();
    }
  });

  it('CRG-02 writes a timestamp as a date input value', () => {
    expect(toDateInput(Date.UTC(2026, 5, 17, 13, 5))).toBe('2026-06-17');
    expect(toDateInput(Date.UTC(2026, 0, 2))).toBe('2026-01-02');
  });

  it('CRG-03 covers whole days for a range in the past', () => {
    expect(validateCustomRange({ from: '2026-06-10', to: '2026-06-12' }, NOW)).toEqual({
      ok: true,
      range: { from: Date.UTC(2026, 5, 10), to: Date.UTC(2026, 5, 13) - 1, live: false },
    });
  });

  it('CRG-04 ends a range that ends today at now, and calls it live', () => {
    expect(validateCustomRange({ from: '2026-06-10', to: '2026-06-17' }, NOW)).toEqual({
      ok: true,
      range: { from: Date.UTC(2026, 5, 10), to: NOW, live: true },
    });
  });

  it('CRG-05 widens a range that would be under an hour to an hour', () => {
    const early = Date.UTC(2026, 5, 17, 0, 20);
    const result = validateCustomRange({ from: '2026-06-17', to: '2026-06-17' }, early);
    expect(result).toEqual({ ok: true, range: { from: early - HOUR, to: early, live: true } });
  });

  it.each([
    ['text that is not a date', { from: 'x', to: '2026-06-12' }, 'invalid'],
    ['a to that is not a date', { from: '2026-06-10', to: '' }, 'invalid'],
    ['from after to', { from: '2026-06-12', to: '2026-06-10' }, 'order'],
    ['to tomorrow', { from: '2026-06-10', to: '2026-06-18' }, 'future'],
    ['from over a year back', { from: '2025-05-01', to: '2026-06-10' }, 'tooOld'],
  ])('CRG-06 refuses %s as %s', (_label, input, problem) => {
    expect(validateCustomRange(input, NOW)).toEqual({ ok: false, problem });
  });

  it('CRG-07 accepts the oldest day the picker allows', () => {
    const oldest = toDateInput(NOW - 364 * DAY);
    const result = validateCustomRange({ from: oldest, to: '2026-06-17' }, NOW);
    expect(result.ok).toBe(true);
  });
});

describe('chart range helpers', () => {
  const custom = { from: Date.UTC(2026, 5, 10), to: Date.UTC(2026, 5, 13) - 1, live: false };

  it('CRG-08 turns a chart range into what the API takes', () => {
    expect(toHistoryRange({ kind: 'period', period: '1W' })).toBe('1W');
    expect(toHistoryRange({ kind: 'custom', range: custom })).toEqual({
      from: custom.from,
      to: custom.to,
    });
  });

  it('CRG-09 describes a custom range by its two dates', () => {
    expect(describeCustomRange(custom)).toBe('2026-06-10 – 2026-06-12');
  });
});
