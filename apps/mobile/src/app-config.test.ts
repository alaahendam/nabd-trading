import { resolveToken } from '@nabd/tokens';

import config from '../app.config';

/** Loads a file as the test environment does: an image becomes its name, a missing file throws. */
const load = (path: string): unknown => jest.requireActual(path);

describe('app configuration', () => {
  it('ICN-01 names an icon, an adaptive icon and a splash, and the files exist', () => {
    expect(config.icon).toBe('./assets/icon.png');
    expect(config.android?.adaptiveIcon?.foregroundImage).toBe('./assets/adaptive-icon.png');
    expect(() => load('../assets/icon.png')).not.toThrow();
    expect(() => load('../assets/adaptive-icon.png')).not.toThrow();
    expect(() => load('../assets/splash-icon.png')).not.toThrow();
  });

  it('ICN-01 puts the splash and the adaptive icon on the brand color', () => {
    const brand = resolveToken('light', 'brand');
    const splash = config.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    );

    expect(config.android?.adaptiveIcon?.backgroundColor).toBe(brand);
    expect(Array.isArray(splash) ? splash[1] : undefined).toMatchObject({
      image: './assets/splash-icon.png',
      backgroundColor: brand,
    });
  });

  it('BLD-05 names the EAS project the build goes to', () => {
    const eas = (config.extra as { eas?: { projectId?: string } } | undefined)?.eas;

    expect(eas?.projectId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
