import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const ALLOWED = 'http://localhost:5173';
const OTHER = 'https://evil.example';
const ACAO = 'access-control-allow-origin';

describe('CORS and wiring', () => {
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

  it('WIR-01 allows the configured origin', async () => {
    const response = await request(server).get('/api/stocks').set('Origin', ALLOWED).expect(200);
    expect(response.headers[ACAO]).toBe(ALLOWED);
  });

  it('WIR-02 never echoes another origin', async () => {
    const response = await request(server).get('/api/stocks').set('Origin', OTHER).expect(200);
    // The header always names the configured origin, so a browser on another origin refuses it.
    expect(response.headers[ACAO]).not.toBe(OTHER);
    expect(response.headers[ACAO]).toBe(ALLOWED);
  });

  it('WIR-03 answers a preflight for the watchlist', async () => {
    const response = await request(server)
      .options('/api/watchlist/AAPL')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'PUT')
      .set('Access-Control-Request-Headers', 'x-client-id')
      .expect(204);
    expect(response.headers[ACAO]).toBe(ALLOWED);
    expect(response.headers['access-control-allow-methods']).toMatch(/PUT/);
    expect(response.headers['access-control-allow-methods']).toMatch(/DELETE/);
    expect(response.headers['access-control-allow-headers']).toMatch(/x-client-id/i);
  });

  it('WIR-04 never uses a wildcard origin', async () => {
    for (const origin of [ALLOWED, OTHER]) {
      const response = await request(server).get('/api/health').set('Origin', origin);
      expect(response.headers[ACAO]).not.toBe('*');
    }
  });

  it('WIR-05 and WIR-06 apply the same policy to the Socket.IO handshake without the 404 guard', async () => {
    const allowed = await request(server)
      .get('/socket.io/?EIO=4&transport=polling')
      .set('Origin', ALLOWED)
      .expect(200);
    expect(allowed.headers[ACAO]).toBe(ALLOWED);
    expect(allowed.text).toMatch(/"sid"/);

    const other = await request(server)
      .get('/socket.io/?EIO=4&transport=polling')
      .set('Origin', OTHER)
      .expect(200);
    expect(other.headers[ACAO]).not.toBe(OTHER);
    expect(other.headers[ACAO]).toBe(ALLOWED);
  });
});
