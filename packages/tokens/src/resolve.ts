import { elevations, paletteGroups } from './palette.js';
import { dark, light, type Reference, type SemanticToken } from './semantic.js';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Every reachable value by its reference: `palette-<name>` for colors, `elevation-...` for shadows. */
const values = new Map<string, string>([
  ...paletteGroups.flatMap((group) =>
    Object.entries(group.colors).map(([name, value]): [string, string] => [
      `palette-${name}`,
      value,
    ]),
  ),
  ...Object.entries(elevations),
]);

/** The palette color or shadow a reference points to. */
export function valueOf(reference: Reference): string {
  const value = values.get(reference);
  if (value === undefined) {
    throw new Error(`Unknown token reference: ${reference}`);
  }
  return value;
}

/** The semantic layer of a theme. */
export const semanticOf = (theme: Theme): Readonly<Record<SemanticToken, Reference>> =>
  theme === 'light' ? light : dark;

/** The final value of a semantic token in a theme: a hex color, or a shadow for the elevation. */
export const resolveToken = (theme: Theme, token: SemanticToken): string =>
  valueOf(semanticOf(theme)[token]);
