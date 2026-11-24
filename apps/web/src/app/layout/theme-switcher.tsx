import { useTranslation } from 'react-i18next';

import {
  parseThemePreference,
  THEME_PREFERENCES,
  type ThemePreference,
} from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-hooks';
import { MonitorIcon, MoonIcon, Select, SunIcon } from '../../shared/ui';

/** The icon follows the choice, so the control shows what is in force at a glance. */
const ICONS: Readonly<Record<ThemePreference, React.ReactNode>> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <MonitorIcon />,
};

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  return (
    <Select
      label={t('theme.label')}
      icon={ICONS[preference]}
      value={preference}
      options={THEME_PREFERENCES.map((option) => ({ value: option, label: t(`theme.${option}`) }))}
      onChange={(value) => {
        setPreference(parseThemePreference(value));
      }}
    />
  );
}
