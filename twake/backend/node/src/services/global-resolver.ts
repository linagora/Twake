import { TwakePlatform } from "../core/platform/platform";
import { PlatformServicesAPI } from "../core/platform/services/platform-services";
import { ConsoleServiceAPI } from "./console/api";
import { ApplicationServiceAPI } from "./applications/api";
import { StatisticsAPI } from "./statistics/types";
import AuthServiceAPI from "../core/platform/services/auth/provider";
import { CompaniesServiceAPI, UsersServiceAPI } from "./user/api";
import { WorkspaceService } from "./workspaces/api";
import { getService as getWorkspaceService } from "./workspaces/services/workspace";
import { getService as getUsersService } from "./user/services/users";
import { getService as GetCompaniesService } from "./user/services/companies";
import { RealtimeServiceAPI } from "../core/platform/services/realtime/api";
import WebServerAPI from "../core/platform/services/webserver/provider";
import { FastifyInstance } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { TwakeContext } from "../core/platform/framework";
import web from "./workspaces/web";

type PlatformServices = {
  realtime: RealtimeServiceAPI;
};

type CoreServices = {
  workspaces: WorkspaceService;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;
  console: ConsoleServiceAPI;
  statistics: StatisticsAPI;
};

class GlobalResolver {
  public platform: TwakePlatform;
  // public api: ApiContainer;
  public services: CoreServices;
  public platformServices: PlatformServices;
  private fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  public registerEndpoint = (context: TwakeContext, prefix: string) => {
    if (!this.fastify) {
      const webserver = context.getProvider<WebServerAPI>("webserver");
      this.fastify = webserver.getServer();
    }
    this.fastify.register((instance, _opts, next) => {
      web(instance, { prefix: prefix });
      next();
    });
  };

  async doInit(platform: TwakePlatform) {
    this.platform = platform;
    const platformServices = platform.getProvider<PlatformServicesAPI>("platform-services");
    const consoleService = platform.getProvider<ConsoleServiceAPI>("console");
    const applications = platform.getProvider<ApplicationServiceAPI>("applications");
    const statistics = platform.getProvider<StatisticsAPI>("statistics");
    const auth = platform.getProvider<AuthServiceAPI>("auth");
    const realtime = platform.getProvider<RealtimeServiceAPI>("realtime");

    this.platformServices = {
      realtime,
    };

    const users = getUsersService(platformServices);
    await users.init();
    const companies = GetCompaniesService(platformServices, users);
    await companies.init();

    const workspaces = getWorkspaceService(platformServices, users, companies, applications, auth);
    await workspaces.init();

    this.services = {
      workspaces,
      companies,
      users,
      console: consoleService,
      statistics,
    };
  }
}

export default new GlobalResolver();
