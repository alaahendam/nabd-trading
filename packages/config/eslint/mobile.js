import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';
import i18next from 'eslint-plugin-i18next';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';

import { base } from './base.js';
import { colorLiteralSelectors } from './design-system.js';
import { fileNaming } from './file-naming.js';
import { mobileRules } from './mobile-rules.js';

const sharedDeepImports = {
  group: ['@nabd/*/dist', '@nabd/*/dist/*', '@nabd/*/src', '@nabd/*/src/*'],
  message: 'Import a workspace package from its entry point, not its internals.',
};
const apps = {
  group: ['@nabd/web', '@nabd/web/*', '@nabd/server', '@nabd/server/*'],
  message: 'The mobile app never imports another app.',
};

const restrictedGlobals = [
  { name: 'fetch', message: 'HTTP requests go through @nabd/api-client.' },
  { name: 'XMLHttpRequest', message: 'HTTP requests go through @nabd/api-client.' },
  { name: 'WebSocket', message: 'Realtime goes through @nabd/market-data.' },
];

/**
 * Config for the mobile app (`apps/mobile`).
 *
 * Architecture: routes (`app/`) only compose; `src` is layered `providers`, `features`, `shared`
 * and `lib`, imports flow one way, and a feature is reached only through its `index.ts`. Network
 * and sockets live in the shared packages. React Native rules: no inline styles, no color
 * literals, no raw text outside a Text component, no physical direction (start and end only),
 * every control has a role and a label, and every visible string goes through i18n.
 */
export const mobileConfig = defineConfig(
  base,
  fileNaming,
  {
    files: ['**/*.{ts,tsx}'],
    settings: { react: { version: 'detect' } },
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
    ],
    rules: {
      'react/prop-types': 'off',
      'react/jsx-no-leaked-render': 'error',
      'react/self-closing-comp': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'nabd-mobile': mobileRules },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react-dom', message: 'The mobile app does not use React DOM.' },
            {
              name: 'socket.io-client',
              message: 'Only @nabd/market-data may import socket.io-client.',
            },
            { name: 'lightweight-charts', message: 'The chart library is web-only.' },
          ],
          patterns: [apps, sharedDeepImports],
        },
      ],
      'no-restricted-globals': ['error', ...restrictedGlobals],
      // Colors exist once, in the palette of @nabd/tokens.
      'no-restricted-syntax': ['error', ...colorLiteralSelectors],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-native': reactNative, i18next },
    rules: {
      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
      'react-native/no-raw-text': 'error',
      'nabd-mobile/no-physical-direction': 'error',
      'nabd-mobile/require-accessibility': 'error',
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            include: [
              'accessibilityLabel',
              'accessibilityHint',
              'aria-label',
              'alt',
              'placeholder',
              'title',
            ],
          },
        },
      ],
    },
  },
  {
    // Expo Router files (`app/`) are named by the router: `_layout`, `(tabs)`, `[symbol]`,
    // `+not-found`. They only compose features, and have default exports by design.
    files: ['app/**/*.{ts,tsx}'],
    rules: { 'check-file/filename-naming-convention': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'routes', pattern: 'app' },
        { type: 'providers', pattern: 'src/providers' },
        { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'lib', pattern: 'src/lib' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'routes' } },
              allow: { to: { element: { types: ['providers', 'features', 'shared', 'lib'] } } },
            },
            {
              from: { element: { type: 'providers' } },
              allow: { to: { element: { types: ['providers', 'features', 'shared', 'lib'] } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: ['features', 'shared', 'lib'] } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { types: ['shared', 'lib'] } } },
            },
            {
              from: { element: { type: 'lib' } },
              allow: { to: { element: { type: 'lib' } } },
            },
            {
              disallow: {
                to: { element: { type: 'features', fileInternalPath: '!index.{ts,tsx}' } },
              },
              message:
                'Import a feature through its public index.ts, never its internals ({{ to.element.fileInternalPath }}).',
            },
          ],
        },
      ],
    },
  },
  {
    // Tests may write literal text and set up what they need.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'i18next/no-literal-string': 'off' },
  },
);
