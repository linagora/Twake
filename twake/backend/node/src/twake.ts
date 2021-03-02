import path from "path";
import { TwakePlatform, TwakePlatformConfiguration } from "./core/platform/platform";

/**
 * Instanciate and start a new TwakePlatform with the given services.
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

      return platform;
    } catch (err) {
      console.error(err);
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

  process.on("SIGINT", stop);

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
