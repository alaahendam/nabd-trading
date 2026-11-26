import { aapl, brkb } from '@nabd/testing';
import { fireEvent, screen } from '@testing-library/react-native';
import { Profiler } from 'react';
import { Text } from 'react-native';

import { createTestApp } from '../../test-app';
import { StockRow } from './stock-row';

const noop = () => undefined;

describe('StockRow', () => {
  it('ROW-01 shows the symbol, the name, the price and the change', async () => {
    await createTestApp().render(<StockRow stock={aapl} onPress={noop} />);

    expect(screen.getByText('AAPL')).toBeOnTheScreen();
    expect(screen.getByText('Apple Inc.')).toBeOnTheScreen();
    expect(screen.getByText('$230.00')).toBeOnTheScreen();
    expect(screen.getByText('+$2.00 +0.88%')).toBeOnTheScreen();
  });

  it('ROW-02 signs the change and announces its direction in words', async () => {
    const app = createTestApp();
    await app.render(<StockRow stock={aapl} onPress={noop} />);

    await app.tick('AAPL', 220);

    expect(screen.getByText('-$8.00 -3.51%')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: /Down 3\.51%/ })).toBeOnTheScreen();
  });

  it('ROW-03 says "Delayed" for a price that is not fresh, and stops when it is', async () => {
    const app = createTestApp();
    await app.render(<StockRow stock={aapl} onPress={noop} />);
    expect(screen.queryByText('Delayed')).not.toBeOnTheScreen();

    await app.tick('AAPL', 231);
    expect(screen.getByText('Delayed')).toBeOnTheScreen();
    await app.connect();

    expect(screen.queryByText('Delayed')).not.toBeOnTheScreen();
  });

  it('ROW-04 shows only the new stock after the row is recycled', async () => {
    const app = createTestApp();
    const view = await app.render(<StockRow stock={aapl} onPress={noop} />);
    await app.connect();
    await app.tick('AAPL', 240);
    expect(screen.getByText('$240.00')).toBeOnTheScreen();

    await view.rerender(<StockRow stock={brkb} onPress={noop} />);

    expect(screen.getByText('BRK.B')).toBeOnTheScreen();
    expect(screen.getByText('$460.00')).toBeOnTheScreen();
    expect(screen.queryByText('AAPL')).not.toBeOnTheScreen();
    expect(screen.queryByText('$240.00')).not.toBeOnTheScreen();
    await app.tick('AAPL', 250);
    expect(screen.queryByText('$250.00')).not.toBeOnTheScreen();
    expect(screen.getByText('$460.00')).toBeOnTheScreen();
  });

  it('ROW-05 does not render again for a tick of another symbol', async () => {
    const app = createTestApp();
    const commits = { count: 0 };
    await app.render(
      <Profiler
        id="row"
        onRender={() => {
          commits.count += 1;
        }}
      >
        <StockRow stock={aapl} onPress={noop} />
      </Profiler>,
    );
    await app.connect();
    const before = commits.count;

    await app.tick('BRK.B', 470);
    expect(commits.count).toBe(before);
    await app.tick('AAPL', 231);

    expect(commits.count).toBeGreaterThan(before);
  });

  it('ROW-06 opens the stock when pressed', async () => {
    const opened: string[] = [];
    await createTestApp().render(
      <StockRow
        stock={aapl}
        onPress={(symbol) => {
          opened.push(symbol);
        }}
      />,
    );

    await fireEvent.press(screen.getByRole('link'));

    expect(opened).toEqual(['AAPL']);
  });

  it('ROW-07 is one accessible element read as a sentence, with the action beside it', async () => {
    await createTestApp().render(
      <StockRow
        stock={aapl}
        onPress={noop}
        renderAction={(symbol) => <Text>star {symbol}</Text>}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'AAPL, Apple Inc., $230.00, Up 0.88%' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('star AAPL')).toBeOnTheScreen();
  });
});
