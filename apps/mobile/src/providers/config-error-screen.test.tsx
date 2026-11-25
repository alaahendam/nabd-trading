import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '../test-utils';
import { ConfigErrorScreen } from './config-error-screen';

describe('ConfigErrorScreen', () => {
  it('CFG-01 names the setting and what is wrong with it', async () => {
    await renderWithProviders(
      <ConfigErrorScreen problems={[{ name: 'EXPO_PUBLIC_API_URL', kind: 'missing' }]} />,
    );

    expect(screen.getByText('EXPO_PUBLIC_API_URL: it is missing')).toBeOnTheScreen();
  });

  it('CFG-02 says when the value is not a valid address', async () => {
    await renderWithProviders(
      <ConfigErrorScreen problems={[{ name: 'EXPO_PUBLIC_API_URL', kind: 'invalid' }]} />,
    );

    expect(screen.getByText('EXPO_PUBLIC_API_URL: it is not a valid URL')).toBeOnTheScreen();
  });

  it('CFG-03 explains how to fix it', async () => {
    await renderWithProviders(<ConfigErrorScreen problems={[]} />);

    expect(screen.getByText(/Fix it in the environment file/)).toBeOnTheScreen();
    expect(screen.getByText('Copy .env.example to .env and fill in the values.')).toBeOnTheScreen();
  });

  it('CFG-04 marks the title as a header for screen readers', async () => {
    await renderWithProviders(<ConfigErrorScreen problems={[]} />);

    expect(screen.getByRole('header', { name: 'This app is not set up' })).toBeOnTheScreen();
  });
});
