import { defineConfig } from 'eslint/config';
import i18next from 'eslint-plugin-i18next';

/**
 * Every user-facing string goes through i18n (English and Arabic).
 * Literal text and user-facing attributes in JSX are errors; tests are exempt.
 */
export const i18n = defineConfig(
  {
    files: ['**/*.tsx'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            include: ['alt', 'aria-label', 'aria-description', 'title', 'placeholder'],
          },
        },
      ],
    },
  },
  {
    files: ['**/*.{test,spec}.tsx', '**/*.stories.tsx'],
    rules: { 'i18next/no-literal-string': 'off' },
  },
);
