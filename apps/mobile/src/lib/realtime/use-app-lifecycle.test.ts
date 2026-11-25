import { PriceStore, RealtimeClient, type SocketPort } from '@nabd/market-data';
import { FakeSocket } from '@nabd/testing';
import { renderHook } from '@testing-library/react-native';
import type { AppStateStatus } from 'react-native';

import type { AppStateLike } from '../query/wire-query-client';
import { useAppLifecycle } from './use-app-lifecycle';

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

const symbolsAsked = (socket: FakeSocket) => socket.calls.subscribe.flat();

/** A connected client holding a subscription to AAPL, as it is while a screen shows it. */
function createConnectedClient() {
  const socket = new FakeSocket();
  const client = new RealtimeClient(socket satisfies SocketPort, new PriceStore());
  client.connect();
  client.acquire(['AAPL']);
  socket.simulateConnect();
  return { socket, client };
}

describe('useAppLifecycle', () => {
  it('LIF-01 disconnects the client when the app goes to the background', async () => {
    const { socket, client } = createConnectedClient();
    const app = createAppState();
    await renderHook(() => {
      useAppLifecycle(client, app.appState);
    });

    app.emit('background');

    expect(client.getStatus()).toBe('offline');
    expect(socket.calls.disconnect).toBe(1);
  });

  it('LIF-02 connects again on return and asks for the active subscriptions again', async () => {
    const { socket, client } = createConnectedClient();
    const app = createAppState();
    await renderHook(() => {
      useAppLifecycle(client, app.appState);
    });
    await Promise.resolve();
    expect(symbolsAsked(socket)).toEqual(['AAPL']);

    app.emit('background');
    app.emit('active');
    socket.simulateConnect();
    await Promise.resolve();

    expect(socket.calls.connect).toBe(2);
    expect(client.getStatus()).toBe('connected');
    expect(symbolsAsked(socket)).toEqual(['AAPL', 'AAPL']);
  });

  it('LIF-03 shows a held price as stale while the app is in the background', async () => {
    const { socket, client } = createConnectedClient();
    const app = createAppState();
    await renderHook(() => {
      useAppLifecycle(client, app.appState);
    });
    client.store.apply([{ symbol: 'AAPL', price: 190, volume: 10, timestamp: Date.now() }]);

    app.emit('background');

    expect(client.getStatus()).not.toBe('connected');
    expect(socket.connected).toBe(false);
  });

  it('ignores the transitional inactive state', async () => {
    const { socket, client } = createConnectedClient();
    const app = createAppState();
    await renderHook(() => {
      useAppLifecycle(client, app.appState);
    });

    app.emit('inactive');

    expect(socket.calls.disconnect).toBe(0);
    expect(client.getStatus()).toBe('connected');
  });

  it('LIF-04 stops listening when unmounted', async () => {
    const { client } = createConnectedClient();
    const app = createAppState();
    const view = await renderHook(() => {
      useAppLifecycle(client, app.appState);
    });

    await view.unmount();

    expect(app.calls.removed).toBe(1);
  });
});
