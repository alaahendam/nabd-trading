import { describe, expect, expectTypeOf, it } from 'vitest';

import { apiErrorSchema, createApiError } from './errors.js';
import type { PriceTick } from './market.js';
import {
  type ClientToServerEvents,
  MAX_SYMBOLS_PER_REQUEST,
  type ServerToClientEvents,
  SOCKET_EVENTS,
  socketErrorSchema,
  subscriptionPayloadSchema,
  symbolRoom,
  ticksPayloadSchema,
} from './socket.js';

const tick = (symbol: string, timestamp: number) => ({
  symbol,
  price: 100,
  volume: 10,
  timestamp,
});

describe('SOCKET_EVENTS', () => {
  it('SOC-01 are the agreed set', () => {
    expect(SOCKET_EVENTS).toEqual({
      subscribe: 'subscribe',
      unsubscribe: 'unsubscribe',
      ticks: 'ticks',
      error: 'server:error',
    });
  });
});

describe('subscriptionPayloadSchema', () => {
  it('SOC-04 limits a request to 50 symbols', () => {
    expect(MAX_SYMBOLS_PER_REQUEST).toBe(50);
  });

  it.each([
    ['one symbol', ['AAPL']],
    ['the maximum', Array.from({ length: MAX_SYMBOLS_PER_REQUEST }, () => 'AAPL')],
    ['duplicates', ['AAPL', 'AAPL']],
  ])('SOC-02 accepts %s', (_label, list) => {
    expect(subscriptionPayloadSchema.parse({ symbols: list })).toEqual({ symbols: list });
  });

  it.each([
    ['an empty list', { symbols: [] }],
    [
      'one over the maximum',
      { symbols: Array.from({ length: MAX_SYMBOLS_PER_REQUEST + 1 }, () => 'AAPL') },
    ],
    ['an invalid symbol', { symbols: ['AAPL', 'nope'] }],
    ['a missing key', {}],
    ['a non-array', { symbols: 'AAPL' }],
    ['null', null],
  ])('SOC-03 rejects %s', (_label, payload) => {
    expect(subscriptionPayloadSchema.safeParse(payload).success).toBe(false);
  });
});

describe('ticksPayloadSchema', () => {
  it('SOC-05 accepts a batch across symbols and repeats of one symbol', () => {
    const payload = { ticks: [tick('AAPL', 1), tick('MSFT', 1), tick('AAPL', 2)] };
    expect(ticksPayloadSchema.parse(payload)).toEqual(payload);
  });

  it.each([
    ['an empty batch', { ticks: [] }],
    ['an invalid tick', { ticks: [{ ...tick('AAPL', 1), price: 0 }] }],
    ['a missing key', {}],
  ])('SOC-06 rejects %s', (_label, payload) => {
    expect(ticksPayloadSchema.safeParse(payload).success).toBe(false);
  });
});

describe('socketErrorSchema', () => {
  it('SOC-07 parses the error object of a REST error body, with and without details', () => {
    const plain = createApiError('VALIDATION_ERROR', 'Too many symbols').error;
    const detailed = createApiError('VALIDATION_ERROR', 'Bad symbol', { symbol: 'x' }).error;
    expect(socketErrorSchema.parse(plain)).toEqual(plain);
    expect(socketErrorSchema.parse(detailed)).toEqual(detailed);
    expect(apiErrorSchema.shape.error).toBe(socketErrorSchema);
  });

  it.each([
    ['an unknown code', { code: 'OOPS', message: 'x' }],
    ['an empty message', { code: 'NOT_FOUND', message: '' }],
  ])('SOC-07 rejects %s', (_label, payload) => {
    expect(socketErrorSchema.safeParse(payload).success).toBe(false);
  });
});

describe('symbolRoom', () => {
  it('SOC-08 is one room per symbol', () => {
    expect(symbolRoom('AAPL')).toBe('symbol:AAPL');
    expect(symbolRoom('MSFT')).toBe('symbol:MSFT');
    expect(symbolRoom('AAPL')).not.toBe(symbolRoom('MSFT'));
  });
});

describe('event maps', () => {
  it('SOC-09 are keyed by the event names and carry schema-derived payloads', () => {
    expectTypeOf<keyof ClientToServerEvents>().toEqualTypeOf<'subscribe' | 'unsubscribe'>();
    expectTypeOf<keyof ServerToClientEvents>().toEqualTypeOf<'ticks' | 'server:error'>();
    expectTypeOf<Parameters<ClientToServerEvents['subscribe']>[0]>().toEqualTypeOf<{
      symbols: string[];
    }>();
    expectTypeOf<Parameters<ServerToClientEvents['ticks']>[0]>().toEqualTypeOf<{
      ticks: PriceTick[];
    }>();
    expect(Object.values(SOCKET_EVENTS)).toHaveLength(4);
  });
});
