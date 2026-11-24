import { describe, expect, it } from 'vitest';

import { readChartColors } from './chart-colors';

describe('readChartColors', () => {
  it('CLR-01 reads the colors from the CSS tokens, trimmed', () => {
    const tokens: Record<string, string> = {
      '--surface-raised': ' light-background ',
      '--content-muted': 'light-text',
      '--grid': ' light-grid',
      '--positive': 'light-up ',
      '--negative': 'light-down',
    };
    const colors = readChartColors({ getPropertyValue: (name) => tokens[name] ?? '' });

    expect(colors).toEqual({
      background: 'light-background',
      text: 'light-text',
      grid: 'light-grid',
      up: 'light-up',
      down: 'light-down',
    });
  });
});
