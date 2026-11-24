import { useTranslation } from 'react-i18next';

import { Badge } from '../../shared/ui';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-bs border-line">
      <div className="mx-auto flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-content-muted inline-full max-inline-6xl">
        <Badge tone="watch">{t('simulated.badge')}</Badge>
        <p>{t('simulated.description')}</p>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          lang="en"
          dir="ltr"
          className="ms-auto underline"
        >
          {t('attribution.chartNotice')}
        </a>
      </div>
    </footer>
  );
}
