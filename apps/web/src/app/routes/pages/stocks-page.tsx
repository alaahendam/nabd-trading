import { useTranslation } from 'react-i18next';

import { StockList } from '../../../features/stocks';
import { WatchlistToggle } from '../../../features/watchlist';
import { useDocumentTitle } from '../use-document-title';

export function StocksPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.stocks'));
  return (
    <>
      <h1 className="pbe-4 text-2xl font-semibold">{t('pages.stocks')}</h1>
      <StockList renderAction={(symbol) => <WatchlistToggle symbol={symbol} />} />
    </>
  );
}
