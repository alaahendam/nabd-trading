import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Skeleton, StateMessage } from '../../shared/ui';
import { useSubscription } from '../market-data';
import { useStocks } from './stock-queries';
import { StockRow } from './stock-row';

const SKELETON_ROWS = 6;

interface StockListProps {
  /** Show only these symbols. Without it the list shows every stock. */
  symbols?: readonly string[];
  renderAction?: (symbol: string) => ReactNode;
}

export function StockList({ symbols, renderAction }: StockListProps) {
  const { t } = useTranslation();
  const query = useStocks();

  const visible = useMemo(() => {
    const all = query.data ?? [];
    return symbols === undefined ? all : all.filter((stock) => symbols.includes(stock.symbol));
  }, [query.data, symbols]);

  useSubscription(visible.map((stock) => stock.symbol));

  if (query.isPending) {
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

  if (query.isError && query.data === undefined) {
    return (
      <StateMessage
        tone="error"
        title={t('stocks.error')}
        description={t('stocks.errorHint')}
        action={
          <Button
            onClick={() => {
              void query.refetch();
            }}
          >
            {t('errors.retry')}
          </Button>
        }
      />
    );
  }

  if (visible.length === 0) {
    return <StateMessage tone="empty" title={t('stocks.empty')} />;
  }

  return (
    <div>
      <p className="pbe-2 text-sm text-content-muted">
        {t('count.stocks', { count: visible.length })}
      </p>
      <ul>
        {visible.map((stock) => (
          <StockRow
            key={stock.symbol}
            stock={stock}
            {...(renderAction === undefined ? {} : { renderAction })}
          />
        ))}
      </ul>
    </div>
  );
}
