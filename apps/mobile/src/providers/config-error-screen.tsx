import { useTranslation } from 'react-i18next';

import type { EnvProblem } from '../lib/env';
import { Screen, Text } from '../shared/ui';

/** Shown instead of the app when a setting it needs is missing or invalid, never a blank screen. */
export function ConfigErrorScreen({ problems }: { problems: readonly EnvProblem[] }) {
  const { t } = useTranslation();

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('config.error.title')}
      </Text>
      <Text>{t('config.error.description')}</Text>
      {problems.map((problem) => (
        <Text key={problem.name}>
          {t('config.error.setting', {
            name: problem.name,
            problem: t(`config.error.problem.${problem.kind}`),
          })}
        </Text>
      ))}
      <Text variant="muted">{t('config.error.hint')}</Text>
    </Screen>
  );
}
