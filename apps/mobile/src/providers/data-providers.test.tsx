import { useApi } from '@nabd/data';
import { PriceStore, RealtimeClient, useConnectionStatus } from '@nabd/market-data';
import { createFakeApi, FakeSocket } from '@nabd/testing';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { StartupStorage } from '../lib/storage/startup-storage';
import { DataProviders } from './data-providers';
import { createDataServices, type DataServices } from './services';

function createFakeServices(): DataServices & { socket: FakeSocket } {
  const socket = new FakeSocket();
  return {
    socket,
    api: createFakeApi(),
    queryClient: new QueryClient(),
    realtime: new RealtimeClient(socket, new PriceStore()),
  };
}

describe('DataProviders', () => {
  it('DAT-01 gives the tree the API, the query client and the connection status', async () => {
    const services = createFakeServices();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DataProviders services={services}>{children}</DataProviders>
    );

    const { result } = await renderHook(
      () => ({ api: useApi(), queryClient: useQueryClient(), status: useConnectionStatus() }),
      { wrapper },
    );

    expect(result.current.api).toBe(services.api);
    expect(result.current.queryClient).toBe(services.queryClient);
    expect(result.current.status).toBe('connecting');
  });

  it('DAT-02 connects when mounted and closes when unmounted', async () => {
    const services = createFakeServices();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DataProviders services={services}>{children}</DataProviders>
    );

    const view = await renderHook(() => useConnectionStatus(), { wrapper });
    expect(services.socket.calls.connect).toBe(1);
    await view.unmount();

    expect(services.socket.calls.disconnect).toBe(1);
  });
});

describe('createDataServices', () => {
  it('DAT-03 builds the API, the query client and a realtime client that has not connected', async () => {
    const storage = await StartupStorage.load(
      { multiGet: () => Promise.resolve([]), setItem: () => Promise.resolve() },
      [],
    );

    const services = createDataServices(storage, 'https://api.example.com');

    expect(typeof services.api.listStocks).toBe('function');
    expect(services.queryClient).toBeInstanceOf(QueryClient);
    expect(services.realtime.getStatus()).toBe('connecting');
  });
});

describe('createDataServices requests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('DAT-04 sends a generated client ID with requests and keeps it', async () => {
    const written: [string, string][] = [];
    const storage = await StartupStorage.load(
      {
        multiGet: () => Promise.resolve([]),
        setItem: (key, value) => {
          written.push([key, value]);
          return Promise.resolve();
        },
      },
      [],
    );
    const sent: Record<string, string>[] = [];
    jest.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      sent.push({ ...(init?.headers as Record<string, string>) });
      return Promise.resolve(Response.json({ data: [] }));
    });

    await createDataServices(storage, 'https://api.example.com').api.listWatchlist();

    expect(sent[0]?.['x-client-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(written).toEqual([['nabd.clientId', sent[0]?.['x-client-id']]]);
  });
});
