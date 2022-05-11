import puppeteer from "puppeteer";

import config from "../config";

import { signIn } from "../steps/signin";

describe("Sign in", () => {
  it("should be defined after sign in", async () => {
    const { headless, slowMo, executablePath, args } = config;
    const browser = await puppeteer.launch({
      headless,
      slowMo,
      executablePath,
      args,
    });

    const page = await signIn(
      config.twake_url,
      browser,
      config.accounts_for_sign_in[0],
      {
        withConsole: config.console,
      }
    );

    expect(page).toBeDefined();

    await page.close();
    await browser.close();
  });
});
