import { io, Socket } from 'socket.io-client';
import { FlowPage } from '../pages/flow.page';
import { BrowserService } from './browser.service';

export class WorkerSocketClient {
  private socket: Socket;
  private currentJobId: number | null = null;

  constructor(
    private browserService: BrowserService,
    private flowPage: FlowPage
  ) {
    this.socket = io('http://localhost:3000', {
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
    
    // 2. Nhập Prompt và Generate
    await this.flowPage.generateVideo(job.prompt);

    this.socket.emit('worker:status_update', { jobId: job.id, status: 'RENDERING' });

    // 3. Chờ video xong và bấm Download
    await this.flowPage.waitForVideoAndDownload();

    // Trong thực tế, lúc này FileManager (Chokidar) sẽ lắng nghe thư mục tải xuống 
    // và bắn sự kiện để upload lên S3. Tạm thời mô phỏng việc upload thành công.
    console.log(`Job ${job.id} completed. Waiting for File Watcher...`);
  }

  // Được gọi bởi FileManager khi video upload xong
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
