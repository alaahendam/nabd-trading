import { type HistoryData, type Period, type PriceTick, type StockWithQuote } from '@nabd/shared';
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

import { CLOCK, type Clock } from '../../common/clock.js';
import { generateHistory } from './history.js';
import { MARKET_OPTIONS, type MarketOptions } from './market.options.js';
import { MarketSimulator } from './simulator.js';
import { getUniverseEntry, STOCK_UNIVERSE, toStock } from './universe.js';

/** Owns the simulated market: steps it on a timer and publishes each step's ticks. */
@Injectable()
export class MarketService implements OnModuleInit, OnModuleDestroy {
  private readonly simulator: MarketSimulator;
  private readonly subject = new Subject<PriceTick[]>();
  private timer: NodeJS.Timeout | undefined;

  /** One batch per step, in time order. Each batch has at least one tick. */
  readonly ticks$: Observable<PriceTick[]> = this.subject.asObservable();

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(MARKET_OPTIONS) private readonly options: MarketOptions,
  ) {
    this.simulator = new MarketSimulator(STOCK_UNIVERSE, {
      seed: options.seed,
      startTime: clock.now(),
      volatilityScale: options.volatilityScale,
    });
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.step();
    }, this.options.stepMs);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
    this.subject.complete();
  }

  /** Moves the market to the clock's time and publishes the ticks that produced. */
  step(): void {
    const ticks = this.simulator.advance(this.clock.now());
    if (ticks.length > 0) {
      this.subject.next(ticks);
    }
  }

  symbols(): string[] {
    return STOCK_UNIVERSE.map((entry) => entry.symbol);
  }

  hasSymbol(symbol: string): boolean {
    return getUniverseEntry(symbol) !== undefined;
  }

  stocks(): StockWithQuote[] {
    return this.simulator.snapshot().map(({ entry, quote }) => ({ ...toStock(entry), quote }));
  }

  stock(symbol: string): StockWithQuote | undefined {
    const entry = getUniverseEntry(symbol);
    const quote = this.simulator.quote(symbol);
    return entry && quote ? { ...toStock(entry), quote } : undefined;
  }

  history(symbol: string, period: Period): HistoryData | undefined {
    const entry = getUniverseEntry(symbol);
    const quote = this.simulator.quote(symbol);
    return entry && quote
      ? generateHistory(entry, period, this.clock.now(), quote.price)
      : undefined;
  }

  latestTick(symbol: string): PriceTick | undefined {
    return this.simulator.latestTick(symbol);
  }
}
