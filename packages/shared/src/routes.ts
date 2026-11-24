/** Global prefix the server mounts every route under. */
export const API_PREFIX = '/api';

/** Route patterns, for the server's controllers. Paths are relative to `API_PREFIX`. */
export const ROUTES = {
  health: '/health',
  stocks: '/stocks',
  stock: '/stocks/:symbol',
  history: '/stocks/:symbol/history',
  watchlist: '/watchlist',
  watchlistItem: '/watchlist/:symbol',
} as const;

type SymbolRoutePattern = typeof ROUTES.stock | typeof ROUTES.history | typeof ROUTES.watchlistItem;

/** Fills `:symbol` with a URL-encoded symbol, for the client. */
export function symbolRoute(pattern: SymbolRoutePattern, symbol: string): string {
  return pattern.replace(':symbol', encodeURIComponent(symbol));
}
