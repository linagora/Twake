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
import Repository, { FindFilter, FindOptions } from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import { UsersServiceAPI } from "../../api";
import { ListUserOptions } from "./types";

export class UserService implements UsersServiceAPI {
  version: "1";
  repository: Repository<User>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository<User>("user", User);

    return this;
  }

  create(item: User, context?: ExecutionContext): Promise<CreateResult<User>> {
    throw new Error("Method not implemented.");
  }
  
  update(pk: Partial<User>, item: User, context?: ExecutionContext): Promise<UpdateResult<User>> {
    throw new Error("Method not implemented.");
  }
  
  save<SaveOptions>(item: User, options?: SaveOptions, context?: ExecutionContext): Promise<SaveResult<User>> {
    throw new Error("Method not implemented.");
  }
  
  delete(pk: Partial<User>, context?: ExecutionContext): Promise<DeleteResult<User>> {
    throw new Error("Method not implemented.");
  }
  
  list(pagination: Pagination, options?: ListUserOptions, context?: ExecutionContext): Promise<ListResult<User>> {
    const findFilter: FindFilter = {};
    const findOptions: FindOptions = {
      pagination,
    };

    if (options?.userIds) {
      findOptions.$in = [["id", options.userIds]];
    }

    return this.repository.find(findFilter, findOptions);
  }

  async get(pk: UserPrimaryKey): Promise<User> {
    return await this.repository.findOne(pk);
  }
}
