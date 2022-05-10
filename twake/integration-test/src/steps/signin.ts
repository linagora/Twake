import { Browser, Page } from "puppeteer";

const signInBtnSelector = { local: "#create_btn" };
const firstNameInputSelector = { local: "#first_name_create" };
const lastNameInputSelector = { local: "#last_name_create" };
const emailInputSelector = { local: "#email_create" };
const passwordInputSelector = { local: "#password_create" };
const signInContinueBtnSelector = { local: "#continue_btn" };
const signedInSelector = { local: ".channels_view" };

export async function signIn(
  url: string,
  browser: Browser,
  credentials: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  },
  _opts: { withConsole?: boolean } = { withConsole: false }
): Promise<Page> {
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await Promise.all([
    // Click on the sign in button
    await page.goto(url),
    await page.waitForSelector(signInBtnSelector.local),
    await page.click(signInBtnSelector.local),

    // First name
    await page.waitForSelector(firstNameInputSelector.local),
    await page.focus(firstNameInputSelector.local),
    await page.keyboard.type(credentials.first_name ?? ""),

    // Last name
    await page.waitForSelector(lastNameInputSelector.local),
    await page.focus(lastNameInputSelector.local),
    await page.keyboard.type(credentials.last_name ?? ""),

    // Email
    await page.waitForSelector(emailInputSelector.local),
    await page.focus(emailInputSelector.local),
    await page.keyboard.type(credentials.email),

    // Password
    await page.waitForSelector(passwordInputSelector.local),
    await page.focus(passwordInputSelector.local),
    await page.keyboard.type(credentials.password),

    // Continue
    await page.waitForSelector(signInContinueBtnSelector.local),
    await page.click(signInContinueBtnSelector.local),

    await new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);

  return page;
}
