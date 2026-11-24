import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';

import { useConnectionStatus } from '../../features/market-data';
import { buttonVariants, ConnectionBadge, Logo } from '../../shared/ui';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

const NAV_ITEMS = [
  { to: '/stocks', label: 'nav.stocks' },
  { to: '/watchlist', label: 'nav.watchlist' },
] as const;

export function Header() {
  const { t } = useTranslation();
  const status = useConnectionStatus();

  return (
    <header className="border-be border-line bg-surface-raised">
      <div className="mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 inline-full max-inline-6xl">
        <Link to="/stocks" className="rounded-md">
          <Logo />
        </Link>
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
  );
}
