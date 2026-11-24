import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { subscribeTick } from './clock-ticker';

describe('subscribeTick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('HK-09 calls every listener each second from a single timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = subscribeTick(first);
    const stopSecond = subscribeTick(second);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(2000);
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);

    stopFirst();
    stopSecond();
  });

  it('HK-09 keeps the timer while a listener remains and stops it after the last', () => {
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = subscribeTick(first);
    const stopSecond = subscribeTick(second);

    stopFirst();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    stopSecond();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('HK-09 starts a fresh timer later and tolerates stopping twice', () => {
    const listener = vi.fn();
    const stop = subscribeTick(listener);
    stop();
    stop();
    expect(vi.getTimerCount()).toBe(0);

    const again = subscribeTick(listener);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);
    again();
  });
});
