import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FastifyInstance } from "fastify";
import { TwakePlatform, TwakePlatformConfiguration } from "../../../src/core/platform/platform";
import WebServerAPI from "../../../src/core/platform/services/webserver/provider";
import { DatabaseServiceAPI } from "../../../src/core/platform/services/database/api";
import AuthServiceAPI from "../../../src/core/platform/services/auth/provider";
import { Workspace } from "../../../src/services/types";

type TokenPayload = {
  sub: string;
  org?: {
    [companyId: string]: {
      role: string;
      wks: {
        [workspaceId: string]: {
          adm: boolean;
        };
      };
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
  auth: {
    getJWTToken(payload?: TokenPayload): Promise<string>;
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
  const auth = platform.getProvider<AuthServiceAPI>("auth");
  const currentUser: User = { id: uuidv4() };
  const workspace: Workspace = {
    company_id: uuidv4(),
    workspace_id: uuidv4(),
  };

  async function getJWTToken(payload: TokenPayload = { sub: currentUser.id }): Promise<string> {
    if (!payload.sub) {
      payload.sub = currentUser.id;
    }

    if (currentUser.isWorkspaceAdmin) {
      payload.org = {};
      payload.org[workspace.company_id] = {
        role: "",
        wks: {},
      };
      payload.org[workspace.company_id].wks[workspace.workspace_id] = { adm: true };
    }

    return auth.sign(payload);
  }

  async function tearDown(): Promise<void> {
    await platform.stop();
    await dropDatabase();
  }

  async function dropDatabase(): Promise<void> {
    if (!database) {
      return;
    }

    await database.getConnector().drop();
  }

  return {
    platform,
    app,
    database,
    workspace,
    currentUser,
    auth: {
      getJWTToken,
    },
    tearDown,
  };
}
