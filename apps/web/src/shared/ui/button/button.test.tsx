import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button, buttonVariants } from './button';

describe('Button', () => {
  it('UI-01 defaults to type button, so it does not submit a form', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Button>Go</Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('UI-02 accepts a submit type', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'submit');
    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UI-03 runs its handler on click and does nothing when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('UI-04 gives each variant and size its own classes', () => {
    const variants = (['primary', 'secondary', 'ghost'] as const).map((variant) =>
      buttonVariants({ variant }),
    );
    expect(new Set(variants).size).toBe(3);
    const sizes = (['md', 'sm'] as const).map((size) => buttonVariants({ size }));
    expect(new Set(sizes).size).toBe(2);
    expect(buttonVariants()).toBe(buttonVariants({ variant: 'primary', size: 'md' }));
  });

  it('UI-05 keeps a class the caller passes', () => {
    render(<Button className="uppercase">Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('uppercase');
    expect(button.className).toContain(buttonVariants());
  });

  it('UI-06 forwards other props', () => {
    render(
      <Button aria-pressed="true" aria-label="Pin" data-testid="pin">
        icon
      </Button>,
    );
    const button = screen.getByTestId('pin');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Pin' })).toBe(button);
  });
});
