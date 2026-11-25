import { describe, expect, it } from 'vitest';

import { ApiClientError, isRetryable } from './api-error.js';

describe('ApiClientError', () => {
  it.each([
    ['network', { kind: 'network' }, true],
    ['http 500', { kind: 'http', status: 500 }, true],
    ['http 502', { kind: 'http', status: 502 }, true],
    ['http 503', { kind: 'http', status: 503 }, true],
    ['http 408', { kind: 'http', status: 408 }, true],
    ['http 429', { kind: 'http', status: 429 }, true],
    ['http 400', { kind: 'http', status: 400 }, false],
    ['http 401', { kind: 'http', status: 401 }, false],
    ['http 404', { kind: 'http', status: 404 }, false],
    ['http 422', { kind: 'http', status: 422 }, false],
    ['parse', { kind: 'parse' }, false],
  ] as const)('ERR-01 %s is retryable: %s', (_label, input, retryable) => {
    expect(new ApiClientError({ ...input, message: 'x' }).retryable).toBe(retryable);
  });

  it('ERR-02 carries what the server said', () => {
    const error = new ApiClientError({
      kind: 'http',
      status: 404,
      code: 'NOT_FOUND',
      message: 'No stock with symbol NOPE',
      details: { symbol: 'NOPE' },
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiClientError');
    expect(error).toMatchObject({
      kind: 'http',
      status: 404,
      code: 'NOT_FOUND',
      message: 'No stock with symbol NOPE',
      details: { symbol: 'NOPE' },
    });
  });

  it('ERR-02 leaves status and code undefined when there are none', () => {
    const error = new ApiClientError({ kind: 'network', message: 'down' });
    expect(error.status).toBeUndefined();
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('ERR-04 keeps the cause', () => {
    const cause = new TypeError('Failed to fetch');
    expect(new ApiClientError({ kind: 'network', message: 'down', cause }).cause).toBe(cause);
  });
});

describe('isRetryable', () => {
  it('ERR-03 follows the flag of an ApiClientError and is false for anything else', () => {
    expect(isRetryable(new ApiClientError({ kind: 'network', message: 'x' }))).toBe(true);
    expect(isRetryable(new ApiClientError({ kind: 'parse', message: 'x' }))).toBe(false);
    expect(isRetryable(new Error('x'))).toBe(false);
    expect(isRetryable('x')).toBe(false);
    expect(isRetryable(undefined)).toBe(false);
  });
});
