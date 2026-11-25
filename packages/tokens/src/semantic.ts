/**
 * The semantic layer: what a color is for. Each theme maps every semantic token to a palette color
 * (or, for the elevation, to a shadow). Dark must define exactly the tokens light does, and the
 * `Record` types make the compiler check it.
 */
export const SEMANTIC_TOKENS = [
  'surface',
  'surface-raised',
  'surface-sunken',
  'content',
  'content-muted',
  'on-brand',
  'on-accent',
  'line',
  'grid',
  'line-strong',
  'brand',
  'accent',
  'positive',
  'positive-subtle',
  'negative',
  'negative-subtle',
  'watch',
  'focus',
  'elevation-raised',
] as const;

export type SemanticToken = (typeof SEMANTIC_TOKENS)[number];

/** A palette color as `palette-<name>`, or a shadow as `elevation-<theme>-<name>`. */
export type Reference = string;

export const light: Readonly<Record<SemanticToken, Reference>> = {
  surface: 'palette-sage-50',
  'surface-raised': 'palette-white',
  'surface-sunken': 'palette-sage-100',
  content: 'palette-ink-950',
  'content-muted': 'palette-sage-700',
  'on-brand': 'palette-canvas-50',
  'on-accent': 'palette-ink-950',
  line: 'palette-sage-200',
  grid: 'palette-sage-150',
  'line-strong': 'palette-sage-500',
  brand: 'palette-forest-900',
  accent: 'palette-lime-300',
  positive: 'palette-green-700',
  'positive-subtle': 'palette-green-50',
  negative: 'palette-red-700',
  'negative-subtle': 'palette-red-50',
  watch: 'palette-amber-700',
  focus: 'palette-blue-600',
  'elevation-raised': 'elevation-light-raised',
};

export const dark: Readonly<Record<SemanticToken, Reference>> = {
  surface: 'palette-night-900',
  'surface-raised': 'palette-night-800',
  'surface-sunken': 'palette-night-950',
  content: 'palette-night-100',
  'content-muted': 'palette-night-300',
  'on-brand': 'palette-ink-950',
  'on-accent': 'palette-ink-950',
  line: 'palette-night-700',
  grid: 'palette-night-700',
  'line-strong': 'palette-night-500',
  brand: 'palette-lime-300',
  accent: 'palette-lime-300',
  positive: 'palette-green-400',
  'positive-subtle': 'palette-green-900',
  negative: 'palette-red-400',
  'negative-subtle': 'palette-red-900',
  watch: 'palette-amber-400',
  focus: 'palette-lime-300',
  'elevation-raised': 'elevation-dark-raised',
};
