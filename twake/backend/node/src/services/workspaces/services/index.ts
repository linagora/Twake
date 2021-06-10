import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { CompaniesServiceAPI } from "../../user/api";

export function getService(databaseService: DatabaseServiceAPI): WorkspaceServicesAPI {
  return new Service(databaseService);
}

class Service implements WorkspaceServicesAPI {
  version: "1";
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;

  constructor(databaseService: DatabaseServiceAPI) {
    this.workspaces = getWorkspaceService(databaseService);
    this.companies = getCompaniesService(databaseService);
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([this.workspaces.init(context), this.companies.init(context)]);
    } catch (err) {
      console.error("Error while initializing notification service", err);
    }
    return this;
  }
}
