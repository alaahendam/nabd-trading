import { useRouter } from 'expo-router';

import { MarketBanner } from '../../src/features/market-data';
import { StockList } from '../../src/features/stocks';
import { Screen } from '../../src/shared/ui';

/** The stock list. */
export default function StocksTab() {
  const router = useRouter();

  return (
    <Screen edges={['left', 'right']}>
      <MarketBanner />
      <StockList
        onOpenStock={(symbol) => {
          router.push({ pathname: '/stock/[symbol]', params: { symbol } });
        }}
      />
    </Screen>
  );
}
