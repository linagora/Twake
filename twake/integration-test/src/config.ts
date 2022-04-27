import { createSomeFakeChannels } from "./utils/create-some-fake-channels";
import { createSomeFakeUsers } from "./utils/create-some-fake-users";

export default {
  twake_url: process.env.SERVER || "http://localhost:3000",
  executablePath: "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
  screenshot_path: "screenshots/",
  console: false,
  headless: true,
  slowMo: 50,
  accounts_for_login: [
    {
      username: "azaplsky@linagora.com",
      password: "081083STef$",
    },
    {
      username: "another_guy@example.com",
      password: "secretPassword123",
    },
  ],
  accounts_for_sign_in: createSomeFakeUsers(5),
  channels_for_create: createSomeFakeChannels(5),
};

console.log("this is the config file", process.env);
