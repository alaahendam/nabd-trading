import { fireEvent, render, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../test-utils';
import { ErrorBoundary } from './error-boundary';
import { ErrorScreen } from './error-screen';

describe('ErrorScreen', () => {
  it('ERR-01 shows the title, the description and a retry button', async () => {
    await renderWithProviders(<ErrorScreen retry={() => undefined} />);

    expect(screen.getByRole('header', { name: 'Something went wrong' })).toBeOnTheScreen();
    expect(screen.getByText('An unexpected error occurred. You can try again.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  });

  it('ERR-02 calls retry when the button is pressed', async () => {
    const retried = { count: 0 };
    await renderWithProviders(
      <ErrorScreen
        retry={() => {
          retried.count += 1;
        }}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(retried.count).toBe(1);
  });

  it('ERR-03 makes the retry button at least 48 high', async () => {
    await renderWithProviders(<ErrorScreen retry={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Try again' })).toHaveStyle({ minHeight: 48 });
  });
});

describe('ErrorBoundary', () => {
  it('ERR-04 brings its own providers, so it works when the layout is gone', async () => {
    const retried = { count: 0 };

    await render(
      <ErrorBoundary
        error={new Error('boom')}
        retry={() => {
          retried.count += 1;
          return Promise.resolve();
        }}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(retried.count).toBe(1);
  });
});
