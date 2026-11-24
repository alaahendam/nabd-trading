import type { StocksQuery, StocksResponse, StockWithQuote } from '@nabd/shared';

import { ApiException } from '../../common/api-exception.js';

/**
 * One page of the ordered stock list. The cursor is the last symbol of the previous page, which
 * stays valid while the list does not change. A `symbols` filter returns just those stocks, in list
 * order, and is not paged. Without a limit everything after the cursor is returned.
 */
export function paginateStocks(
  stocks: readonly StockWithQuote[],
  { limit, cursor, symbols }: StocksQuery,
): StocksResponse {
  if (symbols !== undefined) {
    const wanted = new Set(symbols);
    const data = stocks.filter((stock) => wanted.has(stock.symbol));
    return { data, nextCursor: null, total: data.length };
  }

  let start = 0;
  if (cursor !== undefined) {
    const index = stocks.findIndex((stock) => stock.symbol === cursor);
    if (index === -1) {
      throw new ApiException('VALIDATION_ERROR', `Unknown cursor ${cursor}`);
    }
    start = index + 1;
  }

  const end = limit === undefined ? stocks.length : start + limit;
  const data = stocks.slice(start, end);
  const last = data.at(-1);
  return {
    data,
    nextCursor: end < stocks.length && last !== undefined ? last.symbol : null,
    total: stocks.length,
  };
}
