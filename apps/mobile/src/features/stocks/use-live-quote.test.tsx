import { aapl } from '@nabd/testing';

import { createTestApp } from '../../test-app';
import { useLiveQuote } from './use-live-quote';

const { quote } = aapl;

describe('useLiveQuote', () => {
  it('LQ-01 uses the quote when there is no live price', async () => {
    const app = createTestApp();

    const { result } = await app.renderHook(() => useLiveQuote(quote));

    expect(result.current).toMatchObject({
      price: 230,
      change: 2,
      direction: 'flat',
      freshness: 'none',
    });
  });

  it('LQ-02 replaces the quote price with a live price', async () => {
    const app = createTestApp();
    const { result } = await app.renderHook(() => useLiveQuote(quote));
    await app.connect();

    await app.tick('AAPL', 232);

    expect(result.current.price).toBe(232);
    expect(result.current.volume).toBe(1_500_000);
  });

  it('LQ-03 computes change and percent from the live price and the previous close', async () => {
    const app = createTestApp();
    const { result } = await app.renderHook(() => useLiveQuote(quote));

    await app.tick('AAPL', 232);

    expect(result.current.change).toBe(4);
    expect(result.current.changePercent).toBeCloseTo((4 / 228) * 100, 10);
  });

  it('LQ-04 is flat until two ticks arrived, then follows the last move', async () => {
    const app = createTestApp();
    const { result } = await app.renderHook(() => useLiveQuote(quote));

    await app.tick('AAPL', 232);
    expect(result.current.direction).toBe('flat');
    await app.tick('AAPL', 231);
    expect(result.current.direction).toBe('down');
    await app.tick('AAPL', 233);
    expect(result.current.direction).toBe('up');
  });

  it('LQ-05 widens the high and low when the live price goes beyond them', async () => {
    const app = createTestApp();
    const { result } = await app.renderHook(() => useLiveQuote(quote));

    await app.tick('AAPL', 235);
    expect(result.current.high).toBe(235);
    await app.tick('AAPL', 220);

    expect(result.current.high).toBe(235);
    expect(result.current.low).toBe(220);
  });

  it('LQ-06 is stale while the connection is not live, and fresh once it is', async () => {
    const app = createTestApp();
    const { result } = await app.renderHook(() => useLiveQuote(quote));

    await app.tick('AAPL', 232);
    expect(result.current.freshness).toBe('stale');
    await app.connect();

    expect(result.current.freshness).toBe('fresh');
  });
});
