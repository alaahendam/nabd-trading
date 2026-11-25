import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { AppState } from 'react-native';

import { readEnv } from '../src/lib/env';
import { loadFonts } from '../src/lib/fonts';
import { networkConnectivity } from '../src/lib/network/network-connectivity';
import { wireQueryClient } from '../src/lib/query/wire-query-client';
import type { StartupStorage } from '../src/lib/storage/startup-storage';
import { AppProviders } from '../src/providers/app-providers';
import { AppStack } from '../src/providers/app-stack';
import { Bootstrap, holdSplash } from '../src/providers/bootstrap';
import { ConfigGate } from '../src/providers/config-gate';
import { DataProviders } from '../src/providers/data-providers';
import { prepareApp, type Prepared } from '../src/providers/prepare-app';
import { createDataServices, createServices } from '../src/providers/services';

// Expo inlines only static `process.env.EXPO_PUBLIC_*` references, so each is read here, written
// exactly like this, and handed to the check.
const env = readEnv({ EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL });

export { ErrorBoundary } from '../src/providers/error-boundary';

holdSplash();
wireQueryClient({ appState: AppState, connectivity: networkConnectivity });
const prepare = () => prepareApp({ store: AsyncStorage, loadFonts });

function DataRoot({ storage, apiUrl }: { storage: StartupStorage; apiUrl: string }) {
  const services = useMemo(() => createDataServices(storage, apiUrl), [storage, apiUrl]);

  return (
    <DataProviders services={services}>
      <AppStack />
    </DataProviders>
  );
}

function AppRoot({ prepared }: { prepared: Prepared }) {
  // Once: the services hold the stores, which must not be rebuilt on a re-render.
  const services = useMemo(() => createServices(prepared.storage), [prepared]);

  return (
    <AppProviders services={services}>
      <StatusBar style="auto" />
      <ConfigGate env={env}>
        {({ apiUrl }) => <DataRoot storage={prepared.storage} apiUrl={apiUrl} />}
      </ConfigGate>
    </AppProviders>
  );
}

export default function RootLayout() {
  return <Bootstrap prepare={prepare}>{(prepared) => <AppRoot prepared={prepared} />}</Bootstrap>;
}
