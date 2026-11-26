import type { ConnectionStatus as Status } from '@nabd/market-data';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '../../../test-utils';
import { ConnectionStatus } from './connection-status';

const LABELS: Record<Status, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  reconnecting: 'Reconnecting…',
  offline: 'Offline',
};

describe('ConnectionStatus', () => {
  it.each(Object.entries(LABELS) as [Status, string][])(
    'CON-01 shows the label of %s',
    async (status, label) => {
      await renderWithProviders(<ConnectionStatus status={status} />);

      expect(screen.getByText(label)).toBeOnTheScreen();
    },
  );

  it('CON-02 is a polite live region', async () => {
    await renderWithProviders(<ConnectionStatus status="connected" />);

    expect(screen.getByTestId('connection-status').props).toMatchObject({
      accessibilityLiveRegion: 'polite',
    });
  });
});
