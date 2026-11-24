import { Module } from '@nestjs/common';

import { IdentityGuard } from './identity.guard.js';

@Module({ providers: [IdentityGuard], exports: [IdentityGuard] })
export class IdentityModule {}
