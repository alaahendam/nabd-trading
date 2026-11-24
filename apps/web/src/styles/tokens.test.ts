import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../test/contrast';
import indexCss from './index.css?raw';
import tokensCss from './tokens.css?raw';

/** The declarations (`--name: value`) inside the first block that starts with `selector`. */
function declarations(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf('\n}', start);
  const block = css.slice(start, end);
  return new Map(
    Array.from(block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g), (match): [string, string] => [
      match[1] ?? '',
      (match[2] ?? '').trim(),
    ]),
  );
}

const light = declarations(tokensCss, ':root');
const dark = declarations(tokensCss, "[data-theme='dark']");

/** Follows var(--x) references until a literal value is reached. */
function resolve(theme: Map<string, string>, name: string): string {
  let value = theme.get(name) ?? light.get(name);
  while (value?.startsWith('var(')) {
    const reference = /var\((--[a-z0-9-]+)\)/.exec(value)?.[1] ?? '';
    value = theme.get(reference) ?? light.get(reference);
  }
  return value ?? '';
}

const themes = [
  ['light', new Map(light)],
  ['dark', new Map([...light, ...dark])],
] as const;

const SEMANTIC_TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ['--content', '--surface'],
  ['--content', '--surface-raised'],
  ['--content', '--surface-sunken'],
  ['--content-muted', '--surface'],
  ['--content-muted', '--surface-raised'],
  ['--content-muted', '--surface-sunken'],
  ['--on-brand', '--brand'],
  ['--on-accent', '--accent'],
  ['--positive', '--surface'],
  ['--positive', '--surface-raised'],
  ['--positive', '--positive-subtle'],
  ['--negative', '--surface'],
  ['--negative', '--surface-raised'],
  ['--negative', '--negative-subtle'],
  ['--brand', '--surface'],
  ['--brand', '--surface-raised'],
];

const SEMANTIC_NON_TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ['--watch', '--surface'],
  ['--watch', '--surface-raised'],
  ['--focus', '--surface'],
  ['--focus', '--surface-raised'],
  ['--line-strong', '--surface'],
  ['--line-strong', '--surface-raised'],
];

const SEMANTIC_COLORS = [...light.keys()].filter(
  (name) => !name.startsWith('--palette-') && !name.startsWith('--elevation-'),
);

describe('design tokens', () => {
  describe.each(themes)('%s theme', (_name, theme) => {
    it.each(SEMANTIC_TEXT_PAIRS)('TOK-01 %s on %s is at least 4.5:1', (foreground, background) => {
      const ratio = contrastRatio(resolve(theme, foreground), resolve(theme, background));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it.each(SEMANTIC_NON_TEXT_PAIRS)(
      'TOK-02 %s on %s is at least 3:1',
      (foreground, background) => {
        const ratio = contrastRatio(resolve(theme, foreground), resolve(theme, background));
        expect(ratio).toBeGreaterThanOrEqual(3);
      },
    );

    it('TOK-05 market green is not the brand green', () => {
      expect(resolve(theme, '--positive')).not.toBe(resolve(theme, '--brand'));
    });
  });

  describe('light theme sharpness', () => {
    const ratio = (foreground: string, background: string) =>
      contrastRatio(resolve(themes[0][1], foreground), resolve(themes[0][1], background));

    it('TOK-06 borders and dividers are clearly visible on a card', () => {
      expect(ratio('--line', '--surface-raised')).toBeGreaterThanOrEqual(1.7);
      expect(ratio('--line', '--surface')).toBeGreaterThanOrEqual(1.5);
    });

    it('TOK-06 the chart grid is visible but lighter than a border', () => {
      expect(ratio('--grid', '--surface-raised')).toBeGreaterThanOrEqual(1.2);
      expect(ratio('--grid', '--surface-raised')).toBeLessThan(ratio('--line', '--surface-raised'));
    });

    it('TOK-07 muted text meets the AAA level of 7:1 on every surface', () => {
      for (const surface of ['--surface', '--surface-raised', '--surface-sunken']) {
        expect(ratio('--content-muted', surface)).toBeGreaterThanOrEqual(7);
      }
    });

    it('TOK-08 the market colors are strong on a card', () => {
      expect(ratio('--positive', '--surface-raised')).toBeGreaterThanOrEqual(5.5);
      expect(ratio('--negative', '--surface-raised')).toBeGreaterThanOrEqual(5.5);
    });

    it('TOK-09 white cards stand out from the page', () => {
      expect(ratio('--surface-raised', '--surface')).toBeGreaterThanOrEqual(1.05);
    });
  });

  it('TOK-03 dark redefines every semantic token of the light layer', () => {
    const stillLight = SEMANTIC_COLORS.filter((name) => !dark.has(name));
    expect(stillLight).toEqual([]);
  });

  it('TOK-04 the Tailwind theme maps every semantic color and nothing else', () => {
    const theme = declarations(indexCss, '@theme inline');
    const targets = [...theme]
      .filter(([name]) => name.startsWith('--color-') && name !== '--color-*')
      .flatMap(([, value]) => /var\((--[a-z0-9-]+)\)/.exec(value)?.[1] ?? []);

    expect([...targets].sort()).toEqual([...SEMANTIC_COLORS].sort());
    for (const target of targets) {
      expect(light.has(target)).toBe(true);
    }
  });
});
