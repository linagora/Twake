/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SaveResult,
  DeleteResult,
  ListResult,
  Paginable,
  CreateResult,
  ExecutionContext,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import { UsersServiceAPI } from "../../api";

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
  
  async list<ListOptions>(pagination: Paginable, options?: ListOptions, context?: ExecutionContext): Promise<ListResult<User>> {
    throw new Error("Method not implemented.");
  }

  async get(pk: UserPrimaryKey): Promise<User> {
    return await this.repository.findOne(pk);
  }
}
