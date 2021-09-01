import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { getService as getUsersService } from "../../user/services/users";
import UserServiceAPI, { CompaniesServiceAPI, UsersServiceAPI } from "../../user/api";
import { ConsoleServiceAPI } from "../../console/api";
import { SearchServiceAPI } from "../../../core/platform/services/search/api";
import { CounterAPI } from "../../../core/platform/services/counter/types";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";

export function getService(
  platformServices: PlatformServicesAPI,
  consoleService: ConsoleServiceAPI,
): WorkspaceServicesAPI {
  return new Service(platformServices, consoleService);
}

class Service implements WorkspaceServicesAPI {
  version: "1";
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;
  console: ConsoleServiceAPI;

  constructor(platformServices: PlatformServicesAPI, consoleService: ConsoleServiceAPI) {
    this.companies = getCompaniesService(platformServices);
    this.users = getUsersService(platformServices);
    this.workspaces = getWorkspaceService(platformServices, this.users);
    this.console = consoleService;
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.workspaces.init(context),
        this.companies.init(context),
        this.users.init(context),
      ]);
    } catch (err) {
      console.error("Error while initializing workspace service", err);
    }
    return this;
  }
}
