import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { aapl, aaplHistory, brkb, watchlistItem } from '../../test/fixtures';
import { API_URL, server } from '../../test/msw';
import { ApiClientError } from './api-error';
import { createApi } from './endpoints';
import { createHttpClient } from './http-client';

const api = createApi(
  createHttpClient({ baseUrl: API_URL, getClientId: () => '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b' }),
);

const caught = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('createApi', () => {
  it('EPT-01 lists stocks with their quotes', async () => {
    server.use(
      http.get(`${API_URL}/api/stocks`, () =>
        HttpResponse.json({ data: [aapl, brkb], nextCursor: null, total: 2 }),
      ),
    );
    expect(await api.listStocks()).toEqual([aapl, brkb]);
  });

  it('EPT-02 gets one stock, keeping a dotted symbol readable in the path', async () => {
    const paths: string[] = [];
    server.use(
      http.get(`${API_URL}/api/stocks/:symbol`, ({ request, params }) => {
        paths.push(new URL(request.url).pathname);
        return HttpResponse.json({ data: params['symbol'] === 'BRK.B' ? brkb : aapl });
      }),
    );
    expect((await api.getStock('AAPL')).symbol).toBe('AAPL');
    expect((await api.getStock('BRK.B')).symbol).toBe('BRK.B');
    expect(paths).toEqual(['/api/stocks/AAPL', '/api/stocks/BRK.B']);
  });

  it('EPT-03 gets history for a period', async () => {
    let period: string | null = null;
    server.use(
      http.get(`${API_URL}/api/stocks/AAPL/history`, ({ request }) => {
        period = new URL(request.url).searchParams.get('period');
        return HttpResponse.json({ data: aaplHistory });
      }),
    );
    expect(await api.getHistory('AAPL', '1W')).toEqual(aaplHistory);
    expect(period).toBe('1W');
  });

  it('EPT-04 lists, adds and removes watchlist items', async () => {
    const calls: string[] = [];
    server.use(
      http.get(`${API_URL}/api/watchlist`, () => {
        calls.push('GET');
        return HttpResponse.json({ data: [watchlistItem] });
      }),
      http.put(`${API_URL}/api/watchlist/AAPL`, () => {
        calls.push('PUT');
        return HttpResponse.json({ data: watchlistItem });
      }),
      http.delete(`${API_URL}/api/watchlist/AAPL`, () => {
        calls.push('DELETE');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    expect(await api.listWatchlist()).toEqual([watchlistItem]);
    expect(await api.addToWatchlist('AAPL')).toEqual(watchlistItem);
    await expect(api.removeFromWatchlist('AAPL')).resolves.toBeUndefined();
    expect(calls).toEqual(['GET', 'PUT', 'DELETE']);
  });

  it('EPT-05 surfaces server errors with their code', async () => {
    server.use(
      http.get(`${API_URL}/api/stocks/NOPE`, () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'No stock with symbol NOPE' } },
          { status: 404 },
        ),
      ),
    );
    const error = await caught(api.getStock('NOPE'));
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ kind: 'http', status: 404, code: 'NOT_FOUND' });
  });

  it('EPT-06 catches data that breaks the shared contract', async () => {
    const broken = { ...aapl, quote: { ...aapl.quote, high: 100 } };
    server.use(http.get(`${API_URL}/api/stocks/AAPL`, () => HttpResponse.json({ data: broken })));
    const error = await caught(api.getStock('AAPL'));
    expect(error).toMatchObject({ kind: 'parse' });
  });

  it('EPT-07 can be aborted', async () => {
    server.use(
      http.get(`${API_URL}/api/stocks`, () =>
        HttpResponse.json({ data: [], nextCursor: null, total: 0 }),
      ),
    );
    const controller = new AbortController();
    controller.abort();
    const error = await caught(api.listStocks(controller.signal));
    expect((error as Error).name).toBe('AbortError');
  });
});
