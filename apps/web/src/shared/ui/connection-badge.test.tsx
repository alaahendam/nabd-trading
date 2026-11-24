import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithI18n } from '../../test/render';
import { ConnectionBadge } from './connection-badge';

const LABELS = {
  connecting: 'Connecting…',
  connected: 'Live',
  reconnecting: 'Reconnecting…',
  offline: 'Offline',
} as const;

describe('ConnectionBadge', () => {
  it.each(Object.entries(LABELS))('UI-08 shows %s as "%s"', (status, label) => {
    renderWithI18n(<ConnectionBadge status={status as keyof typeof LABELS} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });

  it('UI-09 shows the Arabic label', () => {
    renderWithI18n(<ConnectionBadge status="offline" />, 'ar');
    expect(screen.getByRole('status')).toHaveTextContent('غير متصل');
  });

  it('UI-10 hides the decorative dot from assistive technology', () => {
    const { container } = renderWithI18n(<ConnectionBadge status="connected" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe('Live');
  });
});
