import type { Server } from 'node:http';

import {
  apiErrorSchema,
  historyResponseSchema,
  PERIOD_CONFIG,
  PERIODS,
  stockResponseSchema,
  stocksResponseSchema,
} from '@nabd/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { STOCK_UNIVERSE } from '../src/modules/market/universe.js';

describe('stocks API', () => {
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

  it('STK-01 lists every stock with its quote', async () => {
    const response = await request(server).get('/api/stocks').expect(200);
    const { data } = stocksResponseSchema.parse(response.body);
    expect(data.map((item) => item.symbol)).toEqual(STOCK_UNIVERSE.map((entry) => entry.symbol));
  });

  it('STK-02 returns one stock', async () => {
    const response = await request(server).get('/api/stocks/AAPL').expect(200);
    expect(stockResponseSchema.parse(response.body).data.symbol).toBe('AAPL');
  });

  it('STK-03 handles a dotted symbol', async () => {
    const response = await request(server).get('/api/stocks/BRK.B').expect(200);
    expect(stockResponseSchema.parse(response.body).data.symbol).toBe('BRK.B');
  });

  it('STK-04 answers 404 for an unknown symbol', async () => {
    const response = await request(server).get('/api/stocks/NOPE').expect(404);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('NOT_FOUND');
  });

  it('STK-05 answers 422 for a malformed symbol', async () => {
    const response = await request(server).get('/api/stocks/aapl').expect(422);
    const { error } = apiErrorSchema.parse(response.body);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(error.details)).toBe(true);
  });

  it('STK-06 defaults history to 1D', async () => {
    const response = await request(server).get('/api/stocks/AAPL/history').expect(200);
    const { data } = historyResponseSchema.parse(response.body);
    expect(data.period).toBe('1D');
    expect(data.symbol).toBe('AAPL');
  });

  it.each(PERIODS)('STK-07 serves %s history ending near the current price', async (period) => {
    const history = await request(server)
      .get(`/api/stocks/AAPL/history?period=${period}`)
      .expect(200);
    const { data } = historyResponseSchema.parse(history.body);
    expect(data.points).toHaveLength(
      PERIOD_CONFIG[period].lookbackMs / PERIOD_CONFIG[period].bucketMs,
    );

    const stock = await request(server).get('/api/stocks/AAPL').expect(200);
    const price = stockResponseSchema.parse(stock.body).data.quote.price;
    const lastClose = data.points.at(-1)?.close ?? 0;
    expect(Math.abs(lastClose / price - 1)).toBeLessThan(0.02);
  });

  it('STK-08 rejects a bad period and an unknown symbol on history', async () => {
    const badPeriod = await request(server).get('/api/stocks/AAPL/history?period=2D').expect(422);
    expect(apiErrorSchema.parse(badPeriod.body).error.code).toBe('VALIDATION_ERROR');

    const unknown = await request(server).get('/api/stocks/NOPE/history').expect(404);
    expect(apiErrorSchema.parse(unknown.body).error.code).toBe('NOT_FOUND');
  });
});
