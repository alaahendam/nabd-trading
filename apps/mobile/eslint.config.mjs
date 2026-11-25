import { mobileConfig } from '@nabd/config/eslint/mobile';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores(['.expo/**', 'expo-env.d.ts', 'src/features/stocks/generated/**']),
  mobileConfig,
);
