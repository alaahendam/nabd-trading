import { LANGUAGE_NAMES, LANGUAGES } from '@nabd/i18n';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLanguageSwitch } from '../../lib/i18n/use-language-switch';
import { minTouchTarget, radius, spacing } from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-provider';
import { Text } from '../../shared/ui';

/** Each option's base width: two of them fit one line on the narrowest screen. */
const LANGUAGE_BASIS = 120;

/**
 * Both languages, each by its own name so anyone can find theirs, with the one in use selected.
 * Choosing the other one saves it and reloads the app, because the layout direction only changes
 * on a start. If it cannot be saved nothing reloads, and a message says so.
 */
export function LanguageSetting() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { current, select } = useLanguageSwitch();
  const [failed, setFailed] = useState(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        group: { gap: spacing.small },
        options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
        option: {
          flexGrow: 1,
          flexBasis: LANGUAGE_BASIS,
          minHeight: minTouchTarget,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.medium,
          borderWidth: 1,
          borderColor: colors.border,
        },
        selected: { backgroundColor: colors.brand, borderColor: colors.brand },
        selectedLabel: { color: colors.onBrand },
        error: { color: colors.negative },
      }),
    [colors],
  );

  return (
    <View style={styles.group}>
      <Text variant="title" accessibilityRole="header">
        {t('language.label')}
      </Text>
      <View style={styles.options}>
        {LANGUAGES.map((language) => {
          const selected = language === current;
          return (
            <Pressable
              key={language}
              accessibilityRole="button"
              accessibilityLabel={LANGUAGE_NAMES[language]}
              accessibilityState={{ selected }}
              onPress={() => {
                void select(language).then((result) => {
                  setFailed(result === 'not-saved');
                });
              }}
              style={[styles.option, selected ? styles.selected : undefined]}
            >
              <Text style={selected ? styles.selectedLabel : undefined}>
                {LANGUAGE_NAMES[language]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {failed ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t('language.notSaved')}
        </Text>
      ) : null}
    </View>
  );
}
