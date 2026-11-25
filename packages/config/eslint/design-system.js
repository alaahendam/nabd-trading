import { defineConfig } from 'eslint/config';
import betterTailwind from 'eslint-plugin-better-tailwindcss';

// esquery regex literals do not support backslash escapes, so character classes are used instead.
const COLOR_FUNCTIONS = '(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)[(]';
const HEX_COLOR =
  '(^|[^0-9A-Za-z_&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})($|[^0-9A-Za-z_])';
const COLOR_STYLE_KEYS =
  '^(color|background|backgroundColor|borderColor|outlineColor|fill|stroke|boxShadow|caretColor|accentColor)$';

const colorMessage = 'Colors come from design tokens, never literals. Use a semantic utility.';

/**
 * `no-restricted-syntax` selectors that reject color literals (hex, rgb(), hsl(), ...). Shared with
 * the portable preset: the palette in @nabd/tokens is the one place allowed to have them.
 */
export const colorLiteralSelectors = [
  { selector: `Literal[value=/${HEX_COLOR}/]`, message: colorMessage },
  { selector: `TemplateElement[value.raw=/${HEX_COLOR}/]`, message: colorMessage },
  { selector: `Literal[value=/(^|[^0-9A-Za-z_])${COLOR_FUNCTIONS}/]`, message: colorMessage },
  {
    selector: `TemplateElement[value.raw=/(^|[^0-9A-Za-z_])${COLOR_FUNCTIONS}/]`,
    message: colorMessage,
  },
];

/** Physical-direction utilities, which break RTL. Logical equivalents: ms-, me-, ps-, pe-, start-, end-. */
const PHYSICAL_DIRECTION =
  '(^|:)-?(ml|mr|pl|pr|left|right|scroll-ml|scroll-mr|scroll-pl|scroll-pr|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|text-left|text-right|float-left|float-right|clear-left|clear-right)(-|$)';

/**
 * Design-system rules for the web app. Components may only use semantic utilities
 * from the token layer: no arbitrary values, no color literals, no physical directions.
 * Set `settings['better-tailwindcss'].entryPoint` to the Tailwind stylesheet so unknown
 * classes are reported against the real theme.
 */
export const designSystem = defineConfig({
  files: ['**/*.{ts,tsx}'],
  plugins: { 'better-tailwindcss': betterTailwind },
  rules: {
    'better-tailwindcss/no-unknown-classes': 'error',
    'better-tailwindcss/no-conflicting-classes': 'error',
    'better-tailwindcss/no-duplicate-classes': 'error',
    'better-tailwindcss/enforce-logical-properties': 'error',
    'better-tailwindcss/no-restricted-classes': [
      'error',
      {
        restrict: [
          {
            pattern: '[[]', // any class with an opening bracket (the plugin strips backslashes from patterns)
            message: 'Arbitrary values are not allowed. Add or use a design token.',
          },
          {
            pattern: PHYSICAL_DIRECTION,
            message:
              'Physical direction breaks RTL. Use logical properties (ms-, me-, ps-, pe-, start-, end-, text-start, text-end).',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      ...colorLiteralSelectors,
      {
        selector: `JSXAttribute[name.name='style'] Property[key.name=/${COLOR_STYLE_KEYS}/]`,
        message: 'No inline color styles. Use a semantic utility class.',
      },
    ],
  },
});
