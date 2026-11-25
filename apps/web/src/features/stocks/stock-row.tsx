import type { StockWithQuote } from '@nabd/shared';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { ChangeBadge } from '../../shared/ui';
import { PriceFlash } from './price-flash';
import { useLiveQuote } from './use-live-quote';

interface StockRowProps {
  stock: StockWithQuote;
  /** Something to show at the end of the row, such as a button. It is given the symbol. */
  renderAction?: (symbol: string) => ReactNode;
}

export function StockRow({ stock, renderAction }: StockRowProps) {
  const live = useLiveQuote(stock.quote);

  return (
    <li className="flex items-center gap-4 border-be border-line py-3 last:border-be-0">
      <Link to={`/stocks/${stock.symbol}`} className="flex-1 rounded-sm min-inline-0">
        <span className="block font-semibold">{stock.symbol}</span>{' '}
        <span className="block truncate text-sm text-content-muted">
          <bdi>{stock.name}</bdi>
        </span>
      </Link>
      <div className="flex flex-col items-end gap-1">
        <PriceFlash
          price={live.price}
          direction={live.direction}
          freshness={live.freshness}
          tickKey={live.tickKey}
        />
        <ChangeBadge change={live.change} changePercent={live.changePercent} />
      </div>
      {renderAction?.(stock.symbol)}
    </li>
  );
}
