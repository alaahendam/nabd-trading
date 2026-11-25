import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderWithProviders } from '../test-utils';
import { ConfigGate } from './config-gate';

describe('ConfigGate', () => {
  it('CFG-06 shows the app when the settings are valid', async () => {
    await renderWithProviders(
      <ConfigGate env={{ ok: true, env: { apiUrl: 'https://api.example.com' } }}>
        <Text>the app</Text>
      </ConfigGate>,
    );

    expect(screen.getByText('the app')).toBeOnTheScreen();
    expect(screen.queryByText('This app is not set up')).not.toBeOnTheScreen();
  });

  it('CFG-07 shows the configuration error instead of the app when they are not', async () => {
    await renderWithProviders(
      <ConfigGate env={{ ok: false, problems: [{ name: 'EXPO_PUBLIC_API_URL', kind: 'missing' }] }}>
        <Text>the app</Text>
      </ConfigGate>,
    );

    expect(screen.getByText('This app is not set up')).toBeOnTheScreen();
    expect(screen.queryByText('the app')).not.toBeOnTheScreen();
  });
});
