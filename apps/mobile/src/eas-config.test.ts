import easConfig from '../eas.json';
import packageJson from '../package.json';

describe('EAS build configuration', () => {
  it('BLD-01 builds an installable APK for internal distribution', () => {
    expect(easConfig.build.preview.distribution).toBe('internal');
    expect(easConfig.build.preview.android.buildType).toBe('apk');
  });

  it('BLD-02 takes the API address from an EAS environment, never from a file in git', () => {
    expect(easConfig.build.preview.environment).toBe('preview');
    expect(JSON.stringify(easConfig)).not.toMatch(/EXPO_PUBLIC_API_URL|https?:\/\//);
  });

  it('BLD-07 builds the shared packages and the chart library after install on the server', () => {
    const hook = packageJson.scripts['eas-build-post-install'];

    expect(hook).toContain('turbo run build --filter="@nabd/mobile^..."');
    expect(hook).toContain('node scripts/build-chart-page.mjs');
    // Packages first, then the chart library; the bundle needs both.
    expect(hook.indexOf('turbo run build')).toBeLessThan(hook.indexOf('build-chart-page'));
  });
});
