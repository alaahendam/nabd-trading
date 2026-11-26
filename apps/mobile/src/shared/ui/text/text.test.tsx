import { screen } from '@testing-library/react-native';

import { maxFontScale } from '../../../lib/theme/theme';
import { createTestApp } from '../../../test-app';
import { Text } from './text';

describe('Text', () => {
  it.each(['body', 'title', 'muted', 'display'] as const)(
    'DYN-01 follows the system font size, up to the cap, in the %s variant',
    async (variant) => {
      await createTestApp().render(<Text variant={variant}>size</Text>);

      const text = screen.getByText('size');

      expect(text.props['maxFontSizeMultiplier']).toBe(2);
      expect(text.props['allowFontScaling']).not.toBe(false);
    },
  );

  it('DYN-02 has the cap as one value that a caller cannot override', async () => {
    expect(maxFontScale).toBe(2);
    await createTestApp().render(<Text maxFontSizeMultiplier={5}>size</Text>);

    expect(screen.getByText('size').props['maxFontSizeMultiplier']).toBe(maxFontScale);
  });
});
