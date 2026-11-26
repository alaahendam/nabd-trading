import { ApiClientError } from '@nabd/api-client';
import { useStock } from '@nabd/data';
import { formatPrice, formatVolume } from '@nabd/i18n';
import { useSubscription } from '@nabd/market-data';
import type { StockWithQuote } from '@nabd/shared';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '../../lib/theme/theme';
import { Button, ChangeBadge, Skeleton, StateMessage, Text } from '../../shared/ui';
import { useLiveQuote } from './use-live-quote';

const styles = StyleSheet.create({
  content: { gap: spacing.large, paddingVertical: spacing.medium },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  figures: { alignItems: 'flex-end' },
  stats: { gap: spacing.small },
  stat: { flexDirection: 'row', justifyContent: 'space-between' },
  loading: { gap: spacing.medium, paddingVertical: spacing.medium },
});

/**
 * One stock: its name and price, live, and the day's figures. The symbol comes from the address,
 * so it is read case-insensitively. The stock is subscribed while this is shown.
 */
export function StockDetail({
  symbol,
  onBack,
  renderAction,
  children,
}: {
  symbol: string;
  /** Opens the stock list, from the "not found" state. */
  onBack: () => void;
  /** Something beside the symbol, such as the star. It is given the symbol. */
  renderAction?: (symbol: string) => ReactNode;
  /** What goes under the figures once the stock has loaded, such as the chart. */
  children?: (symbol: string) => ReactNode;
}) {
  const { t } = useTranslation();
  const normalized = symbol.toUpperCase();
  const query = useStock(normalized);

  useSubscription([normalized]);

  // Data comes first, so a refresh that fails after the page loaded keeps showing it.
  if (query.data !== undefined) {
    return (
      <StockDetailBody stock={query.data} renderAction={renderAction}>
        {children}
      </StockDetailBody>
    );
  }

  if (query.isPending) {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('stock.loading')}
        style={styles.loading}
      >
        <Skeleton width={180} height={40} />
        <Skeleton width={320} height={96} />
      </View>
    );
  }

  if (query.error instanceof ApiClientError && query.error.status === 404) {
    return (
      <StateMessage
        tone="error"
        title={t('stock.notFound.title')}
        description={t('stock.notFound.description', { symbol: normalized })}
        action={<Button label={t('notFound.home')} onPress={onBack} />}
      />
    );
  }

  return (
    <StateMessage
      tone="error"
      title={t('stock.error')}
      description={t('stocks.errorHint')}
      action={
        <Button
          label={t('errors.retry')}
          onPress={() => {
            void query.refetch();
          }}
        />
      }
    />
  );
}

function StockDetailBody({
  stock,
  renderAction,
  children,
}: {
  stock: StockWithQuote;
  renderAction: ((symbol: string) => ReactNode) | undefined;
  children: ((symbol: string) => ReactNode) | undefined;
}) {
  const { t } = useTranslation();
  const live = useLiveQuote(stock.quote);

  const stats = [
    { label: t('stock.stats.open'), value: formatPrice(stock.quote.open) },
    { label: t('stock.stats.high'), value: formatPrice(live.high) },
    { label: t('stock.stats.low'), value: formatPrice(live.low) },
    { label: t('stock.stats.previousClose'), value: formatPrice(stock.quote.previousClose) },
    { label: t('stock.stats.volume'), value: formatVolume(live.volume) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <View style={styles.title}>
            <Text variant="title" accessibilityRole="header">
              {stock.symbol}
            </Text>
            {renderAction?.(stock.symbol)}
          </View>
          <Text variant="muted">{stock.name}</Text>
          <Text variant="muted">{`${stock.exchange} · ${stock.sector}`}</Text>
        </View>
        <View style={styles.figures}>
          <Text variant="display">{formatPrice(live.price)}</Text>
          {live.freshness === 'stale' ? <Text variant="muted">{t('stocks.stale')}</Text> : null}
          <ChangeBadge change={live.change} changePercent={live.changePercent} />
        </View>
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} accessible style={styles.stat}>
            <Text variant="muted">{stat.label}</Text>
            <Text>{stat.value}</Text>
          </View>
        ))}
      </View>

      {children?.(stock.symbol)}
    </ScrollView>
  );
}
