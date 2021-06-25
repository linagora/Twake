import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { MergeProcess } from "./processing/merge";
import { ConsoleOptions, ConsoleType, MergeProgress } from "./types";
import { ConsoleServiceClient } from "./client-interface";
import { ConsoleClientFactory } from "./client-factory";

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
}

export function getService(
  database: DatabaseServiceAPI,
  userService: UserServiceAPI,
  type: ConsoleType,
  options: ConsoleOptions,
): ConsoleServiceAPI {
  return new ConsoleService(database, userService, type, options);
}
