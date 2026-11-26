import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../lib/theme/theme-provider';

/** The root navigation: the tabs, and the stock detail above them with a header and back. */
export function AppStack() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="stock/[symbol]"
        options={{
          headerShown: true,
          title: t('pages.stock'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
    </Stack>
  );
}
