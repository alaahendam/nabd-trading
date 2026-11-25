import { type ReactNode, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';

/** A screen: inside the safe area, on the theme's background, with room around its content. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          gap: spacing.small,
          padding: spacing.medium,
          backgroundColor: colors.background,
        },
      }),
    [colors],
  );
  return (
    <SafeAreaView testID="screen" style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}
