import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { WorkerSocketClient } from '../core/socket.client';

export class FileWatcher {
  private downloadDir: string;
  private backendApiUrl = 'http://localhost:3000';

  constructor(private socketClient: WorkerSocketClient) {
    // Thư mục tải xuống của Chrome trên Windows
    const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\';
    this.downloadDir = path.join(homeDir, 'Downloads');
    console.log(`Watching downloads in: ${this.downloadDir}`);
  }

  startWatching() {
    // Chokidar theo dõi sự kiện file mp4 mới được tạo/hoàn tất tải về
    // Lưu ý: Trên Windows không nên truyền glob pattern (/*.mp4) trực tiếp vì lỗi backslash
    const watcher = chokidar.watch(this.downloadDir, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    watcher.on('add', async (filePath) => {
      // Chỉ xử lý file video đuôi .mp4
      if (!filePath.toLowerCase().endsWith('.mp4')) return;
      
      console.log(`Video downloaded: ${filePath}`);
      
      try {
        await this.handleNewVideo(filePath);
      } catch (err) {
        console.error('Error handling downloaded video:', err);
      }
    });
  }

  private async handleNewVideo(filePath: string) {
    const fileName = path.basename(filePath);
    
    // 1. Gọi Backend lấy presigned url
    console.log('Requesting presigned URL...');
    const presignedRes = await axios.get(`${this.backendApiUrl}/storage/presigned-url`, {
      params: { fileName, fileType: 'video/mp4' },
    });

    if (!presignedRes.data.success) {
      throw new Error('Failed to get presigned URL');
    }
    const uploadUrl = presignedRes.data.url;

    // 2. Upload file lên R2
    console.log(`Uploading ${fileName} to R2...`);
    const fileBuffer = fs.readFileSync(filePath);
    await axios.put(uploadUrl, fileBuffer, {
      headers: { 'Content-Type': 'video/mp4' },
    });
    console.log('Upload successful!');

    // 3. Xóa file local (tùy chọn)
    fs.unlinkSync(filePath);

    // 4. Tìm JobID hiện tại
    const jobId = this.socketClient.getCurrentJobId();
    if (!jobId) {
      console.error('Video downloaded but no active job found!');
      return;
    }
    const domain = process.env.R2_PUBLIC_DOMAIN;
    if (!domain) {
      console.error('Lỗi: Chưa cấu hình R2_PUBLIC_DOMAIN trong file .env của Worker!');
      return;
    }
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    const finalVideoUrl = `${baseUrl.replace(/\/$/, '')}/${fileName}`;

    this.socketClient.reportJobCompleted(jobId, finalVideoUrl);
  }
}
