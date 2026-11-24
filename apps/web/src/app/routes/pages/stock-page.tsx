import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { StockDetail } from '../../../features/stocks';
import { useDocumentTitle } from '../use-document-title';
import { NotFoundPage } from './not-found-page';

export function StockPage() {
  const { t } = useTranslation();
  const { symbol } = useParams();
  useDocumentTitle(symbol ?? t('notFound.title'));

  if (symbol === undefined) {
    return <NotFoundPage />;
  }
  return <StockDetail symbol={symbol} />;
}
