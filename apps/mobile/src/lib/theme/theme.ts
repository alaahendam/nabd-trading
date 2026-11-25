import { resolveToken } from '@nabd/tokens';

import type { ResolvedTheme } from './theme-store';

/** Spacing and type sizes do not change with the theme. Numbers are device-independent pixels. */
export const spacing = { small: 8, medium: 16, large: 24 } as const;
export const fontSize = { body: 16, title: 22, small: 14, display: 32 } as const;
export const radius = { medium: 8 } as const;
/** The smallest touch target: 48 covers 44 pt on iOS and 48 dp on Android. */
export const minTouchTarget = 48;

/** The colors of a theme, from the shared tokens (never literals). */
export function createColors(theme: ResolvedTheme) {
  return {
    background: resolveToken(theme, 'surface'),
    text: resolveToken(theme, 'content'),
    muted: resolveToken(theme, 'content-muted'),
    border: resolveToken(theme, 'line'),
    brand: resolveToken(theme, 'brand'),
    onBrand: resolveToken(theme, 'on-brand'),
    positive: resolveToken(theme, 'positive'),
    negative: resolveToken(theme, 'negative'),
    watch: resolveToken(theme, 'watch'),
  };
}

export type Colors = ReturnType<typeof createColors>;
