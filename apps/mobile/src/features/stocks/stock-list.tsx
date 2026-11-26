import { queryKeys, useStockList } from '@nabd/data';
import { useSubscription } from '@nabd/market-data';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../lib/theme/theme';
import { Button, Skeleton, StateMessage, Text } from '../../shared/ui';
import { StockRow } from './stock-row';

const SKELETON_ROWS = 6;

const styles = StyleSheet.create({
  skeletons: { gap: spacing.medium, paddingVertical: spacing.small },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: { alignItems: 'center', gap: spacing.small, paddingVertical: spacing.medium },
  list: { flex: 1 },
});

/**
 * The stocks, live. Without `symbols` it pages through every stock; with them it shows just those,
 * in one request (the watchlist). Only the rows that are loaded are subscribed, so subscriptions
 * grow with the scrolling. The list recycles its rows, which is why `StockRow` keeps nothing of
 * the stock it showed before.
 */
export function StockList({
  symbols,
  onOpenStock,
  renderAction,
}: {
  symbols?: readonly string[];
  onOpenStock: (symbol: string) => void;
  renderAction?: (symbol: string) => ReactNode;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const list = useStockList(symbols);
  const [refreshing, setRefreshing] = useState(false);

  useSubscription(list.stocks.map((stock) => stock.symbol));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({
        queryKey:
          symbols === undefined ? queryKeys.stockPages() : queryKeys.stocksBySymbols(symbols),
      });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, symbols]);

  if (list.isPending) {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('stocks.loading')}
        style={styles.skeletons}
      >
        {Array.from({ length: SKELETON_ROWS }, (_unused, index) => (
          <View key={index} style={styles.skeletonRow}>
            <Skeleton width={120} height={40} />
            <Skeleton width={90} height={40} />
          </View>
        ))}
      </View>
    );
  }

  if (!list.hasData) {
    return (
      <StateMessage
        tone="error"
        title={t('stocks.error')}
        description={t('stocks.errorHint')}
        action={<Button label={t('errors.retry')} onPress={list.refetch} />}
      />
    );
  }

  if (list.stocks.length === 0) {
    return <StateMessage tone="empty" title={t('stocks.empty')} />;
  }

  return (
    <FlashList
      testID="stock-list"
      style={styles.list}
      data={list.stocks}
      keyExtractor={(stock) => stock.symbol}
      renderItem={({ item }) => (
        <StockRow
          stock={item}
          onPress={onOpenStock}
          {...(renderAction === undefined ? {} : { renderAction })}
        />
      )}
      ListHeaderComponent={<Text variant="muted">{t('count.stocks', { count: list.total })}</Text>}
      ListFooterComponent={
        <ListFooter
          isLoadingMore={list.isLoadingMore}
          failed={list.loadMoreFailed}
          onRetry={list.loadMore}
        />
      }
      onEndReached={list.loadMoreFailed ? undefined : list.loadMore}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
}

/**
 * What sits under the last row: nothing on the last page, a busy line while a page loads, or the
 * message and a retry button after a failure. A failed page is not retried by itself, so a failing
 * request is not repeated in a loop; the button tries again.
 */
function ListFooter({
  isLoadingMore,
  failed,
  onRetry,
}: {
  isLoadingMore: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  if (failed) {
    return (
      <View accessibilityRole="alert" style={styles.footer}>
        <Text variant="muted">{t('stocks.loadMoreError')}</Text>
        <Button label={t('errors.retry')} onPress={onRetry} />
      </View>
    );
  }
  if (isLoadingMore) {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('stocks.loadingMore')}
        style={styles.footer}
      >
        <Text variant="muted">{t('stocks.loadingMore')}</Text>
      </View>
    );
  }
  return null;
}
