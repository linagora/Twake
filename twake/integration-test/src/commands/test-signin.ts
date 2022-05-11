import puppeteer from "puppeteer";

import config from "../config";

import { signIn } from "../steps/signin";

async function init() {
  const { headless, slowMo, executablePath, args } = config;
  const browser = await puppeteer.launch({
    headless,
    slowMo,
    executablePath,
    args,
  });

  await signIn(config.twake_url, browser, config.accounts_for_sign_in[0], {
    withConsole: config.console,
  });
}

init();
