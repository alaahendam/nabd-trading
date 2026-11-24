export const CHAOS_OPTIONS = Symbol('CHAOS_OPTIONS');
export const RANDOM = Symbol('RANDOM');

export interface ChaosOptions {
  /** Delay added to every HTTP response, in milliseconds. */
  latencyMs: number;
  /** Share of HTTP requests, from 0 to 1, that fail with 503. */
  errorRate: number;
}
