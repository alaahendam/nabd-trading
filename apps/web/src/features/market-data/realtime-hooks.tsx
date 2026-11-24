import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

import { subscribeTick } from './clock-ticker';
import type { ConnectionStatus } from './connection-status';
import type { LivePrice } from './price-store';
import type { RealtimeClient } from './realtime-client';
import { type Freshness, freshness } from './staleness';

const RealtimeContext = createContext<RealtimeClient | undefined>(undefined);

function useRealtimeClient(): RealtimeClient {
  const client = useContext(RealtimeContext);
  if (!client) {
    throw new Error('Realtime hooks must be used inside <RealtimeProvider>.');
  }
  return client;
}

/** Runs the connection for the app: connects on mount, closes on unmount, follows the browser. */
export function RealtimeProvider({
  client,
  children,
}: {
  client: RealtimeClient;
  children: ReactNode;
}) {
  useEffect(() => {
    const goOnline = () => {
      client.setBrowserOnline(true);
    };
    const goOffline = () => {
      client.setBrowserOnline(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (!navigator.onLine) {
      client.setBrowserOnline(false);
    }
    client.connect();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      client.disconnect();
    };
  }, [client]);

  return <RealtimeContext value={client}>{children}</RealtimeContext>;
}

/** The live price of one symbol. Re-renders only when that symbol changes. */
export function useLivePrice(symbol: string): LivePrice | undefined {
  const { store } = useRealtimeClient();
  const subscribe = useCallback(
    (notify: () => void) => store.subscribe(symbol, notify),
    [store, symbol],
  );
  return useSyncExternalStore(subscribe, () => store.get(symbol));
}

/** Keeps these symbols subscribed while the calling component is mounted. */
export function useSubscription(symbols: readonly string[]): void {
  const client = useRealtimeClient();
  // A stable key, so a new array with the same symbols in any order does not resubscribe.
  const key = [...new Set(symbols)].sort().join(',');
  useEffect(() => client.acquire(key === '' ? [] : key.split(',')), [client, key]);
}

export function useConnectionStatus(): ConnectionStatus {
  const client = useRealtimeClient();
  const subscribe = useCallback((notify: () => void) => client.subscribeStatus(notify), [client]);
  return useSyncExternalStore(subscribe, () => client.getStatus());
}

/**
 * Whether the price of a symbol is `none` (not here yet), `fresh` or `stale`. Re-renders only
 * when that answer changes: the shared clock tick only makes React look again.
 */
export function useFreshness(symbol: string, thresholdMs?: number): Freshness {
  const client = useRealtimeClient();
  const subscribe = useCallback(
    (notify: () => void) => {
      const stops = [
        client.store.subscribe(symbol, notify),
        client.subscribeStatus(notify),
        subscribeTick(notify),
      ];
      return () => {
        for (const stop of stops) {
          stop();
        }
      };
    },
    [client, symbol],
  );
  return useSyncExternalStore(subscribe, () =>
    freshness(client.store.get(symbol), {
      now: Date.now(),
      status: client.getStatus(),
      ...(thresholdMs === undefined ? {} : { thresholdMs }),
    }),
  );
}
