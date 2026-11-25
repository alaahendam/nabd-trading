import { SOCKET_EVENTS } from '@nabd/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (...args: unknown[]) => void;

/** Stands in for a socket.io-client socket: records listeners and emits, and can fire events. */
class FakeIoSocket {
  connected = false;
  readonly listeners = new Map<string, Handler[]>();
  readonly managerListeners = new Map<string, Handler[]>();
  readonly emitted: { event: string; payload: unknown }[] = [];
  readonly connect = vi.fn();
  readonly disconnect = vi.fn();

  readonly io = {
    on: (event: string, handler: Handler) => {
      this.managerListeners.set(event, [...(this.managerListeners.get(event) ?? []), handler]);
    },
  };

  on(event: string, handler: Handler): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), handler]);
  }

  emit(event: string, payload: unknown): void {
    this.emitted.push({ event, payload });
  }

  fire(event: string, ...args: unknown[]): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(...args);
    }
  }

  fireManager(event: string, ...args: unknown[]): void {
    for (const handler of this.managerListeners.get(event) ?? []) {
      handler(...args);
    }
  }
}

const mocks = vi.hoisted(() => ({ io: vi.fn() }));
vi.mock('socket.io-client', () => ({ io: mocks.io }));

const { createSocketIoAdapter } = await import('./socket-io-adapter.js');

describe('createSocketIoAdapter', () => {
  let fake: FakeIoSocket;

  beforeEach(() => {
    fake = new FakeIoSocket();
    mocks.io.mockReset();
    mocks.io.mockReturnValue(fake);
  });

  it('SOC-01 creates one manual socket for the URL', () => {
    createSocketIoAdapter('http://localhost:3000');
    expect(mocks.io).toHaveBeenCalledTimes(1);
    expect(mocks.io).toHaveBeenCalledWith('http://localhost:3000', { autoConnect: false });
    expect(fake.connect).not.toHaveBeenCalled();
  });

  it('SOC-02 delegates connection control and state', () => {
    const adapter = createSocketIoAdapter('http://localhost:3000');
    adapter.connect();
    adapter.disconnect();
    expect(fake.connect).toHaveBeenCalledTimes(1);
    expect(fake.disconnect).toHaveBeenCalledTimes(1);

    expect(adapter.connected).toBe(false);
    fake.connected = true;
    expect(adapter.connected).toBe(true);
  });

  it('SOC-03 emits subscriptions with the shared event names', () => {
    const adapter = createSocketIoAdapter('http://localhost:3000');
    adapter.subscribe(['AAPL', 'MSFT']);
    adapter.unsubscribe(['AAPL']);
    expect(fake.emitted).toEqual([
      { event: SOCKET_EVENTS.subscribe, payload: { symbols: ['AAPL', 'MSFT'] } },
      { event: SOCKET_EVENTS.unsubscribe, payload: { symbols: ['AAPL'] } },
    ]);
  });

  it('SOC-04 maps handlers to Socket.IO events', () => {
    const adapter = createSocketIoAdapter('http://localhost:3000');
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();
    const onTicks = vi.fn();
    const onServerError = vi.fn();
    const onReconnectAttempt = vi.fn();
    const onReconnectFailed = vi.fn();

    adapter.onConnect(onConnect);
    adapter.onDisconnect(onDisconnect);
    adapter.onTicks(onTicks);
    adapter.onServerError(onServerError);
    adapter.onReconnectAttempt(onReconnectAttempt);
    adapter.onReconnectFailed(onReconnectFailed);

    fake.fire('connect');
    fake.fire('disconnect', 'transport close', { description: 'ignored' });
    fake.fire(SOCKET_EVENTS.ticks, { ticks: [] });
    fake.fire(SOCKET_EVENTS.error, { code: 'X', message: 'y' });
    fake.fireManager('reconnect_attempt', 3);
    fake.fireManager('reconnect_failed');

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onDisconnect).toHaveBeenCalledWith('transport close');
    expect(onTicks).toHaveBeenCalledWith({ ticks: [] });
    expect(onServerError).toHaveBeenCalledWith({ code: 'X', message: 'y' });
    expect(onReconnectAttempt).toHaveBeenCalledTimes(1);
    expect(onReconnectAttempt).toHaveBeenCalledWith();
    expect(onReconnectFailed).toHaveBeenCalledTimes(1);
  });
});
