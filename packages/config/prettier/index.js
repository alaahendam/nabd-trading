import { fileURLToPath } from 'node:url';

const tailwindPlugin = fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss'));

/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  endOfLine: 'lf',
  arrowParens: 'always',
  plugins: [tailwindPlugin],
  tailwindFunctions: ['cva', 'cn', 'clsx'],
};

export default config;
