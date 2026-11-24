import { base } from '@nabd/config/eslint/base';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';

// Root tooling files only. Each workspace lints itself with its own config.
export default [
  globalIgnores(['apps/**', 'packages/**']),
  ...base,
  { languageOptions: { globals: globals.node } },
];
