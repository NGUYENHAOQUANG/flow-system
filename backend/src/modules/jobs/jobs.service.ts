import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db } from '@/db/client';
import { StorageService } from '@/modules/storage/storage.service';
import * as schema from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private queue: (typeof schema.jobs.$inferSelect)[] = []; // In-Memory Queue

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async createJob(data: {
    prompt: string;
    model?: string;
    duration?: string;
    aspectRatio?: string;
    quantity?: string;
    tab?: string;
    type?: string;
    imageUrls?: string[]; // URL ảnh tham chiếu từ người dùng tải lên
  }) {
    // 1. Lưu vào Database (Giả sử userId = 1 vì bỏ Auth)
    const [newJob] = await db
      .insert(schema.jobs)
      .values({
        userId: 1, // Mock user id
        prompt: data.prompt,
        model: data.model || 'Veo 3.1 - Lite',
        duration: data.duration || '8s',
        aspectRatio: data.aspectRatio || '16:9',
        quantity: data.quantity || '1x',
        tab: data.tab || 'khung_hinh',
        type: data.type || 'video',
        status: 'WAITING',
      })
      .returning();

    this.logger.log(`Created Job ID: ${newJob.id}`);

    // Đính kèm imageUrls vào object job (in-memory only, không lưu DB)
    // Được dùng để truyền cho Worker qua WebSocket dispatch
    const jobWithImages = { ...newJob, imageUrls: data.imageUrls || [] };

    // 2. Đẩy vào In-Memory Queue
    this.queue.push(jobWithImages as any);

    return jobWithImages;
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
    const [updated] = await db
      .update(schema.jobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.jobs.id, id))
      .returning();
    return updated;
  }

  async getAllJobs() {
    const rows = await db
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
        quantity: schema.jobs.quantity,
        tab: schema.jobs.tab,
        type: schema.jobs.type,
        priority: schema.jobs.priority,
        createdAt: schema.jobs.createdAt,
        updatedAt: schema.jobs.updatedAt,
        videoUrl: schema.jobFiles.url,
      })
      .from(schema.jobs)
      .leftJoin(schema.jobFiles, eq(schema.jobs.id, schema.jobFiles.jobId))
      .orderBy(desc(schema.jobs.createdAt));
      
    // Gắn thêm domain nếu DB chỉ lưu tên file (bảo vệ tương thích ngược với các file đã lưu full link)
    const domain = this.configService.get<string>('R2_PUBLIC_DOMAIN') || '';
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    return rows.map((row) => {
      let finalUrl = row.videoUrl;
      if (finalUrl && !finalUrl.startsWith('http')) {
        finalUrl = `${baseUrl.replace(/\/$/, '')}/${finalUrl}`;
      }
      return { ...row, videoUrl: finalUrl };
    });
  }

  async saveJobVideoUrl(jobId: number, url: string) {
    const ext = url.split('.').pop()?.toLowerCase();
    let fileType = 'video/mp4';
    if (ext === 'png') fileType = 'image/png';
    else if (ext === 'webp') fileType = 'image/webp';
    else if (ext === 'jpg' || ext === 'jpeg') fileType = 'image/jpeg';

    await db.insert(schema.jobFiles).values({
      jobId,
      fileType,
      url,
    });
  }
}
