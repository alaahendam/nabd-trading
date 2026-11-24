import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../lib/i18n/i18n-provider';
import { LANGUAGE_NAMES, LANGUAGES } from '../../lib/i18n/language';
import { Button } from '../../shared/ui';

/** Each language is named in itself, so a reader can always find theirs. */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  return (
    <div role="group" aria-label={t('language.label')} className="flex gap-1">
      {LANGUAGES.map((option) => (
        <Button
          key={option}
          size="sm"
          lang={option}
          variant={option === language ? 'primary' : 'ghost'}
          aria-pressed={option === language}
          onClick={() => {
            setLanguage(option);
          }}
        >
          {LANGUAGE_NAMES[option]}
        </Button>
      ))}
    </div>
  );
}
