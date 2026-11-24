import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithI18n } from '../../../test/render';
import { Logo } from './logo';

describe('Logo', () => {
  it('UI-25 shows the translated name beside a decorative mark', () => {
    const { container, unmount } = renderWithI18n(<Logo />);
    expect(screen.getByText('Nabd')).toBeInTheDocument();
    const mark = container.querySelector('svg');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).toHaveAttribute('focusable', 'false');
    unmount();

    renderWithI18n(<Logo />, 'ar');
    expect(screen.getByText('نبض')).toBeInTheDocument();
  });

  it('UI-26 takes the mark colors from the semantic tokens', () => {
    const { container } = renderWithI18n(<Logo />);
    const mark = container.querySelector('svg');
    expect(mark?.querySelector('rect')).toHaveClass('fill-brand');
    expect(mark?.querySelector('path')).toHaveClass('stroke-on-brand');
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
