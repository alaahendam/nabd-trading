import { useTranslation } from 'react-i18next';

import { WatchlistView } from '../../../features/watchlist';
import { useDocumentTitle } from '../use-document-title';

export function WatchlistPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.watchlist'));
  return (
    <>
      <h1 className="pbe-4 text-2xl font-semibold">{t('pages.watchlist')}</h1>
      <WatchlistView />
    </>
  );
}
