import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithI18n } from '../../test/render';
import { PriceFlash } from './price-flash';

describe('PriceFlash', () => {
  it('PF-01 shows the formatted price as a left-to-right figure', () => {
    renderWithI18n(<PriceFlash price={1234.5} direction="flat" freshness="fresh" tickKey={1} />);
    expect(screen.getByText('$1,234.50')).toHaveClass('numeric');
  });

  it.each([
    ['up', 'animate-flash-up'],
    ['down', 'animate-flash-down'],
  ] as const)('PF-02 flashes when the price goes %s', (direction, animation) => {
    renderWithI18n(<PriceFlash price={10} direction={direction} freshness="fresh" tickKey={1} />);
    const price = screen.getByText('$10.00');
    expect(price).toHaveAttribute('data-direction', direction);
    expect(price).toHaveClass(animation);
  });

  it('PF-02 does not flash when the price is flat', () => {
    renderWithI18n(
      <PriceFlash price={10} direction="flat" freshness="fresh" tickKey={undefined} />,
    );
    const price = screen.getByText('$10.00');
    expect(price).toHaveAttribute('data-direction', 'flat');
    expect(price.className).not.toContain('animate-flash');
  });

  it('PF-03 shows the delayed label only when the price is stale', () => {
    const { rerender } = renderWithI18n(
      <PriceFlash price={10} direction="flat" freshness="stale" tickKey={1} />,
    );
    expect(screen.getByText('Delayed')).toBeInTheDocument();

    rerender(<PriceFlash price={10} direction="flat" freshness="fresh" tickKey={1} />);
    expect(screen.queryByText('Delayed')).not.toBeInTheDocument();
    rerender(<PriceFlash price={10} direction="flat" freshness="none" tickKey={undefined} />);
    expect(screen.queryByText('Delayed')).not.toBeInTheDocument();
  });
});
