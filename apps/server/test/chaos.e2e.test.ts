import type { Server } from 'node:http';

import { apiErrorSchema, healthResponseSchema } from '@nabd/shared';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { CHAOS_OPTIONS } from '../src/modules/chaos/chaos.options.js';

describe('chaos mode', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CHAOS_OPTIONS)
      .useValue({ latencyMs: 0, errorRate: 1 })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('CHS-08 fails requests with the shared 503 error and keeps health truthful', async () => {
    const failed = await request(server).get('/api/stocks').expect(503);
    expect(apiErrorSchema.parse(failed.body).error.code).toBe('SERVICE_UNAVAILABLE');

    const health = await request(server).get('/api/health').expect(200);
    expect(healthResponseSchema.parse(health.body).data.status).toBe('ok');
  });
});
