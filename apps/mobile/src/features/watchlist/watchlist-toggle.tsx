import { useWatchlist, useWatchlistToggle } from '@nabd/data';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { lightTap } from '../../lib/haptics';
import { fontSize, minTouchTarget } from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-provider';
import { Text } from '../../shared/ui';

const STAR = { on: '★', off: '☆' } as const;

/**
 * A star that adds a stock to the watchlist or takes it off. It is a button named "Watch <symbol>"
 * whatever its state, and its state is announced as selected. The change shows at once; if the
 * server refuses, the star goes back and a short message says so.
 */
export function WatchlistToggle({ symbol }: { symbol: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const list = useWatchlist();
  const toggle = useWatchlistToggle();
  const watched = list.data?.some((item) => item.symbol === symbol) ?? false;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minWidth: minTouchTarget,
          minHeight: minTouchTarget,
          alignItems: 'center',
          justifyContent: 'center',
        },
        star: { fontSize: fontSize.title, color: watched ? colors.watch : colors.muted },
        error: { color: colors.negative, fontSize: fontSize.small },
      }),
    [colors, watched],
  );

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('watchlist.toggle', { symbol })}
        accessibilityState={{ selected: watched, disabled: list.isPending }}
        disabled={list.isPending}
        onPress={() => {
          lightTap();
          toggle.mutate({ symbol, watch: !watched });
        }}
        style={styles.button}
      >
        <Text style={styles.star}>{watched ? STAR.on : STAR.off}</Text>
      </Pressable>
      {toggle.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t('watchlist.toggleError')}
        </Text>
      ) : null}
    </View>
  );
}
