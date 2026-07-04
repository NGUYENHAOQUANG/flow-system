import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsGateway } from './jobs.gateway';
import { JobsController } from './jobs.controller';

@Module({
  providers: [JobsService, JobsGateway],
  controllers: [JobsController]
})
export class JobsModule {}
