import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

import {
  apiErrorSchema,
  CLIENT_ID_HEADER,
  ROUTES,
  watchlistItemResponseSchema,
  watchlistResponseSchema,
} from '@nabd/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const path = (suffix = '') => `/api${ROUTES.watchlist}${suffix}`;

describe('watchlist API', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (clientId: string) => ({ [CLIENT_ID_HEADER]: clientId });

  it('WLH-01 protects every route with the guard', async () => {
    for (const response of [
      await request(server).get(path()),
      await request(server).put(path('/AAPL')),
      await request(server).delete(path('/AAPL')),
    ]) {
      expect(response.status).toBe(401);
      expect(apiErrorSchema.parse(response.body).error.code).toBe('CLIENT_ID_REQUIRED');
    }
  });

  it('WLH-02 rejects a malformed client ID', async () => {
    const response = await request(server).get(path()).set(as('abc')).expect(401);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('CLIENT_ID_REQUIRED');
  });

  it('WLH-03 adds with PUT', async () => {
    const response = await request(server).put(path('/AAPL')).set(as(randomUUID())).expect(200);
    expect(watchlistItemResponseSchema.parse(response.body).data.symbol).toBe('AAPL');
  });

  it('WLH-04 makes PUT idempotent', async () => {
    const client = randomUUID();
    const first = await request(server).put(path('/AAPL')).set(as(client)).expect(200);
    const second = await request(server).put(path('/AAPL')).set(as(client)).expect(200);
    expect(watchlistItemResponseSchema.parse(second.body)).toEqual(
      watchlistItemResponseSchema.parse(first.body),
    );
  });

  it('WLH-05 lists in the order items were added', async () => {
    const client = randomUUID();
    await request(server).put(path('/MSFT')).set(as(client)).expect(200);
    await request(server).put(path('/AAPL')).set(as(client)).expect(200);
    const response = await request(server).get(path()).set(as(client)).expect(200);
    expect(watchlistResponseSchema.parse(response.body).data.map((item) => item.symbol)).toEqual([
      'MSFT',
      'AAPL',
    ]);
  });

  it('WLH-06 removes with DELETE, and again without error', async () => {
    const client = randomUUID();
    await request(server).put(path('/AAPL')).set(as(client)).expect(200);
    const first = await request(server).delete(path('/AAPL')).set(as(client)).expect(204);
    const second = await request(server).delete(path('/AAPL')).set(as(client)).expect(204);
    expect(first.text).toBe('');
    expect(second.text).toBe('');
    const list = await request(server).get(path()).set(as(client)).expect(200);
    expect(watchlistResponseSchema.parse(list.body).data).toEqual([]);
  });

  it('WLH-07 rejects unknown and malformed symbols', async () => {
    const client = randomUUID();
    const unknown = await request(server).put(path('/NOPE')).set(as(client)).expect(404);
    expect(apiErrorSchema.parse(unknown.body).error.code).toBe('NOT_FOUND');
    const malformed = await request(server).put(path('/aapl')).set(as(client)).expect(422);
    expect(apiErrorSchema.parse(malformed.body).error.code).toBe('VALIDATION_ERROR');
  });

  it('WLH-08 keeps clients apart', async () => {
    const a = randomUUID();
    const b = randomUUID();
    await request(server).put(path('/AAPL')).set(as(a)).expect(200);
    const response = await request(server).get(path()).set(as(b)).expect(200);
    expect(watchlistResponseSchema.parse(response.body).data).toEqual([]);
  });
});
