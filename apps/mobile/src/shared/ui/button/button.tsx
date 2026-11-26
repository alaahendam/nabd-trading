import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { minTouchTarget, radius, spacing } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';
import { Text } from '../text/text';

/** A button with a visible label. At least 48 tall and wide, announced as a button. */
export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: minTouchTarget,
          minWidth: minTouchTarget,
          paddingHorizontal: spacing.large,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.medium,
          backgroundColor: colors.brand,
        },
        label: { color: colors.onBrand },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
