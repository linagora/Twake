import puppeteer from "puppeteer";

import config from "../config";

import { createChannel } from "../steps/create-channel";
import { login } from "../steps/login";
import { signIn } from "../steps/signin";

// This is the entry point for the integration tests.
async function init() {
  const { headless, slowMo, executablePath, args } = config;
  const browser = await puppeteer.launch({
    headless,
    slowMo,
    executablePath,
    args,
  });

  await Promise.all([
    signIn(config.twake_url, browser, config.accounts_for_sign_in[0], {
      withConsole: config.console,
    }),

    login(config.twake_url, browser, config.accounts_for_login[0], {
      withConsole: config.console,
    }),

    createChannel(config.twake_url, browser, undefined, {
      withConsole: config.console,
    }),
    // Do other tests here
  ]);
}

init();
