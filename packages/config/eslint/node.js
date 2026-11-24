import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';

import { base } from './base.js';

/**
 * Config for Node workspaces (`apps/server`, tooling scripts).
 *
 * Server modules (`src/modules/*`) talk to each other only through the providers
 * their module exports from its public `index.ts`. Shared code lives in `src/common`.
 */
export const nodeConfig = defineConfig(
  base,
  {
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'modules', pattern: 'src/modules/*', capture: ['module'] },
        { type: 'common', pattern: 'src/common' },
      ],
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'modules' } },
              allow: { to: { element: { types: ['modules', 'common'] } } },
            },
            {
              from: { element: { type: 'common' } },
              allow: { to: { element: { type: 'common' } } },
            },
            {
              disallow: {
                to: { element: { type: 'modules', fileInternalPath: '!index.ts' } },
              },
              message:
                'Use another module through its public index.ts (exported providers), never its internals ({{ to.element.fileInternalPath }}).',
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@nabd/shared/*'],
              message: 'Import from the @nabd/shared entry point, not its internals.',
            },
          ],
        },
      ],
    },
  },
);
