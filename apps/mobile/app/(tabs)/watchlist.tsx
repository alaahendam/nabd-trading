import { useTranslation } from 'react-i18next';

import { MarketBanner } from '../../src/features/market-data';
import { Screen, Text } from '../../src/shared/ui';

/** The watchlist. A placeholder until M3. */
export default function WatchlistTab() {
  const { t } = useTranslation();

  return (
    <Screen>
      <MarketBanner />
      <Text variant="title" accessibilityRole="header">
        {t('nav.watchlist')}
      </Text>
    </Screen>
  );
}
