/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SaveResult,
  DeleteResult,
  ListResult,
  CreateResult,
  ExecutionContext,
  UpdateResult,
  Pagination,
  OperationType,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository, {
  FindFilter,
  FindOptions,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import { UsersServiceAPI } from "../../api";
import { ListUserOptions } from "./types";
import CompanyUser from "../../entities/company_user";
import Company from "../../entities/company";
import { Column } from "../../../../core/platform/services/database/services/orm/decorators";

export class UserService implements UsersServiceAPI {
  version: "1";
  repository: Repository<User>;
  companyUserRepository: Repository<CompanyUser>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository<User>("user", User);
    this.companyUserRepository = await this.database.getRepository<CompanyUser>(
      "group_user",
      CompanyUser,
    );

    return this;
  }

  async create(user: User): Promise<CreateResult<User>> {
    await this.repository.save(user);
    return new CreateResult("user", user);
  }

  update(pk: Partial<User>, item: User, context?: ExecutionContext): Promise<UpdateResult<User>> {
    throw new Error("Method not implemented.");
  }

  async save<SaveOptions>(
    item: User,
    options?: SaveOptions,
    context?: ExecutionContext,
  ): Promise<SaveResult<User>> {
    item.email_canonical = item.email_canonical.toLocaleLowerCase();
    item.username_canonical = item.username_canonical.toLocaleLowerCase();
    await this.repository.save(item);
    return new SaveResult("user", item, OperationType.UPDATE);
  }

  async delete(pk: Partial<User>, context?: ExecutionContext): Promise<DeleteResult<User>> {
    const instance = await this.repository.findOne(pk);
    if (instance) await this.repository.remove(instance);
    return new DeleteResult<User>("user", instance, !!instance);
  }

  async list(
    pagination: Pagination,
    options?: ListUserOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<User>> {
    const findFilter: FindFilter = {};
    const findOptions: FindOptions = {
      pagination,
    };

    if (options?.userIds) {
      findOptions.$in = [["id", options.userIds]];
    }

    return this.repository.find(findFilter, findOptions);
  }

  getByEmails(emails: string[]): Promise<User[]> {
    return Promise.all(
      emails.map(email => this.repository.findOne({ email_canonical: email })),
    ).then(emails => emails.filter(a => a));
  }

  async get(pk: UserPrimaryKey): Promise<User> {
    return await this.repository.findOne(pk);
  }

  async getByConsoleId(id: string): Promise<User> {
    // TODO: improve using indexes
    const allUsers = await this.repository.find({}).then(a => a.getEntities());
    return allUsers.find(user => user.identity_provider_id == id);
  }

  async getUserCompanies(pk: UserPrimaryKey): Promise<CompanyUser[]> {
    return await this.companyUserRepository.find({ user_id: pk.id }).then(a => a.getEntities());
  }

  async isEmailAlreadyInUse(email: string): Promise<boolean> {
    return this.repository.findOne({ email_canonical: email }).then(user => Boolean(user));
  }
  async getAvailableUsername(username: string): Promise<string> {
    const users = await this.repository.find({}).then(a => a.getEntities());

    if (!users.find(user => user.username_canonical == username.toLocaleLowerCase())) {
      return username;
    }

    let suitableUsername = null;

    for (let i = 1; i < 1000; i++) {
      const dynamicUsername = username + i;
      if (!users.find(user => user.username_canonical == dynamicUsername.toLocaleLowerCase())) {
        suitableUsername = dynamicUsername;
        break;
      }
    }
    return suitableUsername;
  }
}
