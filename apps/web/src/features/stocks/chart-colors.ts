import type { ChartColors } from './chart-port';

interface StyleReader {
  getPropertyValue(name: string): string;
}

/**
 * The chart draws on a canvas, which cannot read CSS variables, so the current values of the
 * semantic tokens are read and handed over. Read again after a theme change.
 */
export function readChartColors(style: StyleReader): ChartColors {
  const read = (token: string) => style.getPropertyValue(token).trim();
  return {
    background: read('--surface-raised'),
    text: read('--content-muted'),
    grid: read('--line'),
    up: read('--positive'),
    down: read('--negative'),
  };
}
