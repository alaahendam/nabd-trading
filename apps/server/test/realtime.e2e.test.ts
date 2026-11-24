import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import {
  MAX_SYMBOLS_PER_REQUEST,
  SOCKET_EVENTS,
  type SocketError,
  socketErrorSchema,
  symbolRoom,
  type TicksPayload,
  ticksPayloadSchema,
} from '@nabd/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { RealtimeGateway } from '../src/modules/realtime/realtime.gateway.js';

type Client = Socket;

const WAIT = { timeout: 8000, interval: 25 };

describe('realtime gateway', () => {
  let app: INestApplication;
  let port: number;
  const clients: Client[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    port = ((app.getHttpServer() as Server).address() as AddressInfo).port;
  });

  afterEach(() => {
    for (const client of clients.splice(0)) {
      client.disconnect();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const connect = (): Promise<Client> =>
    new Promise((resolve, reject) => {
      const client = io(`http://127.0.0.1:${port}`, { transports: ['websocket'], forceNew: true });
      clients.push(client);
      client.once('connect', () => {
        resolve(client);
      });
      client.once('connect_error', reject);
    });

  /** Records every payload of an event so tests can inspect what arrived. */
  const record = <T>(client: Client, event: string): T[] => {
    const received: T[] = [];
    client.on(event, (payload: T) => {
      received.push(payload);
    });
    return received;
  };

  const symbolsOf = (batches: TicksPayload[]) =>
    new Set(batches.flatMap((batch) => batch.ticks.map((tick) => tick.symbol)));

  it('RTM-01 sends the current price of every subscribed symbol right away', async () => {
    const client = await connect();
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);

    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL', 'MSFT'] });

    await vi.waitFor(() => {
      expect(symbolsOf(batches)).toEqual(new Set(['AAPL', 'MSFT']));
    }, WAIT);
    for (const batch of batches) {
      ticksPayloadSchema.parse(batch);
    }
  });

  it('RTM-02 streams live ticks for subscribed symbols only', async () => {
    const client = await connect();
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);

    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL'] });
    await vi.waitFor(() => {
      expect(batches.length).toBeGreaterThanOrEqual(4);
    }, WAIT);

    for (const batch of batches) {
      ticksPayloadSchema.parse(batch);
    }
    expect(symbolsOf(batches)).toEqual(new Set(['AAPL']));
    const timestamps = batches.flatMap((batch) => batch.ticks.map((tick) => tick.timestamp));
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it('RTM-03 stops the flow after unsubscribe', async () => {
    const client = await connect();
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);
    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL'] });
    await vi.waitFor(() => {
      expect(batches.length).toBeGreaterThanOrEqual(2);
    }, WAIT);

    client.emit(SOCKET_EVENTS.unsubscribe, { symbols: ['AAPL'] });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const settled = batches.length;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(batches).toHaveLength(settled);
  });

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['an empty list', { symbols: [] }],
    [
      'too many symbols',
      { symbols: Array.from({ length: MAX_SYMBOLS_PER_REQUEST + 1 }, () => 'AAPL') },
    ],
    ['a malformed symbol', { symbols: ['aapl'] }],
  ])('RTM-04 answers server:error for %s and stays usable', async (_label, payload) => {
    const client = await connect();
    const errors = record<SocketError>(client, SOCKET_EVENTS.error);
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);

    client.emit(SOCKET_EVENTS.subscribe, payload);
    await vi.waitFor(() => {
      expect(errors).toHaveLength(1);
    }, WAIT);
    expect(socketErrorSchema.parse(errors[0]).code).toBe('VALIDATION_ERROR');

    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL'] });
    await vi.waitFor(() => {
      expect(batches.length).toBeGreaterThan(0);
    }, WAIT);
  });

  it('RTM-05 reports unknown symbols and still subscribes to the known ones', async () => {
    const client = await connect();
    const errors = record<SocketError>(client, SOCKET_EVENTS.error);
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);

    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL', 'NOPE'] });
    await vi.waitFor(() => {
      expect(errors).toHaveLength(1);
      expect(batches.length).toBeGreaterThan(0);
    }, WAIT);

    const error = socketErrorSchema.parse(errors[0]);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual({ symbols: ['NOPE'] });
    expect(symbolsOf(batches)).toEqual(new Set(['AAPL']));
  });

  it('RTM-06 gives each client only what it subscribed to', async () => {
    const a = await connect();
    const b = await connect();
    const aBatches = record<TicksPayload>(a, SOCKET_EVENTS.ticks);
    const bBatches = record<TicksPayload>(b, SOCKET_EVENTS.ticks);

    a.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL'] });
    b.emit(SOCKET_EVENTS.subscribe, { symbols: ['MSFT'] });
    await vi.waitFor(() => {
      expect(aBatches.length).toBeGreaterThanOrEqual(3);
      expect(bBatches.length).toBeGreaterThanOrEqual(3);
    }, WAIT);

    expect(symbolsOf(aBatches)).toEqual(new Set(['AAPL']));
    expect(symbolsOf(bBatches)).toEqual(new Set(['MSFT']));
  });

  it('RTM-07 cleans up the room when a client disconnects', async () => {
    const gateway = app.get(RealtimeGateway, { strict: false });
    const client = await connect();
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);
    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL'] });
    await vi.waitFor(() => {
      expect(batches.length).toBeGreaterThan(0);
    }, WAIT);
    expect((await gateway.server.in(symbolRoom('AAPL')).fetchSockets()).length).toBe(1);

    client.disconnect();
    await vi.waitFor(async () => {
      expect((await gateway.server.in(symbolRoom('AAPL')).fetchSockets()).length).toBe(0);
    }, WAIT);
  });

  it('RTM-08 survives garbage', async () => {
    const client = await connect();
    const errors = record<SocketError>(client, SOCKET_EVENTS.error);
    const batches = record<TicksPayload>(client, SOCKET_EVENTS.ticks);

    client.emit('nonsense', 123);
    client.emit(SOCKET_EVENTS.subscribe);
    await vi.waitFor(() => {
      expect(errors).toHaveLength(1);
    }, WAIT);

    client.emit(SOCKET_EVENTS.subscribe, { symbols: ['AAPL'] });
    await vi.waitFor(() => {
      expect(batches.length).toBeGreaterThan(0);
    }, WAIT);
  });
});
