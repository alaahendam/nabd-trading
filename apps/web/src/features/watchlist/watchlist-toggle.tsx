import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

import { Button } from '../../shared/ui';
import { useWatchlist, useWatchlistToggle } from './use-watchlist';

const STAR = { on: '★', off: '☆' } as const;

/**
 * A star button that adds a stock to the watchlist or takes it off. It is a real button with
 * `aria-pressed`, named "Watch <symbol>" whatever its state. The change shows at once; if the
 * server refuses, the star goes back and a short message says so.
 */
export function WatchlistToggle({ symbol }: { symbol: string }) {
  const { t } = useTranslation();
  const list = useWatchlist();
  const toggle = useWatchlistToggle();
  const watched = list.data?.some((item) => item.symbol === symbol) ?? false;

  return (
    <span className="inline-flex flex-col items-center">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={watched}
        aria-label={t('watchlist.toggle', { symbol })}
        disabled={list.isPending}
        onClick={() => {
          toggle.mutate({ symbol, watch: !watched });
        }}
      >
        <span
          aria-hidden="true"
          className={clsx('text-lg', watched ? 'text-watch' : 'text-content-muted')}
        >
          {watched ? STAR.on : STAR.off}
        </span>
      </Button>
      {toggle.isError ? (
        <span role="alert" className="text-xs text-negative">
          {t('watchlist.toggleError')}
        </span>
      ) : null}
    </span>
  );
}
