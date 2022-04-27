import puppeteer from "puppeteer";

import config from "../config";

import { login } from "../steps/login";

async function init() {
  const { headless, slowMo, executablePath, args } = config;
  const browser = await puppeteer.launch({
    headless,
    slowMo,
    executablePath,
    args,
  });

  await login(config.twake_url, browser, config.accounts_for_login[0], {
    withConsole: config.console,
  });
}

init();
