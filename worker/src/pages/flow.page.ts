import { BasePage } from './base.page';
import { FlowLocators } from '../locators/flow.locators';
import { WebDriver } from 'selenium-webdriver';

export class FlowPage extends BasePage {
  constructor(driver: WebDriver) {
    super(driver);
  }

  async navigateToFlow() {
    await this.driver.get('https://labs.google/fx/tools/flow');
    // Chờ cho đến khi khung nhập prompt xuất hiện để chắc chắn đã vào đúng trang
    await this.waitForElement(FlowLocators.PROMPT_INPUT, 30000);
  }

  async generateVideo(prompt: string) {
    console.log(`Entering prompt: ${prompt}`);
    await this.type(FlowLocators.PROMPT_INPUT, prompt);
    await this.click(FlowLocators.GENERATE_BTN);
  }

  async waitForVideoAndDownload() {
    console.log('Waiting for generation to complete (this might take a while)...');
    // Tăng thời gian chờ lên mức cao vì tạo video rất lâu (vd: 5 phút = 300000ms)
    await this.waitForElement(FlowLocators.VIDEO_RESULT_CONTAINER, 300000);
    console.log('Video generated. Clicking download...');
    await this.click(FlowLocators.DOWNLOAD_BTN);
  }
}
