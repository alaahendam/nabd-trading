import { CLIENT_ID_HEADER } from '@nabd/shared';
import { API_URL, server } from '@nabd/testing/msw';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiClientError } from './api-error';
import { createHttpClient } from './http-client';

const CLIENT_ID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';
const itemSchema = z.object({ data: z.object({ name: z.string(), count: z.number().default(1) }) });

const client = (baseUrl = API_URL) => createHttpClient({ baseUrl, getClientId: () => CLIENT_ID });

const caught = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('createHttpClient', () => {
  it('HTTP-01 builds the request from the base URL, the API prefix and the path', async () => {
    let seen: Request | undefined;
    server.use(
      http.get(`${API_URL}/api/stocks`, ({ request }) => {
        seen = request;
        return HttpResponse.json({ data: { name: 'ok' } });
      }),
    );

    await client().request(itemSchema, { method: 'GET', path: '/stocks' });

    expect(seen?.url).toBe(`${API_URL}/api/stocks`);
    expect(seen?.headers.get(CLIENT_ID_HEADER)).toBe(CLIENT_ID);
    expect(seen?.headers.get('accept')).toBe('application/json');
  });

  it('HTTP-02 encodes query parameters', async () => {
    let url = '';
    server.use(
      http.get(`${API_URL}/api/stocks`, ({ request }) => {
        url = request.url;
        return HttpResponse.json({ data: { name: 'ok' } });
      }),
    );

    await client().request(itemSchema, {
      method: 'GET',
      path: '/stocks',
      query: { period: '1W', q: 'a b&c' },
    });

    const params = new URL(url).searchParams;
    expect(params.get('period')).toBe('1W');
    expect(params.get('q')).toBe('a b&c');
    expect(url).toContain('q=a+b%26c');
  });

  it('HTTP-03 returns the parsed response, with defaults applied and unknown keys stripped', async () => {
    server.use(
      http.get(`${API_URL}/api/x`, () => HttpResponse.json({ data: { name: 'n', extra: true } })),
    );
    const result = await client().request(itemSchema, { method: 'GET', path: '/x' });
    expect(result).toEqual({ data: { name: 'n', count: 1 } });
  });

  it('HTTP-04 reports a response that breaks the schema', async () => {
    server.use(http.get(`${API_URL}/api/x`, () => HttpResponse.json({ data: { name: 5 } })));
    const error = await caught(client().request(itemSchema, { method: 'GET', path: '/x' }));
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ kind: 'parse', retryable: false });
    expect((error as ApiClientError).message).toContain('name');
  });

  it('HTTP-05 reports a body that is not JSON', async () => {
    server.use(http.get(`${API_URL}/api/x`, () => HttpResponse.text('plain text')));
    const error = await caught(client().request(itemSchema, { method: 'GET', path: '/x' }));
    expect(error).toMatchObject({ kind: 'parse', retryable: false });
  });

  it('HTTP-06 reads the server error shape', async () => {
    server.use(
      http.get(`${API_URL}/api/x`, () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'No stock with symbol NOPE', details: { s: 1 } } },
          { status: 404 },
        ),
      ),
    );
    const error = await caught(client().request(itemSchema, { method: 'GET', path: '/x' }));
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 404,
      code: 'NOT_FOUND',
      message: 'No stock with symbol NOPE',
      details: { s: 1 },
      retryable: false,
    });
  });

  it('HTTP-07 handles an error without the shared body', async () => {
    server.use(
      http.get(`${API_URL}/api/bad-gateway`, () =>
        HttpResponse.html('<h1>502</h1>', { status: 502 }),
      ),
      http.get(`${API_URL}/api/empty`, () => new HttpResponse(null, { status: 404 })),
    );
    const gateway = await caught(
      client().request(itemSchema, { method: 'GET', path: '/bad-gateway' }),
    );
    expect(gateway).toMatchObject({ kind: 'http', status: 502, retryable: true });
    expect((gateway as ApiClientError).code).toBeUndefined();
    expect((gateway as ApiClientError).message).toContain('502');

    const empty = await caught(client().request(itemSchema, { method: 'GET', path: '/empty' }));
    expect(empty).toMatchObject({ kind: 'http', status: 404, retryable: false });
  });

  it('HTTP-08 reports the network being down', async () => {
    server.use(http.get(`${API_URL}/api/x`, () => HttpResponse.error()));
    const error = await caught(client().request(itemSchema, { method: 'GET', path: '/x' }));
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ kind: 'network', retryable: true });
    expect((error as ApiClientError).cause).toBeInstanceOf(Error);
  });

  it('HTTP-09 lets an abort through unchanged', async () => {
    server.use(
      http.get(`${API_URL}/api/slow`, async () => {
        await delay('infinite');
        return HttpResponse.json({ data: { name: 'late' } });
      }),
    );
    const controller = new AbortController();
    const pending = caught(
      client().request(itemSchema, { method: 'GET', path: '/slow', signal: controller.signal }),
    );
    controller.abort();
    const error = await pending;
    expect(error).not.toBeInstanceOf(ApiClientError);
    expect((error as Error).name).toBe('AbortError');
  });

  it('HTTP-10 sends a request without a body for 204 and for 200', async () => {
    server.use(
      http.delete(`${API_URL}/api/gone`, () => new HttpResponse(null, { status: 204 })),
      http.delete(`${API_URL}/api/ok`, () => HttpResponse.json({ ignored: true })),
    );
    await expect(client().send({ method: 'DELETE', path: '/gone' })).resolves.toBeUndefined();
    await expect(client().send({ method: 'DELETE', path: '/ok' })).resolves.toBeUndefined();
  });

  it('HTTP-11 raises the same errors from send', async () => {
    server.use(
      http.delete(`${API_URL}/api/missing`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'nope' } }, { status: 404 }),
      ),
      http.delete(`${API_URL}/api/down`, () => HttpResponse.error()),
    );
    expect(await caught(client().send({ method: 'DELETE', path: '/missing' }))).toMatchObject({
      kind: 'http',
      code: 'NOT_FOUND',
    });
    expect(await caught(client().send({ method: 'DELETE', path: '/down' }))).toMatchObject({
      kind: 'network',
    });
  });

  it.each([`${API_URL}/`, API_URL])(
    'HTTP-12 builds the same URL from the base %s',
    async (base) => {
      let url = '';
      server.use(
        http.get(`${API_URL}/api/x`, ({ request }) => {
          url = request.url;
          return HttpResponse.json({ data: { name: 'ok' } });
        }),
      );
      await client(base).request(itemSchema, { method: 'GET', path: '/x' });
      expect(url).toBe(`${API_URL}/api/x`);
    },
  );

  it('HTTP-13 uses the global fetch by default', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    server.use(http.get(`${API_URL}/api/x`, () => HttpResponse.json({ data: { name: 'ok' } })));
    await client().request(itemSchema, { method: 'GET', path: '/x' });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('HTTP-14 still reports the status when the error body cannot be read', async () => {
    const brokenBody = new ReadableStream({
      start(controller) {
        controller.error(new Error('stream broke'));
      },
    });
    const stubbed = createHttpClient({
      baseUrl: API_URL,
      getClientId: () => CLIENT_ID,
      fetch: () => Promise.resolve(new Response(brokenBody, { status: 503 })),
    });
    const error = await caught(stubbed.request(itemSchema, { method: 'GET', path: '/x' }));
    expect(error).toMatchObject({ kind: 'http', status: 503, retryable: true });
    expect((error as ApiClientError).message).toContain('503');
  });

  it('HTTP-13 uses a fetch it is given instead', async () => {
    const fetchStub = vi.fn(() => Promise.resolve(Response.json({ data: { name: 'stubbed' } })));
    const stubbed = createHttpClient({
      baseUrl: API_URL,
      getClientId: () => CLIENT_ID,
      fetch: fetchStub,
    });
    const result = await stubbed.request(itemSchema, { method: 'GET', path: '/x' });
    expect(result.data.name).toBe('stubbed');
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });
});
