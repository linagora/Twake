import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { MergeProcess } from "./processing/merge";
import { ConsoleOptions, ConsoleType, MergeProgress } from "./types";
import { ConsoleServiceClient } from "./client-interface";
import { ConsoleClientFactory } from "./client-factory";
import User from "../user/entities/user";

class ConsoleService implements ConsoleServiceAPI {
  version: "1";

  consoleType: ConsoleType;
  consoleOptions: ConsoleOptions;
  services: {
    database: DatabaseServiceAPI;
    userService: UserServiceAPI;
  };

  constructor(
    database: DatabaseServiceAPI,
    userService: UserServiceAPI,
    type: ConsoleType,
    options: ConsoleOptions,
  ) {
    this.consoleType = type;
    this.consoleOptions = options;
    this.services = {
      database,
      userService,
    };
  }

  merge(
    baseUrl: string,
    concurrent: number = 1,
    dryRun: boolean = false,
    console: string = "console",
    link: boolean = true,
    client: string,
    secret: string,
  ): MergeProgress {
    return new MergeProcess(
      this.services.database,
      this.services.userService,
      dryRun,
      console,
      link,
      {
        client,
        secret,
        url: baseUrl,
      },
    ).merge(concurrent);
  }

  getClient(): ConsoleServiceClient {
    return ConsoleClientFactory.create(this);
  }

  async processPendingUser(user: User): Promise<void> {
    const services = this.services.userService;
    const userCompanies = await services.companies.getAllForUser(user.id);
    for (const userCompany of userCompanies) {
      const workspaces = await services.workspaces.getAllForCompany(userCompany.group_id);
      for (const workspace of workspaces) {
        const pendingUserPk = {
          workspace_id: workspace.id,
          email: user.email_canonical,
        };
        const pendingUser = await services.workspaces.getPendingUser(pendingUserPk);

        if (pendingUser) {
          await services.workspaces.removePendingUser(pendingUserPk);
          await services.workspaces.addUser(
            { id: workspace.id },
            { id: user.id },
            pendingUser.role,
          );
        }
      }
    }
  }
}

export function getService(
  database: DatabaseServiceAPI,
  userService: UserServiceAPI,
  type: ConsoleType,
  options: ConsoleOptions,
): ConsoleServiceAPI {
  return new ConsoleService(database, userService, type, options);
}
