import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';

/**
 * A grey block that stands where content is loading. It is hidden from screen readers: the busy
 * status around it says what is loading.
 */
export function Skeleton({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: { width, height, borderRadius: radius.medium, backgroundColor: colors.border },
      }),
    [colors, width, height],
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.block}
    />
  );
}
