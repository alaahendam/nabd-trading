import { FakeSocket } from '@nabd/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createSocketIoAdapter: vi.fn() }));
vi.mock('./socket-io-adapter', () => ({ createSocketIoAdapter: mocks.createSocketIoAdapter }));

const { createRealtimeClient } = await import('./create-realtime-client');
const { PriceStore } = await import('./price-store');
const { RealtimeClient } = await import('./realtime-client');

describe('createRealtimeClient', () => {
  beforeEach(() => {
    mocks.createSocketIoAdapter.mockReset();
  });

  it('HK-10 builds a client over a Socket.IO adapter for the URL with its own price store', () => {
    const socket = new FakeSocket();
    mocks.createSocketIoAdapter.mockReturnValue(socket);

    const client = createRealtimeClient('http://localhost:3000');

    expect(mocks.createSocketIoAdapter).toHaveBeenCalledWith('http://localhost:3000');
    expect(client).toBeInstanceOf(RealtimeClient);
    expect(client.store).toBeInstanceOf(PriceStore);
    expect(client.getStatus()).toBe('connecting');
  });
});
