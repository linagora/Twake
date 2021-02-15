import * as Sentry from "@sentry/node";
import path from "path";
import { TwakePlatform, TwakePlatformConfiguration } from "./core/platform/platform";
import config from "./core/config";

if (config.get("sentry.dsn")) {
  Sentry.init({
    dsn: config.get("sentry.dsn"),
    tracesSampleRate: 1.0,
  });
}

let platform: TwakePlatform;

const start = async (): Promise<TwakePlatform> => {
  try {
    const configuration: TwakePlatformConfiguration = {
      services: config.get("services"),
      servicesPath: path.resolve(__dirname, "./services/"),
    };
    platform = new TwakePlatform(configuration);
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

process.once("SIGUSR2", async () => {
  try {
    await platform?.stop();
  } catch (err) {
    console.error(err);
  }
  process.kill(process.pid, "SIGUSR2");
});

start();
