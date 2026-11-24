import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  it.each(['neutral', 'positive', 'negative', 'watch'] as const)(
    'UI-07 renders its text with the %s tone',
    (tone) => {
      render(<Badge tone={tone}>Label</Badge>);
      expect(screen.getByText('Label')).toBeVisible();
    },
  );

  it('UI-07 gives each tone its own classes and defaults to neutral', () => {
    const tones = (['neutral', 'positive', 'negative', 'watch'] as const).map((tone) =>
      badgeVariants({ tone }),
    );
    expect(new Set(tones).size).toBe(4);
    expect(badgeVariants()).toBe(badgeVariants({ tone: 'neutral' }));
  });

  it('UI-07 keeps a class the caller passes and forwards props', () => {
    render(
      <Badge className="uppercase" title="hint">
        Label
      </Badge>,
    );
    expect(screen.getByText('Label')).toHaveClass('uppercase');
    expect(screen.getByText('Label')).toHaveAttribute('title', 'hint');
  });
});
