import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../../lib/api';
import { createFeatureHarness } from '../../test/feature-harness';
import { aapl, aaplHistory } from '../../test/fixtures';
import { StockDetail } from './stock-detail';

afterEach(() => {
  vi.useRealTimers();
});

const stat = (label: string) => {
  const term = screen.getByText(label);
  if (!term.nextElementSibling) {
    throw new Error(`No value next to ${label}`);
  }
  return term.nextElementSibling;
};

interface Options {
  language?: 'en' | 'ar';
  firstFailure?: Error;
  renderAction?: (symbol: string) => React.ReactNode;
  symbol?: string;
}

/** Stubs the API first, then renders, because the page asks for its data as it mounts. */
function renderDetail(options: Options = {}) {
  const { language, firstFailure, renderAction, symbol = 'AAPL' } = options;
  const harness = createFeatureHarness(language === undefined ? {} : { language });
  if (firstFailure) {
    harness.api.getStock.mockRejectedValueOnce(firstFailure);
  }
  harness.api.getStock.mockResolvedValue(aapl);
  harness.api.getHistory.mockResolvedValue(aaplHistory);
  const view = render(
    <StockDetail symbol={symbol} {...(renderAction === undefined ? {} : { renderAction })} />,
    { wrapper: harness.Wrapper },
  );
  return { ...harness, ...view };
}

describe('StockDetail', () => {
  it('DET-01 shows a busy loading status', () => {
    const harness = createFeatureHarness();
    harness.api.getStock.mockReturnValue(new Promise(() => undefined));
    render(<StockDetail symbol="AAPL" />, { wrapper: harness.Wrapper });
    expect(screen.getByRole('status', { name: 'Loading stock…' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('DET-02 shows the header', async () => {
    const { api } = renderDetail();
    expect(await screen.findByRole('heading', { level: 1, name: 'AAPL' })).toBeInTheDocument();
    expect(api.getStock).toHaveBeenCalledWith('AAPL', expect.any(AbortSignal));
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('NASDAQ · Technology')).toBeInTheDocument();
    expect(screen.getByText('$230.00')).toBeInTheDocument();
    expect(screen.getByText('+$2.00 (+0.88%)')).toBeInTheDocument();
  });

  it('DET-13 isolates the English name and the exchange line inside Arabic text', async () => {
    renderDetail({ language: 'ar' });
    await screen.findByRole('heading', { name: 'AAPL' });
    expect(screen.getByText('Apple Inc.').tagName).toBe('BDI');
    expect(screen.getByText('NASDAQ · Technology').tagName).toBe('BDI');
  });

  it('DET-03 shows the live price, its change and the live volume', async () => {
    const { connect, tick } = renderDetail();
    await screen.findByRole('heading', { name: 'AAPL' });
    connect();
    tick([{ symbol: 'AAPL', price: 235, volume: 2000 }]);

    expect(document.querySelector('[data-direction]')).toHaveTextContent('$235.00');
    expect(screen.getByText('+$7.00 (+3.07%)')).toBeInTheDocument();
    expect(stat('Volume')).toHaveTextContent('2K');
  });

  it('DET-04 lists the stats with labels', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'AAPL' });
    expect(stat('Open')).toHaveTextContent('$229.00');
    expect(stat('High')).toHaveTextContent('$231.00');
    expect(stat('Low')).toHaveTextContent('$227.50');
    expect(stat('Previous close')).toHaveTextContent('$228.00');
    expect(stat('Volume')).toHaveTextContent('1M');
  });

  it('DET-05 lets the day range follow the live price', async () => {
    const { connect, tick } = renderDetail();
    await screen.findByRole('heading', { name: 'AAPL' });
    connect();
    tick([{ symbol: 'AAPL', price: 233 }]);
    expect(stat('High')).toHaveTextContent('$233.00');
    tick([{ symbol: 'AAPL', price: 225 }]);
    expect(stat('Low')).toHaveTextContent('$225.00');
  });

  it('DET-06 subscribes to its symbol only, and lets go when hidden', async () => {
    function Screen() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setShown(false);
            }}
          >
            Hide
          </button>
          {shown ? <StockDetail symbol="AAPL" /> : null}
        </>
      );
    }
    const harness = createFeatureHarness();
    harness.api.getStock.mockResolvedValue(aapl);
    harness.api.getHistory.mockResolvedValue(aaplHistory);
    render(<Screen />, { wrapper: harness.Wrapper });
    await screen.findByRole('heading', { name: 'AAPL' });
    harness.connect();
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.socket.calls.subscribe).toEqual([['AAPL']]);

    await userEvent.click(screen.getByRole('button', { name: 'Hide' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.socket.calls.unsubscribe).toEqual([['AAPL']]);
  });

  it('DET-07 shows an error with a retry that loads the stock', async () => {
    const { api } = renderDetail({
      firstFailure: new ApiClientError({ kind: 'http', status: 400, message: 'bad' }),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this stock');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'AAPL' })).toBeInTheDocument();
    expect(api.getStock).toHaveBeenCalledTimes(2);
  });

  it('DET-08 says so when the stock does not exist, with a way back', async () => {
    renderDetail({
      symbol: 'ZZZZ',
      firstFailure: new ApiClientError({
        kind: 'http',
        status: 404,
        code: 'NOT_FOUND',
        message: 'No stock with symbol ZZZZ',
      }),
    });
    const message = await screen.findByRole('alert');
    expect(message).toHaveTextContent('Stock not found');
    expect(message).toHaveTextContent('ZZZZ');
    expect(screen.getByRole('link', { name: 'Back to stocks' })).toHaveAttribute('href', '/stocks');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('DET-09 renders the action slot in the header with the symbol', async () => {
    renderDetail({ renderAction: (symbol) => <button type="button">{`Act on ${symbol}`}</button> });
    expect(await screen.findByRole('button', { name: 'Act on AAPL' })).toBeInTheDocument();
  });

  it('DET-10 reads in Arabic with Latin figures', async () => {
    renderDetail({ language: 'ar' });
    await screen.findByRole('heading', { name: 'AAPL' });
    expect(stat('الافتتاح')).toHaveTextContent('$229.00');
    expect(stat('حجم التداول')).toHaveTextContent('1M');
    expect(screen.getByText('$230.00')).toHaveClass('numeric');
    expect(screen.getByText('ارتفاع')).toBeInTheDocument();
  });

  it('DET-11 marks a price as delayed after ten silent seconds', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const { connect, tick } = renderDetail();
    // Wait for the page itself, not for a few fake milliseconds (see LST-07).
    await screen.findByRole('heading', { name: 'AAPL' });
    connect();
    tick([{ symbol: 'AAPL', price: 231 }]);
    expect(screen.queryByText('Delayed')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(11_000);
    });
    expect(screen.getByText('Delayed')).toBeInTheDocument();
  });

  it('DET-12 keeps the page when a refresh fails after it loaded', async () => {
    const { api, queryClient } = renderDetail();
    await screen.findByRole('heading', { name: 'AAPL' });

    api.getStock.mockRejectedValueOnce(
      new ApiClientError({ kind: 'http', status: 400, message: 'x' }),
    );
    await act(async () => {
      await queryClient.refetchQueries();
    });

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(within(document.body).getByText('Apple Inc.')).toBeInTheDocument();
  });
});
