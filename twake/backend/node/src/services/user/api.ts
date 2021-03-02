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

export default interface UserServiceAPI extends TwakeServiceProvider, Initializable {
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
}

export interface UsersServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<User, UserPrimaryKey, ExecutionContext> {}

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
