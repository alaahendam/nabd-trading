/** @type {import('jest').Config} */
export default {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^socket.io-client$': '<rootDir>/test-support/socket-io-client.ts' },
  // The first Expo Router render in a run loads and transforms the whole router, which takes
  // several seconds on a cold cache and longer while the other workspaces' tests run beside it.
  testTimeout: 30_000,
  testMatch: ['<rootDir>/app/**/*.test.{ts,tsx}', '<rootDir>/src/**/*.test.{ts,tsx}'],
  // The pnpm form from the Expo docs: packages in the store are only transformed when they are
  // React Native or Expo ones. The workspace packages are symlinks to folders outside node_modules,
  // so they are transformed like the app's own code.
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|@shopify/flash-list))',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!src/test-utils.tsx',
    '!src/**/generated/**',
    '!**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
    './src/lib/env.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
  },
};
