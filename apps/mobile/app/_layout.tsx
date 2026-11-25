import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { readEnv } from '../src/lib/env';
import { AppProviders } from '../src/providers/app-providers';
import { ConfigGate } from '../src/providers/config-gate';

// Expo inlines only static `process.env.EXPO_PUBLIC_*` references, so each is read here, written
// exactly like this, and handed to the check.
const env = readEnv({ EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL });

export default function RootLayout() {
  return (
    <AppProviders>
      <ConfigGate env={env}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </ConfigGate>
    </AppProviders>
  );
}
