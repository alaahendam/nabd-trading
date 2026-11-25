import { useTranslation } from 'react-i18next';

import { Screen, Text } from '../../src/shared/ui';

/** The stock list. A placeholder until M3. */
export default function StocksTab() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('nav.stocks')}
      </Text>
    </Screen>
  );
}
