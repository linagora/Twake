import { TwakeServiceProvider } from "../../core/platform/framework";
import {
  ConsoleCompany,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  MergeProgress,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "./types";

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
}
