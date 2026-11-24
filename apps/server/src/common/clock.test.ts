import { describe, expect, it } from 'vitest';

import { SystemClock } from './clock.js';

describe('SystemClock', () => {
  it('CLK-01 tells the time', () => {
    expect(Math.abs(new SystemClock().now() - Date.now())).toBeLessThan(1000);
  });
});
