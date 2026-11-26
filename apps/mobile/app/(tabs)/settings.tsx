import { LanguageSetting } from '../../src/features/settings';
import { Screen } from '../../src/shared/ui';

/** Settings: for now, the language. */
export default function SettingsTab() {
  return (
    <Screen edges={['left', 'right']}>
      <LanguageSetting />
    </Screen>
  );
}
