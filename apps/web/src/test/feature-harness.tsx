import { QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { PriceStore } from '../features/market-data/price-store';
import { RealtimeClient } from '../features/market-data/realtime-client';
import { RealtimeProvider } from '../features/market-data/realtime-hooks';
import { ChartProvider } from '../features/stocks/chart-context';
import { ApiProvider } from '../lib/api';
import { createI18n } from '../lib/i18n/i18n';
import type { Language } from '../lib/i18n/language';
import { createQueryClient } from '../lib/query/query-client';
import { ThemeStore } from '../lib/theme/theme';
import { ThemeProvider } from '../lib/theme/theme-hooks';
import { createFakeApi } from './fake-api';
import { createFakeChart } from './fake-chart';
import { FakeSocket } from './fake-socket';

interface HarnessOptions {
  language?: Language;
  route?: string;
}

interface TickInput {
  symbol: string;
  price: number;
  volume?: number;
  timestamp?: number;
}

/**
 * Everything a feature component needs, with the network and the socket faked: i18n, the API,
 * a fresh query client, the realtime client over a `FakeSocket`, and a memory router.
 */
export function createFeatureHarness({ language = 'en', route = '/' }: HarnessOptions = {}) {
  const api = createFakeApi();
  const socket = new FakeSocket();
  // The store publishes on a frame in the app. Here the test decides when the frame runs.
  let pendingFrame: (() => void) | undefined;
  const store = new PriceStore({
    schedule: (callback) => {
      pendingFrame = callback;
      return () => {
        pendingFrame = undefined;
      };
    },
  });
  const client = new RealtimeClient(socket, store);
  const queryClient = createQueryClient();
  const i18n = createI18n(language);
  const chart = createFakeChart();
  const themeStore = new ThemeStore({
    storage: { getItem: () => null, setItem: () => undefined },
    matchMedia: () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
    root: { dataset: {} },
  });
  let stamp = Date.now();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <ThemeProvider store={themeStore}>
          <ApiProvider api={api}>
            <QueryClientProvider client={queryClient}>
              <RealtimeProvider client={client}>
                <ChartProvider loader={chart.loader}>
                  <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
                </ChartProvider>
              </RealtimeProvider>
            </QueryClientProvider>
          </ApiProvider>
        </ThemeProvider>
      </I18nextProvider>
    );
  }

  return {
    api,
    socket,
    client,
    queryClient,
    chart,
    themeStore,
    Wrapper,
    connect: () => {
      act(() => {
        socket.simulateConnect();
      });
    },
    /** Delivers ticks and runs the frame that publishes them. */
    tick: (ticks: readonly TickInput[]) => {
      act(() => {
        socket.simulateTicks({
          ticks: ticks.map((tick) => {
            stamp += 1;
            return { volume: 1000, timestamp: stamp, ...tick };
          }),
        });
        const frame = pendingFrame;
        pendingFrame = undefined;
        frame?.();
      });
    },
  };
}

export type FeatureHarness = ReturnType<typeof createFeatureHarness>;

export function renderFeature(ui: ReactElement, options?: HarnessOptions) {
  const harness = createFeatureHarness(options);
  return { ...harness, ...render(ui, { wrapper: harness.Wrapper }) };
}
