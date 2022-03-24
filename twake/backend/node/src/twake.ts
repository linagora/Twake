import path from "path";
import { TwakePlatform, TwakePlatformConfiguration } from "./core/platform/platform";

import globalResolver from "./services/global-resolver";

/**
 * Instantiate and start a new TwakePlatform with the given services.
 */
async function run(services: string[] = []): Promise<TwakePlatform> {
  let platform: TwakePlatform;

  const start = async (): Promise<TwakePlatform> => {
    try {
      const configuration: TwakePlatformConfiguration = {
        services,
        servicesPath: path.resolve(__dirname, "./services/"),
      };
      platform = new TwakePlatform(configuration);
      await platform.init();
      await platform.start();
      await globalResolver.doInit(platform);
      return platform;
    } catch (err) {
      console.error("Will exit process because of: ", err);
      process.exit(-1);
    }
  };

  async function stop() {
    try {
      await platform?.stop();
    } catch (err) {
      console.error(err);
    }
  }

  process.on("uncaughtException", error => {
    console.error(error);
  });

  process.on("unhandledRejection", error => {
    console.error(error);
  });

  process.on("SIGINT", async () => {
    await stop();
    process.kill(process.pid, "SIGUSR2");
  });

  process.once("SIGUSR2", async () => {
    await stop();
    process.kill(process.pid, "SIGUSR2");
  });

  await start();

  return platform;
}

export default {
  run,
};
