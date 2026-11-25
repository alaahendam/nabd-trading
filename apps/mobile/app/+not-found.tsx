import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, Text } from '../src/shared/ui';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('notFound.title')}
      </Text>
      <Text variant="muted">{t('notFound.description')}</Text>
      <Link href="/" accessibilityRole="link">
        {t('notFound.home')}
      </Link>
    </Screen>
  );
}
