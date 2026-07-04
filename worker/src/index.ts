import { BrowserService } from './core/browser.service';
import { FlowPage } from './pages/flow.page';
import { WorkerSocketClient } from './core/socket.client';
import { FileWatcher } from './managers/file.watcher';

async function bootstrap() {
  console.log('Starting Google Flow Ultra Automation Worker...');
  
  const browserService = new BrowserService();
  // Khởi chạy trình duyệt ngay từ đầu
  const driver = await browserService.initBrowser();
  
  const flowPage = new FlowPage(driver);
  
  const socketClient = new WorkerSocketClient(browserService, flowPage);
  
  const fileWatcher = new FileWatcher(socketClient);
  fileWatcher.startWatching();

  // Giữ tiến trình Node.js không bị thoát
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await browserService.quit();
    process.exit(0);
  });
}

bootstrap().catch(console.error);
