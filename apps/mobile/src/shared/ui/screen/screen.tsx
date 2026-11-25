import { type ReactNode, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';

const ALL_EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];

/**
 * A screen: inside the safe area, on the theme's background, with room around its content. A screen
 * under a navigation header or above a tab bar passes the edges those already cover as left out,
 * so the inset is not added twice; one with nothing around it keeps all four.
 */
export function Screen({
  children,
  edges = ALL_EDGES,
}: {
  children: ReactNode;
  edges?: readonly Edge[];
}) {
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
    <SafeAreaView testID="screen" edges={edges} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}
