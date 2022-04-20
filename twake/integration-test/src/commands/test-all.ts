import puppeteer from "puppeteer";

import config from "../config";

import { login } from "../tests/login";
import { signIn } from "../tests/create-account";

// This is the entry point for the integration tests.
async function init() {
  const { headless, slowMo } = config;
  const browser = await puppeteer.launch({ headless, slowMo });

  await Promise.all([
    login(config.twake_url, browser, config.accounts_for_login[0], {
      withConsole: config.console,
    }),

    signIn(config.twake_url, browser, config.accounts_for_sign_in[0], {
      withConsole: config.console,
    }),

    // Do other tests here
  ]);
}

init();
