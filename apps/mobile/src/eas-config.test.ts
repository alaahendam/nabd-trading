import easConfig from '../eas.json';

describe('EAS build configuration', () => {
  it('BLD-01 builds an installable APK for internal distribution', () => {
    expect(easConfig.build.preview.distribution).toBe('internal');
    expect(easConfig.build.preview.android.buildType).toBe('apk');
  });

  it('BLD-02 takes the API address from an EAS environment, never from a file in git', () => {
    expect(easConfig.build.preview.environment).toBe('preview');
    expect(JSON.stringify(easConfig)).not.toMatch(/EXPO_PUBLIC_API_URL|https?:\/\//);
  });
});
