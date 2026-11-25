import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AppProviders } from './providers/app-providers';

/** Renders a component inside the app's providers, in English. */
export async function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}
