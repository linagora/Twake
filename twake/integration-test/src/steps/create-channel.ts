import { Browser, Page } from "puppeteer";

import config from "../config";

import { signIn } from "./signin";

const popupSelector = "div.ant-modal-wrap.ant-modal-centered";
const hamburgerIconBtnSelector = "span.ant-layout-sider-zero-width-trigger";
const plusIconBtnSelector =
  "div.workspace_channels div.channel_category div.add";
const createChannelMenuItemSelector = "div.menu.add-channel";
const inputChannelNameSelector = 'input[placeholder="Channel name"]';
const inputChannelDescriptionSelector =
  'textarea[placeholder="Describe the channel"]';
const selectChannelVisibilitySelector = ".ant-select-selector";
const selectChannelVisibilityItemSelector = `.ant-select-item[title="${
  config.channels_for_create[0].visibility === "public" ? "Public" : "Private"
}]"`;

const createButtonSelector =
  "button.ant-btn.ant-btn-primary.ant-btn-block.small";

export async function createChannel(
  url: string,
  browser: Browser,
  credentials: { email: string; password: string },
  opts: { withConsole: boolean } = { withConsole: false }
): Promise<Page> {
  const page = await signIn(url, browser, credentials, {
    withConsole: opts.withConsole,
  });

  await Promise.all([
    // Click on the hamburger icon (depend the screensize)
    //await page.waitForSelector(hamburgerIconBtnSelector),
    //await page.click(hamburgerIconBtnSelector),

    // Click on the plus icon
    await page.waitForSelector(plusIconBtnSelector),
    await page.hover(plusIconBtnSelector),
    await page.click(plusIconBtnSelector),

    // Click on the create channel menu item
    await page.waitForSelector(createChannelMenuItemSelector),
    await page.hover(createChannelMenuItemSelector),
    await page.click(createChannelMenuItemSelector),

    await new Promise((resolve) => setTimeout(resolve, 1000)),

    // Wait for the popup to appear
    await page.waitForSelector(popupSelector),

    // Filling the channel name
    await page.waitForSelector(inputChannelNameSelector),
    await page.focus(inputChannelNameSelector),
    await page.keyboard.type(config.channels_for_create[0].name),

    // Filling the channel description
    await page.waitForSelector(inputChannelDescriptionSelector),
    await page.focus(inputChannelDescriptionSelector),
    await page.keyboard.type(config.channels_for_create[0].description),

    // Click the channel visibility select
    // await page.waitForSelector(selectChannelVisibilitySelector),
    // await page.click(selectChannelVisibilitySelector),

    // FIXME: Select the channel visibility
    // await page.waitForSelector(selectChannelVisibilityItemSelector),
    // await page.click(selectChannelVisibilityItemSelector),

    // Click the create button
    await page.waitForSelector(createButtonSelector),
    await page.click(createButtonSelector),

    await page.waitForSelector(createButtonSelector),
  ]);

  return page;
}
