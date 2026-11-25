import type { Colors } from '../../lib/theme/theme';
import type { ChartColors } from './chart-commands';

/**
 * The chart page cannot read the app's theme, so it is handed resolved colors. They come from the
 * same tokens as everything else: the surface it sits on, the muted text, the line color for the
 * grid, and the up and down colors for candles and volume.
 */
export function chartColorsFor(colors: Colors): ChartColors {
  return {
    background: colors.background,
    text: colors.muted,
    grid: colors.border,
    up: colors.positive,
    down: colors.negative,
  };
}
