import { useEffect } from 'react';

import type { AppStateLike } from '../query/wire-query-client';

/** What the lifecycle needs from the realtime client. */
export interface Connection {
  connect(): void;
  disconnect(): void;
}

/**
 * Closes the socket while the app is in the background and opens it again on return. A phone
 * suspends a backgrounded app anyway, and a socket the OS killed is worse than one closed on
 * purpose. Closing sets the connection `offline`, so every price already held is stale (see
 * `freshness`) until a fresh tick arrives, and opening again asks for the active subscriptions
 * again (the client does that on every connect).
 */
export function useAppLifecycle(connection: Connection, appState: AppStateLike): void {
  useEffect(() => {
    const subscription = appState.addEventListener('change', (state) => {
      if (state === 'background') {
        connection.disconnect();
      } else if (state === 'active') {
        connection.connect();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [connection, appState]);
}
