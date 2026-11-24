import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '../use-document-title';

/** Placeholder: the watchlist feature replaces the body in Phase 5. */
export function WatchlistPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.watchlist');
  return <h1 className="text-2xl font-semibold">{t('pages.watchlist')}</h1>;
}
