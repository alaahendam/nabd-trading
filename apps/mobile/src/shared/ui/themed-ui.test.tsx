import { resolveToken } from '@nabd/tokens';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '../../test-utils';
import { Screen, Text } from '.';

describe('themed components', () => {
  it.each(['light', 'dark'] as const)('THM-07 draws Text in the %s theme colors', async (theme) => {
    await renderWithProviders(<Text>hello</Text>, { 'nabd.theme': theme });

    expect(screen.getByText('hello')).toHaveStyle({ color: resolveToken(theme, 'content') });
  });

  it('THM-07 gives the muted variant the muted color', async () => {
    await renderWithProviders(<Text variant="muted">quiet</Text>, { 'nabd.theme': 'dark' });

    expect(screen.getByText('quiet')).toHaveStyle({
      color: resolveToken('dark', 'content-muted'),
    });
  });

  it.each(['light', 'dark'] as const)('THM-07 puts Screen on the %s background', async (theme) => {
    await renderWithProviders(
      <Screen>
        <Text>inside</Text>
      </Screen>,
      { 'nabd.theme': theme },
    );

    expect(screen.getByTestId('screen')).toHaveStyle({
      backgroundColor: resolveToken(theme, 'surface'),
    });
  });
});
