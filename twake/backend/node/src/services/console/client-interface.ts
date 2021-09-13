import {
  ConsoleCompany,
  ConsoleHookCompany,
  ConsoleHookUser,
  ConsoleOptions,
  CreateConsoleCompany,
  CreateConsoleUser,
  CreatedConsoleCompany,
  CreatedConsoleUser,
  CreateInternalUser,
  UpdateConsoleUserRole,
  UpdatedConsoleUserRole,
} from "./types";
import User from "../user/entities/user";
import Company, { CompanyPrimaryKey, CompanySearchKey } from "../user/entities/company";
import { CompanyUserRole } from "../user/web/types";
import { ExternalGroupPrimaryKey } from "../user/entities/external_company";

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
   * @param inviter
   */
  addUserToCompany(company: ConsoleCompany, user: CreateConsoleUser): Promise<CreatedConsoleUser>;

  /**
   * Add user to twake in general (for non-console version)
   *
   * @param user
   */
  addUserToTwake(user: CreateInternalUser): Promise<User>;

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

  updateLocalCompanyFromConsole(companyDTO: ConsoleHookCompany): Promise<Company>;

  updateLocalUserFromConsole(userDTO: ConsoleHookUser): Promise<User>;

  removeCompanyUser(consoleUserId: string, company: Company): Promise<void>;

  removeUser(consoleUserId: string): Promise<void>;

  removeCompany(companySearchKey: CompanySearchKey): Promise<void>;

  fetchCompanyInfo(consoleCompanyCode: string): Promise<ConsoleHookCompany>;

  getUserByAccessToken(accessToken: string): Promise<ConsoleHookUser>;

  resendVerificationEmail(email: string): Promise<void>;
}
