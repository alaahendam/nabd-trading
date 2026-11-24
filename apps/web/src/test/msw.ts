import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { aapl, brkb } from './fixtures';

/** The mock API for every test. Handlers are added per test; any unhandled request fails it. */
export const server = setupServer();

export const API_URL = 'http://api.test';

/** The stock list, for tests that render a screen showing it. */
export const stocksHandler = http.get(`${API_URL}/api/stocks`, () =>
  HttpResponse.json({ data: [aapl, brkb] }),
);
