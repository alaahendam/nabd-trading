import { defineConfig } from 'eslint/config';

import { base } from './base.js';

const appPackages = ['@nabd/web', '@nabd/web/*', '@nabd/mobile', '@nabd/mobile/*', '@nabd/server'];

/**
 * Config for portable packages (`packages/*` other than `config` and `shared`): code that runs
 * unchanged in the web app and in the mobile app.
 *
 * TypeScript sees the DOM lib only for `fetch`, `AbortSignal` and timers, which React Native also
 * provides. Using the browser itself is an error: a package that needs the platform takes it as an
 * argument (a scheduler, a storage object, a connectivity source). A package never imports an app,
 * React DOM or React Native. Individual packages relax the one rule they exist to own.
 */
export const portable = defineConfig(base, {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-globals': [
      'error',
      ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location'].map(
        (name) => ({
          name,
          message: 'Portable packages do not use the browser: take the platform as an argument.',
        }),
      ),
      { name: 'fetch', message: 'HTTP requests go through @nabd/api-client.' },
      { name: 'XMLHttpRequest', message: 'HTTP requests go through @nabd/api-client.' },
      { name: 'WebSocket', message: 'Realtime goes through @nabd/market-data.' },
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-dom',
            message: 'Portable packages must not depend on React DOM.',
          },
          {
            name: 'react-native',
            message: 'Portable packages must not depend on React Native.',
          },
          {
            name: 'socket.io-client',
            message: 'Only @nabd/market-data may import socket.io-client.',
          },
          {
            name: 'lightweight-charts',
            message: 'Only the web chart adapter may import the chart library.',
          },
        ],
        patterns: [
          { group: appPackages, message: 'A package never imports an app.' },
          {
            group: ['@nabd/shared/*'],
            message: 'Import from the @nabd/shared entry point, not its internals.',
          },
        ],
      },
    ],
  },
});
