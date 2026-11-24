import { defineConfig } from 'eslint/config';
import checkFile from 'eslint-plugin-check-file';

/**
 * One naming rule for every source file and folder: kebab-case. A middle extension such as
 * `.test` or `.d` is allowed, so `price-store.test.ts` and `i18next.d.ts` pass.
 */
export const fileNaming = defineConfig({
  files: ['src/**/*.{ts,tsx}'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/filename-naming-convention': [
      'error',
      { 'src/**/*.{ts,tsx}': 'KEBAB_CASE' },
      { ignoreMiddleExtensions: true },
    ],
    'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
  },
});
