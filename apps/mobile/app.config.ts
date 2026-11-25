import type { ExpoConfig } from 'expo/config';

/**
 * The Expo configuration. The API URL is not read here: the app reads
 * `process.env.EXPO_PUBLIC_API_URL` itself, which Expo inlines when it bundles, and shows a
 * readable error if it is missing or invalid (see `src/lib/env.ts`).
 */
const config: ExpoConfig = {
  name: 'Nabd',
  slug: 'nabd',
  scheme: 'nabd',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
  android: { package: 'com.nabd.trading' },
  ios: { bundleIdentifier: 'com.nabd.trading' },
};

export default config;
