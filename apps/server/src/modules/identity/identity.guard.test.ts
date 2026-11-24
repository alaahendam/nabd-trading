import { CLIENT_ID_HEADER } from '@nabd/shared';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { ApiException } from '../../common/api-exception.js';
import type { IdentifiedRequest } from './current-user.js';
import { IdentityGuard } from './identity.guard.js';

const UUID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

const contextFor = (request: IdentifiedRequest) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

const rejection = (request: IdentifiedRequest) => {
  try {
    new IdentityGuard().canActivate(contextFor(request));
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('IdentityGuard', () => {
  it('IDN-01 accepts a UUID and sets the user on the request', () => {
    const request: IdentifiedRequest = { headers: { [CLIENT_ID_HEADER]: UUID } };
    expect(new IdentityGuard().canActivate(contextFor(request))).toBe(true);
    expect(request.user).toEqual({ id: UUID });
  });

  it.each([
    ['no header', {}],
    ['an empty header', { [CLIENT_ID_HEADER]: '' }],
    ['a non-UUID', { [CLIENT_ID_HEADER]: 'abc' }],
    ['a UUID with junk', { [CLIENT_ID_HEADER]: `${UUID}-extra` }],
    ['a repeated header', { [CLIENT_ID_HEADER]: [UUID, UUID] }],
  ])('IDN-02 rejects %s with CLIENT_ID_REQUIRED', (_label, headers) => {
    const request: IdentifiedRequest = { headers };
    const error = rejection(request);
    expect(error).toBeInstanceOf(ApiException);
    expect((error as ApiException).getStatus()).toBe(401);
    expect((error as ApiException).getResponse()).toMatchObject({
      error: { code: 'CLIENT_ID_REQUIRED' },
    });
    expect(request.user).toBeUndefined();
  });
});
