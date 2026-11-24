import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('UI-11 is hidden from assistive technology and keeps the caller class', () => {
    const { container } = render(<Skeleton className="uppercase" />);
    const element = container.firstElementChild;
    expect(element).toHaveAttribute('aria-hidden', 'true');
    expect(element).toHaveClass('uppercase');
  });

  it('UI-11 renders with no class given', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
