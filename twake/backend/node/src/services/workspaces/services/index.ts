import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { getService as getUsersService } from "../../user/services/users";
import UserServiceAPI, { CompaniesServiceAPI, UsersServiceAPI } from "../../user/api";
import { ConsoleServiceAPI } from "../../console/api";
import { SearchServiceAPI } from "../../../core/platform/services/search/api";

export function getService(
  databaseService: DatabaseServiceAPI,
  consoleService: ConsoleServiceAPI,
  searchService: SearchServiceAPI,
): WorkspaceServicesAPI {
  return new Service(databaseService, consoleService, searchService);
}

class Service implements WorkspaceServicesAPI {
  version: "1";
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;
  console: ConsoleServiceAPI;

  constructor(
    databaseService: DatabaseServiceAPI,
    consoleService: ConsoleServiceAPI,
    searchService: SearchServiceAPI,
  ) {
    this.companies = getCompaniesService(databaseService);
    this.users = getUsersService(databaseService, searchService);
    this.workspaces = getWorkspaceService(databaseService, this.users);
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
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
