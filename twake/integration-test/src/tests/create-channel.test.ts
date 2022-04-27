import puppeteer from "puppeteer";

import config from "../config";

import { createChannel } from "../steps/create-channel";

describe("Sign in", () => {
  it("should be defined after creating a channel", async () => {
    const { headless, slowMo, executablePath, args } = config;
    const browser = await puppeteer.launch({
      headless,
      slowMo,
      executablePath,
      args,
    });

    const page = await createChannel(
      config.twake_url,
      browser,
      config.accounts_for_login[0],
      {
        withConsole: config.console,
      }
    );

    expect(page).toBeDefined();

    await page.close();
    await browser.close();
  });
});
