import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useDocumentTitle } from '../use-document-title';

/** Placeholder: the stock detail feature replaces the body in Phase 5. */
export function StockPage() {
  const { t } = useTranslation();
  const { symbol } = useParams();
  useDocumentTitle('pages.stock');
  return (
    <>
      <h1 className="text-2xl font-semibold">{t('pages.stock')}</h1>
      <p className="text-content-muted numeric">{symbol}</p>
    </>
  );
}
