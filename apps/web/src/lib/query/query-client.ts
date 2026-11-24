import { QueryClient } from '@tanstack/react-query';

import { isRetryable } from '../api';

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 8000;

export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < MAX_RETRIES && isRetryable(error);

export const retryDelay = (attempt: number): number =>
  Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
        retryDelay,
      },
      mutations: { retry: false },
    },
  });
