// PKG-01: every shared package loads in the mobile test runtime, through its published `exports`.
import * as apiClient from '@nabd/api-client';
import * as data from '@nabd/data';
import * as domain from '@nabd/domain';
import * as i18n from '@nabd/i18n';
import * as marketData from '@nabd/market-data';
import * as shared from '@nabd/shared';
import * as tokens from '@nabd/tokens';

describe('shared packages', () => {
  it.each([
    ['@nabd/api-client', apiClient],
    ['@nabd/data', data],
    ['@nabd/domain', domain],
    ['@nabd/i18n', i18n],
    ['@nabd/market-data', marketData],
    ['@nabd/shared', shared],
    ['@nabd/tokens', tokens],
  ])('PKG-01 loads %s', (_name, module) => {
    expect(Object.keys(module).length).toBeGreaterThan(0);
  });
});
