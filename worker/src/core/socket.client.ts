import { io, Socket } from 'socket.io-client';
import { FlowPage, type JobSettings } from '../pages/flow.page';
import { BrowserService } from './browser.service';

export class WorkerSocketClient {
  private socket: Socket;
  private currentJobId: number | null = null;
  private expectedQuantity: number = 1;
  private uploadedCount: number = 0;

  constructor(
    private browserService: BrowserService,
    private flowPage: FlowPage
  ) {
    this.socket = io(process.env.BACKEND_API_URL || '', {
      transports: ['websocket'],
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to Backend Gateway');
      // Báo là worker này rảnh rỗi và sẵn sàng nhận job
      this.socket.emit('worker:ready');
    });

    this.socket.on('job:dispatch', async (job) => {
      console.log(`Received Job ID: ${job.id}`);
      const maxRetries = 1; // Giảm xuống 1 để không bị tạo video 2 lần nếu có lỗi tải xuống
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        try {
          attempt++;
          console.log(`Processing Job ID: ${job.id} (Attempt ${attempt}/${maxRetries})`);
          await this.processJob(job);
          success = true;
        } catch (err) {
          console.error(`Attempt ${attempt} failed:`, err);
          await this.browserService.getDriver().then(d => d.navigate().refresh());
        }
      }

      if (!success) {
        console.error(`Job ${job.id} failed after ${maxRetries} attempts.`);
        this.socket.emit('worker:status_update', { jobId: job.id, status: 'FAILED' });
        this.currentJobId = null;
        this.socket.emit('worker:ready');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Backend');
    });

    this.socket.on('job:created', () => {
      if (this.currentJobId === null) {
        console.log('New job available, requesting dispatch...');
        this.socket.emit('worker:ready');
      }
    });
  }

  private async processJob(job: any) {
    this.currentJobId = job.id;
    this.socket.emit('worker:status_update', { jobId: job.id, status: 'GENERATING' });
    
    // 1. Mở trang Google Flow Ultra
    await this.flowPage.navigateToFlow();
    
    // 2. Áp dụng thông số (type, tab, aspectRatio, duration, model, quantity) từ job
    const settings: JobSettings = {
      type:        job.type        ?? 'video',
      tab:         job.tab         ?? 'khung_hinh',
      aspectRatio: job.aspectRatio ?? '16:9',
      duration:    job.duration    ?? '8s',
      model:       job.model       ?? 'Veo 3.1 - Lite',
      quantity:    job.quantity    ?? '1x',
    };
    
    // Đặt số lượng dự kiến
    this.expectedQuantity = 1;
    if (settings.quantity) {
       const match = settings.quantity.match(/\d+/);
       if (match) this.expectedQuantity = parseInt(match[0], 10);
    }
    this.uploadedCount = 0;

    await this.flowPage.applySettings(settings);
    
    // 3. Đính kèm ảnh tham chiếu (nếu có) trước khi nhập prompt
    if (job.imageUrls && job.imageUrls.length > 0) {
      console.log(`[Worker] Job ${job.id} has ${job.imageUrls.length} reference image(s). Attaching...`);
      await this.flowPage.attachImages(job.imageUrls);
    }

    // 4. Nhập Prompt và Generate
    await this.flowPage.generateVideo(job.prompt, settings.type);

    this.socket.emit('worker:status_update', { jobId: job.id, status: 'RENDERING' });

    // 4. Chờ video/ảnh xong và bấm Download
    await this.flowPage.waitForVideoAndDownload(job.prompt, this.expectedQuantity, settings.type);

    // Trong thực tế, lúc này FileManager (Chokidar) sẽ lắng nghe thư mục tải xuống 
    // và bắn sự kiện để upload lên S3. Tạm thời mô phỏng việc upload thành công.
    console.log(`Job ${job.id} completed. Waiting for File Watcher...`);
  }

  // Được gọi bởi FileManager khi 1 video upload xong
  public reportFileUploaded(jobId: number, videoUrl: string) {
    if (this.currentJobId !== jobId) return;
    
    this.uploadedCount++;
    if (this.uploadedCount < this.expectedQuantity) {
       this.socket.emit('worker:file_uploaded', { jobId, videoUrl });
       console.log(`Reported file uploaded ${this.uploadedCount}/${this.expectedQuantity} for job ${jobId}.`);
    } else {
       // Nếu đã upload đủ, hoàn thành job
       this.socket.emit('worker:job_completed', { jobId, videoUrl });
       console.log(`Reported job ${jobId} as COMPLETED (${this.uploadedCount}/${this.expectedQuantity} files). Requesting next job...`);
       this.currentJobId = null;
       this.socket.emit('worker:ready');
    }
  }

  // Tương thích ngược: Được gọi khi cần hoàn thành ngay lập tức
  public reportJobCompleted(jobId: number, videoUrl: string) {
    this.socket.emit('worker:job_completed', { jobId, videoUrl });
    console.log(`Reported job ${jobId} as COMPLETED. Requesting next job...`);
    this.currentJobId = null;
    this.socket.emit('worker:ready');
  }

  public getCurrentJobId(): number | null {
    return this.currentJobId;
  }
}
