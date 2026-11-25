import { elevations, paletteGroups } from './palette.js';
import { dark, light, SEMANTIC_TOKENS } from './semantic.js';

const HEADER = `/*
 * Design tokens, generated from @nabd/tokens (ADR 0006). Do not edit by hand: change the typed
 * tokens in packages/tokens and run \`pnpm --filter @nabd/tokens run generate\`. A test fails when
 * this file is out of date.
 *
 * Primitives are the raw palette. Semantic tokens say what a color is for and are the only
 * layer the rest of the app sees. Light is the default; dark redefines the semantic layer only.
 * Every text and background pairing the UI uses is checked for WCAG contrast in the package.
 */
`;

/** The web's tokens.css, written out from the typed tokens. */
export function generateTokensCss(): string {
  const lines: string[] = [HEADER, ':root {'];

  paletteGroups.forEach((group, index) => {
    if (index > 0) {
      lines.push('');
    }
    lines.push(`  /* ${group.title} */`);
    for (const [name, value] of Object.entries(group.colors)) {
      lines.push(`  --palette-${name}: ${value};`);
    }
  });

  lines.push('', '  /* Elevation shadows are colors too */');
  for (const [name, value] of Object.entries(elevations)) {
    lines.push(`  --${name}: ${value};`);
  }

  lines.push('', '  /* Semantic tokens, light */');
  for (const token of SEMANTIC_TOKENS) {
    lines.push(`  --${token}: var(--${light[token]});`);
  }
  lines.push('}', '', "[data-theme='dark'] {");
  for (const token of SEMANTIC_TOKENS) {
    lines.push(`  --${token}: var(--${dark[token]});`);
  }
  lines.push('}', '');

  return lines.join('\n');
}
