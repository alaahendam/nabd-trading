import { useTranslation } from 'react-i18next';

import { Button, Screen, Text } from '../shared/ui';

/** Shown when a screen throws: what happened, and a way to try again. */
export function ErrorScreen({ retry }: { retry: () => void }) {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('errors.title')}
      </Text>
      <Text>{t('errors.description')}</Text>
      <Button label={t('errors.retry')} onPress={retry} />
    </Screen>
  );
}
