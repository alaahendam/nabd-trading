import { reactConfig } from '@nabd/config/eslint/react';

export default [
  ...reactConfig,
  { settings: { 'better-tailwindcss': { entryPoint: 'src/styles/index.css' } } },
];
