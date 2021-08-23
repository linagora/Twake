import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import WorkspaceServicesAPI, { WorkspaceServiceAPI } from "../api";
import { getService as getWorkspaceService } from "./workspace";
import { getService as getCompaniesService } from "../../user/services/companies";
import { getService as getUsersService } from "../../user/services/users";
import { CompaniesServiceAPI, UsersServiceAPI } from "../../user/api";
import { ConsoleServiceAPI } from "../../console/api";
import { SearchServiceAPI } from "../../../core/platform/services/search/api";
import CounterAPI from "../../../core/platform/services/counter/provider";
import { CounterType } from "../../../core/platform/services/counter/types";

export function getService(
  databaseService: DatabaseServiceAPI,
  consoleService: ConsoleServiceAPI,
  searchService: SearchServiceAPI,
  counterService: CounterAPI,
): WorkspaceServicesAPI {
  return new Service(databaseService, consoleService, searchService, counterService);
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
    counterService: CounterAPI,
  ) {
    this.companies = getCompaniesService(
      databaseService,
      counterService.getCounter(CounterType.COMPANY),
    );
    this.users = getUsersService(databaseService, searchService);
    this.workspaces = getWorkspaceService(
      databaseService,
      this.users,
      counterService.getCounter(CounterType.WORKSPACE),
    );
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
