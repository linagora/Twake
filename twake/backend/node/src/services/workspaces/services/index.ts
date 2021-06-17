import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { getService as getUsersService } from "../../user/services/users";
import { CompaniesServiceAPI, UsersServiceAPI } from "../../user/api";

export function getService(databaseService: DatabaseServiceAPI): WorkspaceServicesAPI {
  return new Service(databaseService);
}

class Service implements WorkspaceServicesAPI {
  version: "1";
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.workspaces = getWorkspaceService(databaseService);
    this.companies = getCompaniesService(databaseService);
    this.users = getUsersService(databaseService);
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
