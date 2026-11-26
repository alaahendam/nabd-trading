import type { ExpoConfig } from 'expo/config';

import brandColor from './brand-color.json';

/**
 * The splash and the adaptive icon sit on the brand color. It is a copy of the `brand` token, not
 * an import of it: Expo reads this file on the build server before any workspace package is
 * built, so it can import none. A test fails if the copy and the token ever differ.
 */
const brand = brandColor.brand;

/**
 * The Expo configuration. The API URL is not read here: the app reads
 * `process.env.EXPO_PUBLIC_API_URL` itself, which Expo inlines when it bundles, and shows a
 * readable error if it is missing or invalid (see `src/lib/env.ts`). The icons are drawn by
 * `scripts/make-icons.mjs`. Expo Go shows its own icon and splash; these appear in a development
 * build or the APK.
 */
const config: ExpoConfig = {
  name: 'Nabd',
  slug: 'nabd',
  scheme: 'nabd',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 200, backgroundColor: brand },
    ],
  ],
  experiments: { typedRoutes: true },
  // The EAS project the APK is built in. An ID, not a secret; `eas init` cannot write it here.
  extra: { eas: { projectId: '0368e4b7-af34-4228-ab5b-4fd9fa3035ce' } },
  android: {
    package: 'com.nabd.trading',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: brand },
  },
  ios: { bundleIdentifier: 'com.nabd.trading' },
};

export default config;
