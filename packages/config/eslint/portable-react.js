import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

import { portable } from './portable.js';

/**
 * Portable config for packages with React bindings (hooks, providers): the portable rules, plus
 * the React and hooks rules. There is no DOM-specific rule here (no jsx-a11y): a package never
 * renders markup, it only offers hooks and context.
 */
export const portableReact = defineConfig(portable, {
  files: ['src/**/*.{ts,tsx}'],
  settings: { react: { version: 'detect' } },
  extends: [
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,
  ],
  rules: { 'react/prop-types': 'off', 'react/jsx-no-leaked-render': 'error' },
});
