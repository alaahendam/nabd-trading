import { type PriceTick, SOCKET_EVENTS, socketErrorSchema, symbolRoom } from '@nabd/shared';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RealtimeGateway } from './realtime.gateway.js';

type FakeSocket = Parameters<RealtimeGateway['subscribe']>[1];

const tick = (symbol: string, timestamp: number): PriceTick => ({
  symbol,
  price: 100,
  volume: 10,
  timestamp,
});

const setup = () => {
  const stream = new Subject<PriceTick[]>();
  const known = ['AAPL', 'MSFT'];
  const market = {
    ticks$: stream.asObservable(),
    hasSymbol: (symbol: string) => known.includes(symbol),
    latestTicks: (symbols: string[]) => symbols.map((symbol) => tick(symbol, 100)),
  };

  const flushed: { room: string; event: string; payload: unknown }[] = [];
  const server = {
    to: (room: string) => ({
      emit: (event: string, payload: unknown) => flushed.push({ room, event, payload }),
    }),
  };
  const gateway = new RealtimeGateway(market as never, { flushMs: 250 });
  gateway.server = server as unknown as RealtimeGateway['server'];

  const joined: string[][] = [];
  const left: string[] = [];
  const sent: { event: string; payload: unknown }[] = [];
  const socket = {
    join: (rooms: string[]) => {
      joined.push(rooms);
      return Promise.resolve();
    },
    leave: (room: string) => {
      left.push(room);
      return Promise.resolve();
    },
    emit: (event: string, payload: unknown) => sent.push({ event, payload }),
  } as unknown as FakeSocket;

  gateway.afterInit();
  return { gateway, stream, flushed, socket, joined, left, sent };
};

describe('RealtimeGateway subscriptions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('RTM-13 joins the symbol rooms and sends the current ticks', async () => {
    const { gateway, socket, joined, sent } = setup();
    await gateway.subscribe({ symbols: ['AAPL', 'MSFT'] }, socket);
    expect(joined).toEqual([[symbolRoom('AAPL'), symbolRoom('MSFT')]]);
    expect(sent).toEqual([
      { event: SOCKET_EVENTS.ticks, payload: { ticks: [tick('AAPL', 100), tick('MSFT', 100)] } },
    ]);
  });

  it('RTM-14 leaves symbols with pending ticks to the next flush, so ticks stay in order', async () => {
    const { gateway, stream, socket, sent, flushed } = setup();
    stream.next([tick('AAPL', 50)]);

    await gateway.subscribe({ symbols: ['AAPL', 'MSFT'] }, socket);
    expect(sent).toEqual([{ event: SOCKET_EVENTS.ticks, payload: { ticks: [tick('MSFT', 100)] } }]);

    vi.advanceTimersByTime(250);
    expect(flushed).toEqual([
      {
        room: symbolRoom('AAPL'),
        event: SOCKET_EVENTS.ticks,
        payload: { ticks: [tick('AAPL', 50)] },
      },
    ]);
  });

  it('RTM-15 sends no snapshot when every subscribed symbol has pending ticks', async () => {
    const { gateway, stream, socket, sent } = setup();
    stream.next([tick('AAPL', 50), tick('MSFT', 50)]);
    await gateway.subscribe({ symbols: ['AAPL', 'MSFT'] }, socket);
    expect(sent).toEqual([]);
  });

  it('RTM-16 reports unknown symbols and joins nothing for them', async () => {
    const { gateway, socket, joined, sent } = setup();
    await gateway.subscribe({ symbols: ['NOPE'] }, socket);

    expect(joined).toEqual([]);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.event).toBe(SOCKET_EVENTS.error);
    expect(socketErrorSchema.parse(sent[0]?.payload)).toMatchObject({
      code: 'NOT_FOUND',
      details: { symbols: ['NOPE'] },
    });
  });

  it.each(['subscribe', 'unsubscribe'] as const)(
    'RTM-17 answers an invalid %s payload with VALIDATION_ERROR',
    async (method) => {
      const { gateway, socket, joined, left, sent } = setup();
      await gateway[method]({ symbols: [] }, socket);

      expect(joined).toEqual([]);
      expect(left).toEqual([]);
      expect(sent).toHaveLength(1);
      expect(socketErrorSchema.parse(sent[0]?.payload).code).toBe('VALIDATION_ERROR');
    },
  );

  it('RTM-18 leaves the room of every symbol on unsubscribe', async () => {
    const { gateway, socket, left } = setup();
    await gateway.unsubscribe({ symbols: ['AAPL', 'MSFT'] }, socket);
    expect(left).toEqual([symbolRoom('AAPL'), symbolRoom('MSFT')]);
  });

  it('RTM-19 ignores duplicates in one request', async () => {
    const { gateway, socket, joined } = setup();
    await gateway.subscribe({ symbols: ['AAPL', 'AAPL'] }, socket);
    expect(joined).toEqual([[symbolRoom('AAPL')]]);
  });
});
