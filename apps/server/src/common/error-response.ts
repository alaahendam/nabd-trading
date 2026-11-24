import { type ApiError, createApiError, ERROR_STATUS, type ErrorCode } from '@nabd/shared';
import { HttpException } from '@nestjs/common';

/** Fixed messages: framework and internal error text never reaches a client. */
const GENERIC_MESSAGE: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Invalid request',
  NOT_FOUND: 'Resource not found',
  CLIENT_ID_REQUIRED: 'A valid client ID is required',
  CONFLICT: 'Conflict',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  INTERNAL_ERROR: 'Internal server error',
};

const CODE_BY_HTTP_STATUS = new Map<number, ErrorCode>([
  [400, 'VALIDATION_ERROR'],
  [413, 'VALIDATION_ERROR'],
  [404, 'NOT_FOUND'],
  [409, 'CONFLICT'],
  [503, 'SERVICE_UNAVAILABLE'],
]);

export interface ErrorResponse {
  status: number;
  body: ApiError;
}

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof response.error === 'object'
  );
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (isApiError(response)) {
      return { status: exception.getStatus(), body: response };
    }
    const code = CODE_BY_HTTP_STATUS.get(exception.getStatus()) ?? 'INTERNAL_ERROR';
    return { status: ERROR_STATUS[code], body: createApiError(code, GENERIC_MESSAGE[code]) };
  }
  return {
    status: ERROR_STATUS.INTERNAL_ERROR,
    body: createApiError('INTERNAL_ERROR', GENERIC_MESSAGE.INTERNAL_ERROR),
  };
}
