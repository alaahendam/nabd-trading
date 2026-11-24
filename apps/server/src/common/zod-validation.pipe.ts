import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

import { ApiException } from './api-exception.js';

/** Validates a param, query or body with a shared schema and hands on the parsed value. */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'Invalid request',
        result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
