import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { webArchitecture } from './architecture.js';
import { base } from './base.js';
import { designSystem } from './design-system.js';
import { i18n } from './i18n.js';

/**
 * Config for React + Vite workspaces (`apps/web`).
 */
export const reactConfig = defineConfig(base, webArchitecture, designSystem, i18n, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: { globals: globals.browser },
  settings: { react: { version: 'detect' } },
  extends: [
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,
    jsxA11y.flatConfigs.strict,
  ],
  rules: {
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': 'error',
    'react/self-closing-comp': 'error',
    'react/jsx-no-leaked-render': 'error',
    'react/button-has-type': 'error',
  },
});
