import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

import { type ChangeDirection, formatPrice } from '../../lib/format/format';
import type { Freshness } from '../market-data';

const FLASH: Readonly<Record<ChangeDirection, string>> = {
  up: 'animate-flash-up',
  down: 'animate-flash-down',
  flat: '',
};

interface PriceFlashProps {
  price: number;
  direction: ChangeDirection;
  freshness: Freshness;
  /** A new key restarts the flash, so every tick flashes once. */
  tickKey: number | undefined;
  large?: boolean;
}

/** The price figure, washed in the market color for a moment after it changes. */
export function PriceFlash({ price, direction, freshness, tickKey, large }: PriceFlashProps) {
  const { t } = useTranslation();

  return (
    <span className="inline-flex flex-col items-end">
      <span
        key={tickKey}
        data-direction={direction}
        className={clsx(
          'rounded-sm px-1 font-semibold numeric',
          large === true ? 'text-3xl' : 'text-lg',
          FLASH[direction],
        )}
      >
        {formatPrice(price)}
      </span>
      {freshness === 'stale' ? (
        <span className="text-xs text-content-muted">{t('stocks.stale')}</span>
      ) : null}
    </span>
  );
}
