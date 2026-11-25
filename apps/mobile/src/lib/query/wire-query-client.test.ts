import type { Connectivity } from '@nabd/market-data';
import { focusManager, onlineManager } from '@tanstack/react-query';
import type { AppStateStatus } from 'react-native';

import { type AppStateLike, wireQueryClient } from './wire-query-client';

function createAppState() {
  let listener: ((state: AppStateStatus) => void) | undefined;
  const calls = { removed: 0 };
  const appState: AppStateLike = {
    addEventListener: (_type, next) => {
      listener = next;
      return {
        remove: () => {
          calls.removed += 1;
        },
      };
    },
  };
  return { appState, calls, emit: (state: AppStateStatus) => listener?.(state) };
}

function createConnectivity(online: boolean) {
  let current = online;
  let listener: ((online: boolean) => void) | undefined;
  const connectivity: Connectivity = {
    isOnline: () => current,
    subscribe: (next) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    },
  };
  return {
    connectivity,
    emit(next: boolean) {
      current = next;
      listener?.(next);
    },
  };
}

describe('wireQueryClient', () => {
  it('QRY-01 marks the queries focused while the app is active', () => {
    const app = createAppState();
    wireQueryClient({
      appState: app.appState,
      connectivity: createConnectivity(true).connectivity,
    });
    const stop = focusManager.subscribe(() => undefined);

    app.emit('background');
    expect(focusManager.isFocused()).toBe(false);
    app.emit('active');
    expect(focusManager.isFocused()).toBe(true);

    stop();
    expect(app.calls.removed).toBe(1);
  });

  it('QRY-02 follows the connectivity for the online state, starting from what it is now', () => {
    const network = createConnectivity(false);
    wireQueryClient({ appState: createAppState().appState, connectivity: network.connectivity });
    const stop = onlineManager.subscribe(() => undefined);

    expect(onlineManager.isOnline()).toBe(false);
    network.emit(true);
    expect(onlineManager.isOnline()).toBe(true);
    network.emit(false);
    expect(onlineManager.isOnline()).toBe(false);

    stop();
  });
});
