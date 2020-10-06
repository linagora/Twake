import { TwakeAppConfiguration } from "./core/platform/framework";
import { Platform } from "./core/platform/platform";

import config from "./core/config";

const start = async (): Promise<void> => {
  try {
    const configuration: TwakeAppConfiguration = {
      name: "Twake",
      services: config.get("services"),
    };
    const platform = new Platform(configuration);
    await platform.init();
    await platform.start();
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
};

process.on("uncaughtException", error => {
  console.error(error);
});

process.on("unhandledRejection", error => {
  console.error(error);
});

start();
