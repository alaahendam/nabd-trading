import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type TitleKey = 'pages.stocks' | 'pages.watchlist' | 'pages.stock' | 'notFound.title';

/** Sets the tab title to "<page> · <app>", in the current language. */
export function useDocumentTitle(key: TitleKey): void {
  const { t } = useTranslation();
  const page = t(key);
  const app = t('app.name');
  useEffect(() => {
    document.title = `${page} · ${app}`;
  }, [page, app]);
}
