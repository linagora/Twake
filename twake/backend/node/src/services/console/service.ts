import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { MergeProcess } from "./processing/merge";
import { ConsoleOptions, ConsoleType, MergeProgress } from "./types";
import { ConsoleServiceClient } from "./client-interface";
import { ConsoleClientFactory } from "./client-factory";

class ConsoleService implements ConsoleServiceAPI {
  version: "1";

  constructor(
    private database: DatabaseServiceAPI,
    private userService: UserServiceAPI,
    private type: ConsoleType,
    private options: ConsoleOptions,
  ) {}

  merge(
    baseUrl: string,
    concurrent: number = 1,
    dryRun: boolean = false,
    console: string = "console",
    link: boolean = true,
    client: string,
    secret: string,
  ): MergeProgress {
    return new MergeProcess(this.database, this.userService, dryRun, console, link, {
      client,
      secret,
      url: baseUrl,
    }).merge(concurrent);
  }

  getClient(dryRun: boolean): ConsoleServiceClient {
    return ConsoleClientFactory.create(this.type, this.options, dryRun);
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
