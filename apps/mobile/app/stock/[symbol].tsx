import { useLocalSearchParams, useRouter } from 'expo-router';

import { MarketBanner } from '../../src/features/market-data';
import { StockDetail } from '../../src/features/stocks';
import { WatchlistToggle } from '../../src/features/watchlist';
import { Screen } from '../../src/shared/ui';

/** The stock detail: the symbol comes from the address. */
export default function StockScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();

  return (
    <Screen>
      <MarketBanner />
      <StockDetail
        symbol={symbol}
        onBack={() => {
          router.navigate('/');
        }}
        renderAction={(shown) => <WatchlistToggle symbol={shown} />}
      />
    </Screen>
  );
}
