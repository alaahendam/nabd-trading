import { resolveToken } from '@nabd/tokens';
import type { ExpoConfig } from 'expo/config';

/** The splash and the adaptive icon sit on the brand color, the same token as the app's buttons. */
const brand = resolveToken('light', 'brand');

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
  android: {
    package: 'com.nabd.trading',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: brand },
  },
  ios: { bundleIdentifier: 'com.nabd.trading' },
};

export default config;
