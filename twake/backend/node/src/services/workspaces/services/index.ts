import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { getService as getUsersService } from "../../user/services/users";
import { CompaniesServiceAPI, UsersServiceAPI } from "../../user/api";
import { ConsoleServiceAPI } from "../../console/api";
import User from "../../user/entities/user";

export function getService(
  databaseService: DatabaseServiceAPI,
  consoleService: ConsoleServiceAPI,
): WorkspaceServicesAPI {
  return new Service(databaseService, consoleService);
}

class Service implements WorkspaceServicesAPI {
  version: "1";
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;
  console: ConsoleServiceAPI;

  constructor(databaseService: DatabaseServiceAPI, consoleService: ConsoleServiceAPI) {
    this.workspaces = getWorkspaceService(databaseService);
    this.companies = getCompaniesService(databaseService);
    this.users = getUsersService(databaseService);
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
