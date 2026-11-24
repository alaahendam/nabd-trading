import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { ApiException } from '../../common/api-exception.js';

/** Who is calling. Controllers depend on this shape only, so a JWT guard can replace the header. */
export interface AuthUser {
  id: string;
}

export interface IdentifiedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

export function userFromRequest(request: IdentifiedRequest): AuthUser {
  if (!request.user) {
    throw new ApiException('CLIENT_ID_REQUIRED', 'A valid client ID is required');
  }
  return request.user;
}

/** Parameter decorator for the identified user. Use it behind `IdentityGuard`. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  userFromRequest(context.switchToHttp().getRequest<IdentifiedRequest>()),
);
