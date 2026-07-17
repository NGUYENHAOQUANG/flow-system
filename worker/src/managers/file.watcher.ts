import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { WorkerSocketClient } from '../core/socket.client';

export class FileWatcher {
  private downloadDir: string;
  private backendApiUrl = process.env.BACKEND_API_URL || '';

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
      const ext = path.extname(filePath).toLowerCase();
      const isVideo = ext === '.mp4';
      const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

      if (!isVideo && !isImage) return;
      
      console.log(`File downloaded: ${filePath}`);
      
      try {
        await this.handleNewFile(filePath);
      } catch (err) {
        console.error('Error handling downloaded file:', err);
      }
    });
  }

  private async handleNewFile(filePath: string) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let fileType = 'video/mp4';
    if (ext === '.png') fileType = 'image/png';
    else if (ext === '.webp') fileType = 'image/webp';
    else if (ext === '.jpg' || ext === '.jpeg') fileType = 'image/jpeg';
    
    // 1. Gọi Backend lấy presigned url
    console.log(`Requesting presigned URL for ${fileType}...`);
    const presignedRes = await axios.get(`${this.backendApiUrl}/storage/presigned-url`, {
      params: { fileName, fileType },
    });

    if (!presignedRes.data.success) {
      throw new Error('Failed to get presigned URL');
    }
    const uploadUrl = presignedRes.data.url;

    // 2. Upload file lên R2
    console.log(`Uploading ${fileName} to R2 with Content-Type: ${fileType}...`);
    const fileBuffer = fs.readFileSync(filePath);
    await axios.put(uploadUrl, fileBuffer, {
      headers: { 'Content-Type': fileType },
    });
    console.log('Upload successful!');

    // 3. Xóa file local (tùy chọn)
    fs.unlinkSync(filePath);

    // 4. Tìm JobID hiện tại
    const jobId = this.socketClient.getCurrentJobId();
    if (!jobId) {
      console.error('File downloaded but no active job found!');
      return;
    }
    // Chỉ gửi tên file (chuẩn cho prod) thay vì full URL
    this.socketClient.reportFileUploaded(jobId, fileName);
  }
}
