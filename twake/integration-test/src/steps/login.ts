import { Browser, Page } from "puppeteer";

const usernameInputSelector = { console: "#userfield", local: "#username" };
const passwordInputSelector = { console: "#passwordfield", local: "#password" };
const loginButtonSelector = { console: "#sign_in_button", local: "#login_btn" };

export async function login(
  url: string,
  browser: Browser,
  credentials: { email: string; password: string },
  opts: { withConsole: boolean } = { withConsole: false }
): Promise<Page> {
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await Promise.all([
    // Go to the url
    await page.goto(url),

    // Username
    await page.waitForSelector(
      opts?.withConsole
        ? usernameInputSelector.console
        : usernameInputSelector.local
    ),
    await page.focus(
      opts?.withConsole
        ? usernameInputSelector.console
        : usernameInputSelector.local
    ),
    await page.keyboard.type(credentials.email ?? ""),

    // Password
    await page.waitForSelector(
      opts?.withConsole
        ? passwordInputSelector.console
        : passwordInputSelector.local
    ),
    await page.focus(
      opts?.withConsole
        ? passwordInputSelector.console
        : passwordInputSelector.local
    ),
    await page.keyboard.type(credentials.password ?? ""),

    await page.click(
      opts?.withConsole
        ? loginButtonSelector.console
        : loginButtonSelector.local
    ),
  ]);

  return page;
}
