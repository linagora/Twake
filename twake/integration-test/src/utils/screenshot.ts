import { Page } from "puppeteer";

import config from "../config";

export const screenshot = async (context: string, page: Page) => {
  const currentDate = new Date().toLocaleTimeString();
  await page.screenshot({
    path: `${config.screenshot_path}/${context}-${currentDate}.png`,
  });
};
