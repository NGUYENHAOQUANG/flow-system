import { By } from 'selenium-webdriver';

export const FlowLocators = {
  // LƯU Ý: Các Locator này là giả định, bạn cần dùng Inspector để lấy XPath hoặc CSS Selector chính xác từ Flow Ultra.
  PROMPT_INPUT: By.css('textarea[placeholder*="Describe your video"]'),
  GENERATE_BTN: By.xpath('//button[contains(text(), "Generate")]'),
  VIDEO_RESULT_CONTAINER: By.css('.video-result-container video'),
  DOWNLOAD_BTN: By.css('button[aria-label="Download video"]'),
  STATUS_INDICATOR: By.css('.generation-status'),
};
