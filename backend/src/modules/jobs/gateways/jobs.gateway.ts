import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JobsService } from '@/modules/jobs/jobs.service';
import { Logger } from '@nestjs/common';
import { WorkerStatusUpdateDto, WorkerJobCompletedDto } from '@/modules/jobs/dto/worker-update.dto';

import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' } })
export class JobsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JobsGateway.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly configService: ConfigService,
  ) {}

  private activeWorkers = new Map<string, number>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const jobId = this.activeWorkers.get(client.id);
    if (jobId) {
      this.logger.warn(
        `Worker crashed while processing Job ${jobId}. Re-queuing job...`,
      );
      await this.jobsService.updateJobStatus(jobId, 'WAITING');
      this.activeWorkers.delete(client.id);

      // Đẩy lại vào queue in-memory (Đơn giản hóa cho bản hiện tại)
      const jobs = await this.jobsService.getAllJobs();
      const crashedJob = jobs.find((j) => j.id === jobId);
      if (crashedJob) {
        // Có thể cần một hàm push back vào đầu queue, tạm thời gọi server emit update
        this.server.emit('job:update_status', {
          jobId: crashedJob.id,
          status: 'WAITING',
        });
      }
    }
  }

  // --- EVENTS TỪ WORKER ---

  @SubscribeMessage('worker:ready')
  async handleWorkerReady(@ConnectedSocket() client: Socket) {
    this.logger.log(`Worker ${client.id} is ready for a job`);
    const job = await this.jobsService.getNextJob();

    if (job) {
      this.activeWorkers.set(client.id, job.id);
      client.emit('job:dispatch', job);
      this.server.emit('job:update_status', {
        jobId: job.id,
        status: 'RUNNING',
      });
    }
  }

  @SubscribeMessage('worker:status_update')
  async handleWorkerStatusUpdate(
    @MessageBody() data: WorkerStatusUpdateDto,
  ) {
    this.logger.log(`Job ${data.jobId} status updated to ${data.status}`);
    await this.jobsService.updateJobStatus(data.jobId, data.status);

    // Broadcast cho client
    this.server.emit('job:update_status', data);
  }

  @SubscribeMessage('worker:job_completed')
  async handleJobCompleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: WorkerJobCompletedDto,
  ) {
    this.logger.log(`Job ${data.jobId} completed. URL: ${data.videoUrl}`);
    await this.jobsService.updateJobStatus(data.jobId, 'COMPLETED');
    this.activeWorkers.delete(client.id);

    // Lưu videoUrl vào db table JobFile
    await this.jobsService.saveJobVideoUrl(data.jobId, data.videoUrl);

    // Xử lý lại URL trả về frontend nếu URL lưu ở DB chỉ là tên file
    const domain = this.configService.get<string>('R2_PUBLIC_DOMAIN') || '';
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    let finalVideoUrl = data.videoUrl;
    if (finalVideoUrl && !finalVideoUrl.startsWith('http')) {
      finalVideoUrl = `${baseUrl.replace(/\/$/, '')}/${finalVideoUrl}`;
    }

    this.server.emit('job:update_status', {
      jobId: data.jobId,
      status: 'COMPLETED',
      videoUrl: finalVideoUrl,
    });
  }

  @SubscribeMessage('worker:file_uploaded')
  async handleFileUploaded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: WorkerJobCompletedDto,
  ) {
    this.logger.log(`Job ${data.jobId} file uploaded. URL: ${data.videoUrl}`);
    
    // Lưu videoUrl vào db table JobFile
    await this.jobsService.saveJobVideoUrl(data.jobId, data.videoUrl);

    // Xử lý lại URL trả về frontend nếu URL lưu ở DB chỉ là tên file
    const domain = this.configService.get<string>('R2_PUBLIC_DOMAIN') || '';
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    let finalVideoUrl = data.videoUrl;
    if (finalVideoUrl && !finalVideoUrl.startsWith('http')) {
      finalVideoUrl = `${baseUrl.replace(/\/$/, '')}/${finalVideoUrl}`;
    }

    this.server.emit('job:file_uploaded', {
      jobId: data.jobId,
      videoUrl: finalVideoUrl,
    });
  }
}
