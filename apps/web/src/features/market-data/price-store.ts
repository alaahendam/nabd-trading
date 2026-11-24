import type { PriceTick } from '@nabd/shared';

/** What the UI shows for a symbol. Immutable: a new object is published for every change. */
export interface LivePrice {
  readonly symbol: string;
  readonly price: number;
  /** The price that was published before this one, for up and down direction. */
  readonly previousPrice: number | undefined;
  /** Cumulative volume for the day. */
  readonly volume: number;
  /** The server's time of the tick. */
  readonly timestamp: number;
  /** When this browser received the tick, used to tell when prices have gone stale. */
  readonly receivedAt: number;
}

/** Runs `callback` later (once) and returns a function that cancels it. */
export type Schedule = (callback: () => void) => () => void;

export const animationFrameSchedule: Schedule = (callback) => {
  const handle = requestAnimationFrame(() => {
    callback();
  });
  return () => {
    cancelAnimationFrame(handle);
  };
};

export interface PriceStoreOptions {
  now?: () => number;
  schedule?: Schedule;
}

interface Pending {
  readonly tick: PriceTick;
  readonly receivedAt: number;
}

/**
 * External store of live prices, read with `useSyncExternalStore` (ADR 0005).
 *
 * Ticks are coalesced to the latest per symbol and published once per scheduled frame, so a
 * burst causes at most one render per symbol per frame, and only for components of that symbol.
 */
export class PriceStore {
  private readonly published = new Map<string, LivePrice>();
  private readonly pending = new Map<string, Pending>();
  private readonly symbolListeners = new Map<string, Set<() => void>>();
  private readonly allListeners = new Set<() => void>();
  private readonly now: () => number;
  private readonly schedule: Schedule;
  private cancelFrame: (() => void) | undefined;

  constructor({
    now = () => Date.now(),
    schedule = animationFrameSchedule,
  }: PriceStoreOptions = {}) {
    this.now = now;
    this.schedule = schedule;
  }

  /** The published snapshot. The same object until the symbol changes. */
  get(symbol: string): LivePrice | undefined {
    return this.published.get(symbol);
  }

  /** Takes in ticks. Anything not newer than what the store already knows is ignored. */
  apply(ticks: readonly PriceTick[]): void {
    let accepted = false;
    for (const tick of ticks) {
      const known =
        this.pending.get(tick.symbol)?.tick.timestamp ??
        this.published.get(tick.symbol)?.timestamp ??
        Number.NEGATIVE_INFINITY;
      if (tick.timestamp > known) {
        this.pending.set(tick.symbol, { tick, receivedAt: this.now() });
        accepted = true;
      }
    }
    if (accepted && !this.cancelFrame) {
      this.cancelFrame = this.schedule(() => {
        this.flush();
      });
    }
  }

  subscribe(symbol: string, listener: () => void): () => void {
    const listeners = this.symbolListeners.get(symbol) ?? new Set<() => void>();
    listeners.add(listener);
    this.symbolListeners.set(symbol, listeners);
    return () => {
      const current = this.symbolListeners.get(symbol);
      current?.delete(listener);
      if (current?.size === 0) {
        this.symbolListeners.delete(symbol);
      }
    };
  }

  /** Notified once per published frame, whatever changed. */
  subscribeAll(listener: () => void): () => void {
    this.allListeners.add(listener);
    return () => {
      this.allListeners.delete(listener);
    };
  }

  /** Forgets every price, pending or published. */
  clear(): void {
    this.cancelFrame?.();
    this.cancelFrame = undefined;
    const symbols = [...this.published.keys()];
    this.published.clear();
    this.pending.clear();
    if (symbols.length > 0) {
      this.notify(symbols);
    }
  }

  private flush(): void {
    this.cancelFrame = undefined;
    const changed: string[] = [];
    for (const [symbol, { tick, receivedAt }] of this.pending) {
      this.published.set(symbol, {
        symbol,
        price: tick.price,
        previousPrice: this.published.get(symbol)?.price,
        volume: tick.volume,
        timestamp: tick.timestamp,
        receivedAt,
      });
      changed.push(symbol);
    }
    this.pending.clear();
    this.notify(changed);
  }

  private notify(symbols: readonly string[]): void {
    for (const symbol of symbols) {
      for (const listener of [...(this.symbolListeners.get(symbol) ?? [])]) {
        listener();
      }
    }
    for (const listener of [...this.allListeners]) {
      listener();
    }
  }
}
