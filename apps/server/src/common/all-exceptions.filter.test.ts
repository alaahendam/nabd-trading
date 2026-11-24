import { createApiError } from '@nabd/shared';
import { type ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { ApiException } from './api-exception.js';

const setup = () => {
  const reply = vi.fn();
  const response = { id: 'response' };
  const adapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost;
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { filter: new AllExceptionsFilter(adapterHost), host, reply, response };
};

describe('AllExceptionsFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('COM-05 replies in the shared shape and logs an unexpected error with its stack', () => {
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { filter, host, reply, response } = setup();
    const error = new Error('boom');

    filter.catch(error, host);

    expect(reply).toHaveBeenCalledWith(
      response,
      createApiError('INTERNAL_ERROR', 'Internal server error'),
      500,
    );
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('boom', error.stack);
  });

  it('COM-05 logs a thrown non-Error value without a stack', () => {
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { filter, host } = setup();

    filter.catch('plain string', host);

    expect(logError).toHaveBeenCalledWith('plain string', undefined);
  });

  it.each<[string, HttpException]>([
    ['an ApiException', new ApiException('NOT_FOUND', 'No such stock')],
    ['a 404 HttpException', new HttpException('missing', 404)],
  ])('COM-05 does not log %s', (_label, exception) => {
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { filter, host, reply } = setup();

    filter.catch(exception, host);

    expect(reply).toHaveBeenCalledTimes(1);
    expect(logError).not.toHaveBeenCalled();
  });
});
