import puppeteer from "puppeteer";

import config from "../config";

import { signIn } from "../tests/create-account";

async function init() {
  const { headless, slowMo } = config;
  const browser = await puppeteer.launch({ headless, slowMo });

  await signIn(config.twake_url, browser, config.accounts_for_sign_in[0], {
    withConsole: config.console,
  });
}

init();
