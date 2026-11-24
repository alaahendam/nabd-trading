import { createApiError, ERROR_CODES, ERROR_STATUS } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { ApiException } from './api-exception.js';

describe('ApiException', () => {
  it.each(ERROR_CODES)('COM-01 %s carries its status and the shared body', (code) => {
    const exception = new ApiException(code, 'Something');
    expect(exception.getStatus()).toBe(ERROR_STATUS[code]);
    expect(exception.getResponse()).toEqual(createApiError(code, 'Something'));
  });

  it('COM-01 keeps details in the body', () => {
    const details = [{ path: 'period', message: 'Invalid option' }];
    const exception = new ApiException('VALIDATION_ERROR', 'Invalid request', details);
    expect(exception.getResponse()).toEqual(
      createApiError('VALIDATION_ERROR', 'Invalid request', details),
    );
  });
});
