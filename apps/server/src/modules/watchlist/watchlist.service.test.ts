import { describe, expect, it } from 'vitest';

import { ApiException } from '../../common/api-exception.js';
import type { Clock } from '../../common/clock.js';
import type { MarketService } from '../market/index.js';
import { InMemoryWatchlistRepository } from './in-memory-watchlist.repository.js';
import { WatchlistService } from './watchlist.service.js';

class FakeClock implements Clock {
  constructor(public time = 1000) {}
  now(): number {
    return this.time;
  }
}

const market = {
  hasSymbol: (symbol: string) => ['AAPL', 'MSFT', 'NVDA'].includes(symbol),
} as unknown as MarketService;

const make = () => {
  const clock = new FakeClock();
  return { clock, service: new WatchlistService(new InMemoryWatchlistRepository(), market, clock) };
};

describe('WatchlistService', () => {
  it('WLS-01 adds an item stamped by the clock', () => {
    const { service } = make();
    expect(service.add('a', 'AAPL')).toEqual({ symbol: 'AAPL', addedAt: 1000 });
    expect(service.list('a')).toEqual([{ symbol: 'AAPL', addedAt: 1000 }]);
  });

  it('WLS-02 add is idempotent and keeps the first addedAt', () => {
    const { clock, service } = make();
    service.add('a', 'AAPL');
    clock.time = 5000;
    expect(service.add('a', 'AAPL')).toEqual({ symbol: 'AAPL', addedAt: 1000 });
    expect(service.list('a')).toHaveLength(1);
  });

  it('WLS-03 rejects an unknown symbol and saves nothing', () => {
    const { service } = make();
    expect(() => service.add('a', 'NOPE')).toThrow(ApiException);
    expect(service.list('a')).toEqual([]);
  });

  it('WLS-04 removes an item', () => {
    const { service } = make();
    service.add('a', 'AAPL');
    service.remove('a', 'AAPL');
    expect(service.list('a')).toEqual([]);
  });

  it('WLS-05 remove is idempotent, even for symbols that never existed', () => {
    const { service } = make();
    service.add('a', 'AAPL');
    service.remove('a', 'MSFT');
    service.remove('a', 'NOPE');
    expect(service.list('a')).toHaveLength(1);
  });

  it('WLS-06 lists in the order items were added', () => {
    const { service } = make();
    service.add('a', 'MSFT');
    service.add('a', 'AAPL');
    expect(service.list('a').map((entry) => entry.symbol)).toEqual(['MSFT', 'AAPL']);
  });

  it('WLS-07 keeps clients apart', () => {
    const { service } = make();
    service.add('a', 'AAPL');
    service.add('b', 'NVDA');
    expect(service.list('a').map((entry) => entry.symbol)).toEqual(['AAPL']);
    expect(service.list('b').map((entry) => entry.symbol)).toEqual(['NVDA']);
  });
});
