import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../src/lib/theme/theme-provider';

/**
 * The glyph for a tab, in the theme's active or inactive color. It is decoration: the tab is
 * named by its title, so a screen reader skips it.
 */
function TabIcon({
  name,
  focused,
  size,
}: {
  name: 'trending-up' | 'star' | 'settings';
  focused: boolean;
  size: number;
}) {
  const { colors } = useTheme();
  return (
    <Ionicons
      testID={`tab-icon-${name}`}
      name={name}
      size={size}
      color={focused ? colors.text : colors.muted}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

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
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.stocks'),
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="trending-up" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: t('nav.watchlist'),
          tabBarIcon: ({ focused, size }) => <TabIcon name="star" focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="settings" focused={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
