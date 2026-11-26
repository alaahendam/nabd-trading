import { changeDirection, formatPercentMagnitude, formatPrice } from '@nabd/i18n';
import type { StockWithQuote } from '@nabd/shared';
import { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { minTouchTarget, spacing } from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-provider';
import { ChangeBadge, Text } from '../../shared/ui';
import { useLiveQuote } from './use-live-quote';

/** The narrowest the name column gets before the figures move under it. */
const NAME_BASIS = 112;

/**
 * One stock in a list. The list recycles rows: this same component is later given another stock,
 * so everything shown comes from `stock` and the live price of `stock.symbol`, and nothing is kept
 * from the stock it showed before. The row is a single accessible element, read as a sentence;
 * the star (`renderAction`) is its own element beside it.
 */
export function StockRow({
  stock,
  onPress,
  renderAction,
}: {
  stock: StockWithQuote;
  onPress: (symbol: string) => void;
  /** Something at the end of the row, such as the star. It is given the symbol. */
  renderAction?: (symbol: string) => ReactNode;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const live = useLiveQuote(stock.quote);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.small,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        main: {
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.medium,
          minHeight: minTouchTarget,
          paddingVertical: spacing.small,
        },
        name: { flexGrow: 1, flexBasis: NAME_BASIS },
        figures: { alignItems: 'flex-end' },
      }),
    [colors],
  );

  const direction = changeDirection(live.change);
  const label = t('stocks.row', {
    symbol: stock.symbol,
    name: stock.name,
    price: formatPrice(live.price),
    direction: t(`change.${direction}`),
    percent: formatPercentMagnitude(live.changePercent),
  });

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={label}
        onPress={() => {
          onPress(stock.symbol);
        }}
        style={styles.main}
      >
        <View style={styles.name}>
          <Text>{stock.symbol}</Text>
          <Text variant="muted" numberOfLines={1}>
            {stock.name}
          </Text>
        </View>
        <View style={styles.figures}>
          <Text>{formatPrice(live.price)}</Text>
          {live.freshness === 'stale' ? <Text variant="muted">{t('stocks.stale')}</Text> : null}
          <ChangeBadge change={live.change} changePercent={live.changePercent} />
        </View>
      </Pressable>
      {renderAction?.(stock.symbol)}
    </View>
  );
}
