import type { PriceTick, Quote } from '@nabd/shared';

import { type Rng, rngFor } from './rng.js';
import type { UniverseEntry } from './universe.js';

const DAY_MS = 86_400_000;
/** The market factor moves on this grid; every stock sees the same moves. */
const MARKET_STEP_MS = 1000;
/** After a longer pause the simulator skips ahead instead of replaying every missed tick. */
const MAX_CATCH_UP_MS = 10_000;
/** Pull back towards the snapshot price, per day. Keeps the demo from wandering off. */
const REVERSION_PER_DAY = 50;
const VOLATILITY_DECAY = 0.995;
const VOLATILITY_MIN = 0.5;
const VOLATILITY_MAX = 2.5;
/** E|z| for a standard normal, so a typical shock leaves the regime where it is. */
const MEAN_ABSOLUTE_SHOCK = 0.8;
/** Share of a stock's own variance the market factor may explain at most. */
const MIN_IDIOSYNCRATIC_SHARE = 0.3;

export interface SimulatorOptions {
  seed: number | string;
  /** Epoch milliseconds the simulation starts at. */
  startTime: number;
  /** Multiplies every volatility. Above 1 makes the demo livelier than a real day. Default 1. */
  volatilityScale?: number;
  /** Daily volatility of the shared market factor. Default 0.01; 0 makes stocks independent. */
  marketDailyVolatility?: number;
  /** How strongly a large shock raises the volatility regime. Default 0.07, which keeps the regime near 0.35 standard deviation; 0 disables it. */
  clusterStrength?: number;
}

interface StockState {
  readonly entry: UniverseEntry;
  readonly rng: Rng;
  /** Daily volatility left after the part the market factor explains. */
  readonly ownVolatility: number;
  price: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  regime: number;
  lastTickAt: number;
  nextTickAt: number;
  lastMarketLevel: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

function requireNonNegative(name: string, value: number): void {
  if (!(value >= 0)) {
    throw new RangeError(`${name} must be zero or more, got ${value}`);
  }
}

export class MarketSimulator {
  private readonly states: StockState[];
  private readonly bySymbol: Map<string, StockState>;
  private readonly marketRng: Rng;
  private readonly volatilityScale: number;
  private readonly marketVolatility: number;
  private readonly clusterStrength: number;

  private time: number;
  private marketTime: number;
  private marketLevel = 0;
  private nextBoundary: number;

  constructor(universe: readonly UniverseEntry[], options: SimulatorOptions) {
    const volatilityScale = options.volatilityScale ?? 1;
    if (!(volatilityScale > 0)) {
      throw new RangeError(`volatilityScale must be positive, got ${volatilityScale}`);
    }
    const marketVolatility = options.marketDailyVolatility ?? 0.01;
    const clusterStrength = options.clusterStrength ?? 0.07;
    requireNonNegative('marketDailyVolatility', marketVolatility);
    requireNonNegative('clusterStrength', clusterStrength);

    this.volatilityScale = volatilityScale;
    this.marketVolatility = marketVolatility;
    this.clusterStrength = clusterStrength;
    this.time = options.startTime;
    this.marketTime = options.startTime;
    this.nextBoundary = (Math.floor(options.startTime / DAY_MS) + 1) * DAY_MS;
    this.marketRng = rngFor(options.seed, 'market');
    this.states = universe.map((entry) => this.createState(entry, options));
    this.bySymbol = new Map(this.states.map((state) => [state.entry.symbol, state]));
  }

  quotes(): Quote[] {
    return this.states.map((state) => this.toQuote(state));
  }

  quote(symbol: string): Quote | undefined {
    const state = this.bySymbol.get(symbol);
    return state && this.toQuote(state);
  }

  latestTick(symbol: string): PriceTick | undefined {
    const state = this.bySymbol.get(symbol);
    return (
      state && {
        symbol,
        price: state.price,
        volume: state.volume,
        timestamp: state.lastTickAt,
      }
    );
  }

  /** Diagnostics: the current volatility regime of a stock. 1 is normal. */
  volatilityMultiplier(symbol: string): number | undefined {
    return this.bySymbol.get(symbol)?.regime;
  }

  /** Moves time to `now` and returns the ticks emitted since the last call, in time order. */
  advance(now: number): PriceTick[] {
    if (now <= this.time) {
      return [];
    }

    const windowStart = Math.max(this.time, now - MAX_CATCH_UP_MS);
    if (windowStart > this.time) {
      this.skipTo(windowStart);
    }

    const ticks: PriceTick[] = [];
    for (;;) {
      const next = this.earliest();
      const tickAt = next?.nextTickAt ?? Number.POSITIVE_INFINITY;
      if (next && tickAt <= now && tickAt < this.nextBoundary) {
        ticks.push(this.step(next, tickAt));
      } else if (this.nextBoundary <= now) {
        this.rollOver();
      } else {
        break;
      }
    }

    this.time = now;
    return ticks;
  }

  private createState(entry: UniverseEntry, options: SimulatorOptions): StockState {
    const init = rngFor(options.seed, entry.symbol, 'init');
    const sigma = entry.dailyVolatility;
    const marketShare = entry.beta * this.marketVolatility;
    const ownVolatility = Math.sqrt(
      Math.max(sigma ** 2 - marketShare ** 2, (MIN_IDIOSYNCRATIC_SHARE * sigma) ** 2),
    );

    const price = entry.snapshotPrice;
    const previousClose = Math.max(0.01, round2(price / Math.exp(sigma * init.normal())));
    const open = Math.max(0.01, round2(previousClose * Math.exp(0.3 * sigma * init.normal())));
    const top = Math.max(open, price);
    const bottom = Math.min(open, price);
    const high = Math.max(round2(top * (1 + 0.2 * sigma * Math.abs(init.normal()))), top);
    const low = Math.min(
      Math.max(round2(bottom * (1 - 0.2 * sigma * Math.abs(init.normal()))), 0.01),
      bottom,
    );
    const dayFraction = (((options.startTime % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS;
    const volume = Math.round(entry.avgDailyVolume * dayFraction * (0.8 + 0.4 * init.next()));

    const rng = rngFor(options.seed, entry.symbol, 'live');
    return {
      entry,
      rng,
      ownVolatility,
      price,
      previousClose,
      open,
      high,
      low,
      volume,
      regime: 1,
      lastTickAt: options.startTime,
      nextTickAt: options.startTime + this.gap(rng, entry),
      lastMarketLevel: 0,
    };
  }

  private gap(rng: Rng, entry: UniverseEntry): number {
    return Math.max(1, Math.round(rng.exponential(entry.ticksPerSecond) * 1000));
  }

  private earliest(): StockState | undefined {
    let found: StockState | undefined;
    for (const state of this.states) {
      if (!found || state.nextTickAt < found.nextTickAt) {
        found = state;
      }
    }
    return found;
  }

  /** Jumps over idle time: no ticks for it, but days still roll over and tick clocks restart. */
  private skipTo(time: number): void {
    while (this.nextBoundary <= time) {
      this.rollOver();
    }
    for (const state of this.states) {
      if (state.nextTickAt < time) {
        state.lastTickAt = time;
        state.nextTickAt = time + this.gap(state.rng, state.entry);
      }
    }
    this.marketTime = Math.max(this.marketTime, time);
    this.time = time;
  }

  private advanceMarket(until: number): void {
    const stepScale = this.volatilityScale * Math.sqrt(MARKET_STEP_MS / DAY_MS);
    while (this.marketTime + MARKET_STEP_MS <= until) {
      this.marketTime += MARKET_STEP_MS;
      this.marketLevel += this.marketVolatility * stepScale * this.marketRng.normal();
    }
  }

  private step(state: StockState, at: number): PriceTick {
    this.advanceMarket(at);

    const days = Math.max(at - state.lastTickAt, 1) / DAY_MS;
    const shock = state.rng.normal();
    const marketMove = state.entry.beta * (this.marketLevel - state.lastMarketLevel);
    const own = state.ownVolatility * this.volatilityScale * state.regime * Math.sqrt(days) * shock;
    const pull =
      REVERSION_PER_DAY * (Math.log(state.entry.snapshotPrice) - Math.log(state.price)) * days;

    state.price = Math.max(0.01, round2(state.price * Math.exp(marketMove + own + pull)));
    state.high = Math.max(state.high, state.price);
    state.low = Math.min(state.low, state.price);
    state.volume += Math.max(
      1,
      Math.round(
        (state.entry.avgDailyVolume / (state.entry.ticksPerSecond * 86_400)) *
          (0.5 + state.rng.next()),
      ),
    );
    state.regime = clamp(
      1 +
        (state.regime - 1) * VOLATILITY_DECAY +
        this.clusterStrength * (Math.abs(shock) - MEAN_ABSOLUTE_SHOCK),
      VOLATILITY_MIN,
      VOLATILITY_MAX,
    );
    state.lastTickAt = at;
    state.lastMarketLevel = this.marketLevel;
    state.nextTickAt = at + this.gap(state.rng, state.entry);

    return { symbol: state.entry.symbol, price: state.price, volume: state.volume, timestamp: at };
  }

  /** At 00:00 UTC the last price becomes the previous close and the day's range restarts. */
  private rollOver(): void {
    for (const state of this.states) {
      state.previousClose = state.price;
      state.open = state.price;
      state.high = state.price;
      state.low = state.price;
      state.volume = 0;
    }
    this.nextBoundary += DAY_MS;
  }

  private toQuote(state: StockState): Quote {
    const move = state.price - state.previousClose;
    return {
      symbol: state.entry.symbol,
      price: state.price,
      previousClose: state.previousClose,
      open: state.open,
      high: state.high,
      low: state.low,
      volume: state.volume,
      change: round2(move),
      changePercent: round2((move / state.previousClose) * 100),
      timestamp: state.lastTickAt,
    };
  }
}
