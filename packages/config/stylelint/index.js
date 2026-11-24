import { fileURLToPath } from 'node:url';

// Resolved from this package so consumers do not need to install the plugins themselves.
const resolve = (name) => fileURLToPath(import.meta.resolve(name));

/** @type {import('stylelint').Config} */
const config = {
  extends: [resolve('stylelint-config-standard')],
  plugins: [resolve('stylelint-use-logical')],
  rules: {
    // Tailwind v4 at-rules.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'source',
          'utility',
          'variant',
          'custom-variant',
          'plugin',
          'apply',
          'config',
          'reference',
          'tailwind',
        ],
      },
    ],
    'import-notation': 'string',
    // oklch(0.9 0.2 130) is the standard Tailwind v4 form.
    'lightness-notation': null,
    'hue-degree-notation': null,
    // Colors are defined once, in the tokens file (see overrides). Everything else uses tokens.
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
      'color',
    ],
    // RTL: logical properties only (margin-inline-start, inset-inline-end, ...).
    'csstools/use-logical': ['always', { except: [] }],
  },
  overrides: [
    {
      files: ['**/tokens.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
      },
    },
  ],
};

export default config;
