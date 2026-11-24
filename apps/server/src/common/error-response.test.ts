import { createApiError } from '@nabd/shared';
import { HttpException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { ApiException } from './api-exception.js';
import { toErrorResponse } from './error-response.js';

describe('toErrorResponse', () => {
  it('COM-02 passes an ApiException through', () => {
    const exception = new ApiException('CONFLICT', 'Already there', { symbol: 'AAPL' });
    expect(toErrorResponse(exception)).toEqual({
      status: 409,
      body: createApiError('CONFLICT', 'Already there', { symbol: 'AAPL' }),
    });
  });

  it.each([
    [404, 'NOT_FOUND', 404],
    [409, 'CONFLICT', 409],
    [503, 'SERVICE_UNAVAILABLE', 503],
    [400, 'VALIDATION_ERROR', 422],
    [413, 'VALIDATION_ERROR', 422],
    [418, 'INTERNAL_ERROR', 500],
  ])('COM-03 maps an HTTP %i error to %s with status %i', (httpStatus, code, status) => {
    const result = toErrorResponse(new HttpException('framework detail', httpStatus));
    expect(result.status).toBe(status);
    expect(result.body.error.code).toBe(code);
    expect(result.body.error.message).not.toContain('framework detail');
  });

  it.each([
    ['an Error', new Error('secret db password')],
    ['a string', 'secret db password'],
    ['null', null],
  ])('COM-04 turns %s into a generic 500 without the original message', (_label, thrown) => {
    const result = toErrorResponse(thrown);
    expect(result.status).toBe(500);
    expect(result.body).toEqual(createApiError('INTERNAL_ERROR', 'Internal server error'));
    expect(JSON.stringify(result.body)).not.toContain('secret');
  });
});
