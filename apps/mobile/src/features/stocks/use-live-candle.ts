import { applyLivePrice, type Candle } from '@nabd/domain';
import type { LivePrice } from '@nabd/market-data';
import { useState } from 'react';

interface Tracked {
  candles: readonly Candle[];
  tick: LivePrice | undefined;
  candle: Candle | undefined;
}

/**
 * The last candle with the live price laid over it: each tick widens the candle's high and low and
 * moves its close, and a tick past the candle's bucket starts a new one. Loading other history
 * starts from that history's own last candle. There is nothing before the first tick, so the chart
 * shows the loaded history as it is.
 *
 * This keeps what it has seen in state and adjusts it while rendering, as React documents for a
 * value derived from props and its own earlier value.
 */
export function useLiveCandle(
  candles: readonly Candle[],
  bucketMs: number | undefined,
  tick: LivePrice | undefined,
): Candle | undefined {
  const [tracked, setTracked] = useState<Tracked>({ candles, tick: undefined, candle: undefined });

  if (tracked.candles === candles && tracked.tick === tick) {
    return tracked.candle;
  }

  let candle: Candle | undefined;
  if (tick !== undefined && bucketMs !== undefined && candles.length > 0) {
    const sameHistory = tracked.candles === candles;
    candle = applyLivePrice(sameHistory ? (tracked.candle ?? candles.at(-1)) : candles.at(-1), {
      price: tick.price,
      timestamp: tick.timestamp,
      bucketMs,
    });
  }
  setTracked({ candles, tick, candle });
  return candle;
}
