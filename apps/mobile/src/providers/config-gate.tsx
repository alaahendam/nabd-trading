import type { ReactNode } from 'react';

import type { EnvResult } from '../lib/env';
import { ConfigErrorScreen } from './config-error-screen';

/** Lets the app through when its settings are valid, and shows the reason when they are not. */
export function ConfigGate({ env, children }: { env: EnvResult; children: ReactNode }) {
  return env.ok ? children : <ConfigErrorScreen problems={env.problems} />;
}
