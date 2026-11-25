import { ApiClientError } from '@nabd/api-client';
import type { StockWithQuote } from '@nabd/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { formatPrice, formatVolume } from '../../lib/format/format';
import { Button, buttonVariants, ChangeBadge, Skeleton, StateMessage } from '../../shared/ui';
import { useSubscription } from '../market-data';
import { PriceFlash } from './price-flash';
import { StockChart } from './stock-chart';
import { useStock } from './stock-queries';
import { useLiveQuote } from './use-live-quote';

interface StockDetailProps {
  symbol: string;
  /** Something to show beside the symbol, such as a button. It is given the symbol. */
  renderAction?: (symbol: string) => ReactNode;
}

export function StockDetail({ symbol, renderAction }: StockDetailProps) {
  const { t } = useTranslation();
  const query = useStock(symbol);

  useSubscription([symbol]);

  // Data comes first, so a refresh that fails after the page loaded keeps showing it.
  if (query.data !== undefined) {
    return <StockDetailBody stock={query.data} renderAction={renderAction} />;
  }

  if (query.isPending) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={t('stock.loading')}
        className="flex flex-col gap-4"
      >
        <Skeleton className="block-10 inline-48" />
        <Skeleton className="block-24 inline-full" />
      </div>
    );
  }

  if (query.error instanceof ApiClientError && query.error.status === 404) {
    return (
      <StateMessage
        tone="error"
        title={t('stock.notFound.title')}
        description={t('stock.notFound.description', { symbol })}
        action={
          <Link to="/stocks" className={buttonVariants()}>
            {t('notFound.home')}
          </Link>
        }
      />
    );
  }

  return (
    <StateMessage
      tone="error"
      title={t('stock.error')}
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

function StockDetailBody({
  stock,
  renderAction,
}: {
  stock: StockWithQuote;
  renderAction: ((symbol: string) => ReactNode) | undefined;
}) {
  const { t } = useTranslation();
  const live = useLiveQuote(stock.quote);

  const stats = [
    { label: t('stock.stats.open'), value: formatPrice(stock.quote.open) },
    { label: t('stock.stats.high'), value: formatPrice(live.high) },
    { label: t('stock.stats.low'), value: formatPrice(live.low) },
    { label: t('stock.stats.previousClose'), value: formatPrice(stock.quote.previousClose) },
    { label: t('stock.stats.volume'), value: formatVolume(live.volume) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{stock.symbol}</h1>
            {renderAction?.(stock.symbol)}
          </div>
          {/* English names stay in their own direction inside Arabic text: <bdi> isolates them. */}
          <p className="text-content-muted">
            <bdi>{stock.name}</bdi>
          </p>
          <p className="text-sm text-content-muted">
            <bdi>{`${stock.exchange} · ${stock.sector}`}</bdi>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriceFlash
            large
            price={live.price}
            direction={live.direction}
            freshness={live.freshness}
            tickKey={live.tickKey}
          />
          <ChangeBadge change={live.change} changePercent={live.changePercent} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-surface-raised p-4 shadow-raised sm:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-sm text-content-muted">{stat.label}</dt>
            <dd className="numeric font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <StockChart symbol={stock.symbol} />
    </div>
  );
}
