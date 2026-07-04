import { BasePage } from './base.page';
import { FlowLocators } from '../locators/flow.locators';
import { WebDriver, Key, By } from 'selenium-webdriver';

export class FlowPage extends BasePage {
  private previousVideoSrcs: string[] = [];

  constructor(driver: WebDriver) {
    super(driver);
  }

  async navigateToFlow() {
    const targetUrl = 'https://labs.google/fx/vi/tools/flow/project/fd159876-1336-4135-a1d9-c68eb7ee3eb0';
    const currentUrl = await this.driver.getCurrentUrl();
    
    // Chỉ tải lại trang nếu chưa ở đúng trang project này
    if (!currentUrl.includes('fd159876-1336-4135-a1d9-c68eb7ee3eb0')) {
        await this.driver.get(targetUrl);
        // Đợi 5 giây để toàn bộ danh sách video cũ load xong
        await this.driver.sleep(5000);
    }
    
    // Chờ cho đến khi khung nhập prompt xuất hiện để chắc chắn đã vào đúng trang
    await this.waitForElement(FlowLocators.PROMPT_INPUT, 30000);
  }

  async generateVideo(prompt: string) {
    // Lưu lại toàn bộ danh sách src của các video ĐÃ CÓ trên trang để làm mốc so sánh
    this.previousVideoSrcs = await this.driver.executeScript(`
        const ObjectURLRegex = /^blob:/;
        const videos = document.querySelectorAll('video');
        return Array.from(videos)
            .map(v => v.getAttribute('src'))
            .filter(src => src && !ObjectURLRegex.test(src)); // Bỏ qua các blob url nếu có
    `);

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
    
    let newSrc = null;
    let attempts = 0;
    while (attempts < 300) { // Đợi tối đa 5 phút
        newSrc = await this.driver.executeScript(`
            const previousSrcs = arguments[0];
            const videos = document.querySelectorAll('video');
            for (let v of videos) {
                const src = v.getAttribute('src');
                // Nếu tìm thấy một video có src hợp lệ và CHƯA TỪNG tồn tại trong danh sách cũ
                if (src && !src.startsWith('blob:') && !previousSrcs.includes(src)) {
                    return src;
                }
            }
            return null;
        `, this.previousVideoSrcs);
        
        if (newSrc) {
            break;
        }
        await this.driver.sleep(1000);
        attempts++;
    }
    
    if (!newSrc) {
        throw new Error("Timeout: Không thấy video mới được tạo ra sau 5 phút!");
    }
    
    console.log('Video generated. Tự động tải video thông qua Javascript...');
    
    // Ép trình duyệt fetch URL của video và ép tải xuống bằng thẻ <a>
    const downloadSuccess = await this.driver.executeAsyncScript(`
        const url = arguments[0];
        const callback = arguments[1];
        
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'flow_video_' + Date.now() + '.mp4';
                document.body.appendChild(a);
                a.click();
                a.remove();
                callback(true);
            })
            .catch(err => {
                console.error("Lỗi khi fetch video:", err);
                callback(false);
            });
    `, newSrc);
    
    if (!downloadSuccess) {
        throw new Error("Không thể tải video về máy! Có thể do lỗi mạng hoặc CORS.");
    }
    console.log('Đã phát lệnh tải video thành công!');
  }
}
