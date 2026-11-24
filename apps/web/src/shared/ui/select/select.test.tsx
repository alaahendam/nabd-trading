import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', lang: 'ar' },
];

const renderSelect = (props: Partial<React.ComponentProps<typeof Select>> = {}) =>
  render(
    <Select
      label="Pick one"
      icon={<svg data-testid="icon" aria-hidden="true" />}
      value="a"
      options={options}
      onChange={() => undefined}
      {...props}
    />,
  );

describe('Select', () => {
  it('UI-19 is a native select with an accessible name, its options and the value selected', () => {
    renderSelect({ value: 'b' });
    const select = screen.getByRole('combobox', { name: 'Pick one' });
    expect(select).toHaveValue('b');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);
  });

  it('UI-20 reports the chosen value once', async () => {
    const onChange = vi.fn();
    renderSelect({ onChange });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Pick one' }), 'c');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('UI-21 hides the icon and the chevron from assistive technology', () => {
    const { container } = renderSelect();
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThanOrEqual(2);
    for (const element of hidden) {
      expect(element.closest('[class*="pointer-events-none"]')).not.toBeNull();
    }
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('UI-22 lets an option carry its own language', () => {
    renderSelect();
    expect(screen.getByRole('option', { name: 'Gamma' })).toHaveAttribute('lang', 'ar');
    expect(screen.getByRole('option', { name: 'Alpha' })).not.toHaveAttribute('lang');
  });

  it('UI-23 can be disabled', () => {
    renderSelect({ disabled: true });
    expect(screen.getByRole('combobox', { name: 'Pick one' })).toBeDisabled();
  });
});
