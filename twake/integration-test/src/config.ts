import { createSomeFakeChannels } from "./utils/create-some-fake-channels";
import { createSomeFakeUsers } from "./utils/create-some-fake-users";

export default {
  twake_url: process.env.SERVER || "http://localhost:3000",
  executablePath: "/usr/bin/google-chrome", //"/Applications/Chromium.app/Contents/MacOS/Chromium"
  args: ["--no-sandbox"],
  screenshot_path: "screenshots/",
  console: false,
  headless: true,
  slowMo: 50,
  accounts_for_login: createSomeFakeUsers(5),
  accounts_for_sign_in: createSomeFakeUsers(5),
  channels_for_create: createSomeFakeChannels(5),
};
