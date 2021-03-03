/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SaveResult,
  DeleteResult,
  ListResult,
  Paginable,
  CreateResult,
  ExecutionContext,
  UpdateResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import UserServiceAPI, { CompaniesServiceAPI, UsersServiceAPI } from "../../api";
import Company, { CompanyPrimaryKey } from "../../entities/company";
import CompanyUser, { CompanyUserPrimaryKey } from "../../entities/company_user";

export class CompanyService implements CompaniesServiceAPI {
  version: "1";
  companyRepository: Repository<Company>;
  companyUserRepository: Repository<CompanyUser>;

  constructor(private database: DatabaseServiceAPI, private userService: UserServiceAPI) {}

  async init(): Promise<this> {
    this.companyRepository = await this.database.getRepository<Company>("group_entity", Company);
    this.companyUserRepository = await this.database.getRepository<CompanyUser>("group_user", CompanyUser);

    return this;
  }

  getCompany(companyId: CompanyPrimaryKey): Promise<Company> {
    return this.companyRepository.findOne({ id: companyId })
  }

  getCompanies(pagination?: Pagination): Promise<ListResult<Company>> {
    return this.companyRepository.find({}, { pagination });
  }

  async getUsersForCompany(companyId: CompanyUserPrimaryKey, pagination?: Pagination): Promise<ListResult<User>> {
    const companyUsers: ListResult<CompanyUser> = await this.companyUserRepository.find({ group_id: companyId.group_id}, { pagination });

    if (companyUsers.isEmpty()) {
      return new ListResult<User>("user", [], companyUsers.nextPage);
    }

    const userIds = companyUsers.getEntities().map(value => value.user_id);
    const userPagination = new Pagination("", String(userIds.length));
    const users: ListResult<User> = await this.userService.users.list(
      userPagination,
      {
        $in: [["id", userIds]],
      },
    );

    return new ListResult<User>("user", users.getEntities(), companyUsers.nextPage);
  }
}
