import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { aapl, aaplHistory, brkb } from './fixtures';

/** The mock API for every test. Handlers are added per test; any unhandled request fails it. */
export const server = setupServer();

export const API_URL = 'http://api.test';

/** One stock, for tests that render its detail page. */
export const stockHandler = http.get(`${API_URL}/api/stocks/AAPL`, () =>
  HttpResponse.json({ data: aapl }),
);

/** The history behind the chart on the detail page. */
export const historyHandler = http.get(`${API_URL}/api/stocks/AAPL/history`, () =>
  HttpResponse.json({ data: aaplHistory }),
);

/** The stock list, for tests that render a screen showing it. */
export const stocksHandler = http.get(`${API_URL}/api/stocks`, () =>
  HttpResponse.json({ data: [aapl, brkb] }),
);
