import { describe, expect, it } from 'vitest';

import { chartLocale } from './chart-locale';

describe('chartLocale', () => {
  it('CLC-01 follows the language, with Latin digits in Arabic', () => {
    expect(chartLocale('en')).toBe('en-US');
    expect(chartLocale('ar')).toBe('ar-u-nu-latn');
    expect(chartLocale('fr')).toBe('en-US');
  });
});
