import puppeteer from "puppeteer";

import config from "../config";

import { login } from "../steps/login";

describe("Login", () => {
  it("should be defined after login", async () => {
    const { headless, slowMo, executablePath, args } = config;
    const browser = await puppeteer.launch({
      headless,
      slowMo,
      executablePath,
      args,
    });

    const page = await login(
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
