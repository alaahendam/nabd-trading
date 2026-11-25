import { type Period, PERIODS } from '@nabd/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { minTouchTarget, radius, spacing } from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-provider';
import { Text } from '../../shared/ui';

/**
 * The five periods, as toggle buttons: the choice changes what one chart shows, so the selected
 * one is announced as selected. The visible codes (1D, 1W…) are the usual market notation in both
 * languages; the spoken name adds the period in words. Each is at least 48 high.
 */
export function PeriodSwitcher({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', gap: spacing.small },
        button: {
          flex: 1,
          minHeight: minTouchTarget,
          minWidth: minTouchTarget,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.medium,
          borderWidth: 1,
          borderColor: colors.border,
        },
        selected: { backgroundColor: colors.brand, borderColor: colors.brand },
        selectedLabel: { color: colors.onBrand },
      }),
    [colors],
  );

  return (
    <View accessibilityLabel={t('chart.period.label')} style={styles.row}>
      {PERIODS.map((period) => {
        const selected = period === value;
        return (
          <Pressable
            key={period}
            accessibilityRole="button"
            accessibilityLabel={`${period}, ${t(`chart.period.${period}`)}`}
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(period);
            }}
            style={[styles.button, selected ? styles.selected : undefined]}
          >
            <Text style={selected ? styles.selectedLabel : undefined}>{period}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
