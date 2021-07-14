import { merge } from "lodash";

import {
  CrudExeption,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository, {
  FindOptions,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import { UserPrimaryKey } from "../../entities/user";
import { CompaniesServiceAPI } from "../../api";
import Company, {
  CompanyPrimaryKey,
  CompanySearchKey,
  getInstance as getCompanyInstance,
} from "../../entities/company";
import CompanyUser, {
  CompanyUserPrimaryKey,
  getInstance as getCompanyUserInstance,
} from "../../entities/company_user";
import { ListUserOptions } from "../users/types";
import { CompanyUserRole } from "../../web/types";
import { uuid } from "../../../../utils/types";
import ExternalGroup, {
  ExternalGroupPrimaryKey,
  getInstance as getExternalGroupInstance,
} from "../../entities/external_company";
import { pick } from "lodash";

export class CompanyService implements CompaniesServiceAPI {
  version: "1";
  companyRepository: Repository<Company>;
  externalCompanyRepository: Repository<ExternalGroup>;
  companyUserRepository: Repository<CompanyUser>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.companyRepository = await this.database.getRepository<Company>("group_entity", Company);
    this.companyUserRepository = await this.database.getRepository<CompanyUser>(
      "group_user",
      CompanyUser,
    );
    this.externalCompanyRepository = await this.database.getRepository<ExternalGroup>(
      "external_group_repository",
      ExternalGroup,
    );

    return this;
  }

  private getExtCompany(pk: ExternalGroupPrimaryKey) {
    return this.externalCompanyRepository.findOne(pk);
  }

  async updateCompany(company: Company): Promise<Company> {
    if (company.identity_provider_id && !company.identity_provider) {
      company.identity_provider = "console";
    }

    await this.companyRepository.save(company);

    if (company.identity_provider_id) {
      const key = {
        service_id: company.identity_provider,
        external_id: company.identity_provider_id,
      };

      const extCompany = (await this.getExtCompany(key)) || getExternalGroupInstance(key);

      extCompany.company_id = company.id;

      await this.externalCompanyRepository.save(extCompany);
    }

    return company;
  }

  async createCompany(company: Company): Promise<Company> {
    const companyToCreate: Company = getCompanyInstance({
      ...company,
      ...{
        dateAdded: Date.now(),
      },
    });

    return this.updateCompany(companyToCreate);
  }

  async getCompany(companySearchKey: CompanySearchKey): Promise<Company> {
    if (companySearchKey.id) {
      return this.companyRepository.findOne(companySearchKey);
    } else if (companySearchKey.identity_provider_id) {
      const extCompany = await this.getExtCompany({
        external_id: companySearchKey.identity_provider_id,
        service_id: companySearchKey.identity_provider || "console",
      });
      if (!extCompany) {
        return null;
      }
      return await this.companyRepository.findOne({ id: extCompany.company_id });
    }
  }

  getCompanyUser(company: CompanyPrimaryKey, user: UserPrimaryKey): Promise<CompanyUser> {
    return this.companyUserRepository.findOne({ group_id: company.id, user_id: user.id });
  }

  async getAllForUser(userId: uuid): Promise<CompanyUser[]> {
    return this.companyUserRepository.find({ user_id: userId }).then(a => a.getEntities());
  }

  getCompanies(pagination?: Pagination): Promise<ListResult<Company>> {
    return this.companyRepository.find({}, { pagination });
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
    companyId: uuid,
    userId: uuid,
    role: CompanyUserRole = "member",
  ): Promise<CompanyUser> {
    const key = {
      group_id: companyId,
      user_id: userId,
    };
    const entity =
      (await this.companyUserRepository.findOne(key)) ||
      getCompanyUserInstance(merge(key, { dateAdded: Date.now() }));

    entity.role = role;
    await this.companyUserRepository.save(entity);
    return entity;
  }

  async removeCompany(searchKey: CompanySearchKey): Promise<void> {
    if (searchKey.identity_provider_id) {
      const extCompany = await this.getExtCompany({
        service_id: searchKey.identity_provider,
        external_id: searchKey.identity_provider_id,
      });
      if (!extCompany) {
        throw CrudExeption.notFound(`Company ${searchKey.identity_provider_id} not found`);
      }
      await this.externalCompanyRepository.remove(extCompany);
      searchKey.id = extCompany.company_id;
    }

    const company = await this.getCompany({ id: searchKey.id });
    if (!company) {
      throw CrudExeption.notFound(`Company ${searchKey.id} not found`);
    }

    await this.companyRepository.remove(company);

    return Promise.resolve(null);
  }
}
