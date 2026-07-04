import { BasePage } from './base.page';
import { FlowLocators } from '../locators/flow.locators';
import { WebDriver, Key, By } from 'selenium-webdriver';

export class FlowPage extends BasePage {
  constructor(driver: WebDriver) {
    super(driver);
  }

  async navigateToFlow() {
    await this.driver.get('https://labs.google/fx/vi/tools/flow/project/fd159876-1336-4135-a1d9-c68eb7ee3eb0');
    // Chờ cho đến khi khung nhập prompt xuất hiện để chắc chắn đã vào đúng trang
    await this.waitForElement(FlowLocators.PROMPT_INPUT, 30000);
  }

  async generateVideo(prompt: string) {
    console.log(`Entering prompt: ${prompt}`);
    
    // Đợi 2 giây cho UI load xong hoàn toàn
    await this.driver.sleep(2000);
    
    // Tìm ô nhập liệu của Google Flow (sử dụng Slate editor)
    const editorLocator = By.css('[data-slate-editor="true"], [role="textbox"]');
    const editor = await this.waitForElement(editorLocator, 30000);
    
    console.log("Đã tìm thấy ô nhập liệu, tiến hành gõ chữ...");
    // Phải click vào ô contenteditable trước khi gõ
    await editor.click();
    await editor.sendKeys(prompt + " "); // Thêm dấu cách để Slate.js kịp nhận diện text
    
    // Đợi 2 giây để Slate.js cập nhật state nội bộ và nút Tạo sáng lên
    await this.driver.sleep(2000);
    
    // Tìm nút Tạo (biểu tượng mũi tên arrow_forward)
    try {
        // Tìm tất cả các nút có icon arrow_forward (tránh bấm nhầm nút "Tạo" ở menu bên trái)
        const btns = await this.driver.findElements(By.xpath('//button[.//i[text()="arrow_forward"]]'));
        if (btns.length > 0) {
            // Nút gửi của khung chat thường nằm ở cuối cùng trong mã HTML
            await btns[btns.length - 1].click();
            console.log("Đã bấm nút mũi tên Tạo video!");
        } else {
            console.log("Không tìm thấy nút mũi tên, thử dùng phím Enter...");
            await editor.sendKeys(Key.ENTER);
        }
    } catch(e) {
        console.log("Lỗi khi bấm nút, thử dùng phím Enter...");
        await editor.sendKeys(Key.ENTER);
    }
  }

  async waitForVideoAndDownload() {
    console.log('Waiting for generation to complete (this might take a while)...');
    // Tăng thời gian chờ lên mức cao vì tạo video rất lâu (vd: 5 phút = 300000ms)
    await this.waitForElement(FlowLocators.VIDEO_RESULT_CONTAINER, 300000);
    console.log('Video generated. Clicking download...');
    await this.click(FlowLocators.DOWNLOAD_BTN);
  }
}
