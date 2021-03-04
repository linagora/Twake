import {
  CRUDService,
  ExecutionContext,
  ListResult,
  Paginable,
} from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import User, { UserPrimaryKey } from "./entities/user";
import CompanyUser, { CompanyUserPrimaryKey } from "./entities/company_user";
import Company, { CompanyPrimaryKey } from "./entities/company";
import ExternalUser from "./entities/external_user";
import ExternalGroup from "./entities/external_company";

export default interface UserServiceAPI extends TwakeServiceProvider, Initializable {
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
  external: UserExternalLinksServiceAPI;
}

export interface UsersServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<User, UserPrimaryKey, ExecutionContext> {}

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

  /**
   * Get a company from its id
   *
   * @param companyId
   */
  getCompany(companyId: CompanyPrimaryKey): Promise<Company>;

  /**
   * Get the companies
   *
   * @param pagination
   */
  getCompanies(pagination?: Paginable): Promise<ListResult<Company>>;

  /**
   * Add a user in a company
   *
   * @param company
   * @param user
   */
  addUserInCompany(company: Company, user: User): Promise<CompanyUser>;

  /**
   * Get users in a given company
   *
   * @param companyId
   * @param pagination
   */
  getUsersForCompany(
    companyId: CompanyUserPrimaryKey,
    pagination?: Paginable,
  ): Promise<ListResult<User>>;
}
