import { createApiError, ERROR_STATUS, type ErrorCode } from '@nabd/shared';
import { HttpException } from '@nestjs/common';

/** Throw this from anywhere; the filter answers with the shared error shape and the code's status. */
export class ApiException extends HttpException {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(createApiError(code, message, details), ERROR_STATUS[code]);
  }
}
