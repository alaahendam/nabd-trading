import { type PriceTick, priceTickSchema, quoteSchema } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { MarketSimulator, type SimulatorOptions } from './simulator.js';
import { STOCK_UNIVERSE, type UniverseEntry } from './universe.js';

const DAY_MS = 86_400_000;
const T0 = Date.UTC(2026, 0, 15, 12, 0, 0);

const makeSim = (
  overrides: Partial<SimulatorOptions> = {},
  universe: readonly UniverseEntry[] = STOCK_UNIVERSE,
) => new MarketSimulator(universe, { seed: 1, startTime: T0, volatilityScale: 3, ...overrides });

const must = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error('expected a value');
  }
  return value;
};

/** Advances from `start` in fixed steps, calling `onStep` after each, and collects every tick. */
const run = (
  sim: MarketSimulator,
  seconds: number,
  {
    stepMs = 1000,
    start = T0,
    onStep,
  }: { stepMs?: number; start?: number; onStep?: (now: number) => void } = {},
): PriceTick[] => {
  const ticks: PriceTick[] = [];
  for (let elapsed = stepMs; elapsed <= seconds * 1000; elapsed += stepMs) {
    ticks.push(...sim.advance(start + elapsed));
    onStep?.(start + elapsed);
  }
  return ticks;
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const std = (values: number[]) => {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};
const correlation = (a: number[], b: number[]) => {
  const meanA = mean(a);
  const meanB = mean(b);
  const covariance = mean(a.map((value, index) => (value - meanA) * (must(b[index]) - meanB)));
  return covariance / (std(a) * std(b));
};
const lagOneAutocorrelation = (values: number[]) =>
  correlation(values.slice(0, -1), values.slice(1));
const logReturns = (prices: number[]) =>
  prices.slice(1).map((price, index) => Math.log(price / must(prices[index])));
const isCents = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

describe('MarketSimulator', () => {
  it('SIM-01 starts with one valid quote per stock at its snapshot price', () => {
    const quotes = makeSim().quotes();
    expect(quotes.map((quote) => quote.symbol)).toEqual(
      STOCK_UNIVERSE.map((entry) => entry.symbol),
    );
    for (const [index, quote] of quotes.entries()) {
      expect(quoteSchema.parse(quote)).toEqual(quote);
      expect(quote.price).toBe(must(STOCK_UNIVERSE[index]).snapshotPrice);
      expect(quote.timestamp).toBe(T0);
    }
  });

  it('SIM-02 is a function of the seed', () => {
    const a = makeSim({ seed: 5 });
    const b = makeSim({ seed: 5 });
    const other = makeSim({ seed: 6 });
    const ticksA = run(a, 30);
    expect(run(b, 30)).toEqual(ticksA);
    expect(b.quotes()).toEqual(a.quotes());
    expect(run(other, 30)).not.toEqual(ticksA);
  });

  it('SIM-03 does not depend on how time is chunked', () => {
    const fine = makeSim();
    const coarse = makeSim();
    const fineTicks = run(fine, 30, { stepMs: 1000 });
    const coarseTicks = run(coarse, 30, { stepMs: 10_000 });
    expect(coarseTicks).toEqual(fineTicks);
    expect(coarse.quotes()).toEqual(fine.quotes());
  });

  it.each([1, 2, 3])('SIM-04 keeps every quote valid (seed %i)', (seed) => {
    const sim = makeSim({ seed });
    let checks = 0;
    run(sim, 600, {
      stepMs: 1000,
      onStep: (now) => {
        if ((now - T0) % 20_000 === 0) {
          for (const quote of sim.quotes()) {
            expect(quoteSchema.safeParse(quote).success).toBe(true);
          }
          checks += 1;
        }
      },
    });
    expect(checks).toBe(30);
  });

  it('SIM-05 emits valid, ordered ticks inside the advanced window', () => {
    const sim = makeSim();
    const known = new Set(STOCK_UNIVERSE.map((entry) => entry.symbol));
    let previousTimestamp = T0;
    for (let second = 1; second <= 60; second += 1) {
      const now = T0 + second * 1000;
      for (const tick of sim.advance(now)) {
        expect(priceTickSchema.safeParse(tick).success).toBe(true);
        expect(known.has(tick.symbol)).toBe(true);
        expect(tick.timestamp).toBeGreaterThanOrEqual(previousTimestamp);
        expect(tick.timestamp).toBeGreaterThan(now - 1000);
        expect(tick.timestamp).toBeLessThanOrEqual(now);
        previousTimestamp = tick.timestamp;
      }
    }
  });

  it('SIM-06 ticks arrive at irregular, rate-driven times', () => {
    const sim = makeSim();
    const ticks = run(sim, 600);
    const bySymbol = (symbol: string) => ticks.filter((tick) => tick.symbol === symbol);
    const aapl = bySymbol('AAPL');
    const gaps = aapl.slice(1).map((tick, index) => tick.timestamp - must(aapl[index]).timestamp);
    const expectedGap =
      1000 / must(STOCK_UNIVERSE.find((entry) => entry.symbol === 'AAPL')).ticksPerSecond;
    expect(Math.abs(mean(gaps) - expectedGap) / expectedGap).toBeLessThan(0.1);
    const variation = std(gaps) / mean(gaps);
    expect(variation).toBeGreaterThan(0.85);
    expect(variation).toBeLessThan(1.15);
    expect(bySymbol('NVDA').length).toBeGreaterThan(bySymbol('JNJ').length);
  });

  it('SIM-07 moves stocks together through the market factor', () => {
    const correlationOf = (options: Partial<SimulatorOptions>) => {
      const sim = makeSim(options);
      const tsla: number[] = [must(sim.quote('TSLA')).price];
      const nvda: number[] = [must(sim.quote('NVDA')).price];
      run(sim, 7200, {
        stepMs: 10_000,
        onStep: () => {
          tsla.push(must(sim.quote('TSLA')).price);
          nvda.push(must(sim.quote('NVDA')).price);
        },
      });
      return correlation(logReturns(tsla), logReturns(nvda));
    };
    expect(correlationOf({})).toBeGreaterThan(0.12);
    expect(Math.abs(correlationOf({ marketDailyVolatility: 0 }))).toBeLessThan(0.1);
  });

  it('SIM-08 clusters volatility', () => {
    const regimes = (options: Partial<SimulatorOptions>) => {
      const sim = makeSim(options);
      const samples: number[] = [];
      run(sim, 3600, { onStep: () => samples.push(must(sim.volatilityMultiplier('TSLA'))) });
      return samples;
    };
    const clustered = regimes({});
    expect(Math.min(...clustered)).toBeGreaterThanOrEqual(0.5);
    expect(Math.max(...clustered)).toBeLessThanOrEqual(2.5);
    expect(std(clustered)).toBeGreaterThan(0.02);
    expect(lagOneAutocorrelation(clustered)).toBeGreaterThan(0.5);
    expect(Math.abs(mean(clustered) - 1)).toBeLessThan(0.15);
    expect(new Set(regimes({ clusterStrength: 0 }))).toEqual(new Set([1]));
  });

  it('SIM-09 keeps prices in cents and above one cent', () => {
    const sim = makeSim();
    for (const tick of run(sim, 120)) {
      expect(isCents(tick.price)).toBe(true);
    }

    const penny: UniverseEntry = {
      ...must(STOCK_UNIVERSE[0]),
      symbol: 'PNY',
      snapshotPrice: 0.05,
      beta: 2.9,
      dailyVolatility: 0.09,
    };
    const extreme = new MarketSimulator([penny], {
      seed: 3,
      startTime: T0,
      volatilityScale: 60,
    });
    for (const tick of run(extreme, 600)) {
      expect(tick.price).toBeGreaterThanOrEqual(0.01);
      expect(isCents(tick.price)).toBe(true);
    }
  });

  it('SIM-10 keeps OHLC consistent', () => {
    const sim = makeSim();
    const seen = new Map<string, { high: number; low: number }>();
    run(sim, 300, {
      onStep: () => {
        for (const quote of sim.quotes()) {
          expect(quote.high).toBeGreaterThanOrEqual(Math.max(quote.open, quote.price));
          expect(quote.low).toBeLessThanOrEqual(Math.min(quote.open, quote.price));
          expect(quoteSchema.safeParse(quote).success).toBe(true);
        }
      },
    });
    for (const tick of run(sim, 60, { start: T0 + 300_000 })) {
      const range = seen.get(tick.symbol) ?? { high: 0, low: Number.POSITIVE_INFINITY };
      seen.set(tick.symbol, {
        high: Math.max(range.high, tick.price),
        low: Math.min(range.low, tick.price),
      });
    }
    for (const [symbol, range] of seen) {
      const quote = must(sim.quote(symbol));
      expect(quote.high).toBeGreaterThanOrEqual(range.high);
      expect(quote.low).toBeLessThanOrEqual(range.low);
    }
  });

  it('SIM-11 only grows volume within a day', () => {
    const sim = makeSim();
    const ticks = run(sim, 300);
    const lastVolume = new Map<string, number>();
    for (const tick of ticks) {
      expect(tick.volume).toBeGreaterThanOrEqual(lastVolume.get(tick.symbol) ?? 0);
      lastVolume.set(tick.symbol, tick.volume);
    }
    for (const [symbol, volume] of lastVolume) {
      expect(must(sim.quote(symbol)).volume).toBe(volume);
    }
  });

  it('SIM-12 rolls the UTC day over', () => {
    const midnight = Math.ceil(T0 / DAY_MS) * DAY_MS;
    const start = midnight - 30_000;
    const sim = new MarketSimulator(STOCK_UNIVERSE, {
      seed: 1,
      startTime: start,
      volatilityScale: 3,
    });
    const ticks = run(sim, 60, { start });
    const lastBefore = new Map<string, number>();
    for (const tick of ticks.filter((candidate) => candidate.timestamp < midnight)) {
      lastBefore.set(tick.symbol, tick.price);
    }
    const volumeBefore = new Map(
      ticks
        .filter((candidate) => candidate.timestamp < midnight)
        .map((tick) => [tick.symbol, tick.volume] as const),
    );
    expect(lastBefore.size).toBe(STOCK_UNIVERSE.length);

    for (const quote of sim.quotes()) {
      expect(quote.previousClose).toBe(lastBefore.get(quote.symbol));
      expect(quote.volume).toBeLessThan(must(volumeBefore.get(quote.symbol)));
      expect(quoteSchema.safeParse(quote).success).toBe(true);
    }
  });

  it('SIM-13 does not drift away from the snapshot', () => {
    const sim = makeSim();
    run(sim, 6 * 3600, { stepMs: 10_000 });
    for (const entry of STOCK_UNIVERSE) {
      const ratio = must(sim.quote(entry.symbol)).price / entry.snapshotPrice;
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.4);
    }
  });

  it('SIM-14 catches up from a long pause without replaying it', () => {
    const sim = makeSim();
    const now = T0 + 3_600_000;
    const ticks = sim.advance(now);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThan(2000);
    for (const tick of ticks) {
      expect(tick.timestamp).toBeGreaterThanOrEqual(now - 10_000);
    }
    for (const quote of sim.quotes()) {
      expect(quoteSchema.safeParse(quote).success).toBe(true);
    }
    expect(sim.advance(now + 1000).length).toBeGreaterThan(0);
  });

  it('SIM-14 rolls the day over inside a skipped pause', () => {
    const midnight = Math.ceil(T0 / DAY_MS) * DAY_MS;
    const sim = new MarketSimulator(STOCK_UNIVERSE, {
      seed: 1,
      startTime: midnight - 60_000,
      volatilityScale: 3,
    });
    sim.advance(midnight + 3_600_000);
    for (const quote of sim.quotes()) {
      expect(quoteSchema.safeParse(quote).success).toBe(true);
    }
  });

  it('SIM-14 keeps ticks that are still pending after a short skip', () => {
    const sim = makeSim();
    const now = T0 + 10_300;
    const ticks = sim.advance(now);
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(tick.timestamp).toBeGreaterThanOrEqual(T0 + 300);
      expect(tick.timestamp).toBeLessThanOrEqual(now);
    }
    for (const quote of sim.quotes()) {
      expect(quoteSchema.safeParse(quote).success).toBe(true);
    }
  });

  it('SIM-15 does not move backwards in time', () => {
    const sim = makeSim();
    run(sim, 10);
    const before = sim.quotes();
    expect(sim.advance(T0 + 10_000)).toEqual([]);
    expect(sim.advance(T0)).toEqual([]);
    expect(sim.quotes()).toEqual(before);
  });

  it('SIM-16 looks up quotes, ticks and volatility', () => {
    const sim = makeSim();
    run(sim, 5);
    const quote = must(sim.quote('AAPL'));
    const tick = must(sim.latestTick('AAPL'));
    expect(priceTickSchema.parse(tick)).toEqual(tick);
    expect(tick).toEqual({
      symbol: 'AAPL',
      price: quote.price,
      volume: quote.volume,
      timestamp: quote.timestamp,
    });
    expect(sim.volatilityMultiplier('AAPL')).toBeGreaterThan(0);
    expect(sim.quote('NOPE')).toBeUndefined();
    expect(sim.latestTick('NOPE')).toBeUndefined();
    expect(sim.volatilityMultiplier('NOPE')).toBeUndefined();
  });

  it.each([
    ['volatilityScale 0', { volatilityScale: 0 }],
    ['volatilityScale -1', { volatilityScale: -1 }],
    ['volatilityScale NaN', { volatilityScale: Number.NaN }],
    ['negative marketDailyVolatility', { marketDailyVolatility: -0.1 }],
    ['negative clusterStrength', { clusterStrength: -1 }],
  ])('SIM-17 rejects %s', (_label, overrides) => {
    expect(() => makeSim(overrides)).toThrow(RangeError);
  });

  it('SIM-18 handles an empty universe', () => {
    const sim = new MarketSimulator([], { seed: 1, startTime: T0 });
    expect(sim.advance(T0 + 1000)).toEqual([]);
    expect(sim.advance(T0 + 2 * DAY_MS)).toEqual([]);
    expect(sim.quotes()).toEqual([]);
  });

  it('SIM-20 pairs every universe entry with its quote', () => {
    const sim = makeSim();
    run(sim, 5);
    const snapshot = sim.snapshot();
    expect(snapshot.map((item) => item.entry)).toEqual(STOCK_UNIVERSE);
    expect(snapshot.map((item) => item.quote)).toEqual(sim.quotes());
  });

  it('SIM-19 returns copies', () => {
    const sim = makeSim();
    const quote = must(sim.quotes()[0]);
    const original = quote.price;
    quote.price = 999_999;
    expect(must(sim.quotes()[0]).price).toBe(original);
    expect(must(sim.quote(quote.symbol)).price).toBe(original);
  });
});
