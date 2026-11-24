import { useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { useConnectionStatus } from '../features/market-data';
import { useApi } from '../lib/api';
import { useLanguage } from '../lib/i18n/i18n-provider';
import { useTheme } from '../lib/theme/theme-hooks';
import { createTestServices } from '../test/app-services';
import { Providers } from './providers';

describe('Providers', () => {
  it('APP-01 gives the tree theme, language, API, query client and realtime', () => {
    const { services } = createTestServices();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Providers services={services}>{children}</Providers>
    );
    const { result } = renderHook(
      () => ({
        theme: useTheme(),
        language: useLanguage(),
        api: useApi(),
        queryClient: useQueryClient(),
        status: useConnectionStatus(),
        t: useTranslation().t,
      }),
      { wrapper },
    );

    expect(result.current.theme.preference).toBe('system');
    expect(result.current.language.language).toBe('en');
    expect(result.current.api).toBe(services.api);
    expect(result.current.queryClient).toBe(services.queryClient);
    expect(result.current.status).toBe('connecting');
    expect(result.current.t('app.name')).toBe('Nabd');
  });
});
