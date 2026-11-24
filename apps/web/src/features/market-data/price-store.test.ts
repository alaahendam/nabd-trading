import type { PriceTick } from '@nabd/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { animationFrameSchedule, PriceStore } from './price-store';

const tick = (symbol: string, price: number, timestamp: number, volume = 10): PriceTick => ({
  symbol,
  price,
  volume,
  timestamp,
});

/** A store whose frames only run when the test says so, and whose clock the test sets. */
const setup = () => {
  const pending: (() => void)[] = [];
  const cancel = vi.fn();
  const schedule = vi.fn((callback: () => void) => {
    pending.push(callback);
    return () => {
      cancel();
      const index = pending.indexOf(callback);
      if (index >= 0) {
        pending.splice(index, 1);
      }
    };
  });
  const clock = { time: 5000 };
  const store = new PriceStore({ now: () => clock.time, schedule });
  const runFrame = () => {
    for (const callback of pending.splice(0)) {
      callback();
    }
  };
  return { store, clock, schedule, cancel, runFrame, pending };
};

describe('PriceStore', () => {
  it('PST-01 publishes nothing before the frame', () => {
    const { store, schedule } = setup();
    store.apply([tick('AAPL', 100, 1)]);
    expect(store.get('AAPL')).toBeUndefined();
    expect(schedule).toHaveBeenCalledTimes(1);
  });

  it('PST-02 publishes the snapshot on the frame', () => {
    const { store, clock, runFrame } = setup();
    clock.time = 7000;
    store.apply([tick('AAPL', 100.25, 1234, 42)]);
    clock.time = 7016;
    runFrame();

    expect(store.get('AAPL')).toEqual({
      symbol: 'AAPL',
      price: 100.25,
      previousPrice: undefined,
      volume: 42,
      timestamp: 1234,
      receivedAt: 7000,
    });
  });

  it('PST-03 coalesces ticks within a frame', () => {
    const { store, runFrame } = setup();
    const listener = vi.fn();
    store.subscribe('AAPL', listener);

    store.apply([tick('AAPL', 100, 1), tick('AAPL', 101, 2)]);
    store.apply([tick('AAPL', 102, 3)]);
    runFrame();

    expect(store.get('AAPL')?.price).toBe(102);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('PST-04 keeps the last published price as previousPrice', () => {
    const { store, runFrame } = setup();
    store.apply([tick('AAPL', 100, 1)]);
    runFrame();
    expect(store.get('AAPL')?.previousPrice).toBeUndefined();

    store.apply([tick('AAPL', 101, 2)]);
    runFrame();
    expect(store.get('AAPL')?.previousPrice).toBe(100);

    store.apply([tick('AAPL', 101, 3)]);
    runFrame();
    expect(store.get('AAPL')?.previousPrice).toBe(101);
  });

  it('PST-05 ignores old and duplicate ticks without scheduling a frame', () => {
    const { store, schedule, runFrame } = setup();
    store.apply([tick('AAPL', 100, 10)]);
    store.apply([tick('AAPL', 99, 9), tick('AAPL', 98, 10)]);
    runFrame();
    expect(store.get('AAPL')?.price).toBe(100);

    schedule.mockClear();
    store.apply([tick('AAPL', 97, 10), tick('AAPL', 96, 5)]);
    expect(schedule).not.toHaveBeenCalled();
    expect(store.get('AAPL')?.price).toBe(100);
  });

  it('PST-06 notifies listeners per symbol', () => {
    const { store, runFrame } = setup();
    const aapl = vi.fn();
    const msft = vi.fn();
    const all = vi.fn();
    store.subscribe('AAPL', aapl);
    store.subscribe('MSFT', msft);
    store.subscribeAll(all);

    store.apply([tick('AAPL', 100, 1)]);
    runFrame();
    expect(aapl).toHaveBeenCalledTimes(1);
    expect(msft).not.toHaveBeenCalled();
    expect(all).toHaveBeenCalledTimes(1);

    store.apply([tick('AAPL', 101, 2), tick('MSFT', 50, 2)]);
    runFrame();
    expect(aapl).toHaveBeenCalledTimes(2);
    expect(msft).toHaveBeenCalledTimes(1);
    expect(all).toHaveBeenCalledTimes(2);
  });

  it('PST-07 returns stable snapshots', () => {
    const { store, runFrame } = setup();
    store.apply([tick('AAPL', 100, 1)]);
    runFrame();
    const first = store.get('AAPL');
    expect(store.get('AAPL')).toBe(first);

    store.apply([tick('AAPL', 101, 2)]);
    expect(store.get('AAPL')).toBe(first);
    runFrame();
    expect(store.get('AAPL')).not.toBe(first);
  });

  it('PST-08 stops notifying after unsubscribe', () => {
    const { store, runFrame } = setup();
    const symbolListener = vi.fn();
    const allListener = vi.fn();
    const stopSymbol = store.subscribe('AAPL', symbolListener);
    const stopAll = store.subscribeAll(allListener);

    stopSymbol();
    stopSymbol();
    stopAll();
    stopAll();
    store.apply([tick('AAPL', 100, 1)]);
    runFrame();

    expect(symbolListener).not.toHaveBeenCalled();
    expect(allListener).not.toHaveBeenCalled();
  });

  it('PST-08 keeps other listeners of the same symbol when one unsubscribes', () => {
    const { store, runFrame } = setup();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = store.subscribe('AAPL', first);
    store.subscribe('AAPL', second);

    stopFirst();
    store.apply([tick('AAPL', 100, 1)]);
    runFrame();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('PST-09 clears everything', () => {
    const { store, cancel, runFrame } = setup();
    const aapl = vi.fn();
    const all = vi.fn();
    store.apply([tick('AAPL', 100, 1)]);
    runFrame();
    store.subscribe('AAPL', aapl);
    store.subscribeAll(all);

    store.apply([tick('MSFT', 50, 1)]);
    store.clear();

    expect(store.get('AAPL')).toBeUndefined();
    expect(store.get('MSFT')).toBeUndefined();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(aapl).toHaveBeenCalledTimes(1);
    expect(all).toHaveBeenCalledTimes(1);

    runFrame();
    expect(store.get('MSFT')).toBeUndefined();
  });

  it('PST-09 clearing an empty store with no frame pending is harmless', () => {
    const { store, cancel } = setup();
    const all = vi.fn();
    store.subscribeAll(all);
    store.clear();
    expect(cancel).not.toHaveBeenCalled();
    expect(all).not.toHaveBeenCalled();
  });

  it('PST-10 schedules one frame at a time', () => {
    const { store, schedule, runFrame } = setup();
    store.apply([tick('AAPL', 100, 1)]);
    store.apply([tick('MSFT', 50, 1)]);
    expect(schedule).toHaveBeenCalledTimes(1);

    runFrame();
    store.apply([tick('AAPL', 101, 2)]);
    expect(schedule).toHaveBeenCalledTimes(2);
  });
});

describe('animationFrameSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('PST-11 runs on the next frame and can be cancelled', () => {
    const ran = vi.fn();
    animationFrameSchedule(ran);
    expect(ran).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(ran).toHaveBeenCalledTimes(1);

    const cancelled = vi.fn();
    const cancel = animationFrameSchedule(cancelled);
    cancel();
    vi.advanceTimersByTime(20);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('PST-12 works with default options and the real clock', () => {
    vi.setSystemTime(new Date(900_000));
    const store = new PriceStore();
    store.apply([tick('AAPL', 100, 1)]);
    vi.advanceTimersByTime(50);
    expect(store.get('AAPL')).toMatchObject({ price: 100, receivedAt: 900_000 });
  });
});
