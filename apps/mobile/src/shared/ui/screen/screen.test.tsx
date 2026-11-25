import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createTestApp } from '../../../test-app';
import { Screen } from './screen';

/** The edges a screen keeps clear: the native view takes them as a mode per edge. */
const edgesOn = (modes: unknown) =>
  Object.entries(modes as Record<string, string>)
    .filter(([, mode]) => mode !== 'off')
    .map(([edge]) => edge)
    .sort();

describe('Screen', () => {
  it('SAF-01 keeps all four edges clear of the device by default', async () => {
    await createTestApp().render(
      <Screen>
        <Text>content</Text>
      </Screen>,
    );

    expect(edgesOn(screen.getByTestId('screen').props['edges'])).toEqual([
      'bottom',
      'left',
      'right',
      'top',
    ]);
  });

  it('SAF-01 takes only the edges it is given', async () => {
    await createTestApp().render(
      <Screen edges={['bottom']}>
        <Text>content</Text>
      </Screen>,
    );

    expect(edgesOn(screen.getByTestId('screen').props['edges'])).toEqual(['bottom']);
  });
});
