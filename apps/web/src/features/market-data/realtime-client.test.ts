import { MAX_SYMBOLS_PER_REQUEST, type PriceTick } from '@nabd/shared';
import { describe, expect, it, vi } from 'vitest';

import { FakeSocket } from '../../test/fake-socket';
import type { PriceStore } from './price-store';
import { RealtimeClient, type RealtimeIssue } from './realtime-client';

const tick = (symbol: string, timestamp = 1): PriceTick => ({
  symbol,
  price: 100,
  volume: 1,
  timestamp,
});

const setup = () => {
  const socket = new FakeSocket();
  const apply = vi.fn();
  const store = { apply } as unknown as PriceStore;
  const issues: RealtimeIssue[] = [];
  const client = new RealtimeClient(socket, store, {
    onIssue: (issue) => issues.push(issue),
  });
  return { socket, client, apply, issues };
};

const connected = () => {
  const context = setup();
  context.client.connect();
  context.socket.simulateConnect();
  return context;
};

describe('RealtimeClient connection', () => {
  it('RTC-01 starts connecting', () => {
    expect(setup().client.getStatus()).toBe('connecting');
  });

  it('RTC-02 connects once however often connect is called', () => {
    const { client, socket } = setup();
    client.connect();
    client.connect();
    expect(socket.calls.connect).toBe(1);
  });

  it('RTC-03 follows connection events', () => {
    const { client, socket } = setup();
    client.connect();
    socket.simulateConnect();
    expect(client.getStatus()).toBe('connected');

    socket.simulateDisconnect('transport close');
    expect(client.getStatus()).toBe('reconnecting');

    socket.simulateConnect();
    socket.simulateDisconnect('ping timeout');
    expect(client.getStatus()).toBe('reconnecting');
  });

  it('RTC-04 reconnects itself after a server-initiated disconnect', () => {
    const { client, socket } = connected();
    socket.simulateDisconnect('io server disconnect');
    expect(client.getStatus()).toBe('reconnecting');
    expect(socket.calls.connect).toBe(2);
  });

  it('RTC-05 reports offline after a client disconnect', () => {
    const { client, socket } = connected();
    client.disconnect();
    expect(socket.calls.disconnect).toBe(1);
    expect(client.getStatus()).toBe('offline');

    socket.simulateDisconnect('io client disconnect');
    expect(client.getStatus()).toBe('offline');
  });

  it('RTC-06 follows reconnect attempts and giving up', () => {
    const { client, socket } = connected();
    socket.simulateReconnectAttempt();
    expect(client.getStatus()).toBe('reconnecting');
    socket.simulateReconnectFailed();
    expect(client.getStatus()).toBe('offline');
  });

  it('RTC-07 reacts to the browser going offline and online', () => {
    const { client, socket } = connected();
    client.setBrowserOnline(false);
    expect(client.getStatus()).toBe('offline');

    socket.simulateDisconnect('transport close');
    expect(client.getStatus()).toBe('offline');

    client.setBrowserOnline(true);
    expect(client.getStatus()).toBe('reconnecting');
    expect(socket.calls.connect).toBe(2);
  });

  it('RTC-07 does nothing about the browser coming online when never started', () => {
    const { client, socket } = setup();
    client.setBrowserOnline(false);
    client.setBrowserOnline(true);
    expect(socket.calls.connect).toBe(0);
  });

  it('RTC-07 does not reconnect on online when the socket is already connected', () => {
    const { client, socket } = connected();
    client.setBrowserOnline(true);
    expect(client.getStatus()).toBe('connected');
    expect(socket.calls.connect).toBe(1);
  });

  it('RTC-24 returns to connected when the browser blips offline and online with the socket intact', () => {
    const { client, socket } = connected();
    client.setBrowserOnline(false);
    expect(client.getStatus()).toBe('offline');

    client.setBrowserOnline(true);
    expect(client.getStatus()).toBe('connected');
    expect(socket.calls.connect).toBe(1);
  });

  it('RTC-19 notifies status subscribers about real changes only', () => {
    const { client, socket } = setup();
    const listener = vi.fn();
    const stop = client.subscribeStatus(listener);

    client.connect();
    socket.simulateConnect();
    socket.simulateConnect();
    expect(listener).toHaveBeenCalledTimes(1);

    socket.simulateDisconnect('transport close');
    expect(listener).toHaveBeenCalledTimes(2);

    stop();
    socket.simulateConnect();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('RTC-20 does not duplicate handlers across a connect, disconnect, connect cycle', () => {
    const { client, socket, apply } = setup();
    client.connect();
    socket.simulateConnect();
    client.disconnect();
    client.connect();
    socket.simulateConnect();

    socket.simulateTicks({ ticks: [tick('AAPL')] });
    expect(apply).toHaveBeenCalledTimes(1);
  });
});

/** Lets the client's once-per-tick reconcile run. */
const settle = () => Promise.resolve();

describe('RealtimeClient subscriptions', () => {
  it('RTC-08 waits for the connection before subscribing', async () => {
    const { client, socket } = setup();
    client.connect();
    client.acquire(['AAPL']);
    await settle();
    expect(socket.calls.subscribe).toEqual([]);

    socket.simulateConnect();
    expect(socket.calls.subscribe).toEqual([['AAPL']]);
  });

  it('RTC-09 subscribes when connected, only for symbols the server does not have yet', async () => {
    const { client, socket } = connected();
    client.acquire(['AAPL', 'MSFT']);
    await settle();
    client.acquire(['MSFT', 'NVDA']);
    await settle();
    expect(socket.calls.subscribe).toEqual([['AAPL', 'MSFT'], ['NVDA']]);
  });

  it('RTC-10 reference-counts symbols', async () => {
    const { client, socket } = connected();
    const releaseFirst = client.acquire(['AAPL']);
    const releaseSecond = client.acquire(['AAPL']);
    await settle();
    expect(socket.calls.subscribe).toEqual([['AAPL']]);

    releaseFirst();
    await settle();
    expect(socket.calls.unsubscribe).toEqual([]);
    releaseSecond();
    await settle();
    expect(socket.calls.unsubscribe).toEqual([['AAPL']]);
  });

  it('RTC-11 ignores a second release of the same handle', async () => {
    const { client, socket } = connected();
    const release = client.acquire(['AAPL']);
    const other = client.acquire(['AAPL']);
    await settle();

    release();
    release();
    await settle();
    expect(socket.calls.unsubscribe).toEqual([]);

    other();
    await settle();
    expect(socket.calls.unsubscribe).toEqual([['AAPL']]);
  });

  it('RTC-12 does not unsubscribe while disconnected, and subscribes nothing afterwards', async () => {
    const { client, socket } = connected();
    const release = client.acquire(['AAPL']);
    await settle();
    socket.simulateDisconnect('transport close');

    release();
    await settle();
    expect(socket.calls.unsubscribe).toEqual([]);

    socket.simulateConnect();
    expect(socket.calls.subscribe).toEqual([['AAPL']]);
  });

  it('RTC-13 subscribes the wanted symbols again on every connect', async () => {
    const { client, socket } = connected();
    const releaseMsft = client.acquire(['MSFT']);
    client.acquire(['AAPL']);
    await settle();
    socket.calls.subscribe.length = 0;

    socket.simulateDisconnect('transport close');
    socket.simulateConnect();
    expect(socket.calls.subscribe).toEqual([['MSFT', 'AAPL']]);

    releaseMsft();
    await settle();
    socket.calls.subscribe.length = 0;
    socket.simulateDisconnect('transport close');
    socket.simulateConnect();
    expect(socket.calls.subscribe).toEqual([['AAPL']]);
  });

  it('RTC-14 splits large requests', async () => {
    const { client, socket } = connected();
    const symbols = Array.from(
      { length: 120 },
      (_, index) =>
        `${String.fromCharCode(65 + (index % 26))}${String.fromCharCode(65 + Math.floor(index / 26))}`,
    );
    client.acquire(symbols);
    await settle();
    expect(socket.calls.subscribe.map((chunk) => chunk.length)).toEqual([
      MAX_SYMBOLS_PER_REQUEST,
      MAX_SYMBOLS_PER_REQUEST,
      20,
    ]);
    expect(socket.calls.subscribe.flat()).toEqual(symbols);
  });

  it('RTC-15 cleans up the symbols it is given', async () => {
    const { client, socket, issues } = connected();
    client.acquire(['AAPL', 'AAPL']);
    await settle();
    expect(socket.calls.subscribe).toEqual([['AAPL']]);

    client.acquire(['aapl']);
    await settle();
    expect(issues).toEqual([{ kind: 'invalid-symbol', symbol: 'aapl' }]);
    expect(socket.calls.subscribe).toHaveLength(1);

    const release = client.acquire([]);
    release();
    await settle();
    expect(socket.calls.subscribe).toHaveLength(1);
    expect(socket.calls.unsubscribe).toEqual([]);
  });

  it('RTC-21 sends nothing for a symbol released and acquired again in the same tick', async () => {
    const { client, socket } = connected();
    const release = client.acquire(['AAPL']);
    await settle();
    socket.calls.subscribe.length = 0;

    release();
    client.acquire(['AAPL']);
    await settle();

    expect(socket.calls.subscribe).toEqual([]);
    expect(socket.calls.unsubscribe).toEqual([]);
  });

  it('RTC-22 batches acquisitions and releases of one tick into single messages', async () => {
    const { client, socket } = connected();
    const releases = ['AAPL', 'MSFT', 'NVDA'].map((symbol) => client.acquire([symbol]));
    await settle();
    expect(socket.calls.subscribe).toEqual([['AAPL', 'MSFT', 'NVDA']]);

    for (const release of releases) {
      release();
    }
    await settle();
    expect(socket.calls.unsubscribe).toEqual([['AAPL', 'MSFT', 'NVDA']]);
  });

  it('RTC-23 does not remember the server across a disconnect', async () => {
    const { client, socket } = connected();
    client.acquire(['AAPL']);
    await settle();

    client.disconnect();
    client.connect();
    socket.simulateConnect();
    expect(socket.calls.subscribe).toEqual([['AAPL'], ['AAPL']]);
  });
});

describe('RealtimeClient incoming data', () => {
  it('RTC-16 passes valid ticks to the store', () => {
    const { socket, apply } = connected();
    socket.simulateTicks({ ticks: [tick('AAPL'), tick('MSFT')] });
    expect(apply).toHaveBeenCalledWith([tick('AAPL'), tick('MSFT')]);
  });

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['an empty batch', { ticks: [] }],
    ['a bad tick', { ticks: [{ ...tick('AAPL'), price: 0 }] }],
  ])('RTC-17 drops %s and reports it', (_label, payload) => {
    const { socket, apply, issues } = connected();
    socket.simulateTicks(payload);
    expect(apply).not.toHaveBeenCalled();
    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe('invalid-ticks');
  });

  it('RTC-17 drops invalid ticks quietly when no issue handler was given', () => {
    const socket = new FakeSocket();
    const apply = vi.fn();
    const client = new RealtimeClient(socket, { apply } as unknown as PriceStore);
    client.connect();
    socket.simulateConnect();

    expect(() => {
      socket.simulateTicks(null);
    }).not.toThrow();
    expect(apply).not.toHaveBeenCalled();
  });

  it('RTC-18 surfaces server errors and reports garbage', () => {
    const { client, socket, issues } = connected();
    const listener = vi.fn();
    client.onServerError(listener);

    const error = { code: 'NOT_FOUND', message: 'Unknown symbols', details: { symbols: ['X'] } };
    socket.simulateServerError(error);
    expect(listener).toHaveBeenCalledWith(error);

    socket.simulateServerError({ code: 'NOPE' });
    expect(issues).toEqual([{ kind: 'invalid-server-error' }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('RTC-18 stops notifying a server error listener after it unsubscribes', () => {
    const { client, socket } = setup();
    const listener = vi.fn();
    const stop = client.onServerError(listener);
    stop();
    socket.simulateServerError({ code: 'NOT_FOUND', message: 'x' });
    expect(listener).not.toHaveBeenCalled();
  });
});
