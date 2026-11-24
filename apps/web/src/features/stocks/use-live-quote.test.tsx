import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFeatureHarness } from '../../test/feature-harness';
import { aapl } from '../../test/fixtures';
import { useLiveQuote } from './use-live-quote';

const { quote } = aapl;

const setup = () => {
  const harness = createFeatureHarness();
  const view = renderHook(() => useLiveQuote(quote), { wrapper: harness.Wrapper });
  return { ...harness, ...view };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('useLiveQuote', () => {
  it('LQ-01 uses the quote until a live price arrives', () => {
    const { result } = setup();
    expect(result.current).toMatchObject({
      price: 230,
      volume: 1_000_000,
      change: 2,
      direction: 'flat',
      freshness: 'none',
      tickKey: undefined,
    });
    expect(result.current.changePercent).toBeCloseTo(0.877, 3);
  });

  it('LQ-02 lets a tick take over the price, change and volume', () => {
    const { result, connect, tick } = setup();
    connect();
    tick([{ symbol: 'AAPL', price: 235, volume: 2000 }]);
    expect(result.current).toMatchObject({ price: 235, change: 7, volume: 2000 });
    expect(result.current.changePercent).toBeCloseTo(3.07, 2);
  });

  it('LQ-03 reports the direction against the previous tick', () => {
    const { result, connect, tick } = setup();
    connect();
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(result.current.direction).toBe('flat');
    tick([{ symbol: 'AAPL', price: 232 }]);
    expect(result.current.direction).toBe('up');
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(result.current.direction).toBe('down');
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(result.current.direction).toBe('flat');
  });

  it('LQ-04 changes the tick key with every tick', () => {
    const { result, connect, tick } = setup();
    connect();
    tick([{ symbol: 'AAPL', price: 231 }]);
    const first = result.current.tickKey;
    tick([{ symbol: 'AAPL', price: 232 }]);
    expect(first).toBeDefined();
    expect(result.current.tickKey).not.toBe(first);
  });

  it('LQ-05 follows the connection and the silence in freshness', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const { result, connect, tick, socket } = setup();
    connect();
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(result.current.freshness).toBe('fresh');

    act(() => {
      vi.advanceTimersByTime(11_000);
    });
    expect(result.current.freshness).toBe('stale');

    tick([{ symbol: 'AAPL', price: 232 }]);
    expect(result.current.freshness).toBe('fresh');

    act(() => {
      socket.simulateDisconnect('transport close');
    });
    expect(result.current.freshness).toBe('stale');
  });
});
