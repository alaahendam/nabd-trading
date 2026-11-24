import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Sets the tab title to "<page> · <app>", in the current language. */
export function useDocumentTitle(page: string): void {
  const { t } = useTranslation();
  const app = t('app.name');
  useEffect(() => {
    document.title = `${page} · ${app}`;
  }, [page, app]);
}
