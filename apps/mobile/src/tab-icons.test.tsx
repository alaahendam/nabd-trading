import { aapl } from '@nabd/testing';
import { resolveToken } from '@nabd/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderRouter, screen } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { THEME_STORAGE_KEY } from './lib/storage/keys';

process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

function stubServer() {
  jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url).pathname;
    if (path.endsWith('/stocks')) {
      return Promise.resolve(Response.json({ data: [aapl], nextCursor: null, total: 1 }));
    }
    return Promise.resolve(Response.json({ data: [] }));
  });
}

beforeEach(async () => {
  stubServer();
  await AsyncStorage.clear();
});
afterEach(() => {
  jest.restoreAllMocks();
});

const icon = (name: string) => screen.getAllByTestId(`tab-icon-${name}`, { hidden: true });

const colorsOf = (name: string) =>
  icon(name)
    .map((element) => StyleSheet.flatten(element.props['style']) as { color: string })
    .map((style) => style.color);

describe('tab icons', () => {
  it('TAB-01 gives each tab an icon, and names the tab by its title', async () => {
    await renderRouter('./app');
    await screen.findByText('Apple Inc.');

    expect(screen.getByRole('button', { name: 'Stocks, tab, 1 of 2' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Watchlist, tab, 2 of 2' })).toBeOnTheScreen();
    expect(icon('trending-up')).not.toHaveLength(0);
    expect(icon('star')).not.toHaveLength(0);
  });

  it('TAB-01 hides the icons from screen readers', async () => {
    await renderRouter('./app');
    await screen.findByText('Apple Inc.');

    expect(icon('star')[0]?.props['importantForAccessibility']).toBe('no-hide-descendants');
  });

  it.each(['light', 'dark'] as const)(
    'TAB-02 colors the active and the inactive icon from the %s theme',
    async (theme) => {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      await renderRouter('./app');
      await screen.findByText('Apple Inc.');

      // The tab bar draws each icon twice, an active layer and an inactive one, and fades between.
      for (const name of ['trending-up', 'star']) {
        expect(colorsOf(name).sort()).toEqual(
          [resolveToken(theme, 'content'), resolveToken(theme, 'content-muted')].sort(),
        );
      }
    },
  );
});
