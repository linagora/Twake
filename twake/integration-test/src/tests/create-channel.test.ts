import puppeteer from "puppeteer";

import config from "../config";

import { createChannel } from "../steps/create-channel";

import { createSomeFakeUsers } from "../utils/create-some-fake-users";

describe("Create channel", () => {
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
      createSomeFakeUsers(1)[0],
      {
        withConsole: config.console,
      }
    );

    expect(page).toBeDefined();

    await page.close();
    await browser.close();
  });
});
