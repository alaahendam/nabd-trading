import { ApiClientError } from '@nabd/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient, retryDelay, shouldRetry } from './query-client';

const network = new ApiClientError({ kind: 'network', message: 'down' });
const http = (status: number) => new ApiClientError({ kind: 'http', status, message: 'x' });

afterEach(() => {
  vi.useRealTimers();
});

describe('shouldRetry', () => {
  it.each([
    ['network', network],
    ['503', http(503)],
    ['429', http(429)],
  ])('QRY-01 retries a %s error twice and then stops', (_label, error) => {
    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });

  it.each([
    ['404', http(404)],
    ['422', http(422)],
    ['401', http(401)],
    ['parse', new ApiClientError({ kind: 'parse', message: 'x' })],
    ['plain Error', new Error('x')],
  ])('QRY-02 never retries a %s error', (_label, error) => {
    expect(shouldRetry(0, error)).toBe(false);
  });
});

describe('retryDelay', () => {
  it('QRY-03 backs off exponentially up to a cap', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(retryDelay)).toEqual([
      1000, 2000, 4000, 8000, 8000, 8000, 8000,
    ]);
  });
});

describe('createQueryClient', () => {
  it('QRY-04 sets the defaults', () => {
    const options = createQueryClient().getDefaultOptions();
    expect(options.queries).toMatchObject({
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: true,
      retry: shouldRetry,
      retryDelay,
    });
    expect(options.mutations).toMatchObject({ retry: false });
  });

  it('QRY-05 gives every client its own cache', () => {
    const first = createQueryClient();
    const second = createQueryClient();
    first.setQueryData(['k'], 1);
    expect(first).not.toBe(second);
    expect(second.getQueryData(['k'])).toBeUndefined();
  });

  it('QRY-06 fails a 404 at once and retries a 503', async () => {
    vi.useFakeTimers();
    const client = createQueryClient();

    const notFound = vi.fn(() => Promise.reject(http(404)));
    await expect(client.query({ queryKey: ['a'], queryFn: notFound })).rejects.toMatchObject({
      status: 404,
    });
    expect(notFound).toHaveBeenCalledTimes(1);

    const unavailable = vi.fn(() => Promise.reject(http(503)));
    const pending = client.query({ queryKey: ['b'], queryFn: unavailable });
    const settled = pending.catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1000);
    expect(unavailable).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(unavailable).toHaveBeenCalledTimes(3);
    expect(await settled).toMatchObject({ status: 503 });
  });
});
