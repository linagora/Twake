import { TwakeContext } from "../../../core/platform/framework";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { getService as getUsersService } from "../../user/services/users";
import { CompaniesServiceAPI, UsersServiceAPI } from "../../user/api";
import { ConsoleServiceAPI } from "../../console/api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../../applications/api";
import AuthServiceAPI from "../../../core/platform/services/auth/provider";

export function getService(
  platformServices: PlatformServicesAPI,
  consoleService: ConsoleServiceAPI,
  applicationsService: ApplicationServiceAPI,
  auth: AuthServiceAPI,
): WorkspaceServicesAPI {
  return new Service(platformServices, consoleService, applicationsService, auth);
}

class Service implements WorkspaceServicesAPI {
  version: "1";
  workspaces: WorkspaceServiceAPI;
  companies: CompaniesServiceAPI;
  users: UsersServiceAPI;

  constructor(
    platformServices: PlatformServicesAPI,
    readonly console: ConsoleServiceAPI,
    readonly applications: ApplicationServiceAPI,
    readonly auth: AuthServiceAPI,
  ) {
    this.companies = getCompaniesService(platformServices);
    this.users = getUsersService(platformServices);
    this.workspaces = getWorkspaceService(
      platformServices,
      this.users,
      this.companies,
      this.applications,
      auth,
    );
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
