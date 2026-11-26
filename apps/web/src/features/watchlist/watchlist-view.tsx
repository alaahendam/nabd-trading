import { useWatchlist } from '@nabd/data';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, buttonVariants, Skeleton, StateMessage } from '../../shared/ui';
import { StockList } from '../stocks';
import { WatchlistToggle } from './watchlist-toggle';

/** The stocks the user follows, live, each with a star to take it off. */
export function WatchlistView() {
  const { t } = useTranslation();
  const list = useWatchlist();

  // Data first, so a refresh that fails after the list loaded keeps showing it.
  if (list.data !== undefined) {
    if (list.data.length === 0) {
      return (
        <StateMessage
          tone="empty"
          title={t('watchlist.empty.title')}
          description={t('watchlist.empty.description')}
          action={
            <Link to="/stocks" className={buttonVariants()}>
              {t('watchlist.empty.action')}
            </Link>
          }
        />
      );
    }
    return (
      <StockList
        symbols={list.data.map((item) => item.symbol)}
        renderAction={(symbol) => <WatchlistToggle symbol={symbol} />}
      />
    );
  }

  if (list.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label={t('watchlist.loading')}>
        <Skeleton className="block-10 inline-full" />
      </div>
    );
  }

  return (
    <StateMessage
      tone="error"
      title={t('watchlist.error')}
      description={t('stocks.errorHint')}
      action={
        <Button
          onClick={() => {
            void list.refetch();
          }}
        >
          {t('errors.retry')}
        </Button>
      }
    />
  );
}
