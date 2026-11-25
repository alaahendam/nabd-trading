import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderWithProviders } from '../test-utils';
import { ConfigGate } from './config-gate';

describe('ConfigGate', () => {
  it('CFG-06 shows the app, with the valid settings, when the settings are valid', async () => {
    await renderWithProviders(
      <ConfigGate env={{ ok: true, env: { apiUrl: 'https://api.example.com' } }}>
        {({ apiUrl }) => <Text>the app at {apiUrl}</Text>}
      </ConfigGate>,
    );

    expect(screen.getByText('the app at https://api.example.com')).toBeOnTheScreen();
    expect(screen.queryByText('This app is not set up')).not.toBeOnTheScreen();
  });

  it('CFG-07 shows the configuration error and builds nothing when they are not', async () => {
    const built = { count: 0 };

    await renderWithProviders(
      <ConfigGate env={{ ok: false, problems: [{ name: 'EXPO_PUBLIC_API_URL', kind: 'missing' }] }}>
        {() => {
          built.count += 1;
          return <Text>the app</Text>;
        }}
      </ConfigGate>,
    );

    expect(screen.getByText('This app is not set up')).toBeOnTheScreen();
    expect(screen.queryByText('the app')).not.toBeOnTheScreen();
    expect(built.count).toBe(0);
  });
});
