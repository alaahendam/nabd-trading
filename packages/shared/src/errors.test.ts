import { describe, expect, it } from 'vitest';

import {
  apiErrorSchema,
  createApiError,
  ERROR_CODES,
  ERROR_STATUS,
  errorCodeSchema,
} from './errors.js';

describe('error codes', () => {
  it('ERR-01 are the agreed closed set', () => {
    expect(ERROR_CODES).toEqual([
      'VALIDATION_ERROR',
      'NOT_FOUND',
      'CLIENT_ID_REQUIRED',
      'CONFLICT',
      'SERVICE_UNAVAILABLE',
      'INTERNAL_ERROR',
    ]);
  });

  it.each(ERROR_CODES)('ERR-02 schema accepts %s', (code) => {
    expect(errorCodeSchema.parse(code)).toBe(code);
  });

  it.each(['OOPS', '', 404, null])('ERR-02 schema rejects %j', (value) => {
    expect(errorCodeSchema.safeParse(value).success).toBe(false);
  });

  it('ERR-03 every code has an HTTP error status and nothing else does', () => {
    expect(Object.keys(ERROR_STATUS).sort()).toEqual([...ERROR_CODES].sort());
    for (const status of Object.values(ERROR_STATUS)) {
      expect(Number.isInteger(status)).toBe(true);
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThanOrEqual(599);
    }
  });

  it('ERR-04 statuses follow the agreed mapping', () => {
    expect(ERROR_STATUS).toEqual({
      VALIDATION_ERROR: 422,
      NOT_FOUND: 404,
      CLIENT_ID_REQUIRED: 401,
      CONFLICT: 409,
      SERVICE_UNAVAILABLE: 503,
      INTERNAL_ERROR: 500,
    });
  });
});

describe('apiErrorSchema', () => {
  it('ERR-05 parses a body with and without details', () => {
    const plain = { error: { code: 'NOT_FOUND', message: 'No such stock' } };
    const detailed = {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid period', details: { field: 'period' } },
    };
    expect(apiErrorSchema.parse(plain)).toEqual(plain);
    expect(apiErrorSchema.parse(detailed)).toEqual(detailed);
  });

  it.each([
    ['unknown code', { error: { code: 'OOPS', message: 'x' } }],
    ['empty message', { error: { code: 'NOT_FOUND', message: '' } }],
    ['no error key', { code: 'NOT_FOUND', message: 'x' }],
    ['not an object', 'NOT_FOUND'],
  ])('ERR-06 rejects %s', (_label, body) => {
    expect(apiErrorSchema.safeParse(body).success).toBe(false);
  });
});

describe('createApiError', () => {
  it('ERR-07 builds a valid body with no details key when there are none', () => {
    const body = createApiError('NOT_FOUND', 'No such stock');
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'No such stock' } });
    expect('details' in body.error).toBe(false);
    expect(apiErrorSchema.safeParse(body).success).toBe(true);
  });

  it('ERR-08 keeps details when given', () => {
    const details = { field: 'period' };
    const body = createApiError('VALIDATION_ERROR', 'Invalid period', details);
    expect(body.error.details).toBe(details);
    expect(apiErrorSchema.safeParse(body).success).toBe(true);
  });
});
