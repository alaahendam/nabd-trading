export const REALTIME_OPTIONS = Symbol('REALTIME_OPTIONS');

export interface RealtimeOptions {
  /** How often pending ticks are sent to subscribers, in milliseconds. */
  flushMs: number;
}
