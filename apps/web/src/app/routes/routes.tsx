import type { ErrorInfo } from 'react';
import { Navigate, type RouteObject } from 'react-router';

import { Shell } from '../layout/shell';
import { NotFoundPage } from './pages/not-found-page';
import { StockPage } from './pages/stock-page';
import { StocksPage } from './pages/stocks-page';
import { WatchlistPage } from './pages/watchlist-page';

export function createAppRoutes({
  onError,
}: {
  onError: (error: Error, info: ErrorInfo) => void;
}): RouteObject[] {
  return [
    {
      element: <Shell onError={onError} />,
      children: [
        { index: true, element: <Navigate to="/stocks" replace /> },
        { path: 'stocks', element: <StocksPage /> },
        { path: 'stocks/:symbol', element: <StockPage /> },
        { path: 'watchlist', element: <WatchlistPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}
