import puppeteer from "puppeteer";

import config from "../config";

import { login } from "../tests/login";

async function init() {
  const { headless, slowMo } = config;
  const browser = await puppeteer.launch({ headless, slowMo });

  await login(config.twake_url, browser, config.accounts_for_login[0], {
    withConsole: config.console,
  });
}

init();
