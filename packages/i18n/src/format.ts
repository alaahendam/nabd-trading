/**
 * Financial figures use one notation in both languages: Latin digits, `.` for decimals, `,` for
 * grouping, a `$` prefix, explicit `+` and `-`, and `K`, `M`, `B` suffixes. The UI shows them
 * left to right even inside a right-to-left layout.
 *
 * `Intl`'s Arabic currency format puts the symbol after the number and adds invisible bidi
 * marks, which would make figures unpredictable, so the notation is fixed here on purpose.
 */

const DASH = '—';

const decimal = new Intl.NumberFormat('en-US-u-nu-latn', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat('en-US-u-nu-latn', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

/**
 * Rounds to two decimals, halves away from zero, so what is shown and what decides the sign
 * agree and +0.005 and -0.005 are mirror images (`Math.round` alone is not).
 */
const toCents = (value: number) => (Math.sign(value) * Math.round(Math.abs(value) * 100)) / 100;

function signed(value: number, text: (magnitude: number) => string): string {
  const rounded = toCents(value);
  if (rounded === 0) {
    return text(0);
  }
  return `${rounded > 0 ? '+' : '-'}${text(Math.abs(rounded))}`;
}

export function formatPrice(value: number): string {
  return Number.isFinite(value) ? `$${decimal.format(value)}` : DASH;
}

export function formatChange(value: number): string {
  return Number.isFinite(value) ? signed(value, formatPrice) : DASH;
}

/** `value` is already a percentage: 2.46 means 2.46%. */
export function formatPercent(value: number): string {
  return Number.isFinite(value)
    ? signed(value, (magnitude) => `${decimal.format(magnitude)}%`)
    : DASH;
}

export function formatVolume(value: number): string {
  return Number.isFinite(value) ? compact.format(value) : DASH;
}

export type ChangeDirection = 'up' | 'down' | 'flat';

/** Up and down are never shown by color alone; this drives the sign or arrow next to it. */
export function changeDirection(value: number): ChangeDirection {
  const rounded = Number.isFinite(value) ? toCents(value) : 0;
  if (rounded > 0) {
    return 'up';
  }
  return rounded < 0 ? 'down' : 'flat';
}

/**
 * A percentage without its sign, for a sentence that says "up" or "down" in words (a text
 * alternative read aloud). `value` is already a percentage: 2.46 means 2.46%.
 */
export function formatPercentMagnitude(value: number): string {
  return Number.isFinite(value) ? `${decimal.format(Math.abs(toCents(value)))}%` : DASH;
}
