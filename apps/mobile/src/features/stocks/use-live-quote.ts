import { type ChangeDirection, changeDirection } from '@nabd/i18n';
import { type Freshness, useFreshness, useLivePrice } from '@nabd/market-data';
import type { Quote } from '@nabd/shared';

export interface LiveQuote {
  price: number;
  /** The day's range, widened when the live price goes beyond the quote's. */
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  /** How the last tick moved the price. Flat until two ticks have arrived. */
  direction: ChangeDirection;
  freshness: Freshness;
}

/**
 * A quote from the REST API with the live price laid over it. Change and percent are computed
 * from the live price and the quote's previous close, so the price and its change always agree.
 * The web app has the same hook in `apps/web`; moving both into a shared package is a separate
 * change.
 */
export function useLiveQuote(quote: Quote): LiveQuote {
  const live = useLivePrice(quote.symbol);
  const freshness = useFreshness(quote.symbol);

  const price = live?.price ?? quote.price;
  const change = price - quote.previousClose;

  return {
    price,
    high: Math.max(quote.high, live?.high ?? price),
    low: Math.min(quote.low, live?.low ?? price),
    volume: live?.volume ?? quote.volume,
    change,
    changePercent: (change / quote.previousClose) * 100,
    direction:
      live?.previousPrice === undefined ? 'flat' : changeDirection(live.price - live.previousPrice),
    freshness,
  };
}
