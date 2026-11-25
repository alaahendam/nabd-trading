import { generateTokensCss, SEMANTIC_TOKENS } from '@nabd/tokens';
import { describe, expect, it } from 'vitest';

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

/** Colors only: the elevation is a shadow, so it has no Tailwind color utility. */
const SEMANTIC_COLORS = SEMANTIC_TOKENS.filter((token) => !token.startsWith('elevation-')).map(
  (token) => `--${token}`,
);

describe('design tokens in the web app', () => {
  it('TOK-15 tokens.css is exactly what @nabd/tokens generates', () => {
    // If this fails, run `pnpm --filter @nabd/tokens run generate` and commit the result.
    expect(tokensCss).toBe(generateTokensCss());
  });

  it('TOK-04 the Tailwind theme maps every semantic color and nothing else', () => {
    const light = declarations(tokensCss, ':root');
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
