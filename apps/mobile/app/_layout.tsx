import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { readEnv } from '../src/lib/env';
import { loadFonts } from '../src/lib/fonts';
import { AppProviders } from '../src/providers/app-providers';
import { Bootstrap, holdSplash } from '../src/providers/bootstrap';
import { ConfigGate } from '../src/providers/config-gate';
import { prepareApp } from '../src/providers/prepare-app';

// Expo inlines only static `process.env.EXPO_PUBLIC_*` references, so each is read here, written
// exactly like this, and handed to the check.
const env = readEnv({ EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL });

holdSplash();
const prepare = () => prepareApp({ store: AsyncStorage, loadFonts });

export default function RootLayout() {
  return (
    <Bootstrap prepare={prepare}>
      {() => (
        <AppProviders>
          <ConfigGate env={env}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </ConfigGate>
        </AppProviders>
      )}
    </Bootstrap>
  );
}
