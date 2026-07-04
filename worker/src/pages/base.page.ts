import { WebDriver, until, By, WebElement } from 'selenium-webdriver';

export class BasePage {
  constructor(protected driver: WebDriver) {}

  async waitForElement(locator: By, timeout = 15000): Promise<WebElement> {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async click(locator: By) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el));
    await el.click();
  }

  async type(locator: By, text: string) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el));
    await el.clear();
    await el.sendKeys(text);
  }

  async getText(locator: By): Promise<string> {
    const el = await this.waitForElement(locator);
    return await el.getText();
  }
}
