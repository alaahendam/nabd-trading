import type { Period } from '@nabd/shared';

export const queryKeys = {
  stocks: () => ['stocks'] as const,
  /** The infinite list of every stock, loaded a page at a time. */
  stockPages: () => ['stocks', 'pages'] as const,
  /** A filtered list: the same symbols give the same key, whatever the order. */
  stocksBySymbols: (symbols: readonly string[]) =>
    ['stocks', 'by-symbols', [...new Set(symbols)].sort().join(',')] as const,
  stock: (symbol: string) => ['stocks', symbol] as const,
  history: (symbol: string, period: Period) => ['stocks', symbol, 'history', period] as const,
  watchlist: () => ['watchlist'] as const,
};
