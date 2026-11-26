import { LANGUAGE_STORAGE_KEY } from '@nabd/i18n';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { deviceLayout } from '../../lib/i18n/device-layout';
import { type AsyncKeyValueStore, StartupStorage } from '../../lib/storage/startup-storage';
import { StorageProvider } from '../../lib/storage/storage-context';
import { createTestApp } from '../../test-app';
import { LanguageSetting } from './language-setting';

const layout = jest.mocked(deviceLayout);

beforeEach(() => {
  layout.allowRTL.mockClear();
  layout.forceRTL.mockClear();
  layout.reload.mockClear();
});

describe('LanguageSetting', () => {
  it('SWL-05 lists both languages by their own names, the current one selected, 48 high', async () => {
    await createTestApp().render(<LanguageSetting />);

    const english = screen.getByRole('button', { name: 'English' });
    const arabic = screen.getByRole('button', { name: 'العربية' });

    expect(english).toBeSelected();
    expect(arabic).not.toBeSelected();
    expect(english).toHaveStyle({ minHeight: 48 });
    expect(arabic).toHaveStyle({ minHeight: 48 });
    expect(screen.getByRole('header', { name: 'Language' })).toBeOnTheScreen();
  });

  it('SWL-05 selects Arabic when the app is saved in Arabic', async () => {
    await createTestApp({ [LANGUAGE_STORAGE_KEY]: 'ar' }).render(<LanguageSetting />);

    expect(screen.getByRole('button', { name: 'العربية' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'English' })).not.toBeSelected();
  });

  it('SWL-06 saves the other language, sets the layout right-to-left, and reloads', async () => {
    await createTestApp().render(<LanguageSetting />);

    await fireEvent.press(screen.getByRole('button', { name: 'العربية' }));

    await waitFor(() => {
      expect(layout.reload).toHaveBeenCalledTimes(1);
    });
    expect(layout.allowRTL).toHaveBeenCalledWith(true);
    expect(layout.forceRTL).toHaveBeenCalledWith(true);
  });

  it('SWL-02 does nothing when the language in use is chosen again', async () => {
    await createTestApp().render(<LanguageSetting />);

    await fireEvent.press(screen.getByRole('button', { name: 'English' }));

    expect(layout.reload).not.toHaveBeenCalled();
    expect(layout.forceRTL).not.toHaveBeenCalled();
  });

  it('SWL-07 says so and does not reload when the choice cannot be saved', async () => {
    const failing: AsyncKeyValueStore = {
      multiGet: () => Promise.resolve([]),
      setItem: () => Promise.reject(new Error('disk full')),
    };
    const storage = await StartupStorage.load(failing, [LANGUAGE_STORAGE_KEY]);
    await createTestApp().render(
      <StorageProvider storage={storage}>
        <LanguageSetting />
      </StorageProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'العربية' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save the language. Try again.',
    );
    expect(layout.reload).not.toHaveBeenCalled();
    expect(layout.forceRTL).not.toHaveBeenCalled();
  });
});
