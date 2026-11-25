import { useLocalSearchParams } from 'expo-router';

import { MarketBanner } from '../../src/features/market-data';
import { Screen, Text } from '../../src/shared/ui';

/** The stock detail. A placeholder until M3: it shows which symbol was opened. */
export default function StockScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();

  return (
    <Screen>
      <MarketBanner />
      <Text variant="title" accessibilityRole="header">
        {symbol}
      </Text>
    </Screen>
  );
}
