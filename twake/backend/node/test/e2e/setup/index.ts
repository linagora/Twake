import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FastifyInstance } from "fastify";
import { TwakePlatform, TwakePlatformConfiguration } from "../../../src/core/platform/platform";
import WebServerAPI from "../../../src/core/platform/services/webserver/provider";
import { DatabaseServiceAPI } from "../../../src/core/platform/services/database/api";
import { MongoConnector } from "../../../src/core/platform/services/database/services/connectors/mongodb";
import { Workspace } from "../../../src/services/types";

export interface TestPlatform {
  platform: TwakePlatform;
  workspace: Workspace;
  app: FastifyInstance;
  database: DatabaseServiceAPI;
  auth: {
    getJWTToken(): Promise<string>;
  };
  tearDown(): Promise<void>;
}

export interface TestPlatformConfiguration {
  services: string[];
}

export async function init(config: TestPlatformConfiguration): Promise<TestPlatform> {
  const configuration: TwakePlatformConfiguration = {
    services: config.services,
    servicesPath: path.resolve(__dirname, "../../../src/services/"),
  };
  const platform = new TwakePlatform(configuration);

  await platform.init();
  await platform.start();

  const app = platform.getProvider<WebServerAPI>("webserver").getServer();
  const database = platform.getProvider<DatabaseServiceAPI>("database");
  const workspace: Workspace = {
    company_id: uuidv4(),
    workspace_id: uuidv4(),
  };

  async function getJWTToken(): Promise<string> {
    const response = await app.inject({
      method: "GET",
      url: "/api/auth/login",
    });

    return JSON.parse(response.payload).token;
  }

  async function tearDown(): Promise<void> {
    await platform.stop();
    await dropDatabase();
  }

  async function dropDatabase(): Promise<void> {
    if (!database) {
      return;
    }

    const mongo = database.getConnector() as MongoConnector;
    await mongo.getDatabase().dropDatabase();
  }

  return {
    platform,
    app,
    database,
    workspace,
    auth: {
      getJWTToken,
    },
    tearDown,
  };
}
