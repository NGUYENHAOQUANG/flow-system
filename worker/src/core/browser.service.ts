import { Builder, ThenableWebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import fs from 'fs';
import path from 'path';

export class BrowserService {
  private driver: ThenableWebDriver | null = null;
  private cleanupLock: (() => void) | null = null;

  private getAvailableProfileDir(basePath: string): { path: string; cleanup: () => void } {
    const cleanBase = basePath.replace(/_\d+$/, '');
    let index = 1;

    while (true) {
      const candidatePath = `${cleanBase}_${index}`;
      const lockFilePath = path.join(candidatePath, 'worker.lock');

      if (!fs.existsSync(candidatePath)) {
        fs.mkdirSync(candidatePath, { recursive: true });
      }

      let isLocked = false;
      if (fs.existsSync(lockFilePath)) {
        try {
          const pid = parseInt(fs.readFileSync(lockFilePath, 'utf8'), 10);
          if (pid) {
            // Gửi tín hiệu 0 để kiểm tra tiến trình có tồn tại không
            process.kill(pid, 0);
            isLocked = true;
          }
        } catch (e: any) {
          // ESRCH nghĩa là tiến trình không tồn tại (stale lock)
          if (e.code === 'ESRCH') {
            isLocked = false;
          } else {
            // Lỗi khác (như EPERM) nghĩa là tiến trình vẫn đang chạy
            isLocked = true;
          }
        }
      }

      if (!isLocked) {
        // Ghi PID vào file lock để đánh dấu đang sử dụng
        fs.writeFileSync(lockFilePath, process.pid.toString(), 'utf8');

        const cleanup = () => {
          try {
            if (fs.existsSync(lockFilePath)) {
              fs.unlinkSync(lockFilePath);
            }
          } catch (e) {
            // Bỏ qua lỗi khi xóa tệp lock
          }
        };

        return { path: candidatePath, cleanup };
      }

      index++;
    }
  }

  private runCleanup() {
    if (this.cleanupLock) {
      this.cleanupLock();
      this.cleanupLock = null;
    }
  }

  async initBrowser(): Promise<ThenableWebDriver> {
    const options = new chrome.Options();
    
    // Tự động tìm và khóa Profile trống
    const configPath = process.env.CHROME_PROFILE_DIR || 'C:\\Temp\\ChromeProfile';
    const { path: profileDir, cleanup } = this.getAvailableProfileDir(configPath);
    this.cleanupLock = cleanup;

    // Đăng ký dọn dẹp khi thoát tiến trình
    process.on('exit', () => this.runCleanup());
    process.on('SIGINT', () => {
      this.runCleanup();
      process.exit(0);
    });

    options.addArguments(`--user-data-dir=${profileDir}`);
    // Bỏ qua các flag automation để tránh bị Google phát hiện (cơ bản)
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.excludeSwitches('enable-automation');
    
    // Tự động cho phép tải xuống nhiều file cùng lúc (tránh bị Chrome chặn)
    options.setUserPreferences({
      'profile.default_content_setting_values.automatic_downloads': 1
    });
    
    // Thêm cờ chạy ngầm (headless)
    // options.addArguments('--headless=new');
    // options.addArguments('--window-size=1920,1080');

    this.driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({ implicit: 5000 });
    return this.driver;
  }

  async getDriver(): Promise<ThenableWebDriver> {
    if (!this.driver) {
      return await this.initBrowser();
    }
    return this.driver;
  }

  async quit() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
    this.runCleanup();
  }
}

