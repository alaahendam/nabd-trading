import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '../use-document-title';

/** Placeholder: the stock list feature replaces the body in Phase 5. */
export function StocksPage() {
  const { t } = useTranslation();
  useDocumentTitle('pages.stocks');
  return <h1 className="text-2xl font-semibold">{t('pages.stocks')}</h1>;
}
