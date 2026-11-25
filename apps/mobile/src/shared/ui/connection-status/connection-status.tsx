import type { ConnectionStatus as Status } from '@nabd/market-data';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';
import { Text } from '../text/text';

const DOT_SIZE = 8;

/**
 * The state of the live connection: a dot and a word, never color alone. It is a polite live
 * region, so a screen reader announces a change once (and never per tick: ticks do not change it).
 */
export function ConnectionStatus({ status }: { status: Status }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dotColor = {
    connected: colors.positive,
    connecting: colors.watch,
    reconnecting: colors.watch,
    offline: colors.negative,
  }[status];
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
        dot: {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: dotColor,
        },
      }),
    [dotColor],
  );

  return (
    <View testID="connection-status" accessibilityLiveRegion="polite" style={styles.row}>
      <View style={styles.dot} />
      <Text variant="muted">{t(`connection.${status}`)}</Text>
    </View>
  );
}
