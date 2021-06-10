import { v1 as uuid } from "uuid";
import {
  DeleteResult,
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository, {
  FindOptions,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import UserServiceAPI, { CompaniesServiceAPI } from "../../api";
import Company, {
  CompanyPrimaryKey,
  getInstance as getCompanyInstance,
} from "../../entities/company";
import CompanyUser, {
  CompanyUserPrimaryKey,
  getInstance as getCompanyUserInstance,
} from "../../entities/company_user";
import { ListUserOptions } from "../users/types";
import { UserCompanyRole } from "../../web/types";

export class CompanyService implements CompaniesServiceAPI {
  version: "1";
  companyRepository: Repository<Company>;
  companyUserRepository: Repository<CompanyUser>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.companyRepository = await this.database.getRepository<Company>("group_entity", Company);
    this.companyUserRepository = await this.database.getRepository<CompanyUser>(
      "group_user",
      CompanyUser,
    );

    return this;
  }

  async createCompany(company: Company): Promise<Company> {
    const companyToCreate: Company = getCompanyInstance({
      ...company,
      ...{
        dateAdded: Date.now(),
      },
    });
    await this.companyRepository.save(companyToCreate);

    return companyToCreate;
  }

  getCompany(company: CompanyPrimaryKey): Promise<Company> {
    return this.companyRepository.findOne(company);
  }

  getCompanyUser(company: CompanyPrimaryKey, user: UserPrimaryKey): Promise<CompanyUser> {
    return this.companyUserRepository.findOne({ group_id: company.id, user_id: user.id });
  }

  getAllForUser(user: Pick<CompanyUser, "user_id">): Promise<ListResult<CompanyUser>> {
    return this.companyUserRepository.find({ user_id: user.user_id });
  }

  getCompanies(pagination?: Pagination): Promise<ListResult<Company>> {
    return this.companyRepository.find({}, { pagination });
  }

  async addUserInCompany(
    companyPk: CompanyPrimaryKey,
    userPk: UserPrimaryKey,
  ): Promise<CompanyUser> {
    const userInCompany = getCompanyUserInstance({
      group_id: companyPk.id,
      user_id: userPk.id,
      id: uuid(),
      dateAdded: Date.now(),
    });

    await this.companyUserRepository.save(userInCompany);

    return userInCompany;
  }

  async removeUserFromCompany(companyPk: CompanyPrimaryKey, userPk: UserPrimaryKey): Promise<void> {
    const entity = await this.companyUserRepository.findOne({
      group_id: companyPk.id,
      user_id: userPk.id,
    });
    if (entity) {
      await this.companyUserRepository.remove(entity);
    }
  }

  async getUsers(
    companyId: CompanyUserPrimaryKey,
    pagination?: Pagination,
    options?: ListUserOptions,
  ): Promise<ListResult<CompanyUser>> {
    const findOptions: FindOptions = {
      pagination,
    };

    if (options?.userIds) {
      findOptions.$in = [["user_id", options.userIds]];
    }

    return this.companyUserRepository.find({ group_id: companyId.group_id }, findOptions);
  }

  async delete(pk: CompanyPrimaryKey, context?: ExecutionContext): Promise<DeleteResult<Company>> {
    const instance = await this.companyRepository.findOne(pk);
    if (instance) await this.companyRepository.remove(instance);
    return new DeleteResult<Company>("company", instance, !!instance);
  }

  async setUserRole(
    companyPk: CompanyPrimaryKey,
    userPk: UserPrimaryKey,
    role: UserCompanyRole,
  ): Promise<void> {
    const entity = await this.companyUserRepository.findOne({
      group_id: companyPk.id,
      user_id: userPk.id,
    });
    if (entity) {
      entity.role = role;
      await this.companyUserRepository.save(entity);
    }
  }
}
