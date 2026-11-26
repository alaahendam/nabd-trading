import { aapl } from '@nabd/testing';
import { screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { fakeChartSurface } from '../test-support/fake-chart-surface';
import { LanguageSetting } from './features/settings/language-setting';
import { ChartSurfaceProvider } from './features/stocks/chart-surface-context';
import { PeriodSwitcher } from './features/stocks/period-switcher';
import { StockChart } from './features/stocks/stock-chart';
import { StockDetail } from './features/stocks/stock-detail';
import { StockList } from './features/stocks/stock-list';
import { StockRow } from './features/stocks/stock-row';
import { WatchlistView } from './features/watchlist';
import { createTestApp } from './test-app';

/** The room inside a 320-point screen after its 16-point padding on both sides. */
const NARROWEST_CONTENT = 288;

const never = () => new Promise<never>(() => undefined);

/** The fixed widths, in points, of everything inside the busy status that is on the screen. */
function fixedWidthsInProgress(): number[] {
  const busy = screen.getAllByRole('progressbar');
  return busy.flatMap((element) =>
    element
      .queryAll(() => true)
      .map(
        (node) =>
          (StyleSheet.flatten(node.props['style']) as { width?: unknown } | undefined)?.width,
      )
      .filter((width): width is number => typeof width === 'number'),
  );
}

describe('screen sizes', () => {
  it('SIZ-01 keeps the stock list placeholders inside a narrow screen', async () => {
    const app = createTestApp();
    app.api.listStocks.implement(never);
    await app.render(<StockList onOpenStock={() => undefined} />);

    expect(Math.max(0, ...fixedWidthsInProgress())).toBeLessThanOrEqual(NARROWEST_CONTENT);
  });

  it('SIZ-01 keeps the detail placeholders inside a narrow screen', async () => {
    const app = createTestApp();
    app.api.getStock.implement(never);
    await app.render(<StockDetail symbol="AAPL" onBack={() => undefined} />);

    expect(fixedWidthsInProgress().length).toBeGreaterThan(0);
    expect(Math.max(...fixedWidthsInProgress())).toBeLessThanOrEqual(NARROWEST_CONTENT);
  });

  it('SIZ-01 keeps the chart placeholder inside a narrow screen', async () => {
    const app = createTestApp();
    app.api.getHistory.implement(never);
    await app.render(
      <ChartSurfaceProvider surface={fakeChartSurface}>
        <StockChart symbol="AAPL" />
      </ChartSurfaceProvider>,
    );

    expect(Math.max(0, ...fixedWidthsInProgress())).toBeLessThanOrEqual(NARROWEST_CONTENT);
  });

  it('SIZ-01 keeps the watchlist placeholders inside a narrow screen', async () => {
    const app = createTestApp();
    app.api.listWatchlist.implement(never);
    await app.render(<WatchlistView onOpenStock={() => undefined} onBrowse={() => undefined} />);

    expect(Math.max(0, ...fixedWidthsInProgress())).toBeLessThanOrEqual(NARROWEST_CONTENT);
  });

  it('SIZ-02 lets the figures of a row move under its name when there is no room', async () => {
    const app = createTestApp();
    await app.render(<StockRow stock={aapl} onPress={() => undefined} />);

    const row = screen.getByRole('link', { name: /^AAPL, Apple Inc\./ });
    const name = screen.getByText('AAPL').parent;
    const nameStyle = StyleSheet.flatten(name?.props['style']) as { flexBasis?: number };

    expect(row).toHaveStyle({ flexWrap: 'wrap' });
    expect(nameStyle.flexBasis).toBeGreaterThan(0);
  });

  it('SIZ-03 lets a figure on the detail move under its label', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);
    await app.render(<StockDetail symbol="AAPL" onBack={() => undefined} />);
    await screen.findByText('Previous close');

    const line = screen.getByText('Previous close').parent;

    expect(line).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('SIZ-04 lets the period buttons wrap instead of running off the screen', async () => {
    await createTestApp().render(<PeriodSwitcher value="1D" onChange={() => undefined} />);

    expect(screen.getByLabelText('Chart period')).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('SIZ-04 lets the language options wrap instead of running off the screen', async () => {
    await createTestApp().render(<LanguageSetting />);

    expect(screen.getByRole('button', { name: 'English' }).parent).toHaveStyle({
      flexWrap: 'wrap',
    });
  });
});
