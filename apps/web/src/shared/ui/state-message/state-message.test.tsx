import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StateMessage } from './state-message';

describe('StateMessage', () => {
  it('UI-18 an empty state is a status with its title', () => {
    render(<StateMessage tone="empty" title="Nothing here" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing here');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('UI-18 an error state is an alert', () => {
    render(<StateMessage tone="error" title="Failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('UI-18 shows the description and the action only when given', () => {
    const { rerender } = render(<StateMessage tone="error" title="Failed" />);
    expect(screen.queryByText('More detail')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <StateMessage
        tone="error"
        title="Failed"
        description="More detail"
        action={<button type="button">Retry</button>}
      />,
    );
    expect(screen.getByText('More detail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
