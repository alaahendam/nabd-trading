import { useWatchlist } from '@nabd/data';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../lib/theme/theme';
import { Button, Skeleton, StateMessage } from '../../shared/ui';
import { StockList } from '../stocks';
import { WatchlistToggle } from './watchlist-toggle';

const styles = StyleSheet.create({ loading: { padding: spacing.medium } });

/** The stocks the user follows, live, each with a star to take it off. */
export function WatchlistView({
  onOpenStock,
  onBrowse,
}: {
  onOpenStock: (symbol: string) => void;
  /** Opens the list of all stocks, from the empty state. */
  onBrowse: () => void;
}) {
  const { t } = useTranslation();
  const list = useWatchlist();

  // Data first, so a refresh that fails after the list loaded keeps showing it.
  if (list.data !== undefined) {
    if (list.data.length === 0) {
      return (
        <StateMessage
          tone="empty"
          title={t('watchlist.empty.title')}
          description={t('watchlist.empty.description')}
          action={<Button label={t('watchlist.empty.action')} onPress={onBrowse} />}
        />
      );
    }
    return (
      <StockList
        symbols={list.data.map((item) => item.symbol)}
        onOpenStock={onOpenStock}
        renderAction={(symbol) => <WatchlistToggle symbol={symbol} />}
      />
    );
  }

  if (list.isPending) {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('watchlist.loading')}
        style={styles.loading}
      >
        <Skeleton width={240} height={40} />
      </View>
    );
  }

  return (
    <StateMessage
      tone="error"
      title={t('watchlist.error')}
      description={t('stocks.errorHint')}
      action={
        <Button
          label={t('errors.retry')}
          onPress={() => {
            void list.refetch();
          }}
        />
      }
    />
  );
}
