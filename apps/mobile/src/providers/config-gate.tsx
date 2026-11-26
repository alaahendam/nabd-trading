import type { ReactNode } from 'react';

import type { Env, EnvResult } from '../lib/env';
import { ConfigErrorScreen } from './config-error-screen';

/**
 * Lets the app through when its settings are valid, handing the valid settings to `children`,
 * and shows the reason when they are not. Nothing that needs a setting is built before this.
 */
export function ConfigGate({
  env,
  children,
}: {
  env: EnvResult;
  children: (env: Env) => ReactNode;
}) {
  return env.ok ? children(env.env) : <ConfigErrorScreen problems={env.problems} />;
}
