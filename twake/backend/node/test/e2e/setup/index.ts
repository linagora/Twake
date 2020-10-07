import { TwakeAppConfiguration } from "../../../src/core/platform/framework";
import { Platform } from "../../../src/core/platform/platform";
import WebServerAPI from "../../../src/services/webserver/provider";
import path from "path";
import { FastifyInstance } from "fastify";

export interface TestPlatform {
  platform: Platform;
  app: FastifyInstance;
  tearDown(): Promise<void>
}

export interface TestPlatformConfiguration {
  services: string[]
}

export async function init(config: TestPlatformConfiguration): Promise<TestPlatform> {
  const configuration: TwakeAppConfiguration = {
    name: "Twake",
    services: config.services,
    servicesPath: path.resolve(__dirname, "../../../src/services/")
  };
  const platform = new Platform(configuration);

  await platform.init();
  await platform.start();

  const fastify = platform.getProvider<WebServerAPI>("webserver").getServer();

  function tearDown(): Promise<void> {
    fastify.close();
    return Promise.resolve();
  }

  return {
    platform,
    app: fastify,
    tearDown
  };
}
