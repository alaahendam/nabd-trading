import type { ComponentProps, ReactNode } from 'react';

import { ChevronDownIcon } from '../icons/icons';

export interface SelectOption {
  value: string;
  label: string;
  /** The language of the label, when it differs from the page. */
  lang?: string;
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'onChange' | 'value' | 'children'> {
  /** The accessible name. There is no visible label. */
  label: string;
  /** A decorative icon at the start of the control. */
  icon: ReactNode;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
}

/**
 * A native select with a leading icon and a chevron. Native, so the keyboard, the screen reader
 * and the phone's own picker all work without rebuilding a listbox.
 */
export function Select({ label, icon, value, options, onChange, ...props }: SelectProps) {
  return (
    <span className="relative inline-flex items-center text-content">
      <span className="pointer-events-none absolute start-2.5">{icon}</span>
      <select
        {...props}
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="appearance-none rounded-md border border-line-strong bg-surface-raised ps-8 pe-8 text-sm font-medium min-block-9"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} lang={option.lang}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute end-2.5">
        <ChevronDownIcon />
      </span>
    </span>
  );
}
