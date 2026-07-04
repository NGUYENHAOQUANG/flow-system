import { Builder, ThenableWebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export class BrowserService {
  private driver: ThenableWebDriver | null = null;

  async initBrowser(): Promise<ThenableWebDriver> {
    const options = new chrome.Options();
    // Khởi chạy Chrome với Profile riêng để duy trì phiên đăng nhập Google
    options.addArguments('--user-data-dir=C:\\Temp\\ChromeProfile');
    // Bỏ qua các flag automation để tránh bị Google phát hiện (cơ bản)
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.excludeSwitches('enable-automation');

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
  }
}
