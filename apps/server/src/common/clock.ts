/** Injection token for the time source, so tests can control time. */
export const CLOCK = Symbol('CLOCK');

export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}
