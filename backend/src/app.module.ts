import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { StorageModule } from '@/modules/storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import { validate } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    JobsModule, 
    StorageModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
