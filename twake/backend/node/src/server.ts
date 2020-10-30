import path from "path";
import { TwakePlatform, TwakePlatformConfiguration } from "./core/platform/platform";

import config from "./core/config";

const start = async (): Promise<TwakePlatform> => {
  try {
    const configuration: TwakePlatformConfiguration = {
      services: config.get("services"),
      servicesPath: path.resolve(__dirname, "./services/"),
    };
    const platform = new TwakePlatform(configuration);
    await platform.init();
    await platform.start();

    return platform;
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
