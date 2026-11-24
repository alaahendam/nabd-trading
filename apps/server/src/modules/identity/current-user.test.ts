import { describe, expect, it } from 'vitest';

import { ApiException } from '../../common/api-exception.js';
import { userFromRequest } from './current-user.js';

describe('userFromRequest', () => {
  it('IDN-03 returns the identified user', () => {
    expect(userFromRequest({ headers: {}, user: { id: 'abc' } })).toEqual({ id: 'abc' });
  });

  it('IDN-03 requires an identified user when the guard did not run', () => {
    expect(() => userFromRequest({ headers: {} })).toThrow(ApiException);
  });
});
