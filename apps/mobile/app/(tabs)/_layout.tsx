import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: t('nav.stocks') }} />
      <Tabs.Screen name="watchlist" options={{ title: t('nav.watchlist') }} />
    </Tabs>
  );
}
