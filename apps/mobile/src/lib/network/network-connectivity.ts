import type { Connectivity } from '@nabd/market-data';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';

/** The two things the app reads from the device's network state. */
export interface NetworkStateLike {
  isConnected?: boolean | undefined;
  isInternetReachable?: boolean | undefined;
}

/** Where the network state comes from. The app passes `expo-network`; tests pass a fake. */
export interface NetworkSource {
  getState(): Promise<NetworkStateLike>;
  addListener(listener: (state: NetworkStateLike) => void): { remove(): void };
}

/** Only an explicit "no" counts as offline: an unknown state is not a lost connection. */
const isOnline = (state: NetworkStateLike): boolean =>
  state.isConnected !== false && state.isInternetReachable !== false;

/**
 * The shared `Connectivity` port, on a phone's network state. It assumes online until the device
 * says otherwise, asks for the current state when the first listener arrives, and listens only
 * while someone is subscribed.
 */
export function createNetworkConnectivity(source: NetworkSource): Connectivity {
  let online = true;
  const listeners = new Set<(online: boolean) => void>();
  let subscription: { remove(): void } | undefined;

  const handle = (state: NetworkStateLike) => {
    const next = isOnline(state);
    if (next === online) {
      return;
    }
    online = next;
    for (const listener of [...listeners]) {
      listener(online);
    }
  };

  return {
    isOnline: () => online,
    subscribe: (listener) => {
      listeners.add(listener);
      if (subscription === undefined) {
        subscription = source.addListener(handle);
        source.getState().then(handle, () => undefined);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          subscription?.remove();
          subscription = undefined;
        }
      };
    },
  };
}

/** The app's connectivity, from `expo-network`. */
export const networkConnectivity = createNetworkConnectivity({
  getState: () => getNetworkStateAsync(),
  addListener: (listener) => addNetworkStateListener(listener),
});
