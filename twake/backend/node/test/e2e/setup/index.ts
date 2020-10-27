import { TwakePlatform, TwakePlatformConfiguration } from "../../../src/core/platform/platform";
import WebServerAPI from "../../../src/core/platform/services/webserver/provider";
import path from "path";
import { FastifyInstance } from "fastify";

export interface TestPlatform {
  platform: TwakePlatform;
  app: FastifyInstance;
  auth: {
    getJWTToken(): Promise<string>
  }
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

  const app = platform.getProvider<WebServerAPI>("webserver").getServer();

  async function getJWTToken(): Promise<string> {
    const response = await app.inject({
      method: "GET",
      url: "/api/auth/login"
    });

    return JSON.parse(response.payload).token;
  }

  async function tearDown(): Promise<void> {
    await platform.stop();
  }

  return {
    platform,
    app,
    auth: {
      getJWTToken
    },
    tearDown
  };
}
