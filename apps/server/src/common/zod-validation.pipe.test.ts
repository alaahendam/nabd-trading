import { createApiError } from '@nabd/shared';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiException } from './api-exception.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const schema = z.object({
  limit: z.coerce.number().int().default(10),
  filter: z.object({ sector: z.string().min(1) }).optional(),
});

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(schema);

  it('COM-06 returns the parsed value with coercion and defaults applied', () => {
    expect(pipe.transform({ limit: '5' })).toEqual({ limit: 5 });
    expect(pipe.transform({})).toEqual({ limit: 10 });
  });

  it('COM-07 rejects with VALIDATION_ERROR and a list of path and message', () => {
    let thrown: unknown;
    try {
      pipe.transform({ limit: 'abc' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ApiException);
    const exception = thrown as ApiException;
    expect(exception.getStatus()).toBe(422);
    expect(exception.getResponse()).toEqual(
      createApiError('VALIDATION_ERROR', 'Invalid request', [
        { path: 'limit', message: expect.any(String) as string },
      ]),
    );
  });

  it('COM-08 uses dotted paths for nested fields', () => {
    let thrown: unknown;
    try {
      pipe.transform({ filter: { sector: '' } });
    } catch (error) {
      thrown = error;
    }

    const body = (thrown as ApiException).getResponse() as {
      error: { details: { path: string }[] };
    };
    expect(body.error.details.map((detail) => detail.path)).toEqual(['filter.sector']);
  });
});
