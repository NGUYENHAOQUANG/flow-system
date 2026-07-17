import { By } from 'selenium-webdriver';

/**
 * Các locator ổn định cho giao diện Google Flow.
 * Dựa trên class `flow_tab_slider_trigger` và Google Material Symbols icon text,
 * KHÔNG phụ thuộc vào ID động (radix-:r1r1:) để tránh bị hỏng khi reload.
 */
export const FlowLocators = {
  // ─── Prompt Input ───────────────────────────────────────────────────────────
  PROMPT_INPUT: By.css('[data-slate-editor="true"], [role="textbox"]'),

  // ─── Nút mở Settings Dropdown ───────────────────────────────────────────────
  // Video mode: có icon crop_16_9 / crop_9_16 | Image mode: có icon crop_landscape v.v.
  // Dùng class DropdownMenuContent của wrapper để tìm trigger an toàn hơn
  SETTINGS_TRIGGER: By.xpath(
    '//button[@aria-haspopup="menu" and (.//i[text()="crop_16_9"] or .//i[text()="crop_9_16"] or .//i[text()="crop_square"] or .//i[contains(@class,"sc-d9fabd6c-1")])]'
  ),

  // ─── Loại nội dung (Hình ảnh / Video) ─────────────────────────────────────────
  TYPE_IMAGE: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="image"]]'
  ),
  TYPE_VIDEO: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="play_circle"]]'
  ),

  // ─── Aspect Ratio ────────────────────────────────────────────────────────────
  ASPECT_RATIO_9_16: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="crop_9_16"]]'
  ),
  ASPECT_RATIO_16_9: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="crop_16_9"]]'
  ),

  // ─── Tab (Khung hình / Thành phần) ─────────────────────────────────────────
  TAB_KHUNG_HINH: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="crop_free"]]'
  ),
  TAB_THANH_PHAN: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="chrome_extension"]]'
  ),

  // ─── Duration ────────────────────────────────────────────────────────────────
  DURATION_4S: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="4s"]'
  ),
  DURATION_6S: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="6s"]'
  ),
  DURATION_8S: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="8s"]'
  ),

  // ─── Quantity (số video tạo một lần: 1x / x2 / x3 / x4) ─────────────────────
  QUANTITY_1X: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="1x"]'
  ),
  QUANTITY_2X: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="x2"]'
  ),
  QUANTITY_3X: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="x3"]'
  ),
  QUANTITY_4X: By.xpath(
    '//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="x4"]'
  ),

  // ─── Model Dropdown ──────────────────────────────────────────────────────────
  // Nút trigger mở model dropdown (có icon arrow_drop_down)
  MODEL_DROPDOWN_TRIGGER: By.xpath(
    '//button[.//i[text()="arrow_drop_down"] and contains(@class,"sc-16c4830a-1")]'
  ),

  // ─── Generate Button ──────────────────────────────────────────────────────────
  GENERATE_BTN: By.xpath('//button[.//i[text()="arrow_forward"]]'),
};

/**
 * Helper tạo locator động cho một model cụ thể trong dropdown.
 * Ví dụ: FlowLocatorsDynamic.modelOption('Veo 3.1 - Lite')
 */
export const FlowLocatorsDynamic = {
  /**
   * Tìm item trong dropdown model theo tên chính xác.
   * Dùng sau khi đã mở MODEL_DROPDOWN_TRIGGER.
   */
  modelOption: (modelName: string) =>
    By.xpath(
      `//div[@role="menu"]//button[contains(normalize-space(.),"${modelName}")]`
    ),

  /**
   * Tìm nút tab (Khung hình / Thành phần) theo giá trị từ FE ('khung_hinh' | 'thanh_phan')
   */
  /**
   * Tìm nút loại nội dung (Hình ảnh / Video) theo giá trị từ FE ('image' | 'video')
   */
  typeBtn: (type: string) => {
    const iconMap: Record<string, string> = {
      'image': 'image',
      'video': 'play_circle',
    };
    const icon = iconMap[type] ?? 'play_circle';
    return By.xpath(
      `//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="${icon}"]]`
    );
  },

  tabBtn: (tab: string) => {
    const iconMap: Record<string, string> = {
      'khung_hinh': 'crop_free',
      'thanh_phan': 'chrome_extension',
    };
    const icon = iconMap[tab] ?? 'crop_free';
    return By.xpath(
      `//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="${icon}"]]`
    );
  },

  /**
   * Tìm nút aspect ratio theo id ('9:16' | '16:9')
   */
  aspectRatioBtn: (ratio: string) => {
    const iconMap: Record<string, string> = {
      '9:16': 'crop_9_16',
      '16:9': 'crop_16_9',
      '4:3': 'crop_landscape',
      '1:1': 'crop_square',
      '3:4': 'crop_portrait',
    };
    const icon = iconMap[ratio] ?? 'crop_16_9';
    return By.xpath(
      `//button[contains(@class,"flow_tab_slider_trigger") and .//i[text()="${icon}"]]`
    );
  },

  /**
   * Tìm nút duration theo giá trị ('4s' | '6s' | '8s')
   */
  durationBtn: (duration: string) =>
    By.xpath(
      `//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="${duration}"]`
    ),

  /**
   * Tìm nút quantity theo giá trị ('1x' | 'x2' | 'x3' | 'x4')
   */
  quantityBtn: (quantity: string) =>
    By.xpath(
      `//button[contains(@class,"flow_tab_slider_trigger") and normalize-space(text())="${quantity}"]`
    ),
};
