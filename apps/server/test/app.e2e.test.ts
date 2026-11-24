import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { configModuleOptions } from '../src/config/env.js';

describe('AppModule', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    vi.unstubAllEnvs();
    await app?.close();
    app = undefined;
  });

  it('ENV-13 config wiring rejects an invalid env', async () => {
    vi.stubEnv('PORT', 'abc');
    await expect(ConfigModule.forRoot(configModuleOptions)).rejects.toThrow(
      /Invalid environment.*PORT/s,
    );
  });

  it('ENV-11 resolves ConfigService through dependency injection', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef.get(ConfigService).get('PORT')).toBe(3000);
  });

  it('ENV-12 boots and listens (no routes yet, so 404)', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer() as Server;
    await request(server).get('/').expect(404);
  });
});
