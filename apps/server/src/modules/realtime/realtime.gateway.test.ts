import { type PriceTick, SOCKET_EVENTS, symbolRoom } from '@nabd/shared';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MarketService } from '../market/index.js';
import { RealtimeGateway } from './realtime.gateway.js';

const tick = (symbol: string, timestamp: number): PriceTick => ({
  symbol,
  price: 100,
  volume: 10,
  timestamp,
});

interface Emit {
  room: string;
  event: string;
  payload: unknown;
}

const setup = () => {
  const stream = new Subject<PriceTick[]>();
  const market = { ticks$: stream.asObservable() } as unknown as MarketService;
  const emitted: Emit[] = [];
  const server = {
    to: (room: string) => ({
      emit: (event: string, payload: unknown) => emitted.push({ room, event, payload }),
    }),
  } as unknown as RealtimeGateway['server'];
  const gateway = new RealtimeGateway(market, { flushMs: 250 });
  gateway.server = server;
  return { gateway, stream, emitted };
};

describe('RealtimeGateway flushing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('RTM-10 emits one batch per symbol room on each flush', () => {
    const { gateway, stream, emitted } = setup();
    gateway.afterInit();

    stream.next([tick('AAPL', 1), tick('MSFT', 2)]);
    stream.next([tick('AAPL', 3)]);
    vi.advanceTimersByTime(250);

    expect(emitted).toEqual([
      {
        room: symbolRoom('AAPL'),
        event: SOCKET_EVENTS.ticks,
        payload: { ticks: [tick('AAPL', 1), tick('AAPL', 3)] },
      },
      {
        room: symbolRoom('MSFT'),
        event: SOCKET_EVENTS.ticks,
        payload: { ticks: [tick('MSFT', 2)] },
      },
    ]);
  });

  it('RTM-11 emits nothing when nothing is pending', () => {
    const { gateway, stream, emitted } = setup();
    gateway.afterInit();
    vi.advanceTimersByTime(1000);
    expect(emitted).toEqual([]);

    stream.next([tick('AAPL', 1)]);
    vi.advanceTimersByTime(250);
    expect(emitted).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(emitted).toHaveLength(1);
  });

  it('RTM-12 stops flushing and listening when destroyed', () => {
    const { gateway, stream, emitted } = setup();
    gateway.afterInit();
    gateway.onModuleDestroy();

    stream.next([tick('AAPL', 1)]);
    vi.advanceTimersByTime(1000);
    expect(emitted).toEqual([]);
  });

  it('RTM-12 can be destroyed before it was ever started', () => {
    const { gateway } = setup();
    expect(() => {
      gateway.onModuleDestroy();
    }).not.toThrow();
  });
});
