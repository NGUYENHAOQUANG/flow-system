import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private queue: (typeof schema.jobs.$inferSelect)[] = []; // In-Memory Queue

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createJob(data: {
    prompt: string;
    model?: string;
    duration?: string;
    aspectRatio?: string;
  }) {
    // 1. Lưu vào Database (Giả sử userId = 1 vì bỏ Auth)
    const [newJob] = await this.db
      .insert(schema.jobs)
      .values({
        userId: 1, // Mock user id
        prompt: data.prompt,
        model: data.model || 'flow-ultra',
        duration: data.duration || '5s',
        aspectRatio: data.aspectRatio || '16:9',
        status: 'WAITING',
      })
      .returning();

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
    if (!job) return null;

    this.logger.log(`Dispatched Job ID: ${job.id}`);

    // Cập nhật trạng thái
    await this.updateJobStatus(job.id, 'RUNNING');
    return job;
  }

  async updateJobStatus(id: number, status: string) {
    const [updated] = await this.db
      .update(schema.jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.jobs.id, id))
      .returning();
    return updated;
  }

  async getAllJobs() {
    const rows = await this.db
      .select({
        id: schema.jobs.id,
        userId: schema.jobs.userId,
        workerId: schema.jobs.workerId,
        status: schema.jobs.status,
        prompt: schema.jobs.prompt,
        negativePrompt: schema.jobs.negativePrompt,
        model: schema.jobs.model,
        duration: schema.jobs.duration,
        aspectRatio: schema.jobs.aspectRatio,
        priority: schema.jobs.priority,
        createdAt: schema.jobs.createdAt,
        updatedAt: schema.jobs.updatedAt,
        videoUrl: schema.jobFiles.url,
      })
      .from(schema.jobs)
      .leftJoin(schema.jobFiles, eq(schema.jobs.id, schema.jobFiles.jobId))
      .orderBy(schema.jobs.createdAt);
    return rows;
  }

  async saveJobVideoUrl(jobId: number, url: string) {
    await this.db.insert(schema.jobFiles).values({
      jobId,
      fileType: 'video/mp4',
      url,
    });
  }
}
