import { type Period, PERIODS } from '@nabd/shared';
import { useTranslation } from 'react-i18next';

import { Button } from '../../shared/ui';

interface PeriodSwitcherProps {
  value: Period;
  onChange: (period: Period) => void;
}

/**
 * Toggle buttons, as in the theme switcher: the choice changes what one chart shows, it does not
 * switch between panels. The visible code (1D, 1W…) is the usual market notation in both languages.
 */
export function PeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t('chart.period.label')} className="flex gap-1">
      {PERIODS.map((period) => (
        <Button
          key={period}
          size="sm"
          variant={period === value ? 'primary' : 'ghost'}
          aria-pressed={period === value}
          aria-label={t(`chart.period.${period}`)}
          onClick={() => {
            onChange(period);
          }}
        >
          {period}
        </Button>
      ))}
    </div>
  );
}
