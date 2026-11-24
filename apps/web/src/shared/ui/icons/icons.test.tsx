import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChevronDownIcon, GlobeIcon, MonitorIcon, MoonIcon, SunIcon } from './icons';

describe('icons', () => {
  it.each([
    ['sun', SunIcon],
    ['moon', MoonIcon],
    ['monitor', MonitorIcon],
    ['globe', GlobeIcon],
    ['chevron', ChevronDownIcon],
  ])('UI-24 the %s icon is a decorative svg that follows the text color', (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });
});
