import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithI18n } from '../../../test/render';
import { ChangeBadge, changeBadgeVariants } from './change-badge';

const badge = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('ChangeBadge', () => {
  it('UI-12 shows an up change with its sign, an arrow and the word for screen readers', () => {
    const { container } = renderWithI18n(<ChangeBadge change={1.5} changePercent={0.85} />);
    expect(badge(container)).toHaveTextContent('▲');
    expect(screen.getByText('+$1.50 (+0.85%)')).toBeInTheDocument();
    expect(screen.getByText('Up')).toHaveClass('sr-only');
  });

  it('UI-13 shows a down change', () => {
    const { container } = renderWithI18n(<ChangeBadge change={-2} changePercent={-1.2} />);
    expect(badge(container)).toHaveTextContent('▼');
    expect(screen.getByText('-$2.00 (-1.20%)')).toBeInTheDocument();
    expect(screen.getByText('Down')).toHaveClass('sr-only');
  });

  it.each([
    [0, 0],
    [0.004, 0.004],
  ])('UI-14 shows %s as unchanged', (change, percent) => {
    const { container } = renderWithI18n(<ChangeBadge change={change} changePercent={percent} />);
    expect(badge(container)).toHaveTextContent('–');
    expect(screen.getByText('$0.00 (0.00%)')).toBeInTheDocument();
    expect(screen.getByText('Unchanged')).toBeInTheDocument();
  });

  it('UI-15 hides the arrow and gives each direction its own classes', () => {
    const { container } = renderWithI18n(<ChangeBadge change={1} changePercent={1} />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('▲');
    const classes = (['up', 'down', 'flat'] as const).map((direction) =>
      changeBadgeVariants({ direction }),
    );
    expect(new Set(classes).size).toBe(3);
  });

  it('UI-16 tolerates bad numbers', () => {
    renderWithI18n(<ChangeBadge change={Number.NaN} changePercent={Number.NaN} />);
    expect(screen.getByText('— (—)')).toBeInTheDocument();
    expect(screen.getByText('Unchanged')).toBeInTheDocument();
  });

  it('UI-17 speaks Arabic and keeps the figures Latin', () => {
    const { rerender } = renderWithI18n(<ChangeBadge change={1.5} changePercent={0.85} />, 'ar');
    expect(screen.getByText('ارتفاع')).toBeInTheDocument();
    expect(screen.getByText('+$1.50 (+0.85%)')).toBeInTheDocument();
    rerender(<ChangeBadge change={-1.5} changePercent={-0.85} />);
    expect(screen.getByText('انخفاض')).toBeInTheDocument();
  });
});
