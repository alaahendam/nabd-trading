import { readLanguage } from './read-language';

const storage = (value: string | null) => ({ getItem: () => value });

describe('readLanguage', () => {
  it.each(['en', 'ar'])('LNG-01 uses the saved language %s', (saved) => {
    expect(readLanguage(storage(saved))).toBe(saved);
  });

  it.each([null, 'fr', ''])('LNG-02 gives English for the saved value %j', (saved) => {
    expect(readLanguage(storage(saved))).toBe('en');
  });
});
