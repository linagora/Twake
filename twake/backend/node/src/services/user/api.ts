import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
  SaveResult,
} from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import User, { UserPrimaryKey } from "./entities/user";
import CompanyUser, { CompanyUserPrimaryKey } from "./entities/company_user";
import Company, { CompanyPrimaryKey, CompanySearchKey } from "./entities/company";
import ExternalUser from "./entities/external_user";
import ExternalGroup from "./entities/external_company";
import { ListUserOptions } from "./services/users/types";
import {
  CompanyObject,
  CompanyStatsObject,
  CompanyUserObject,
  CompanyUserRole,
  UserObject,
} from "./web/types";
import { WorkspaceServiceAPI } from "../workspaces/api";
import { uuid } from "../../utils/types";
import Device from "./entities/device";
import { StatisticsAPI } from "../statistics/types";

export default interface UserServiceAPI extends TwakeServiceProvider, Initializable {
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
  workspaces: WorkspaceServiceAPI;
  external: UserExternalLinksServiceAPI;
  statistics: StatisticsAPI;

  formatUser(user: User, options?: { includeCompanies?: boolean }): Promise<UserObject>;
  formatCompany(
    companyEntity: Company,
    companyUserObject?: CompanyUserObject,
    companyStats?: CompanyStatsObject,
  ): CompanyObject;
}

export interface UsersServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<User, UserPrimaryKey, ExecutionContext> {
  getUserCompanies(pk: UserPrimaryKey): Promise<CompanyUser[]>;

  search<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<User>>;

  getByEmail(email: string): Promise<User>;
  getByEmails(email: string[]): Promise<User[]>;
  getByConsoleId(consoleUserId: string): Promise<User>;
  isEmailAlreadyInUse(email: string): Promise<boolean>;
  getAvailableUsername(username: string): Promise<string>;
  getUserDevices(userPrimaryKey: UserPrimaryKey): Promise<Device[]>;
  registerUserDevice(
    userPrimaryKey: UserPrimaryKey,
    token: string,
    type: string,
    version: string,
  ): Promise<void>;
  deregisterUserDevice(token: string): Promise<void>;
  setPassword(userPrimaryKey: UserPrimaryKey, password: string): Promise<void>;
  getHashedPassword(userPrimaryKey: UserPrimaryKey): Promise<[string, string]>;
  anonymizeAndDelete(user: UserPrimaryKey, context?: ExecutionContext): Promise<void>;
  setPreferences(
    user: UserPrimaryKey,
    preferences: User["preferences"],
  ): Promise<User["preferences"]>;
}

/**
 * Service to manage links between external and internal users/companies.
 */
export interface UserExternalLinksServiceAPI extends TwakeServiceProvider, Initializable {
  /**
   * Create a external user link
   *
   * @param user
   */
  createExternalUser(user: ExternalUser): Promise<ExternalUser>;

  /**
   * Create an external group link
   *
   * @param group
   */
  createExternalGroup(group: ExternalGroup): Promise<ExternalGroup>;
}
export interface CompaniesServiceAPI extends TwakeServiceProvider, Initializable {
  /**
   * Create a company
   *
   * @param company
   */
  createCompany(company: Company): Promise<Company>;
  updateCompany(company: Company): Promise<SaveResult<Company>>;

  /**
   * Get a company from its id or identity
   *
   * @param companySearchKey
   */
  getCompany(companySearchKey: CompanySearchKey): Promise<Company>;

  /**
   * Get the companies
   *
   * @param pagination
   */
  getCompanies(pagination?: Paginable): Promise<ListResult<Company>>;

  /**
   * Get all companies for a user
   * @param company
   * @param user
   */
  getAllForUser(userId: uuid): Promise<CompanyUser[]>;

  /**
   * Add a user in a company
   *
   * @param company
   * @param user
   */
  removeUserFromCompany(
    companyId: CompanyPrimaryKey,
    user: UserPrimaryKey,
  ): Promise<DeleteResult<CompanyUser>>;

  /**
   * Get user ids in the given company
   *
   * @param companyId
   * @param pagination
   */
  getUsers(
    companyId: CompanyUserPrimaryKey,
    pagination?: Paginable,
    options?: ListUserOptions,
  ): Promise<ListResult<CompanyUser>>;

  /**
   *  Get company user
   * @param company
   * @param user
   */
  getCompanyUser(company: CompanyPrimaryKey, user: UserPrimaryKey): Promise<CompanyUser>;

  delete(pk: CompanyPrimaryKey, context?: ExecutionContext): Promise<DeleteResult<Company>>;

  setUserRole(
    companyId: uuid,
    userId: uuid,
    role?: CompanyUserRole,
  ): Promise<SaveResult<CompanyUser>>;

  getUserRole(companyId: uuid, userId: uuid): Promise<CompanyUserRole>;

  removeCompany(searchKey: CompanySearchKey): Promise<void>;

  getUsersCount(workspaceId: string): Promise<number>;
}
