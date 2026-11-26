import { describe, expect, it } from 'vitest';

import {
  changeDirection,
  formatChange,
  formatPercent,
  formatPercentMagnitude,
  formatPrice,
  formatVolume,
} from './format.js';

describe('formatPrice', () => {
  it.each([
    [1234.5, '$1,234.50'],
    [0.05, '$0.05'],
    [1_000_000, '$1,000,000.00'],
    [0, '$0.00'],
  ])('FMT-01 formats %f as %s', (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });
});

describe('formatChange', () => {
  it.each([
    [2.44, '+$2.44'],
    [-2.44, '-$2.44'],
    [0, '$0.00'],
    [-0, '$0.00'],
    [0.004, '$0.00'],
    [-0.004, '$0.00'],
    [1234.5, '+$1,234.50'],
  ])('FMT-02 formats %f as %s', (value, expected) => {
    expect(formatChange(value)).toBe(expected);
  });
});

describe('formatPercent', () => {
  it.each([
    [2.456, '+2.46%'],
    [-0.5, '-0.50%'],
    [0, '0.00%'],
    [0.004, '0.00%'],
    [-0.004, '0.00%'],
    [12, '+12.00%'],
  ])('FMT-03 formats %f as %s', (value, expected) => {
    expect(formatPercent(value)).toBe(expected);
  });
});

describe('formatVolume', () => {
  it.each([
    [0, '0'],
    [950, '950'],
    [1500, '1.5K'],
    [1_234_567, '1.2M'],
    [55_000_000, '55M'],
    [3_200_000_000, '3.2B'],
  ])('FMT-04 formats %f as %s', (value, expected) => {
    expect(formatVolume(value)).toBe(expected);
  });
});

describe('changeDirection', () => {
  it.each([
    [1, 'up'],
    [-1, 'down'],
    [0, 'flat'],
    [0.004, 'flat'],
    [-0.004, 'flat'],
    [0.005, 'up'],
    [-0.005, 'down'],
  ] as const)('FMT-05 gives %f the direction %s', (value, expected) => {
    expect(changeDirection(value)).toBe(expected);
  });

  it('FMT-05 treats non-finite values as flat', () => {
    expect(changeDirection(Number.NaN)).toBe('flat');
  });
});

describe('non-finite input', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'FMT-06 renders %f as an em dash everywhere',
    (value) => {
      expect(formatPrice(value)).toBe('—');
      expect(formatChange(value)).toBe('—');
      expect(formatPercent(value)).toBe('—');
      expect(formatVolume(value)).toBe('—');
    },
  );
});

describe('digits', () => {
  it('FMT-07 are always Latin, whatever the value', () => {
    const allowed = /^[0-9.,$+\-%KMB—]+$/;
    for (const value of [
      0, 0.01, 0.5, 1, 9.99, 10, 123.456, 1234.5, 99_999, 1_000_000, 7.2e9, -3.14,
    ]) {
      for (const text of [
        formatPrice(Math.abs(value)),
        formatChange(value),
        formatPercent(value),
        formatVolume(Math.abs(value)),
      ]) {
        expect(text).toMatch(allowed);
      }
    }
  });
});

describe('formatPercentMagnitude', () => {
  it.each([
    [2.456, '2.46%'],
    [-2.456, '2.46%'],
    [0, '0.00%'],
    [-0.004, '0.00%'],
    [Number.NaN, '—'],
  ])('FMT-08 formats %f as %s, with no sign', (value, expected) => {
    expect(formatPercentMagnitude(value)).toBe(expected);
  });
});
