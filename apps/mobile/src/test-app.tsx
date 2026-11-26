import { createQueryClient } from '@nabd/data';
import { PriceStore, RealtimeClient } from '@nabd/market-data';
import { createFakeApi, FakeSocket } from '@nabd/testing';
import { QueryClient } from '@tanstack/react-query';
import { act, render, renderHook } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { StartupStorage } from './lib/storage/startup-storage';
import { StorageProvider } from './lib/storage/storage-context';
import { AppProviders } from './providers/app-providers';
import { DataProviders } from './providers/data-providers';
import { createServices } from './providers/services';
import { createMemoryStore } from './test-utils';

/**
 * The whole app around a component, with every outside piece a fake: the API (`createFakeApi`),
 * the socket (`FakeSocket`), and a price store whose frame is a microtask, not a screen frame. A
 * test stubs what it needs on `api`, then plays the server with `connect` and `tick`.
 */
export function createTestApp(saved: Record<string, string> = {}) {
  const socket = new FakeSocket();
  const api = createFakeApi();
  // The app's own settings (such as how long a result stays fresh), with the two things a test must
  // not have: retries, and a cache lifetime that sets a garbage-collection timer, which would keep
  // Jest alive.
  const appOptions = createQueryClient().getDefaultOptions();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { ...appOptions.queries, retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const realtime = new RealtimeClient(
    socket,
    new PriceStore({
      // A frame that arrives at the next microtask, so `tick` (which waits inside `act`) sees it.
      schedule: (callback) => {
        let cancelled = false;
        queueMicrotask(() => {
          if (!cancelled) callback();
        });
        return () => {
          cancelled = true;
        };
      },
    }),
  );
  let clock = 1_700_000_000_000;

  async function createWrapper() {
    const storage = await StartupStorage.load(createMemoryStore(saved), Object.keys(saved));
    const services = createServices(storage);
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <AppProviders services={services}>
          <StorageProvider storage={storage}>
            <DataProviders services={{ api, queryClient, realtime }}>{children}</DataProviders>
          </StorageProvider>
        </AppProviders>
      );
    };
  }

  return {
    socket,
    api,
    queryClient,
    realtime,
    async render(ui: ReactElement) {
      return render(ui, { wrapper: await createWrapper() });
    },
    async renderHook<Result>(hook: () => Result) {
      return renderHook(hook, { wrapper: await createWrapper() });
    },
    /** The server accepted the connection. */
    async connect() {
      await act(() => {
        socket.simulateConnect();
      });
    },
    /** The server sent a price for `symbol`. Each call is newer than the last. */
    async tick(symbol: string, price: number) {
      clock += 1000;
      await act(() => {
        socket.simulateTicks({ ticks: [{ symbol, price, volume: 1_500_000, timestamp: clock }] });
      });
    },
  };
}
