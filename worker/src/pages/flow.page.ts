import { BasePage } from './base.page';
import { FlowLocators, FlowLocatorsDynamic } from '../locators/flow.locators';
import { WebDriver, Key, By } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as os from 'os';

export interface JobSettings {
  type?: string;         // 'image' | 'video'
  aspectRatio?: string;  // '9:16' | '16:9'
  duration?: string;     // '4s' | '6s' | '8s'
  model?: string;        // 'Veo 3.1 - Lite' | 'Veo 3.1 - Fast' | ...
  quantity?: string;     // '1x' | 'x2' | 'x3' | 'x4'
  tab?: string;          // 'khung_hinh' | 'thanh_phan'
}

export class FlowPage extends BasePage {
  private firstVideoSrcBefore: string | null = null;
  private oldVideoSrcs: string[] = [];

  constructor(driver: WebDriver) {
    super(driver);
  }

  async navigateToFlow() {
    const targetUrl = 'https://labs.google/fx/vi/tools/flow/project/fd159876-1336-4135-a1d9-c68eb7ee3eb0';
    const currentUrl = await this.driver.getCurrentUrl();
    
    // Chỉ tải lại trang nếu chưa ở đúng trang project này
    if (!currentUrl.includes('fd159876-1336-4135-a1d9-c68eb7ee3eb0')) {
        await this.driver.get(targetUrl);
    }
    
    // Tạm thời giảm implicit wait xuống 1 giây để kiểm tra nhanh sự tồn tại của nút Landing
    await this.driver.manage().setTimeouts({ implicit: 1000 });
    const landingBtns = await this.driver.findElements(
        By.xpath('//button[.//span[text()="Create with Google Flow"] or contains(., "Create with Google Flow")]')
    );
    // Khôi phục lại implicit wait mặc định (5000ms)
    await this.driver.manage().setTimeouts({ implicit: 5000 });

    if (landingBtns.length > 0) {
        console.log('[Worker] Phát hiện nút "Create with Google Flow". Tiến hành click ngay lập tức...');
        await landingBtns[0].click();
        await this.driver.sleep(8000); // Chờ chuyển hướng / đăng nhập
        
        // Kiểm tra xem đã vào đúng project chưa, nếu chưa thì chuyển hướng trực tiếp
        const activeUrl = await this.driver.getCurrentUrl();
        if (!activeUrl.includes('fd159876-1336-4135-a1d9-c68eb7ee3eb0')) {
            console.log(`[Worker] Chưa ở trang dự án. Tiến hành chuyển hướng trực tiếp tới: ${targetUrl}`);
            await this.driver.get(targetUrl);
            await this.driver.sleep(3000);
        }
    }
    
    // Chờ cho đến khi khung nhập prompt xuất hiện để chắc chắn đã vào đúng trang
    await this.waitForElement(FlowLocators.PROMPT_INPUT, 25000);
  }

  /**
   * Mở Settings Dropdown trên Google Flow và chọn đúng các thông số
   * tương ứng với những gì user đã chọn trên Frontend.
   */
  async applySettings(settings: JobSettings) {
    const { type = 'video', aspectRatio = '16:9', duration = '8s', model = 'Veo 3.1 - Lite', quantity = '1x', tab = 'khung_hinh' } = settings;

    console.log(`[Settings] Applying: type=${type}, tab=${tab}, aspectRatio=${aspectRatio}, quantity=${quantity}, model=${model}, duration=${duration}`);

    // Bước 1: Mở Settings Dropdown
    try {
      const trigger = await this.waitForElement(FlowLocators.SETTINGS_TRIGGER, 15000);
      await trigger.click();
      await this.driver.sleep(800);
      console.log('[Settings] Opened settings dropdown.');
    } catch (e) {
      console.warn('[Settings] Could not find/click settings trigger, skipping:', e);
      return;
    }

    // Bước 2: Chọn loại nội dung (Hình ảnh / Video)
    try {
      const typeBtn = await this.waitForElement(FlowLocatorsDynamic.typeBtn(type), 5000);
      const isActive = (await typeBtn.getAttribute('aria-selected')) === 'true' ||
                       (await typeBtn.getAttribute('data-state')) === 'active';
      if (!isActive) {
        await typeBtn.click();
        await this.driver.sleep(500); // Chờ UI cập nhật sau khi đổi mode
        console.log(`[Settings] Selected type: ${type}`);
      } else {
        console.log(`[Settings] Type '${type}' already selected.`);
      }
    } catch (e) {
      console.warn(`[Settings] Could not select type ${type}:`, e);
    }

    await this.driver.sleep(300);

    // Bước 3: Chọn Tab (Khung hình / Thành phần) — chỉ hiện khi mode Video
    if (type === 'video') {
      try {
        const tabBtn = await this.waitForElement(FlowLocatorsDynamic.tabBtn(tab), 5000);
        const isActive = (await tabBtn.getAttribute('aria-selected')) === 'true' ||
                         (await tabBtn.getAttribute('data-state')) === 'active';
        if (!isActive) {
          await tabBtn.click();
          await this.driver.sleep(300);
          console.log(`[Settings] Selected tab: ${tab}`);
        } else {
          console.log(`[Settings] Tab ${tab} already selected.`);
        }
      } catch (e) {
        console.warn(`[Settings] Could not select tab ${tab}:`, e);
      }
      await this.driver.sleep(300);
    }

    // Bước 3: Chọn Aspect Ratio
    try {
      const arBtn = await this.waitForElement(FlowLocatorsDynamic.aspectRatioBtn(aspectRatio), 5000);
      const isActive = (await arBtn.getAttribute('aria-selected')) === 'true' ||
                       (await arBtn.getAttribute('data-state')) === 'active';
      if (!isActive) {
        await arBtn.click();
        console.log(`[Settings] Selected aspect ratio: ${aspectRatio}`);
      } else {
        console.log(`[Settings] Aspect ratio ${aspectRatio} already selected.`);
      }
    } catch (e) {
      console.warn(`[Settings] Could not select aspect ratio ${aspectRatio}:`, e);
    }

    await this.driver.sleep(300);

    // Bước 3: Chọn Quantity (số video tạo một lần)
    try {
      const qtyBtn = await this.waitForElement(FlowLocatorsDynamic.quantityBtn(quantity), 5000);
      const isActive = (await qtyBtn.getAttribute('aria-selected')) === 'true' ||
                       (await qtyBtn.getAttribute('data-state')) === 'active';
      if (!isActive) {
        await qtyBtn.click();
        console.log(`[Settings] Selected quantity: ${quantity}`);
      } else {
        console.log(`[Settings] Quantity ${quantity} already selected.`);
      }
    } catch (e) {
      console.warn(`[Settings] Could not select quantity ${quantity}:`, e);
    }

    await this.driver.sleep(300);

    // Bước 4: Chọn Model
    try {
      const modelTrigger = await this.waitForElement(FlowLocators.MODEL_DROPDOWN_TRIGGER, 5000);
      const currentText = await modelTrigger.getText();
      if (!currentText.includes(model)) {
        await modelTrigger.click();
        await this.driver.sleep(600); // Chờ dropdown model mở
        const modelOption = await this.waitForElement(FlowLocatorsDynamic.modelOption(model), 5000);
        await modelOption.click();
        await this.driver.sleep(400);
        console.log(`[Settings] Selected model: ${model}`);
      } else {
        console.log(`[Settings] Model '${model}' already selected.`);
      }
    } catch (e) {
      console.warn(`[Settings] Could not select model ${model}:`, e);
    }

    await this.driver.sleep(300);

    // Bước 5: Chọn Duration
    try {
      const durBtn = await this.waitForElement(FlowLocatorsDynamic.durationBtn(duration), 5000);
      const isActive = (await durBtn.getAttribute('aria-selected')) === 'true' ||
                       (await durBtn.getAttribute('data-state')) === 'active';
      if (!isActive) {
        await durBtn.click();
        console.log(`[Settings] Selected duration: ${duration}`);
      } else {
        console.log(`[Settings] Duration ${duration} already selected.`);
      }
    } catch (e) {
      console.warn(`[Settings] Could not select duration ${duration}:`, e);
    }

    // Bước 6: Đóng dropdown bằng cách nhấn Escape
    await this.driver.actions().sendKeys(Key.ESCAPE).perform();
    await this.driver.sleep(500);
    console.log('[Settings] Settings applied and dropdown closed.');
  }

  /**
   * T\u1ea3i \u1ea3nh t\u1eeb URL v\u1ec1 b\u1ed9 \u0111\u1ec7m m\u00e1y ch\u1ee7
   */
  private downloadImageToBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Đính kèm các ảnh tham chiếu từ URL vào ô nhập liệu của Google Flow.
   * Quy trình: Tải ảnh về buffer → Encode base64 → Dùng JS tạo Event "paste" ảo chứa File → Dispatch thẳng vào Editor.
   */
  async attachImages(imageUrls: string[]) {
    if (!imageUrls || imageUrls.length === 0) return;

    console.log(`[Worker] Attaching ${imageUrls.length} reference image(s) to Flow...`);

    // Focus ô nhập liệu MỘT LẦN duy nhất trước khi bắt đầu dán
    // Tránh click trong vòng lặp vì nếu đã có ảnh, click có thể trúng vào ảnh làm mất focus
    try {
      const editorLocator = By.css('[data-slate-editor="true"], [role="textbox"]');
      const editor = await this.waitForElement(editorLocator, 10000);
      
      // Sử dụng JS Click và Focus để đảm bảo độ chính xác 100%, vượt qua mọi thẻ ảo che khuất
      await this.driver.executeScript(`
        const el = arguments[0];
        el.focus();
        el.click();
        
        // Tạo Selection Range để Slate.js biết con trỏ đang ở đâu
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false); // Đưa con trỏ xuống cuối
          selection.addRange(range);
        }
      `, editor);
      
      await this.driver.sleep(1000); // Chờ Slate.js sẵn sàng nhận input
      console.log(`[Worker] Editor focused for pasting.`);
    } catch (e) {
      console.warn(`[Worker] Could not click editor before pasting:`, e);
    }

    // 1. Tải và dán từng ảnh
    for (const url of imageUrls) {
      try {
        console.log(`[Worker] Downloading image: ${url}`);
        const buffer = await this.downloadImageToBuffer(url);
        const base64 = buffer.toString('base64');

        // Xác định MIME type từ URL
        const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';
        const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
        const mimeType = mimeMap[ext] || 'image/png';
        const fileName = `reference_${Date.now()}.${ext}`;

        console.log(`[Worker] Injecting image via fake paste event (${mimeType}, ${buffer.length} bytes)...`);

        // Tiêm sự kiện paste trực tiếp vào thẻ DOM của Slate.js
        const pasteResult = await this.driver.executeAsyncScript(`
          const callback = arguments[arguments.length - 1];
          const base64 = arguments[0];
          const mimeType = arguments[1];
          const fileName = arguments[2];

          try {
            // Chuyển base64 thành Uint8Array -> Blob
            const byteString = atob(base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeType });

            // Tạo đối tượng File
            const file = new File([blob], fileName, { type: mimeType });

            // Tạo đối tượng DataTransfer để chứa File
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // Tìm thẻ Editor của Slate.js
            let editorEl = document.querySelector('[data-slate-editor="true"]') || document.querySelector('[role="textbox"]');
            
            // Ưu tiên element đang được focus nếu nó là contenteditable
            if (document.activeElement && document.activeElement.hasAttribute('contenteditable')) {
               editorEl = document.activeElement;
            }

            if (!editorEl) throw new Error("Slate editor not found");

            // Cố gắng focus lại một lần nữa bằng JS để chắc chắn
            editorEl.focus();
            
            // Khôi phục Selection Range nếu bị mất
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
              const range = document.createRange();
              range.selectNodeContents(editorEl);
              range.collapse(false);
              selection.addRange(range);
            }

            // Tạo sự kiện paste ảo
            const pasteEvent = new ClipboardEvent("paste", {
              clipboardData: dataTransfer,
              bubbles: true,
              cancelable: true
            });

            // Bắn sự kiện vào editor
            editorEl.dispatchEvent(pasteEvent);
            
            callback({ success: true });
          } catch (err) {
            callback({ success: false, error: err.message });
          }
        `, base64, mimeType, fileName);

        if (!(pasteResult as any)?.success) {
          console.warn(`[Worker] Fake paste event failed for ${url}: ${(pasteResult as any)?.error}`);
        } else {
          console.log(`[Worker] Image injected successfully for: ${url}`);
        }

        // Chờ một chút để UI xử lý sự kiện paste
        await this.driver.sleep(1500);
      } catch (err) {
        console.error(`[Worker] Failed to attach image ${url}:`, err);
      }
    }

    // 2. Chờ xác minh hình ảnh đã xuất hiện đủ trên màn hình
    console.log(`[Worker] Waiting for ${imageUrls.length} image(s) to render in UI...`);
    let imageCount = 0;
    let attempts = 0;
    const maxAttempts = 30; // Chờ tối đa 30 * 1000ms = 30 giây

    while (attempts < maxAttempts) {
      // Dựa vào HTML người dùng cung cấp: <img alt="Một nội dung nghe nhìn do bạn tạo hoặc tải lên, có trong bộ sưu tập của bạn." ...>
      imageCount = await this.driver.executeScript(`
        const imgs = document.querySelectorAll('img[alt*="tải lên"], img[alt*="uploaded"]');
        return imgs.length;
      `) as number;

      if (imageCount >= imageUrls.length) {
        console.log(`[Worker] Verification passed: found ${imageCount}/${imageUrls.length} images in prompt.`);
        break;
      }

      attempts++;
      await this.driver.sleep(1000);
    }

    if (imageCount < imageUrls.length) {
      console.warn(`[Worker] Warning: Only found ${imageCount}/${imageUrls.length} images after waiting 30s. Proceeding anyway...`);
    }

    console.log('[Worker] All reference images attached and verified. Proceeding to type prompt...');
    await this.driver.sleep(1000);
  }

  async generateVideo(prompt: string, type: string = 'video') {
    // Khóa cuộn trang bằng cả CSS (trọng số cao) và JS Events để chống scroll tuyệt đối
    await this.driver.executeScript(`
        // 1. Khóa bằng CSS
        let style = document.getElementById('automation-lock-scroll');
        if (!style) {
            style = document.createElement('style');
            style.id = 'automation-lock-scroll';
            style.innerHTML = 'html, body, div, main, section { overflow: hidden !important; }';
            document.head.appendChild(style);
        }

        // 2. Khóa bằng Event Listener (chặn lăn chuột)
        if (!window.__automationPreventScroll) {
            window.__automationPreventScroll = function(e) { e.preventDefault(); };
        }
        window.addEventListener('wheel', window.__automationPreventScroll, { passive: false });
        window.addEventListener('touchmove', window.__automationPreventScroll, { passive: false });
    `);

    // Lưu lại src của tất cả video/hình ảnh hiện tại để làm mốc so sánh
    this.oldVideoSrcs = await this.driver.executeScript(`
        const type = arguments[0];
        const tags = Array.from(document.querySelectorAll(type === 'image' ? 'img' : 'video'));
        return tags.map(t => t.getAttribute('src')).filter(Boolean);
    `, type);

    console.log(`Entering prompt: ${prompt}`);
    
    // Đợi 2 giây cho UI load xong hoàn toàn
    await this.driver.sleep(2000);
    
    // Tìm ô nhập liệu của Google Flow (sử dụng Slate editor)
    const editorLocator = By.css('[data-slate-editor="true"], [role="textbox"]');
    const editor = await this.waitForElement(editorLocator, 30000);
    
    console.log("Đã tìm thấy ô nhập liệu, tiến hành gõ chữ...");
    // Phải click vào ô contenteditable trước khi gõ
    await editor.click();
    // Gửi Key.END để đảm bảo con trỏ nằm ở cuối, tránh đè lên hình ảnh vừa dán nếu click trúng hình
    await editor.sendKeys(Key.END, prompt + " "); // Thêm dấu cách để Slate.js kịp nhận diện text
    
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

  async waitForVideoAndDownload(prompt: string, expectedCount: number = 1, type: string = 'video') {
    console.log(`Waiting for ${expectedCount} ${type} generation(s) to complete (this might take a while)...`);
    
    let newSrcs: string[] = [];
    let attempts = 0;
    while (attempts < 300) { // Đợi tối đa 5 phút
        newSrcs = await this.driver.executeScript(`
            const oldSrcs = arguments[0];
            const expected = arguments[1];
            const type = arguments[2];

            const tags = Array.from(document.querySelectorAll(type === 'image' ? 'img' : 'video'));
            const newItems = [];

            for (const t of tags) {
                const src = t.getAttribute('src');
                if (src && !src.startsWith('blob:') && !oldSrcs.includes(src)) {
                    newItems.push(src);
                }
            }
            return newItems;
        `, this.oldVideoSrcs || [], expectedCount, type);
        
        if (newSrcs && newSrcs.length >= expectedCount) {
            break;
        }
        
        // Scroll down to trigger lazy loading of videos/images if they are off-screen
        await this.driver.executeScript(`
            window.scrollBy(0, 500);
            const scrollContainer = document.querySelector('main') || document.documentElement;
            scrollContainer.scrollBy(0, 500);
        `);
        
        await this.driver.sleep(1000);
        attempts++;
    }
    
    if (!newSrcs || newSrcs.length === 0) {
        throw new Error(`Timeout: Không thấy ${type} mới được tạo ra sau 5 phút!`);
    }
    
    console.log(`Found ${newSrcs.length} ${type}(s). Tự động tải thông qua Javascript...`);
    
    for (let i = 0; i < newSrcs.length; i++) {
        const src = newSrcs[i];
        console.log(`[Worker] Bắt đầu tải ${type} ${i + 1}/${newSrcs.length} (URL: ${src.substring(0, 50)}...)`);
        
        // Ép trình duyệt fetch URL của video/hình ảnh và ép tải xuống bằng thẻ <a>
        const downloadSuccess = await this.driver.executeAsyncScript(`
            const url = arguments[0];
            const type = arguments[1];
            const callback = arguments[2];
            
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = blobUrl;
                    
                    const urlParts = url.split('/');
                    let originalName = urlParts[urlParts.length - 1].split('?')[0] || (type === 'image' ? 'image' : 'video');
                    
                    if (type === 'image') {
                        const hasExt = /\\.(png|jpe?g|webp|gif)$/i.test(originalName);
                        if (!hasExt) {
                            originalName += '.png';
                        }
                    } else {
                        if (!originalName.toLowerCase().endsWith('.mp4')) {
                            originalName += '.mp4';
                        }
                    }
                    
                    const timestamp = new Date().getTime();
                    const prefix = type === 'image' ? 'flow_image_' : 'flow_video_';
                    a.download = prefix + timestamp + '_' + originalName;
                    
                    document.body.appendChild(a);
                    a.click();
                    
                    setTimeout(() => {
                        window.URL.revokeObjectURL(blobUrl);
                        document.body.removeChild(a);
                        callback(true);
                    }, 100);
                })
                .catch(err => {
                    console.error('Lỗi khi fetch tệp:', err);
                    callback(false);
                });
        `, src, type);
        
        if (!downloadSuccess) {
            console.error(`Không thể tải xuống từ URL: ${src}`);
        }
        
        await this.driver.sleep(1500); // Đợi 1.5 giây giữa các lần tải
    }
    
    // Mở khóa cuộn trang trả lại giao diện bình thường
    await this.driver.executeScript(`
        const style = document.getElementById('automation-lock-scroll');
        if (style) {
            style.remove();
        }
        if (window.__automationPreventScroll) {
            window.removeEventListener('wheel', window.__automationPreventScroll);
            window.removeEventListener('touchmove', window.__automationPreventScroll);
        }
    `);
  }
}
