import { PERIODS } from '@nabd/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../shared/ui';
import {
  type ChartRange,
  type CustomRangeProblem,
  describeCustomRange,
  toDateInput,
  validateCustomRange,
} from './custom-range';

const DAY = 86_400_000;
/** The oldest day offered: its start is never older than the year the server serves. */
const OLDEST_DAYS_BACK = 364;
const DEFAULT_DAYS = 7;

interface RangeSwitcherProps {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
}

interface Form {
  from: string;
  to: string;
  min: string;
  max: string;
  problem: CustomRangeProblem | undefined;
}

/**
 * The fixed periods, and a Custom option that opens two date fields. Toggle buttons, as in the
 * theme switcher: the choice changes what one chart shows. The visible period codes (1D, 1W…) are
 * the usual market notation in both languages. The form only applies when it is valid; a problem
 * is said in words next to it.
 */
export function RangeSwitcher({ value, onChange }: RangeSwitcherProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Form | undefined>(undefined);

  const openForm = () => {
    // "Now" is read when the form opens, in an event, not while rendering.
    const now = Date.now();
    const range = value.kind === 'custom' ? value.range : undefined;
    setForm({
      from: toDateInput(range?.from ?? now - DEFAULT_DAYS * DAY),
      to: toDateInput(range?.to ?? now),
      min: toDateInput(now - OLDEST_DAYS_BACK * DAY),
      max: toDateInput(now),
      problem: undefined,
    });
  };

  const apply = (current: Form) => {
    const result = validateCustomRange(current, Date.now());
    if (result.ok) {
      onChange({ kind: 'custom', range: result.range });
      setForm(undefined);
    } else {
      setForm({ ...current, problem: result.problem });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={t('chart.period.label')} className="flex flex-wrap gap-1">
        {PERIODS.map((period) => {
          const selected = value.kind === 'period' && value.period === period;
          return (
            <Button
              key={period}
              size="sm"
              variant={selected ? 'primary' : 'ghost'}
              aria-pressed={selected}
              aria-label={`${period}, ${t(`chart.period.${period}`)}`}
              onClick={() => {
                setForm(undefined);
                onChange({ kind: 'period', period });
              }}
            >
              {period}
            </Button>
          );
        })}
        <Button
          size="sm"
          variant={value.kind === 'custom' ? 'primary' : 'ghost'}
          aria-pressed={value.kind === 'custom'}
          aria-expanded={form !== undefined}
          title={value.kind === 'custom' ? describeCustomRange(value.range) : undefined}
          onClick={() => {
            if (form === undefined) {
              openForm();
            } else {
              setForm(undefined);
            }
          }}
        >
          {t('chart.custom.label')}
        </Button>
      </div>

      {form === undefined ? null : (
        <form
          className="flex flex-wrap items-end gap-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            apply(form);
          }}
        >
          <DateField
            label={t('chart.custom.from')}
            value={form.from}
            min={form.min}
            max={form.max}
            onChange={(from) => {
              setForm({ ...form, from });
            }}
          />
          <DateField
            label={t('chart.custom.to')}
            value={form.to}
            min={form.min}
            max={form.max}
            onChange={(to) => {
              setForm({ ...form, to });
            }}
          />
          <Button type="submit" size="sm">
            {t('chart.custom.apply')}
          </Button>
          {form.problem === undefined ? null : (
            <p role="alert" className="text-sm text-negative">
              {t(`chart.custom.problem.${form.problem}`)}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
}

function DateField({ label, value, min, max, onChange }: DateFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-content-muted">
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="rounded-md border border-line-strong bg-surface-raised px-2 text-content min-block-9"
      />
    </label>
  );
}
