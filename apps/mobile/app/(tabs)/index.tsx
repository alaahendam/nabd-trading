import { useRouter } from 'expo-router';

import { MarketBanner } from '../../src/features/market-data';
import { StockList } from '../../src/features/stocks';
import { WatchlistToggle } from '../../src/features/watchlist';
import { Screen } from '../../src/shared/ui';

/** The stock list, with a star on each row to add the stock to the watchlist. */
export default function StocksTab() {
  const router = useRouter();

  return (
    <Screen edges={['left', 'right']}>
      <MarketBanner />
      <StockList
        onOpenStock={(symbol) => {
          router.push({ pathname: '/stock/[symbol]', params: { symbol } });
        }}
        renderAction={(symbol) => <WatchlistToggle symbol={symbol} />}
      />
    </Screen>
  );
}
