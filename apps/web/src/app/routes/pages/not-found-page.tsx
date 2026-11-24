import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonVariants } from '../../../shared/ui';
import { useDocumentTitle } from '../use-document-title';

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-content-muted">{t('notFound.description')}</p>
      <Link to="/stocks" className={buttonVariants()}>
        {t('notFound.home')}
      </Link>
    </div>
  );
}
