import type { Period } from '@nabd/shared';

export const queryKeys = {
  stocks: () => ['stocks'] as const,
  stock: (symbol: string) => ['stocks', symbol] as const,
  history: (symbol: string, period: Period) => ['stocks', symbol, 'history', period] as const,
  watchlist: () => ['watchlist'] as const,
};
