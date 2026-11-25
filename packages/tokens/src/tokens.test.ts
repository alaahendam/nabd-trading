import { describe, expect, it } from 'vitest';

import { contrastRatio, luminance } from './contrast.js';
import { generateTokensCss } from './css.js';
import { elevations, paletteGroups } from './palette.js';
import { resolveToken, semanticOf, THEMES, valueOf } from './resolve.js';
import { dark, light, SEMANTIC_TOKENS, type SemanticToken } from './semantic.js';

type Pair = readonly [SemanticToken, SemanticToken];

const TEXT_PAIRS: readonly Pair[] = [
  ['content', 'surface'],
  ['content', 'surface-raised'],
  ['content', 'surface-sunken'],
  ['content-muted', 'surface'],
  ['content-muted', 'surface-raised'],
  ['content-muted', 'surface-sunken'],
  ['on-brand', 'brand'],
  ['on-accent', 'accent'],
  ['positive', 'surface'],
  ['positive', 'surface-raised'],
  ['positive', 'positive-subtle'],
  ['negative', 'surface'],
  ['negative', 'surface-raised'],
  ['negative', 'negative-subtle'],
  ['brand', 'surface'],
  ['brand', 'surface-raised'],
];

const NON_TEXT_PAIRS: readonly Pair[] = [
  ['watch', 'surface'],
  ['watch', 'surface-raised'],
  ['focus', 'surface'],
  ['focus', 'surface-raised'],
  ['line-strong', 'surface'],
  ['line-strong', 'surface-raised'],
];

const ratio = (theme: 'light' | 'dark', foreground: SemanticToken, background: SemanticToken) =>
  contrastRatio(resolveToken(theme, foreground), resolveToken(theme, background));

describe('contrast helpers', () => {
  it('CON-01 gives black and white a ratio of 21, in either order', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('CON-02 reads three and six digit hex the same', () => {
    expect(luminance('#fff')).toBeCloseTo(luminance('#ffffff'), 8);
    expect(luminance('#0a0')).toBeCloseTo(luminance('#00aa00'), 8);
    expect(luminance('#000')).toBe(0);
  });

  it('CON-03 gives identical colors a ratio of 1', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 8);
  });
});

describe.each(THEMES)('%s theme', (theme) => {
  it.each(TEXT_PAIRS)('TOK-01 %s on %s is at least 4.5:1', (foreground, background) => {
    expect(ratio(theme, foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)('TOK-02 %s on %s is at least 3:1', (foreground, background) => {
    expect(ratio(theme, foreground, background)).toBeGreaterThanOrEqual(3);
  });

  it('TOK-05 market green is not the brand green', () => {
    expect(resolveToken(theme, 'positive')).not.toBe(resolveToken(theme, 'brand'));
  });

  it('TOK-11 every semantic token points at something that exists', () => {
    for (const token of SEMANTIC_TOKENS) {
      expect(() => valueOf(semanticOf(theme)[token])).not.toThrow();
    }
  });
});

describe('light theme sharpness', () => {
  it('TOK-06 borders and dividers are clearly visible on a card', () => {
    expect(ratio('light', 'line', 'surface-raised')).toBeGreaterThanOrEqual(1.7);
    expect(ratio('light', 'line', 'surface')).toBeGreaterThanOrEqual(1.5);
  });

  it('TOK-06 the chart grid is visible but lighter than a border', () => {
    expect(ratio('light', 'grid', 'surface-raised')).toBeGreaterThanOrEqual(1.2);
    expect(ratio('light', 'grid', 'surface-raised')).toBeLessThan(
      ratio('light', 'line', 'surface-raised'),
    );
  });

  it('TOK-07 muted text meets the AAA level of 7:1 on every surface', () => {
    for (const surface of ['surface', 'surface-raised', 'surface-sunken'] as const) {
      expect(ratio('light', 'content-muted', surface)).toBeGreaterThanOrEqual(7);
    }
  });

  it('TOK-08 the market colors are strong on a card', () => {
    expect(ratio('light', 'positive', 'surface-raised')).toBeGreaterThanOrEqual(5.5);
    expect(ratio('light', 'negative', 'surface-raised')).toBeGreaterThanOrEqual(5.5);
  });

  it('TOK-09 white cards stand out from the page', () => {
    expect(ratio('light', 'surface-raised', 'surface')).toBeGreaterThanOrEqual(1.05);
  });
});

describe('the token set', () => {
  it('TOK-03 dark defines exactly the tokens light does', () => {
    expect(Object.keys(dark).sort()).toEqual([...SEMANTIC_TOKENS].sort());
    expect(Object.keys(light).sort()).toEqual([...SEMANTIC_TOKENS].sort());
  });

  it('TOK-12 a reference that does not exist is an error, not a silent blank', () => {
    expect(() => valueOf('palette-no-such-color')).toThrow('Unknown token reference');
  });

  it('TOK-13 resolves the elevation to a shadow in each theme', () => {
    expect(resolveToken('light', 'elevation-raised')).toBe(elevations['elevation-light-raised']);
    expect(resolveToken('dark', 'elevation-raised')).toBe(elevations['elevation-dark-raised']);
  });
});

describe('generateTokensCss', () => {
  const css = generateTokensCss();

  it('TOK-10 declares every palette color, every elevation and every semantic token', () => {
    for (const group of paletteGroups) {
      for (const [name, value] of Object.entries(group.colors)) {
        expect(css).toContain(`--palette-${name}: ${value};`);
      }
    }
    for (const [name, value] of Object.entries(elevations)) {
      expect(css).toContain(`--${name}: ${value};`);
    }
    const darkBlock = css.slice(css.indexOf("[data-theme='dark'] {"));
    const lightBlock = css.slice(0, css.indexOf("[data-theme='dark'] {"));
    for (const token of SEMANTIC_TOKENS) {
      expect(lightBlock).toContain(`--${token}: var(--${light[token]});`);
      expect(darkBlock).toContain(`--${token}: var(--${dark[token]});`);
    }
  });

  it('TOK-14 says it is generated, and ends with a newline', () => {
    expect(css).toContain('generated from @nabd/tokens');
    expect(css.endsWith('}\n')).toBe(true);
  });
});
