import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../../lib/theme';

/** A screen: inside the safe area, on the theme's background, with room around its content. */
export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: theme.spacing.small,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
});
