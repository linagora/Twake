import { resolve as pathResolve } from "path";
import { v1 as uuidv1 } from "uuid";
import { FastifyInstance } from "fastify";
import { TwakePlatform, TwakePlatformConfiguration } from "../../../src/core/platform/platform";
import WebServerAPI from "../../../src/core/platform/services/webserver/provider";
import { DatabaseServiceAPI } from "../../../src/core/platform/services/database/api";
import AuthServiceAPI from "../../../src/core/platform/services/auth/provider";
import { Workspace } from "../../../src/utils/types";
import { PubsubServiceAPI } from "../../../src/core/platform/services/pubsub/api";
import config from "config";

type TokenPayload = {
  sub: string;
  org?: {
    [companyId: string]: {
      role: string;
    };
  };
};

type User = {
  id: string;
  isWorkspaceAdmin?: boolean;
};

export interface TestPlatform {
  currentUser: User;
  platform: TwakePlatform;
  workspace: Workspace;
  app: FastifyInstance;
  database: DatabaseServiceAPI;
  pubsub: PubsubServiceAPI;
  authService: AuthServiceAPI;
  auth: {
    getJWTToken(payload?: TokenPayload): Promise<string>;
  };
  tearDown(): Promise<void>;
}

export interface TestPlatformConfiguration {
  services: string[];
}

let testPlatform: TestPlatform = null;

export async function init(testConfig?: TestPlatformConfiguration): Promise<TestPlatform> {
  if (!testPlatform) {
    const configuration: TwakePlatformConfiguration = {
      services: testConfig && testConfig.services ? testConfig.services : config.get("services"),
      servicesPath: pathResolve(__dirname, "../../../src/services/"),
    };
    const platform = new TwakePlatform(configuration);

    await platform.init();
    await platform.start();

    const app = platform.getProvider<WebServerAPI>("webserver").getServer();
    const database = platform.getProvider<DatabaseServiceAPI>("database");
    const pubsub = platform.getProvider<PubsubServiceAPI>("pubsub");
    const auth = platform.getProvider<AuthServiceAPI>("auth");

    testPlatform = {
      platform,
      app,
      pubsub,
      database,
      workspace: { company_id: "", workspace_id: "" },
      currentUser: { id: "" },
      authService: auth,
      auth: {
        getJWTToken,
      },
      tearDown,
    };
  }

  testPlatform.app.server.close();
  await testPlatform.pubsub.processor.stop();

  testPlatform.currentUser = { id: uuidv1() };
  testPlatform.workspace = {
    company_id: uuidv1(),
    workspace_id: uuidv1(),
  };

  testPlatform.app.server.listen(3000);
  await testPlatform.pubsub.processor.start();

  async function getJWTToken(
    payload: TokenPayload = { sub: testPlatform.currentUser.id },
  ): Promise<string> {
    if (!payload.sub) {
      payload.sub = testPlatform.currentUser.id;
    }

    if (testPlatform.currentUser.isWorkspaceAdmin) {
      payload.org = {};
      payload.org[testPlatform.workspace.company_id] = {
        role: "",
      };
    }

    return testPlatform.authService.sign(payload);
  }

  async function tearDown(): Promise<void> {
    if (testPlatform) {
      testPlatform.app.server.close();
      await testPlatform.pubsub.processor.stop();
    }
  }

  return testPlatform;
}
