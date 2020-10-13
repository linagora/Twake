import { TwakePlatform, TwakePlatformConfiguration } from "../../../src/core/platform/platform";
import WebServerAPI from "../../../src/services/webserver/provider";
import path from "path";
import { FastifyInstance } from "fastify";

export interface TestPlatform {
  platform: TwakePlatform;
  app: FastifyInstance;
  tearDown(): Promise<void>
}

export interface TestPlatformConfiguration {
  services: string[]
}

export async function init(config: TestPlatformConfiguration): Promise<TestPlatform> {
  const configuration: TwakePlatformConfiguration = {
    services: config.services,
    servicesPath: path.resolve(__dirname, "../../../src/services/")
  };
  const platform = new TwakePlatform(configuration);

  await platform.init();
  await platform.start();

  const fastify = platform.getProvider<WebServerAPI>("webserver").getServer();

  async function tearDown(): Promise<void> {
    await platform.stop();
    return Promise.resolve();
  }

  return {
    platform,
    app: fastify,
    tearDown
  };
}
