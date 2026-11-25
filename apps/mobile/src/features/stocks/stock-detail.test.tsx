import { ApiClientError } from '@nabd/api-client';
import { aapl, watchlistItem } from '@nabd/testing';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createTestApp } from '../../test-app';
import { StockDetail } from './stock-detail';

const noop = () => undefined;
const notFound = () =>
  new ApiClientError({ kind: 'http', status: 404, message: 'Not found', code: 'NOT_FOUND' });

describe('StockDetail', () => {
  it('DET-01 shows a busy status while the stock loads', async () => {
    const app = createTestApp();
    app.api.getStock.implement(() => new Promise(() => undefined));

    await app.render(<StockDetail symbol="AAPL" onBack={noop} />);

    expect(screen.getByRole('progressbar', { name: 'Loading stock…' })).toBeOnTheScreen();
  });

  it('DET-02 shows "Stock not found" with the symbol, and a way back to the list', async () => {
    const app = createTestApp();
    app.api.getStock.rejects(notFound());
    const back = { count: 0 };
    await app.render(
      <StockDetail
        symbol="ZZZ"
        onBack={() => {
          back.count += 1;
        }}
      />,
    );

    expect(await screen.findByText('Stock not found')).toBeOnTheScreen();
    expect(screen.getByText('There is no stock with the symbol ZZZ.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Back to stocks' }));

    expect(back.count).toBe(1);
  });

  it('DET-03 shows an error with a retry button for any other failure', async () => {
    const app = createTestApp();
    app.api.getStock.rejectsOnce(new Error('offline')).resolves(aapl);
    await app.render(<StockDetail symbol="AAPL" onBack={noop} />);

    expect(await screen.findByText('Could not load this stock')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Apple Inc.')).toBeOnTheScreen();
  });

  it('DET-04 shows the symbol, name, exchange, sector, price and change', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);

    await app.render(<StockDetail symbol="AAPL" onBack={noop} />);

    expect(await screen.findByRole('header', { name: 'AAPL' })).toBeOnTheScreen();
    expect(screen.getByText('Apple Inc.')).toBeOnTheScreen();
    expect(screen.getByText('NASDAQ · Technology')).toBeOnTheScreen();
    expect(screen.getByText('$230.00')).toBeOnTheScreen();
    expect(screen.getByText('+$2.00 +0.88%')).toBeOnTheScreen();
  });

  it('DET-05 shows open, high, low, previous close and volume', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);

    await app.render(<StockDetail symbol="AAPL" onBack={noop} />);

    await screen.findByText('Open');
    expect(screen.getByText('$229.00')).toBeOnTheScreen();
    expect(screen.getByText('$231.00')).toBeOnTheScreen();
    expect(screen.getByText('$227.50')).toBeOnTheScreen();
    expect(screen.getByText('Previous close')).toBeOnTheScreen();
    expect(screen.getByText('$228.00')).toBeOnTheScreen();
    expect(screen.getByText('1M')).toBeOnTheScreen();
  });

  it('DET-06 follows live ticks for the price, the change, and the high and low', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);
    await app.render(<StockDetail symbol="AAPL" onBack={noop} />);
    await screen.findByText('Apple Inc.');
    await app.connect();

    await app.tick('AAPL', 235);

    expect(screen.getByText('+$7.00 +3.07%')).toBeOnTheScreen();
    // The price, and the day's high that it just raised.
    expect(screen.getAllByText('$235.00')).toHaveLength(2);
  });

  it('DET-07 subscribes the stock while shown, and releases it when left', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);
    const view = await app.render(<StockDetail symbol="AAPL" onBack={noop} />);
    await app.connect();
    await waitFor(() => {
      expect(app.socket.calls.subscribe.flat()).toEqual(['AAPL']);
    });

    await view.rerender(<Text>left the screen</Text>);

    await waitFor(() => {
      expect(app.socket.calls.unsubscribe.flat()).toEqual(['AAPL']);
    });
  });

  it('DET-08 shows the star beside the symbol, and it works', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);
    app.api.listWatchlist.resolves([watchlistItem]);

    await app.render(
      <StockDetail
        symbol="AAPL"
        onBack={noop}
        renderAction={(symbol) => <Text>star {symbol}</Text>}
      />,
    );

    expect(await screen.findByText('star AAPL')).toBeOnTheScreen();
  });

  it('DET-09 reads the symbol from the address case-insensitively', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);

    await app.render(<StockDetail symbol="aapl" onBack={noop} />);

    expect(await screen.findByText('Apple Inc.')).toBeOnTheScreen();
    expect(app.api.getStock.calls.map(([symbol]) => symbol)).toEqual(['AAPL']);
  });

  it('shows what the screen puts under the figures, with the symbol', async () => {
    const app = createTestApp();
    app.api.getStock.resolves(aapl);

    await app.render(
      <StockDetail symbol="AAPL" onBack={noop}>
        {(symbol) => <Text>chart of {symbol}</Text>}
      </StockDetail>,
    );

    expect(await screen.findByText('chart of AAPL')).toBeOnTheScreen();
  });
});
