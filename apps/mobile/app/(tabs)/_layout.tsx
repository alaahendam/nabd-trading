import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../src/lib/theme/theme-provider';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.stocks') }} />
      <Tabs.Screen name="watchlist" options={{ title: t('nav.watchlist') }} />
    </Tabs>
  );
}
