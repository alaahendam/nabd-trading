import { useTranslation } from 'react-i18next';

import { Badge } from '../../shared/ui';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-bs border-line bg-surface-raised">
      <div className="mx-auto flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-xs text-content-muted inline-full max-inline-6xl">
        <Badge tone="watch">{t('simulated.badge')}</Badge>
        <p>{t('simulated.description')}</p>
        {/* The chart library's license requires this notice and link on a visible page. */}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          lang="en"
          dir="ltr"
          className="ms-auto rounded-sm text-content-muted underline-offset-2 hover:text-content hover:underline"
        >
          {t('attribution.chartNotice')}
        </a>
      </div>
    </footer>
  );
}
