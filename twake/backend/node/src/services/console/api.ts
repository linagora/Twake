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

export interface ConsoleServiceClient {
  /**
   * Create a company
   *
   * @param company
   */
  createCompany(company: CreateConsoleCompany): Promise<CreatedConsoleCompany>;

  /**
   * Add user to company
   *
   * @param company
   * @param user
   */
  addUser(company: ConsoleCompany, user: CreateConsoleUser): Promise<CreatedConsoleUser>;

  /**
   * Update user role
   *
   * @param company
   * @param user
   */
  updateUserRole(
    company: ConsoleCompany,
    user: UpdateConsoleUserRole,
  ): Promise<UpdatedConsoleUserRole>;
}
