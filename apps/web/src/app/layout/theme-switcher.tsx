import { useTranslation } from 'react-i18next';

import { THEME_PREFERENCES } from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-hooks';
import { Button } from '../../shared/ui';

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  return (
    <div role="group" aria-label={t('theme.label')} className="flex gap-1">
      {THEME_PREFERENCES.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === preference ? 'primary' : 'ghost'}
          aria-pressed={option === preference}
          onClick={() => {
            setPreference(option);
          }}
        >
          {t(`theme.${option}`)}
        </Button>
      ))}
    </div>
  );
}
