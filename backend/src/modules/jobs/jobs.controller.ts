import { Controller, Post, Body, Get } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsGateway } from './gateways/jobs.gateway';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsGateway: JobsGateway,
  ) {}

  @Post()
  async createJob(@Body() body: CreateJobDto) {
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
