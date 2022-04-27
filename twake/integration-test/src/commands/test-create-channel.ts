import puppeteer from "puppeteer";

import config from "../config";

import { createChannel } from "../steps/create-channel";

async function init() {
  const { headless, slowMo, executablePath, args } = config;
  const browser = await puppeteer.launch({
    headless,
    slowMo,
    executablePath,
    args,
  });

  await createChannel(config.twake_url, browser, config.accounts_for_login[0], {
    withConsole: config.console,
  });
}

init();
