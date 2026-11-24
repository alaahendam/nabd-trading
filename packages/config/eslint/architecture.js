import { defineConfig } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';

const socketIo = {
  name: 'socket.io-client',
  message: 'Only features/market-data may import socket.io-client.',
};
const httpClients = ['axios', 'ky'].map((name) => ({
  name,
  message: 'HTTP requests go through lib/api.',
}));
const sharedDeepImports = {
  group: ['@nabd/shared/*'],
  message: 'Import from the @nabd/shared entry point, not its internals.',
};

/**
 * Web architecture, enforced as lint errors:
 *   app -> features -> shared / lib, never the other way round.
 *   A feature is only reachable through its public `index.ts`.
 *   socket.io-client lives in features/market-data, the HTTP client in lib/api.
 *   No deep imports into @nabd/shared.
 */
export const webArchitecture = defineConfig(
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // boundaries resolves imports through this resolver, so directory imports and
      // tsconfig path aliases map to real files.
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
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
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: ['features', 'shared', 'lib'] } } },
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
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [socketIo, ...httpClients], patterns: [sharedDeepImports] },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'HTTP requests go through lib/api.' },
        { name: 'XMLHttpRequest', message: 'HTTP requests go through lib/api.' },
        { name: 'WebSocket', message: 'Realtime goes through features/market-data.' },
      ],
    },
  },
  {
    // The one feature allowed to import socket.io-client.
    files: ['src/features/market-data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: httpClients, patterns: [sharedDeepImports] }],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'HTTP requests go through lib/api.' },
        { name: 'XMLHttpRequest', message: 'HTTP requests go through lib/api.' },
      ],
    },
  },
  {
    files: ['src/lib/api/**/*.{ts,tsx}'],
    rules: { 'no-restricted-globals': 'off' },
  },
);
