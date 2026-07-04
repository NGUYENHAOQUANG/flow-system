import { Controller, Post, Body, Get } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsGateway } from './jobs.gateway';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsGateway: JobsGateway,
  ) {}

  @Post()
  async createJob(@Body() body: { prompt: string; model?: string; duration?: string; aspectRatio?: string }) {
    // 1. Tạo Job
    const job = await this.jobsService.createJob(body);
    
    // 2. Broadcast sự kiện Job created cho toàn bộ Client
    this.jobsGateway.server.emit('job:created', job);
    
    return { success: true, data: job };
  }

  @Get()
  async getJobs() {
    const jobs = await this.jobsService.getAllJobs();
    return { success: true, data: jobs };
  }
}
