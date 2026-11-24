import type { PriceTick } from '@nabd/shared';

/** Collects ticks between flushes, grouped by symbol in arrival order. */
export class TickBatcher {
  private pending = new Map<string, PriceTick[]>();

  /** `maxPerSymbol` bounds memory if flushing stalls: only the most recent ticks are kept. */
  constructor(private readonly maxPerSymbol = 100) {
    if (!Number.isInteger(maxPerSymbol) || maxPerSymbol < 1) {
      throw new RangeError(`maxPerSymbol must be a positive integer, got ${maxPerSymbol}`);
    }
  }

  push(ticks: readonly PriceTick[]): void {
    for (const tick of ticks) {
      const list = this.pending.get(tick.symbol) ?? [];
      list.push(tick);
      if (list.length > this.maxPerSymbol) {
        list.shift();
      }
      this.pending.set(tick.symbol, list);
    }
  }

  /** Whether ticks for this symbol are waiting for the next flush. */
  has(symbol: string): boolean {
    return this.pending.has(symbol);
  }

  /** Returns everything collected since the last drain and starts empty again. */
  drain(): Map<string, PriceTick[]> {
    const drained = this.pending;
    this.pending = new Map();
    return drained;
  }
}
