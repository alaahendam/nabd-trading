import type { ErrorInfo } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router';

import { useConnectionStatus } from '../features/market-data';
import { Badge, buttonVariants, ConnectionBadge } from '../shared/ui';
import { ErrorBoundary, ErrorPage } from './error-boundary';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

const NAV_ITEMS = [
  { to: '/stocks', label: 'nav.stocks' },
  { to: '/watchlist', label: 'nav.watchlist' },
] as const;

export function Shell({ onError }: { onError: (error: Error, info: ErrorInfo) => void }) {
  const { t } = useTranslation();
  const status = useConnectionStatus();
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col min-block-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:inset-bs-2 focus:z-10 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        {t('nav.skipToContent')}
      </a>

      <header className="border-be border-line bg-surface-raised">
        <div className="mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 inline-full max-inline-6xl">
          <p className="text-lg font-semibold text-brand">{t('app.name')}</p>
          <nav aria-label={t('nav.label')} className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' })
                }
              >
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <div className="ms-auto flex flex-wrap items-center gap-3">
            <ConnectionBadge status={status} />
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

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

      <footer className="border-bs border-line">
        <div className="mx-auto flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-content-muted inline-full max-inline-6xl">
          <Badge tone="watch">{t('simulated.badge')}</Badge>
          <p>{t('simulated.description')}</p>
        </div>
      </footer>
    </div>
  );
}
