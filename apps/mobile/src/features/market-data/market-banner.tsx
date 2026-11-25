import { useConnectionStatus } from '@nabd/market-data';
import { View } from 'react-native';

import { ConnectionStatus, SimulatedNotice } from '../../shared/ui';

/** The top of a market screen: whether prices are live, and that they are simulated. */
export function MarketBanner() {
  const status = useConnectionStatus();

  return (
    <View>
      <ConnectionStatus status={status} />
      <SimulatedNotice />
    </View>
  );
}
