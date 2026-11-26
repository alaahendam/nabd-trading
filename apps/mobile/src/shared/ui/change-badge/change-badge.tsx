import { type ChangeDirection, changeDirection, formatChange, formatPercent } from '@nabd/i18n';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { fontSize } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';
import { Text } from '../text/text';

/**
 * The day's change as a signed amount and percent. Up and down are colored, and also carry a `+`
 * or `-`, so color is never the only signal. Figures stay left to right in any language.
 */
export function ChangeBadge({ change, changePercent }: { change: number; changePercent: number }) {
  const { colors } = useTheme();
  const direction: ChangeDirection = changeDirection(change);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        up: { color: colors.positive, fontSize: fontSize.small },
        down: { color: colors.negative, fontSize: fontSize.small },
        flat: { color: colors.muted, fontSize: fontSize.small },
      }),
    [colors],
  );

  return (
    <Text style={styles[direction]}>
      {formatChange(change)} {formatPercent(changePercent)}
    </Text>
  );
}
