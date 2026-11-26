import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../../lib/theme/theme';
import { Text } from '../text/text';

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.small, padding: spacing.large },
  centered: { textAlign: 'center' },
});

/**
 * An empty or failed state: what happened, what to do about it, and the way to do it. An error is
 * an alert, so a screen reader announces it when it appears.
 */
export function StateMessage({
  tone,
  title,
  description,
  action,
}: {
  tone: 'empty' | 'error';
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View accessibilityRole={tone === 'error' ? 'alert' : undefined} style={styles.box}>
      <Text variant="title" accessibilityRole="header" style={styles.centered}>
        {title}
      </Text>
      {description === undefined ? null : (
        <Text variant="muted" style={styles.centered}>
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}
