import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JobsService } from './jobs.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class JobsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JobsGateway.name);

  constructor(private readonly jobsService: JobsService) {}

  private activeWorkers = new Map<string, number>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const jobId = this.activeWorkers.get(client.id);
    if (jobId) {
      this.logger.warn(`Worker crashed while processing Job ${jobId}. Re-queuing job...`);
      await this.jobsService.updateJobStatus(jobId, 'WAITING');
      this.activeWorkers.delete(client.id);
      
      // Đẩy lại vào queue in-memory (Đơn giản hóa cho bản hiện tại)
      const jobs = await this.jobsService.getAllJobs();
      const crashedJob = jobs.find(j => j.id === jobId);
      if (crashedJob) {
        // Có thể cần một hàm push back vào đầu queue, tạm thời gọi server emit update
        this.server.emit('job:update_status', { jobId: crashedJob.id, status: 'WAITING' });
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
      this.server.emit('job:update_status', { jobId: job.id, status: 'RUNNING' });
    }
  }

  @SubscribeMessage('worker:status_update')
  async handleWorkerStatusUpdate(@MessageBody() data: { jobId: number; status: string }) {
    this.logger.log(`Job ${data.jobId} status updated to ${data.status}`);
    await this.jobsService.updateJobStatus(data.jobId, data.status);
    
    // Broadcast cho client
    this.server.emit('job:update_status', data);
  }

  @SubscribeMessage('worker:job_completed')
  async handleJobCompleted(@ConnectedSocket() client: Socket, @MessageBody() data: { jobId: number; videoUrl: string }) {
    this.logger.log(`Job ${data.jobId} completed. URL: ${data.videoUrl}`);
    await this.jobsService.updateJobStatus(data.jobId, 'COMPLETED');
    this.activeWorkers.delete(client.id);
    
    // TODO: Lưu videoUrl vào db table JobFile

    this.server.emit('job:update_status', { jobId: data.jobId, status: 'COMPLETED', videoUrl: data.videoUrl });
  }

}
