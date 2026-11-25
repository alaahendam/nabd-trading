import { useRouter } from 'expo-router';

import { MarketBanner } from '../../src/features/market-data';
import { WatchlistView } from '../../src/features/watchlist';
import { Screen } from '../../src/shared/ui';

/** The stocks the user follows. */
export default function WatchlistTab() {
  const router = useRouter();

  return (
    <Screen edges={['left', 'right']}>
      <MarketBanner />
      <WatchlistView
        onOpenStock={(symbol) => {
          router.push({ pathname: '/stock/[symbol]', params: { symbol } });
        }}
        onBrowse={() => {
          router.navigate('/');
        }}
      />
    </Screen>
  );
}
