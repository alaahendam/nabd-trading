import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Skeleton, StateMessage } from '../../shared/ui';
import { useSubscription } from '../market-data';
import { StockRow } from './stock-row';
import { useOnVisible } from './use-on-visible';
import { useStockList } from './use-stock-list';

const SKELETON_ROWS = 6;

interface StockListProps {
  /** Show only these symbols, in one request. Without it the list pages through every stock. */
  symbols?: readonly string[];
  renderAction?: (symbol: string) => ReactNode;
}

export function StockList({ symbols, renderAction }: StockListProps) {
  const { t } = useTranslation();
  const list = useStockList(symbols);

  // Only the rows that are loaded are subscribed, so the subscriptions grow with the scrolling.
  useSubscription(list.stocks.map((stock) => stock.symbol));

  if (list.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label={t('stocks.loading')}>
        {Array.from({ length: SKELETON_ROWS }, (_unused, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-3">
            <Skeleton className="block-10 inline-40" />
            <Skeleton className="block-10 inline-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!list.hasData) {
    return (
      <StateMessage
        tone="error"
        title={t('stocks.error')}
        description={t('stocks.errorHint')}
        action={<Button onClick={list.refetch}>{t('errors.retry')}</Button>}
      />
    );
  }

  if (list.stocks.length === 0) {
    return <StateMessage tone="empty" title={t('stocks.empty')} />;
  }

  return (
    <div>
      <p className="pbe-2 text-sm text-content-muted">{t('count.stocks', { count: list.total })}</p>
      <ul className="rounded-lg border border-line bg-surface-raised px-4 shadow-raised">
        {list.stocks.map((stock) => (
          <StockRow
            key={stock.symbol}
            stock={stock}
            {...(renderAction === undefined ? {} : { renderAction })}
          />
        ))}
      </ul>
      {list.hasMore ? (
        <LoadMore
          onLoad={list.loadMore}
          isLoading={list.isLoadingMore}
          failed={list.loadMoreFailed}
        />
      ) : null}
    </div>
  );
}

interface LoadMoreProps {
  onLoad: () => void;
  isLoading: boolean;
  failed: boolean;
}

/**
 * The way to the next page: a button, so it works with the keyboard and a screen reader, and it
 * loads by itself when it scrolls into view. It stops watching while a page loads, and after a
 * failure, so a failing request is not repeated in a loop; pressing the button tries again.
 */
function LoadMore({ onLoad, isLoading, failed }: LoadMoreProps) {
  const { t } = useTranslation();
  const watch = useOnVisible(onLoad, !isLoading && !failed);

  let label: string = t('stocks.loadMore');
  if (isLoading) {
    label = t('stocks.loadingMore');
  } else if (failed) {
    label = t('errors.retry');
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {failed ? (
        <p role="alert" className="text-sm text-negative">
          {t('stocks.loadMoreError')}
        </p>
      ) : null}
      <Button
        ref={watch}
        variant="secondary"
        onClick={onLoad}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {label}
      </Button>
    </div>
  );
}
