import { CLIENT_ID_HEADER, clientIdSchema } from '@nabd/shared';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { ApiException } from '../../common/api-exception.js';
import type { IdentifiedRequest } from './current-user.js';

/** Anonymous identity: a client-generated UUID in `x-client-id`. Not authentication. */
@Injectable()
export class IdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IdentifiedRequest>();
    const clientId = clientIdSchema.safeParse(request.headers[CLIENT_ID_HEADER]);
    if (!clientId.success) {
      throw new ApiException(
        'CLIENT_ID_REQUIRED',
        `A valid ${CLIENT_ID_HEADER} header is required`,
      );
    }
    request.user = { id: clientId.data };
    return true;
  }
}
