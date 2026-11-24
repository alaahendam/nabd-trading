import type { PriceTick } from '@nabd/shared';
import { describe, expect, it } from 'vitest';

import { TickBatcher } from './tick-batcher.js';

const tick = (symbol: string, timestamp: number): PriceTick => ({
  symbol,
  price: 100,
  volume: 10,
  timestamp,
});

describe('TickBatcher', () => {
  it('BAT-01 groups ticks by symbol in arrival order', () => {
    const batcher = new TickBatcher();
    batcher.push([tick('AAPL', 1), tick('MSFT', 2), tick('AAPL', 3)]);
    expect(batcher.drain()).toEqual(
      new Map([
        ['AAPL', [tick('AAPL', 1), tick('AAPL', 3)]],
        ['MSFT', [tick('MSFT', 2)]],
      ]),
    );
  });

  it('BAT-02 empties on drain', () => {
    const batcher = new TickBatcher();
    batcher.push([tick('AAPL', 1)]);
    expect(batcher.drain().size).toBe(1);
    expect(batcher.drain().size).toBe(0);
  });

  it('BAT-03 accumulates pushes until drained', () => {
    const batcher = new TickBatcher();
    batcher.push([tick('AAPL', 1)]);
    batcher.push([tick('AAPL', 2), tick('MSFT', 2)]);
    expect(batcher.drain().get('AAPL')).toEqual([tick('AAPL', 1), tick('AAPL', 2)]);
  });

  it('BAT-04 keeps only the most recent ticks per symbol', () => {
    const batcher = new TickBatcher(3);
    batcher.push([1, 2, 3, 4, 5].map((timestamp) => tick('AAPL', timestamp)));
    batcher.push([tick('MSFT', 9)]);
    const drained = batcher.drain();
    expect(drained.get('AAPL')?.map((item) => item.timestamp)).toEqual([3, 4, 5]);
    expect(drained.get('MSFT')).toEqual([tick('MSFT', 9)]);
  });

  it('BAT-06 knows which symbols are waiting', () => {
    const batcher = new TickBatcher();
    batcher.push([tick('AAPL', 1)]);
    expect(batcher.has('AAPL')).toBe(true);
    expect(batcher.has('MSFT')).toBe(false);
    batcher.drain();
    expect(batcher.has('AAPL')).toBe(false);
  });

  it.each([0, -1, 1.5])('BAT-05 rejects a cap of %s', (cap) => {
    expect(() => new TickBatcher(cap)).toThrow(RangeError);
  });
});
