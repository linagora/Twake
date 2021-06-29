import { TwakeServiceProvider } from "../../core/platform/framework";
import { ConsoleOptions, ConsoleType, MergeProgress } from "./types";
import { ConsoleServiceClient } from "./client-interface";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import UserServiceAPI from "../user/api";

export interface ConsoleServiceAPI extends TwakeServiceProvider {
  merge(
    baseUrl: string,
    concurrent: number,
    dryRun: boolean,
    console: string,
    link: boolean,
    client: string,
    secret: string,
  ): MergeProgress;

  getClient(): ConsoleServiceClient;

  consoleType: ConsoleType;
  consoleOptions: ConsoleOptions;
  services: {
    database: DatabaseServiceAPI;
    userService: UserServiceAPI;
  };
}
