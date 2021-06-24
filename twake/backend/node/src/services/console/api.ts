import { TwakeServiceProvider } from "../../core/platform/framework";
import { MergeProgress } from "./types";
import { ConsoleServiceClient } from "./client-interface";

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

  getClient(dryRun: boolean): ConsoleServiceClient;
}
