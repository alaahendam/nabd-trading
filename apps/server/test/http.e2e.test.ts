import type { Server } from 'node:http';

import { apiErrorSchema, healthResponseSchema } from '@nabd/shared';
import type { INestApplication } from '@nestjs/common';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { ApiException } from '../src/common/api-exception.js';
import { ZodValidationPipe } from '../src/common/zod-validation.pipe.js';

const querySchema = z.object({ n: z.coerce.number().int() });

@Controller('probe')
class ProbeController {
  @Get('throw')
  boom(): never {
    throw new Error('secret connection string');
  }

  @Get('conflict')
  conflict(): never {
    throw new ApiException('CONFLICT', 'Already exists');
  }

  @Get('query')
  query(@Query(new ZodValidationPipe(querySchema)) query: z.infer<typeof querySchema>) {
    return { data: query };
  }
}

describe('HTTP foundation', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
    vi.restoreAllMocks();
  });

  it('COM-09 health returns ok', async () => {
    const response = await request(server).get('/api/health').expect(200);
    const parsed = healthResponseSchema.parse(response.body);
    expect(parsed.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('COM-10 an unknown route uses the shared error shape', async () => {
    const response = await request(server).get('/api/nope').expect(404);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('NOT_FOUND');
  });

  it('COM-11 routes live under /api only', async () => {
    const response = await request(server).get('/health').expect(404);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('NOT_FOUND');
  });

  it('COM-12 sets security headers and hides the framework', async () => {
    const response = await request(server).get('/api/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('COM-13 never leaks an unexpected error', async () => {
    const response = await request(server).get('/api/probe/throw').expect(500);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('INTERNAL_ERROR');
    expect(response.text).not.toContain('secret');
    expect(response.text).not.toContain('at ');
  });

  it('COM-14 answers a thrown ApiException as is', async () => {
    const response = await request(server).get('/api/probe/conflict').expect(409);
    expect(response.body).toEqual({ error: { code: 'CONFLICT', message: 'Already exists' } });
  });

  it('COM-15 validates a real request with the pipe', async () => {
    const ok = await request(server).get('/api/probe/query?n=3').expect(200);
    expect(ok.body).toEqual({ data: { n: 3 } });

    const bad = await request(server).get('/api/probe/query?n=abc').expect(422);
    const parsed = apiErrorSchema.parse(bad.body);
    expect(parsed.error.code).toBe('VALIDATION_ERROR');
    expect(parsed.error.details).toEqual([{ path: 'n', message: expect.any(String) as string }]);
  });
});
