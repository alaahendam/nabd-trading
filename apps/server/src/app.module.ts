import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { configModuleOptions } from './config/env.js';
import { HealthModule } from './modules/health/index.js';

@Module({
  imports: [ConfigModule.forRoot(configModuleOptions), HealthModule],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
