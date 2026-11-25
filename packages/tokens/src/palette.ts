/**
 * The raw colors, grouped as in the design. Nothing outside this package may contain a color
 * literal (a lint rule enforces it). Components never see these: they use the semantic layer.
 */
export const paletteGroups = [
  {
    title: 'Brand',
    colors: {
      'forest-900': '#07351a',
      'ink-950': '#0a140a',
      'canvas-50': '#f8f9f9',
      'sage-200': '#b4c3b2',
      'lime-300': '#c5ff94',
      'amber-400': '#ffb932',
    },
  },
  {
    title: 'Light neutrals',
    colors: {
      white: '#fff',
      'sage-50': '#eff3ef',
      'sage-100': '#e0e7e0',
      'sage-150': '#d9e2d8',
      'sage-500': '#566b55',
      'sage-700': '#2f402f',
    },
  },
  {
    title: 'Dark neutrals, tinted green like the brand',
    colors: {
      'night-950': '#070d08',
      'night-900': '#0b120c',
      'night-800': '#121c14',
      'night-700': '#243326',
      'night-500': '#5c715d',
      'night-300': '#9daf9d',
      'night-100': '#eef3ee',
    },
  },
  {
    title: 'Market colors: a green and a red that are not the brand green',
    colors: {
      'green-50': '#e2f3e7',
      'green-400': '#3ddc84',
      'green-700': '#067236',
      'green-900': '#12301c',
      'red-50': '#fbe7e4',
      'red-400': '#ff7b72',
      'red-700': '#c21d0b',
      'red-900': '#3a1815',
    },
  },
  {
    title: 'Focus and the watch star in light mode',
    colors: {
      'blue-600': '#1d5fd6',
      'amber-700': '#a8620a',
    },
  },
] as const;

/** Elevation shadows are colors too, so they are defined here as well. */
export const elevations = {
  'elevation-light-raised': '0 1px 2px rgb(10 20 10 / 12%), 0 2px 6px rgb(10 20 10 / 8%)',
  'elevation-dark-raised': '0 1px 2px rgb(0 0 0 / 50%), 0 1px 3px rgb(0 0 0 / 40%)',
} as const;
