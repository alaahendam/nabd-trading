import { useTranslation } from 'react-i18next';

import { Text } from '../text/text';

/** The notice every screen carries: the prices are simulated, not real market data. */
export function SimulatedNotice() {
  const { t } = useTranslation();

  return <Text variant="muted">{t('simulated.badge')}</Text>;
}
