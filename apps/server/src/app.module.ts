import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configModuleOptions } from './config/env.js';

@Module({
  imports: [ConfigModule.forRoot(configModuleOptions)],
})
export class AppModule {}
