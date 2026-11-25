import { LANGUAGE_NAMES, LANGUAGES, parseLanguage } from '@nabd/i18n';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../lib/i18n/i18n-provider';
import { GlobeIcon, Select } from '../../shared/ui';

/** Each language is named in itself, so a reader can always find theirs. */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  return (
    <Select
      label={t('language.label')}
      icon={<GlobeIcon />}
      value={language}
      options={LANGUAGES.map((code) => ({ value: code, label: LANGUAGE_NAMES[code], lang: code }))}
      onChange={(value) => {
        const next = parseLanguage(value);
        if (next !== undefined) {
          setLanguage(next);
        }
      }}
    />
  );
}
