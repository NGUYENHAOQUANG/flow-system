import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private queue: any[] = []; // In-Memory Queue

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createJob(data: { prompt: string; model?: string; duration?: string; aspectRatio?: string }) {
    // 1. Lưu vào Database (Giả sử userId = 1 vì bỏ Auth)
    const [newJob] = await this.db.insert(schema.jobs).values({
      userId: 1, // Mock user id
      prompt: data.prompt,
      model: data.model || 'flow-ultra',
      duration: data.duration || '5s',
      aspectRatio: data.aspectRatio || '16:9',
      status: 'WAITING',
    }).returning();

    this.logger.log(`Created Job ID: ${newJob.id}`);

    // 2. Đẩy vào In-Memory Queue
    this.queue.push(newJob);

    return newJob;
  }

  async getNextJob() {
    if (this.queue.length === 0) {
      return null;
    }
    const job = this.queue.shift(); // Lấy job cũ nhất ra
    this.logger.log(`Dispatched Job ID: ${job.id}`);
    
    // Cập nhật trạng thái
    await this.updateJobStatus(job.id, 'RUNNING');
    return job;
  }

  async updateJobStatus(id: number, status: string) {
    const [updated] = await this.db.update(schema.jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.jobs.id, id))
      .returning();
    return updated;
  }

  async getAllJobs() {
    return this.db.select().from(schema.jobs).orderBy(schema.jobs.createdAt);
  }
}
