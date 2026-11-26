import { aapl } from '@nabd/testing';
import { renderRouter, screen } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

/** The server, by address: one stock, a watchlist with it, and a history that cannot load. */
function stubServer() {
  jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(url).pathname;
    if (path.endsWith('/stocks/AAPL')) return Promise.resolve(Response.json({ data: aapl }));
    if (path.endsWith('/stocks')) {
      return Promise.resolve(Response.json({ data: [aapl], nextCursor: null, total: 1 }));
    }
    if (path.endsWith('/watchlist')) {
      return Promise.resolve(Response.json({ data: [{ symbol: 'AAPL', addedAt: 1 }] }));
    }
    return Promise.resolve(
      Response.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
    );
  });
}

beforeEach(stubServer);
afterEach(() => {
  jest.restoreAllMocks();
});

const MIN = 48;

/** What is wrong with every pressable inside the screen: no role, no name, or too small. */
function problemsWithPressables(): string[] {
  const problems: string[] = [];
  const pressables = screen
    .getByTestId('screen')
    .queryAll((element) => typeof element.props['onResponderRelease'] === 'function');
  if (pressables.length === 0) problems.push('no pressable found, so nothing was checked');
  for (const element of pressables) {
    const role = (element.props['role'] ?? element.props['accessibilityRole']) as
      string | undefined;
    const name = (element.props['aria-label'] ?? element.props['accessibilityLabel']) as
      string | undefined;
    const style = StyleSheet.flatten(element.props['style']) as
      { minHeight?: number; height?: number; minWidth?: number; width?: number } | undefined;
    const label = name ?? '(no name)';
    if (role === undefined) problems.push(`${label}: no role`);
    if (name === undefined || name.trim() === '') problems.push(`${label}: no name`);
    if ((style?.minHeight ?? style?.height ?? 0) < MIN)
      problems.push(`${label}: under ${MIN} high`);
    if ((style?.minWidth ?? style?.width ?? MIN) < MIN)
      problems.push(`${label}: under ${MIN} wide`);
  }
  return problems;
}

describe('accessibility pass', () => {
  it.each([
    ['/', 'Apple Inc.'],
    ['/watchlist', 'Apple Inc.'],
    ['/stock/AAPL', 'Could not load the chart'],
    ['/settings', 'English'],
  ])(
    'A11-01 every pressable on %s has a role, a name and a 48-point target',
    async (url, ready) => {
      await renderRouter('./app', { initialUrl: url });
      await screen.findByText(ready);

      expect(problemsWithPressables()).toEqual([]);
    },
  );

  it.each([
    ['/', 'Apple Inc.'],
    ['/watchlist', 'Apple Inc.'],
    ['/stock/AAPL', 'Could not load the chart'],
    ['/settings', 'English'],
  ])('A11-02 %s has a header for a screen reader to jump to', async (url, ready) => {
    await renderRouter('./app', { initialUrl: url });
    await screen.findByText(ready);

    // The navigation title is a heading, a screen's own title a header: both are read as one.
    const headers =
      screen.root?.queryAll(
        (element) =>
          element.props['role'] === 'heading' || element.props['accessibilityRole'] === 'header',
      ) ?? [];

    expect(headers.length).toBeGreaterThanOrEqual(1);
  });

  it('A11-03 says whether a price went up or down in words, not only in color', async () => {
    await renderRouter('./app');

    expect(
      await screen.findByRole('link', { name: /Apple Inc\..*(Up|Down|Unchanged)/ }),
    ).toBeOnTheScreen();
  });
});
