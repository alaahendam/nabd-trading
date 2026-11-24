import type { ErrorInfo } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';

import { ErrorBoundary, ErrorPage } from './error-boundary';
import { Footer } from './footer';
import { Header } from './header';

export function Shell({ onError }: { onError: (error: Error, info: ErrorInfo) => void }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col min-block-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:inset-bs-2 focus:z-10 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        {t('nav.skipToContent')}
      </a>

      <Header />

      <main id="main" tabIndex={-1} className="mx-auto flex-1 px-4 py-6 inline-full max-inline-6xl">
        <ErrorBoundary
          key={pathname}
          onError={onError}
          fallback={(retry) => <ErrorPage onRetry={retry} />}
        >
          <Suspense fallback={<p role="status">{t('loading.page')}</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}
