import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** The last `node_modules/<name>/` segment of a path, so pnpm's nested layout matches too. */
const dependency = (names: string[]) =>
  new RegExp(String.raw`[\/]node_modules[\/](?:${names.join('|')})[\/]`);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Stable dependencies get their own files, so a release that only changes app code keeps
        // them in the browser cache. The chart library is left out on purpose: it is loaded on
        // demand and already has its own chunk. See docs/decisions/0009.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: dependency(['react', 'react-dom', 'scheduler', 'react-router']),
            },
            {
              name: 'data',
              test: dependency([
                '@tanstack/react-query',
                '@tanstack/query-core',
                'socket.io-client',
                'socket.io-parser',
                'engine.io-client',
                'engine.io-parser',
                '@socket.io/component-emitter',
                'zod',
              ]),
            },
            { name: 'i18n', test: dependency(['i18next', 'react-i18next']) },
          ],
        },
      },
    },
  },
});
