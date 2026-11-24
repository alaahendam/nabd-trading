import { describe, expect, it } from 'vitest';

import {
  CLIENT_ID_HEADER,
  clientIdSchema,
  watchlistItemResponseSchema,
  watchlistItemSchema,
  watchlistResponseSchema,
} from './watchlist.js';

const item = { symbol: 'AAPL', addedAt: 1_700_000_000_000 };
const uuid = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

describe('clientIdSchema', () => {
  it('API-01 accepts a UUID', () => {
    expect(clientIdSchema.parse(uuid)).toBe(uuid);
  });

  it.each(['', 'abc', `${uuid}x`])('API-02 rejects %j', (value) => {
    expect(clientIdSchema.safeParse(value).success).toBe(false);
  });

  it('API-03 header name is lowercase', () => {
    expect(CLIENT_ID_HEADER).toBe('x-client-id');
  });
});

describe('watchlistItemSchema', () => {
  it('API-04 parses a valid item', () => {
    expect(watchlistItemSchema.parse(item)).toEqual(item);
  });

  it.each([
    ['symbol', { symbol: 'nope' }],
    ['addedAt', { addedAt: -1 }],
    ['addedAt', { addedAt: 1.5 }],
  ])('API-05 rejects a bad %s (%j)', (field, override) => {
    const result = watchlistItemSchema.safeParse({ ...item, ...override });
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([field]);
  });
});

describe('watchlist responses', () => {
  it.each([
    ['list', watchlistResponseSchema, [item]],
    ['item', watchlistItemResponseSchema, item],
  ])('API-06 %s response wraps its payload in { data }', (_name, schema, payload) => {
    expect(schema.parse({ data: payload })).toEqual({ data: payload });
    expect(schema.safeParse(payload).success).toBe(false);
  });
});
