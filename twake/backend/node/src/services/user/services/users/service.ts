/* eslint-disable @typescript-eslint/no-unused-vars */
import { RealtimeDeleted, RealtimeSaved, TwakeContext } from "../../../../core/platform/framework";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import {
  SaveResult,
  DeleteResult,
  ListResult,
  OperationType,
  Paginable,
  CrudExeption,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import User, { UserPrimaryKey } from "../../entities/user";
import { UsersServiceAPI } from "../../api";

export class UserService implements UsersServiceAPI {
  version: "1";
  repository: Repository<User>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<User>("user", User);

    return this;
  }

  async get(pk: UserPrimaryKey): Promise<User> {
    return await this.repository.findOne(pk);
  }
}
