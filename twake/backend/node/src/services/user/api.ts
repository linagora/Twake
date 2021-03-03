import { CRUDService, ExecutionContext, ListResult, Pagination } from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import User, { UserPrimaryKey } from "./entities/user";
import { CompanyUserPrimaryKey } from "./entities/company_user";
import Company, { CompanyPrimaryKey } from "./entities/company";

export default interface UserServiceAPI extends TwakeServiceProvider, Initializable {
  users: UsersServiceAPI;
  companies: CompaniesServiceAPI;
}

export interface UsersServiceAPI extends TwakeServiceProvider, Initializable, CRUDService<
  User,
  UserPrimaryKey,
  ExecutionContext
> {
  
}

export interface CompaniesServiceAPI extends TwakeServiceProvider, Initializable {

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
  getCompanies(pagination?: Pagination): Promise<ListResult<Company>>;

  /**
   * Get users in a given company
   * 
   * @param companyId 
   * @param pagination 
   */
  getUsersForCompany(companyId: CompanyUserPrimaryKey, pagination?: Pagination): Promise<ListResult<User>>;
}
