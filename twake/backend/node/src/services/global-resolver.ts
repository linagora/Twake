import { TwakePlatform } from "../core/platform/platform";
import { PlatformServicesAPI } from "../core/platform/services/platform-services";
import { ConsoleServiceAPI } from "./console/api";
import { ApplicationServiceAPI } from "./applications/api";
import { StatisticsAPI } from "./statistics/types";
import AuthServiceAPI from "../core/platform/services/auth/provider";
import { CompaniesServiceAPI, UsersServiceAPI } from "./user/api";
import WorkspaceServicesAPI, { WorkspaceService } from "./workspaces/api";
import { getService as getWorkspaceService } from "./workspaces/services/workspace";
import { getService as getUsersService } from "./user/services/users";
import { getService as GetCompaniesService } from "./user/services/companies";

type ApiContainer = {
  workspaceServicesAPI: WorkspaceServicesAPI;
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

  async doInit(platform: TwakePlatform) {
    this.platform = platform;

    const platformServices = platform.getProvider<PlatformServicesAPI>("platform-services");

    // const fastify = platformServices.fastify.getServer();
    const consoleService = platform.getProvider<ConsoleServiceAPI>("console");
    const applications = platform.getProvider<ApplicationServiceAPI>("applications");
    const statistics = platform.getProvider<StatisticsAPI>("statistics");
    const auth = platform.getProvider<AuthServiceAPI>("auth");
    // const realtime = platform.getProvider<RealtimeServiceAPI>("realtime");
    // const users = platform.getProvider<UserServiceAPI>("user");

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
