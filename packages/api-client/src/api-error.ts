import type { ErrorCode } from '@nabd/shared';

export type ApiErrorKind = 'network' | 'http' | 'parse';

export interface ApiClientErrorInit {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  code?: ErrorCode;
  details?: unknown;
  cause?: unknown;
}

const RETRYABLE_CLIENT_STATUSES: ReadonlySet<number> = new Set([408, 429]);

const isRetryableFailure = (kind: ApiErrorKind, status: number | undefined): boolean => {
  if (kind === 'network') return true;
  if (kind === 'parse' || status === undefined) return false;
  return status >= 500 || RETRYABLE_CLIENT_STATUSES.has(status);
};

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly code: ErrorCode | undefined;
  readonly details: unknown;
  readonly retryable: boolean;

  constructor(init: ApiClientErrorInit) {
    super(init.message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'ApiClientError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.retryable = isRetryableFailure(init.kind, init.status);
  }
}

export const isRetryable = (error: unknown): boolean =>
  error instanceof ApiClientError && error.retryable;
