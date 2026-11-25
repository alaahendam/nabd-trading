import type { HistoryRange } from '@nabd/shared';
import { type HistoryData, PERIOD_CONFIG } from '@nabd/shared';
import { aaplHistory } from '@nabd/testing';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFeatureHarness } from '../../test/feature-harness';
import { StockChart } from './stock-chart';

const NOW = Date.UTC(2026, 5, 17, 13, 0, 0);
const HALF_HOUR = 1_800_000;

/** What the server answers: a period has its own candle size, a custom range 30 minutes here. */
const historyFor = (symbol: string, range: HistoryRange): HistoryData => ({
  ...aaplHistory,
  symbol,
  period: typeof range === 'string' ? range : 'custom',
  bucketMs: typeof range === 'string' ? PERIOD_CONFIG[range].bucketMs : HALF_HOUR,
});

function renderChart(language?: 'en' | 'ar') {
  const harness = createFeatureHarness(language === undefined ? {} : { language });
  harness.api.getHistory.implement((symbol, range) => Promise.resolve(historyFor(symbol, range)));
  const view = render(<StockChart symbol="AAPL" />, { wrapper: harness.Wrapper });
  return { ...harness, ...view };
}

const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
  await screen.findByRole('figure');
  await act(async () => {
    await Promise.resolve();
  });
};

const openCustom = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Custom' }));
};

const apply = async (from: string, to: string) => {
  fireEvent.change(screen.getByLabelText('From'), { target: { value: from } });
  fireEvent.change(screen.getByLabelText('To'), { target: { value: to } });
  await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('StockChart custom range', () => {
  it('CHT-19 opens a form with two date fields and Apply, and requests nothing yet', async () => {
    const { api } = renderChart();
    await settle();
    expect(api.getHistory.calls).toHaveLength(1);

    await openCustom();

    const from = screen.getByLabelText('From');
    const to = screen.getByLabelText('To');
    expect(from).toHaveAttribute('type', 'date');
    expect(to).toHaveAttribute('type', 'date');
    expect(to).toHaveAttribute('max', '2026-06-17');
    expect(from).toHaveAttribute('min', '2025-06-18');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    const custom = screen.getByRole('button', { name: 'Custom' });
    expect(custom).toHaveAttribute('aria-expanded', 'true');
    // Nothing is applied yet, so the period in force is still the one that looks selected.
    expect(custom).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '1D, Past day' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(api.getHistory.calls).toHaveLength(1);
  });

  it('CHT-20 loads the range that is applied and names the chart with its dates', async () => {
    const { api, chart } = renderChart();
    await settle();
    await openCustom();

    await apply('2026-06-10', '2026-06-12');

    expect(api.getHistory.calls.at(-1)?.[1]).toEqual({
      from: Date.UTC(2026, 5, 10),
      to: Date.UTC(2026, 5, 13) - 1,
    });
    expect(screen.getByRole('figure')).toHaveAttribute(
      'aria-label',
      'AAPL price chart: 2026-06-10 – 2026-06-12',
    );
    expect(chart.port.setData).toHaveBeenCalledTimes(2);
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([
    ['', '2026-06-12', 'Enter both dates'],
    ['2026-06-12', '2026-06-10', 'The start date must not be after the end date'],
    ['2026-06-10', '2026-06-18', 'Dates in the future are not available'],
    ['2025-05-01', '2026-06-10', 'Dates older than a year are not available'],
  ])('CHT-21 explains %s to %s and sends nothing', async (from, to, message) => {
    const { api } = renderChart();
    await settle();
    await openCustom();
    const before = api.getHistory.calls.length;

    await apply(from, to);

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(api.getHistory.calls).toHaveLength(before);
  });

  it('CHT-22 leaves the custom range when a period is chosen', async () => {
    const { api } = renderChart();
    await settle();
    await openCustom();
    await apply('2026-06-10', '2026-06-12');

    await userEvent.click(screen.getByRole('button', { name: '1W, Past week' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(api.getHistory.calls.at(-1)?.[1]).toBe('1W');
    expect(screen.getByRole('button', { name: '1W, Past week' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
  });

  it('CHT-22 closes an open form when a period is chosen without applying', async () => {
    renderChart();
    await settle();
    await openCustom();
    expect(screen.getByLabelText('From')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '1M, Past month' }));

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
  });

  it('CHT-23 moves the last candle only for a range that ends today', async () => {
    const { chart, connect, tick } = renderChart();
    await settle();
    await openCustom();
    await apply('2026-06-10', '2026-06-17');
    connect();
    chart.port.updateCandle.mockClear();

    tick([{ symbol: 'AAPL', price: 240, timestamp: NOW + 60_000 }]);
    expect(chart.port.updateCandle).toHaveBeenCalledTimes(1);

    await openCustom();
    await apply('2026-06-10', '2026-06-12');
    chart.port.updateCandle.mockClear();
    tick([{ symbol: 'AAPL', price: 241, timestamp: NOW + 120_000 }]);
    expect(chart.port.updateCandle).not.toHaveBeenCalled();
  });

  it("CHT-24 starts a new candle at the start of the answer's candle size", async () => {
    const { chart, connect, tick } = renderChart();
    await settle();
    await openCustom();
    await apply('2026-06-10', '2026-06-17');
    connect();
    chart.port.updateCandle.mockClear();

    const timestamp = NOW + 5 * 60_000;
    tick([{ symbol: 'AAPL', price: 250, timestamp }]);

    expect(chart.port.updateCandle.mock.calls[0]?.[0]).toEqual({
      time: (Math.floor(timestamp / HALF_HOUR) * HALF_HOUR) / 1000,
      open: 250,
      high: 250,
      low: 250,
      close: 250,
    });
  });

  it('CHT-26 closes the form when Custom is pressed again, without asking for anything', async () => {
    const { api } = renderChart();
    await settle();
    await openCustom();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    const before = api.getHistory.calls.length;

    await openCustom();

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute('aria-pressed', 'false');
    expect(api.getHistory.calls).toHaveLength(before);
  });

  it('CHT-27 shows the applied dates when the form is reopened', async () => {
    renderChart();
    await settle();
    await openCustom();
    await apply('2026-06-10', '2026-06-12');

    await openCustom();

    expect(screen.getByLabelText('From')).toHaveValue('2026-06-10');
    expect(screen.getByLabelText('To')).toHaveValue('2026-06-12');
  });

  it('CHT-25 speaks Arabic in the form', async () => {
    renderChart('ar');
    await settle();
    await userEvent.click(screen.getByRole('button', { name: 'مخصص' }));

    fireEvent.change(screen.getByLabelText('من'), { target: { value: '2026-06-12' } });
    fireEvent.change(screen.getByLabelText('إلى'), { target: { value: '2026-06-10' } });
    await userEvent.click(screen.getByRole('button', { name: 'تطبيق' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'يجب ألا يكون تاريخ البداية بعد تاريخ النهاية',
    );
  });
});
