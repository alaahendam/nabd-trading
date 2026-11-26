import { changeDirection, formatChange, formatPercent } from '@nabd/i18n';
import { cva } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';

export const changeBadgeVariants = cva('inline-flex items-center gap-1 text-sm font-medium', {
  variants: {
    direction: {
      up: 'text-positive',
      down: 'text-negative',
      flat: 'text-content-muted',
    },
  },
});

const ARROWS = { up: '▲', down: '▼', flat: '–' } as const;

/**
 * A price change and its percentage. Direction is shown by an arrow and the sign, and spoken
 * as a word, so color is never the only signal.
 */
export function ChangeBadge({ change, changePercent }: { change: number; changePercent: number }) {
  const { t } = useTranslation();
  const direction = changeDirection(change);

  return (
    <span className={changeBadgeVariants({ direction })}>
      <span aria-hidden="true">{ARROWS[direction]}</span>
      <span className="sr-only">{t(`change.${direction}`)}</span>
      <span className="numeric">{`${formatChange(change)} (${formatPercent(changePercent)})`}</span>
    </span>
  );
}
