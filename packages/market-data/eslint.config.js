import { restrictImports } from '@nabd/config/eslint/portable';
import { portableReact } from '@nabd/config/eslint/portable-react';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  portableReact,
  {
    // The one place that may import the Socket.IO client, and the test that fakes it.
    files: ['src/socket-io-adapter*.ts'],
    rules: { 'no-restricted-imports': ['error', restrictImports(['socket.io-client'])] },
  },
  {
    // Tests of the React bindings run in a DOM, and render a component to prove the hooks work.
    files: ['src/**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-globals': 'off' },
  },
);
