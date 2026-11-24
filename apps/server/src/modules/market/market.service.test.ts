import {
  historyDataSchema,
  PERIOD_CONFIG,
  PERIODS,
  type PriceTick,
  priceTickSchema,
  stockWithQuoteSchema,
} from '@nabd/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Clock } from '../../common/clock.js';
import { MarketService } from './market.service.js';
import { STOCK_UNIVERSE } from './universe.js';

const START = Date.UTC(2026, 5, 17, 12, 0, 0);

class FakeClock implements Clock {
  constructor(public time = START) {}
  now(): number {
    return this.time;
  }
  advance(ms: number): void {
    this.time += ms;
  }
}

const options = { seed: 'test', volatilityScale: 3, stepMs: 100 };

const make = (overrides: Partial<typeof options> = {}) => {
  const clock = new FakeClock();
  return { clock, service: new MarketService(clock, { ...options, ...overrides }) };
};

const must = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error('expected a value');
  }
  return value;
};

describe('MarketService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SVC-01 gives the same market for the same options', () => {
    const a = make();
    const b = make();
    const other = make({ seed: 'other' });
    for (const { clock, service } of [a, b, other]) {
      clock.advance(5000);
      service.step();
    }
    expect(a.service.stocks()).toEqual(b.service.stocks());
    expect(other.service.stocks()).not.toEqual(a.service.stocks());
  });

  it('SVC-02 steps on a timer, publishes batches, and stops on destroy', () => {
    const { clock, service } = make();
    const batches: PriceTick[][] = [];
    let completed = false;
    service.ticks$.subscribe({
      next: (batch) => batches.push(batch),
      complete: () => {
        completed = true;
      },
    });

    service.onModuleInit();
    clock.advance(1000);
    vi.advanceTimersByTime(100);

    expect(batches).toHaveLength(1);
    const first = must(batches[0]);
    expect(first.length).toBeGreaterThan(0);
    for (const tick of first) {
      expect(priceTickSchema.safeParse(tick).success).toBe(true);
    }

    service.onModuleDestroy();
    clock.advance(1000);
    vi.advanceTimersByTime(1000);
    expect(batches).toHaveLength(1);
    expect(completed).toBe(true);
  });

  it('SVC-03 publishes nothing when there are no ticks', () => {
    const { service } = make();
    const batches: PriceTick[][] = [];
    service.ticks$.subscribe((batch) => batches.push(batch));
    service.step();
    expect(batches).toEqual([]);
  });

  it('SVC-04 lists stocks with quotes and finds one by symbol', () => {
    const { service } = make();
    const stocks = service.stocks();
    expect(stocks.map((item) => item.symbol)).toEqual(STOCK_UNIVERSE.map((entry) => entry.symbol));
    for (const item of stocks) {
      expect(stockWithQuoteSchema.safeParse(item).success).toBe(true);
    }
    expect(service.stock('AAPL')?.name).toBe('Apple Inc.');
    expect(service.stock('NOPE')).toBeUndefined();
  });

  it.each(PERIODS)('SVC-05 builds %s history ending at the current price', (period) => {
    const { clock, service } = make();
    clock.advance(30_000);
    service.step();
    const history = must(service.history('AAPL', period));
    expect(historyDataSchema.safeParse(history).success).toBe(true);
    expect(history.points).toHaveLength(
      PERIOD_CONFIG[period].lookbackMs / PERIOD_CONFIG[period].bucketMs,
    );
    expect(must(history.points.at(-1)).close).toBe(must(service.stock('AAPL')).quote.price);
  });

  it('SVC-05 returns undefined history for an unknown symbol', () => {
    expect(make().service.history('NOPE', '1D')).toBeUndefined();
  });

  it('SVC-06 looks up symbols and latest ticks', () => {
    const { service } = make();
    expect(service.hasSymbol('AAPL')).toBe(true);
    expect(service.hasSymbol('NOPE')).toBe(false);
    expect(service.symbols()).toEqual(STOCK_UNIVERSE.map((entry) => entry.symbol));
    const tick = must(service.latestTick('AAPL'));
    expect(priceTickSchema.parse(tick)).toEqual(tick);
    expect(service.latestTick('NOPE')).toBeUndefined();
  });
});
